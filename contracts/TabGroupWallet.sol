// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITabGroupWallet} from "./interfaces/ITabGroupWallet.sol";
import {SettlementMath} from "./libraries/SettlementMath.sol";

/**
 * @title TabGroupWallet
 * @notice The group wallet that settles itself — built for the Monad ecosystem.
 * @author Person 1 (Blockchain Engineer)
 * @dev Manages groups, expense splitting with deterministic rounding remainder handling,
 * net balance tracking, and greedy settlement generation & execution using native MON.
 */
contract TabGroupWallet is ITabGroupWallet, ReentrancyGuard {
    // --- State Variables ---
    uint256 public nextGroupId = 1;
    uint256 public nextExpenseId = 1;

    // groupId => Group
    mapping(uint256 => Group) internal _groups;

    // groupId => list of member addresses
    mapping(uint256 => address[]) internal _groupMembers;

    // groupId => account => isMember
    mapping(uint256 => mapping(address => bool)) internal _isGroupMember;

    // groupId => account => net balance (positive = creditor/should receive, negative = debtor/owes)
    mapping(uint256 => mapping(address => int256)) public netBalances;

    // expenseId => Expense
    mapping(uint256 => Expense) internal _expenses;

    // expenseId => approver => hasApproved
    mapping(uint256 => mapping(address => bool)) internal _expenseApprovals;

    // planHash => SettlementPlan
    mapping(bytes32 => SettlementPlan) internal _settlementPlans;

    // planHash => list of DebtTransfer structs
    mapping(bytes32 => DebtTransfer[]) internal _planTransfers;

    // planHash => transferIndex => isExecuted
    mapping(bytes32 => mapping(uint256 => bool)) internal _isTransferExecuted;

    // planHash => exists
    mapping(bytes32 => bool) internal _isPlanRegistered;

    // account => claimable native MON (pull-payment pattern fallback)
    mapping(address => uint256) internal _claimableFunds;

    // --- Modifiers ---
    modifier onlyGroupMember(uint256 groupId) {
        if (!_isGroupMember[groupId][msg.sender]) {
            revert NotGroupMember(groupId, msg.sender);
        }
        _;
    }

    // --- External / Public Functions ---

    /**
     * @notice Creates a new group with specified members and required approvals.
     * @param name Name of the group.
     * @param initialMembers List of member addresses (creator is automatically added).
     * @param requiredApprovals Approvals needed for an expense to affect balances (0 defaults to 1).
     * @return groupId The unique identifier of the newly created group.
     */
    function createGroup(
        string calldata name,
        address[] calldata initialMembers,
        uint256 requiredApprovals
    ) external override returns (uint256 groupId) {
        if (bytes(name).length == 0) {
            revert EmptyGroupName();
        }

        groupId = nextGroupId++;

        // Add creator
        _isGroupMember[groupId][msg.sender] = true;
        _groupMembers[groupId].push(msg.sender);

        // Add initial members
        uint256 memberCount = initialMembers.length;
        for (uint256 i = 0; i < memberCount; i++) {
            address member = initialMembers[i];
            if (member == address(0)) {
                revert ZeroAddress();
            }
            if (_isGroupMember[groupId][member]) {
                revert DuplicateMember(groupId, member);
            }
            _isGroupMember[groupId][member] = true;
            _groupMembers[groupId].push(member);
        }

        uint256 totalMembers = _groupMembers[groupId].length;
        uint256 configuredApprovals = requiredApprovals == 0 ? 1 : requiredApprovals;
        if (configuredApprovals > totalMembers) {
            configuredApprovals = totalMembers;
        }

        _groups[groupId] = Group({
            id: groupId,
            name: name,
            creator: msg.sender,
            memberCount: totalMembers,
            expenseCount: 0,
            requiredApprovals: configuredApprovals,
            currentSettlementRound: 1,
            isActive: true
        });

        emit GroupCreated(groupId, name, msg.sender, configuredApprovals, _groupMembers[groupId]);
    }

    /**
     * @notice Adds a new member to an existing group.
     * @param groupId Group identifier.
     * @param newMember Address of the member to add.
     */
    function addMember(
        uint256 groupId,
        address newMember
    ) external override onlyGroupMember(groupId) {
        _requireGroupExists(groupId);

        if (newMember == address(0)) {
            revert ZeroAddress();
        }
        if (_isGroupMember[groupId][newMember]) {
            revert DuplicateMember(groupId, newMember);
        }

        _isGroupMember[groupId][newMember] = true;
        _groupMembers[groupId].push(newMember);
        _groups[groupId].memberCount++;

        emit MemberAdded(groupId, newMember, msg.sender);
    }

    /**
     * @notice Records an expense within a group.
     * @dev Supports equal splitting across participants. Handles rounding remainders
     * deterministically. If required approvals == 1 and creator/payer records it,
     * it is automatically processed and affects balances immediately.
     * @param groupId Group identifier.
     * @param payer Member who paid the expense upfront.
     * @param amount Total expense amount in wei (native MON).
     * @param description Brief description or identifier.
     * @param participants Members sharing this expense.
     * @return expenseId Unique identifier of the recorded expense.
     */
    function recordExpense(
        uint256 groupId,
        address payer,
        uint256 amount,
        string calldata description,
        address[] calldata participants
    ) external override onlyGroupMember(groupId) returns (uint256 expenseId) {
        _requireGroupExists(groupId);

        if (!_isGroupMember[groupId][payer]) {
            revert PayerNotMember(payer);
        }
        if (amount == 0) {
            revert InvalidAmount();
        }
        uint256 partCount = participants.length;
        if (partCount == 0) {
            revert InvalidParticipants();
        }

        // Validate participants: must be group members with no duplicates
        for (uint256 i = 0; i < partCount; i++) {
            address p = participants[i];
            if (p == address(0)) revert ZeroAddress();
            if (!_isGroupMember[groupId][p]) revert NotGroupMember(groupId, p);
            for (uint256 j = i + 1; j < partCount; j++) {
                if (p == participants[j]) revert DuplicateMember(groupId, p);
            }
        }

        expenseId = nextExpenseId++;
        _groups[groupId].expenseCount++;

        uint256 reqApprovals = _groups[groupId].requiredApprovals;
        if (reqApprovals > partCount) {
            reqApprovals = partCount;
        }

        // Caller auto-approves their own recorded expense
        _expenseApprovals[expenseId][msg.sender] = true;
        uint256 approvalCount = 1;

        bool autoProcessed = (approvalCount >= reqApprovals);
        ExpenseStatus status = autoProcessed ? ExpenseStatus.Processed : ExpenseStatus.Pending;

        _expenses[expenseId] = Expense({
            id: expenseId,
            groupId: groupId,
            payer: payer,
            amount: amount,
            description: description,
            participants: participants,
            approvalCount: approvalCount,
            status: status,
            timestamp: block.timestamp
        });

        emit ExpenseRecorded(
            groupId,
            expenseId,
            payer,
            amount,
            description,
            participants,
            reqApprovals,
            autoProcessed
        );

        if (autoProcessed) {
            _applyExpenseBalances(groupId, payer, amount, participants);
            emit ExpenseProcessed(groupId, expenseId, amount);
        }
    }

    /**
     * @notice Approves a pending expense.
     * @dev Once approvalCount reaches requiredApprovals, the expense transitions
     * to Processed and updates net balances exactly once.
     * @param groupId Group identifier.
     * @param expenseId Expense identifier.
     */
    function approveExpense(
        uint256 groupId,
        uint256 expenseId
    ) external override onlyGroupMember(groupId) {
        _requireGroupExists(groupId);

        Expense storage exp = _expenses[expenseId];
        if (exp.id == 0 || exp.groupId != groupId) {
            revert ExpenseDoesNotExist(expenseId);
        }
        if (exp.status == ExpenseStatus.Processed) {
            revert ExpenseAlreadyProcessed(expenseId);
        }
        if (exp.status != ExpenseStatus.Pending) {
            revert ExpenseNotPending(expenseId);
        }
        if (_expenseApprovals[expenseId][msg.sender]) {
            revert AlreadyApproved(expenseId, msg.sender);
        }

        _expenseApprovals[expenseId][msg.sender] = true;
        exp.approvalCount++;

        uint256 reqApprovals = _groups[groupId].requiredApprovals;
        if (reqApprovals > exp.participants.length) {
            reqApprovals = exp.participants.length;
        }

        emit ExpenseApproved(groupId, expenseId, msg.sender, exp.approvalCount, reqApprovals);

        if (exp.approvalCount >= reqApprovals) {
            exp.status = ExpenseStatus.Processed;
            _applyExpenseBalances(groupId, exp.payer, exp.amount, exp.participants);
            emit ExpenseProcessed(groupId, expenseId, exp.amount);
        }
    }

    /**
     * @notice Rejects a pending expense.
     * @param groupId Group identifier.
     * @param expenseId Expense identifier.
     */
    function rejectExpense(
        uint256 groupId,
        uint256 expenseId
    ) external override onlyGroupMember(groupId) {
        _requireGroupExists(groupId);

        Expense storage exp = _expenses[expenseId];
        if (exp.id == 0 || exp.groupId != groupId) {
            revert ExpenseDoesNotExist(expenseId);
        }
        if (exp.status != ExpenseStatus.Pending) {
            revert ExpenseNotPending(expenseId);
        }

        // Only creator, payer, or one of the participants may reject
        bool isParticipant = false;
        for (uint256 i = 0; i < exp.participants.length; i++) {
            if (exp.participants[i] == msg.sender) {
                isParticipant = true;
                break;
            }
        }
        if (msg.sender != exp.payer && msg.sender != _groups[groupId].creator && !isParticipant) {
            revert NotAuthorized();
        }

        exp.status = ExpenseStatus.Rejected;
        emit ExpenseRejected(groupId, expenseId, msg.sender);
    }

    /**
     * @notice View function to calculate the greedy debt simplification plan based on current balances.
     * @dev Keeps settlement calculation separate from execution. Consumes 0 gas when queried off-chain.
     * @param groupId Group identifier.
     * @return Simplified array of DebtTransfer transfers.
     */
    function getSettlementPlan(
        uint256 groupId
    ) external view override returns (DebtTransfer[] memory) {
        _requireGroupExists(groupId);

        address[] memory membersList = _groupMembers[groupId];
        uint256 len = membersList.length;
        int256[] memory balances = new int256[](len);

        for (uint256 i = 0; i < len; i++) {
            balances[i] = netBalances[groupId][membersList[i]];
        }

        return SettlementMath.computeGreedySettlement(membersList, balances);
    }

    /**
     * @notice Proposes and registers a settlement plan for a specific settlement round.
     * @dev Validates that every transfer matches debtor debt and creditor credit before registering.
     * @param groupId Group identifier.
     * @param transfers List of simplified debt transfers.
     * @return planHash Unique deterministic hash for this settlement plan.
     */
    function proposeSettlementPlan(
        uint256 groupId,
        DebtTransfer[] calldata transfers
    ) external override onlyGroupMember(groupId) returns (bytes32 planHash) {
        _requireGroupExists(groupId);
        uint256 totalTransfers = transfers.length;
        if (totalTransfers == 0) {
            revert InvalidSettlementPlan();
        }

        uint256 roundId = _groups[groupId].currentSettlementRound;
        planHash = keccak256(abi.encode(groupId, roundId, transfers));

        if (_isPlanRegistered[planHash]) {
            revert PlanMismatch(planHash, planHash);
        }

        // Validate each transfer against current net balances
        for (uint256 i = 0; i < totalTransfers; i++) {
            DebtTransfer calldata t = transfers[i];
            if (t.amount == 0) revert InvalidAmount();
            if (!_isGroupMember[groupId][t.from] || !_isGroupMember[groupId][t.to]) {
                revert NotGroupMember(groupId, t.from);
            }
            if (netBalances[groupId][t.from] > -int256(t.amount)) {
                revert InsufficientDebt(t.from, t.amount, netBalances[groupId][t.from]);
            }
            if (netBalances[groupId][t.to] < int256(t.amount)) {
                revert InsufficientCredit(t.to, t.amount, netBalances[groupId][t.to]);
            }
            _planTransfers[planHash].push(t);
        }

        _isPlanRegistered[planHash] = true;
        _settlementPlans[planHash] = SettlementPlan({
            planHash: planHash,
            roundId: roundId,
            totalTransfers: totalTransfers,
            executedTransfersCount: 0,
            isCompleted: false
        });

        emit SettlementPlanProposed(groupId, planHash, roundId, totalTransfers);
    }

    /**
     * @notice Executes an individual transfer within a registered settlement plan.
     * @dev Debtor calls with msg.value equal to transfer.amount in native MON.
     * Prevents double settlement and replay of previously executed transfers/plans.
     * Uses pull-over-push fallback if creditor transfer reverts.
     * @param groupId Group identifier.
     * @param planHash Hash of the settlement plan.
     * @param transferIndex Index of the transfer in the plan.
     */
    function executeSettlementTransfer(
        uint256 groupId,
        bytes32 planHash,
        uint256 transferIndex
    ) external payable override nonReentrant {
        _requireGroupExists(groupId);
        if (!_isPlanRegistered[planHash]) {
            revert PlanDoesNotExist(planHash);
        }

        SettlementPlan storage plan = _settlementPlans[planHash];
        if (plan.isCompleted) {
            revert PlanAlreadyCompleted(planHash);
        }
        if (transferIndex >= plan.totalTransfers) {
            revert InvalidSettlementPlan();
        }
        if (_isTransferExecuted[planHash][transferIndex]) {
            revert TransferAlreadyExecuted(planHash, transferIndex);
        }

        DebtTransfer memory t = _planTransfers[planHash][transferIndex];

        if (msg.sender != t.from) {
            revert NotAuthorized();
        }
        if (msg.value != t.amount) {
            revert IncorrectTransferValue(t.amount, msg.value);
        }

        int256 debtorBal = netBalances[groupId][t.from];
        if (debtorBal > -int256(t.amount)) {
            revert InsufficientDebt(t.from, t.amount, debtorBal);
        }
        int256 creditorBal = netBalances[groupId][t.to];
        if (creditorBal < int256(t.amount)) {
            revert InsufficientCredit(t.to, t.amount, creditorBal);
        }

        // Checks-Effects: update balances and mark transfer executed
        _isTransferExecuted[planHash][transferIndex] = true;
        plan.executedTransfersCount++;

        netBalances[groupId][t.from] += int256(t.amount);
        netBalances[groupId][t.to] -= int256(t.amount);

        emit BalanceUpdated(groupId, t.from, netBalances[groupId][t.from], int256(t.amount));
        emit BalanceUpdated(groupId, t.to, netBalances[groupId][t.to], -int256(t.amount));
        emit SettlementTransferExecuted(groupId, planHash, transferIndex, t.from, t.to, t.amount);

        if (plan.executedTransfersCount == plan.totalTransfers) {
            plan.isCompleted = true;
            _groups[groupId].currentSettlementRound++;
            emit SettlementPlanCompleted(groupId, planHash, plan.roundId);
        }

        // Interaction: safe send native MON to creditor, fallback to claimable pull balance
        _safeSendNative(t.to, t.amount);
    }

    /**
     * @notice Allows a debtor to settle directly with a creditor for an arbitrary valid amount.
     * @param groupId Group identifier.
     * @param to Creditor address receiving native MON.
     */
    function settleDirect(
        uint256 groupId,
        address to
    ) external payable override onlyGroupMember(groupId) nonReentrant {
        _requireGroupExists(groupId);
        if (!_isGroupMember[groupId][to]) {
            revert NotGroupMember(groupId, to);
        }
        if (msg.value == 0) {
            revert InvalidAmount();
        }

        int256 debtorBal = netBalances[groupId][msg.sender];
        if (debtorBal > -int256(msg.value)) {
            revert InsufficientDebt(msg.sender, msg.value, debtorBal);
        }
        int256 creditorBal = netBalances[groupId][to];
        if (creditorBal < int256(msg.value)) {
            revert InsufficientCredit(to, msg.value, creditorBal);
        }

        // Checks-Effects
        netBalances[groupId][msg.sender] += int256(msg.value);
        netBalances[groupId][to] -= int256(msg.value);

        emit BalanceUpdated(groupId, msg.sender, netBalances[groupId][msg.sender], int256(msg.value));
        emit BalanceUpdated(groupId, to, netBalances[groupId][to], -int256(msg.value));
        emit DirectSettlementExecuted(groupId, msg.sender, to, msg.value);

        // Interaction
        _safeSendNative(to, msg.value);
    }

    /**
     * @notice Allows a creditor to withdraw claimable escrowed native MON if a direct send failed.
     */
    function withdrawClaimable() external override nonReentrant {
        uint256 amount = _claimableFunds[msg.sender];
        if (amount == 0) {
            revert NothingToWithdraw();
        }

        _claimableFunds[msg.sender] = 0;
        emit ClaimableFundsWithdrawn(msg.sender, amount);

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
    }

    // --- View Functions ---

    function getGroup(uint256 groupId) external view override returns (
        string memory name,
        address creator,
        uint256 memberCount,
        uint256 expenseCount,
        uint256 requiredApprovals,
        uint256 currentSettlementRound,
        bool isActive
    ) {
        _requireGroupExists(groupId);
        Group storage g = _groups[groupId];
        return (
            g.name,
            g.creator,
            g.memberCount,
            g.expenseCount,
            g.requiredApprovals,
            g.currentSettlementRound,
            g.isActive
        );
    }

    function getMembers(uint256 groupId) external view override returns (address[] memory) {
        _requireGroupExists(groupId);
        return _groupMembers[groupId];
    }

    function isMember(uint256 groupId, address account) external view override returns (bool) {
        return _isGroupMember[groupId][account];
    }

    function getExpense(
        uint256 groupId,
        uint256 expenseId
    ) external view override returns (Expense memory) {
        _requireGroupExists(groupId);
        Expense memory exp = _expenses[expenseId];
        if (exp.id == 0 || exp.groupId != groupId) {
            revert ExpenseDoesNotExist(expenseId);
        }
        return exp;
    }

    function hasApprovedExpense(uint256 expenseId, address member) external view override returns (bool) {
        return _expenseApprovals[expenseId][member];
    }

    function getNetBalance(uint256 groupId, address member) external view override returns (int256) {
        _requireGroupExists(groupId);
        return netBalances[groupId][member];
    }

    function getAllNetBalances(
        uint256 groupId
    ) external view override returns (address[] memory membersList, int256[] memory balances) {
        _requireGroupExists(groupId);
        membersList = _groupMembers[groupId];
        uint256 len = membersList.length;
        balances = new int256[](len);
        for (uint256 i = 0; i < len; i++) {
            balances[i] = netBalances[groupId][membersList[i]];
        }
    }

    function getSettlementPlanDetails(bytes32 planHash) external view returns (
        SettlementPlan memory plan,
        DebtTransfer[] memory transfers
    ) {
        if (!_isPlanRegistered[planHash]) revert PlanDoesNotExist(planHash);
        return (_settlementPlans[planHash], _planTransfers[planHash]);
    }

    function isTransferExecuted(bytes32 planHash, uint256 transferIndex) external view returns (bool) {
        return _isTransferExecuted[planHash][transferIndex];
    }

    function getClaimableFunds(address recipient) external view override returns (uint256) {
        return _claimableFunds[recipient];
    }

    // --- Internal Helpers ---

    function _requireGroupExists(uint256 groupId) internal view {
        if (groupId == 0 || groupId >= nextGroupId || !_groups[groupId].isActive) {
            revert GroupDoesNotExist(groupId);
        }
    }

    /**
     * @dev Applies equal split debits and single payer credit.
     * Deterministically distributes remainder wei among first `remainder` participants.
     */
    function _applyExpenseBalances(
        uint256 groupId,
        address payer,
        uint256 amount,
        address[] memory participants
    ) internal {
        (uint256 baseShare, uint256 remainder) = SettlementMath.splitEqually(
            amount,
            participants.length
        );

        // Credit payer full amount
        netBalances[groupId][payer] += int256(amount);
        emit BalanceUpdated(groupId, payer, netBalances[groupId][payer], int256(amount));

        // Debit each participant
        uint256 len = participants.length;
        for (uint256 i = 0; i < len; i++) {
            address p = participants[i];
            uint256 share = (i < remainder) ? (baseShare + 1) : baseShare;
            netBalances[groupId][p] -= int256(share);
            emit BalanceUpdated(groupId, p, netBalances[groupId][p], -int256(share));
        }
    }

    /**
     * @dev Safe push-with-pull-fallback for native MON transfers.
     */
    function _safeSendNative(address recipient, uint256 amount) internal {
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            // Escrow funds for pull withdrawal
            _claimableFunds[recipient] += amount;
            emit ClaimableFundsCredited(recipient, amount);
        }
    }

    // Receive function to accept direct native MON if needed
    receive() external payable {}
}
