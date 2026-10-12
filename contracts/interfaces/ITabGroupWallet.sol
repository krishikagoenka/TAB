// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ITabGroupWallet
 * @notice Interface for TAB — the group wallet that settles itself on Monad.
 * @author Person 1 (Blockchain Engineer)
 */
interface ITabGroupWallet {
    enum ExpenseStatus {
        Pending,
        Processed,
        Rejected
    }

    struct Group {
        uint256 id;
        string name;
        address creator;
        uint256 memberCount;
        uint256 expenseCount;
        uint256 requiredApprovals;
        uint256 currentSettlementRound;
        bool isActive;
    }

    struct Expense {
        uint256 id;
        uint256 groupId;
        address payer;
        uint256 amount;
        string description;
        address[] participants;
        uint256 approvalCount;
        ExpenseStatus status;
        uint256 timestamp;
    }

    struct DebtTransfer {
        address from; // Debtor (pays native MON)
        address to;   // Creditor (receives native MON)
        uint256 amount; // Transfer amount in wei
    }

    struct SettlementPlan {
        bytes32 planHash;
        uint256 roundId;
        uint256 totalTransfers;
        uint256 executedTransfersCount;
        bool isCompleted;
    }

    // --- Events ---
    event GroupCreated(
        uint256 indexed groupId,
        string name,
        address indexed creator,
        uint256 requiredApprovals,
        address[] members
    );

    event MemberAdded(
        uint256 indexed groupId,
        address indexed member,
        address indexed addedBy
    );

    event ExpenseRecorded(
        uint256 indexed groupId,
        uint256 indexed expenseId,
        address indexed payer,
        uint256 amount,
        string description,
        address[] participants,
        uint256 requiredApprovals,
        bool autoProcessed
    );

    event ExpenseApproved(
        uint256 indexed groupId,
        uint256 indexed expenseId,
        address indexed approver,
        uint256 currentApprovals,
        uint256 requiredApprovals
    );

    event ExpenseProcessed(
        uint256 indexed groupId,
        uint256 indexed expenseId,
        uint256 amount
    );

    event ExpenseRejected(
        uint256 indexed groupId,
        uint256 indexed expenseId,
        address indexed rejectedBy
    );

    event BalanceUpdated(
        uint256 indexed groupId,
        address indexed member,
        int256 newBalance,
        int256 delta
    );

    event SettlementPlanProposed(
        uint256 indexed groupId,
        bytes32 indexed planHash,
        uint256 roundId,
        uint256 transferCount
    );

    event SettlementTransferExecuted(
        uint256 indexed groupId,
        bytes32 indexed planHash,
        uint256 transferIndex,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event SettlementPlanCompleted(
        uint256 indexed groupId,
        bytes32 indexed planHash,
        uint256 roundId
    );

    event DirectSettlementExecuted(
        uint256 indexed groupId,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event ClaimableFundsCredited(
        address indexed recipient,
        uint256 amount
    );

    event ClaimableFundsWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    // --- Custom Errors ---
    error ZeroAddress();
    error EmptyGroupName();
    error GroupDoesNotExist(uint256 groupId);
    error NotGroupMember(uint256 groupId, address account);
    error DuplicateMember(uint256 groupId, address account);
    error InvalidAmount();
    error InvalidParticipants();
    error PayerNotMember(address payer);
    error ExpenseDoesNotExist(uint256 expenseId);
    error ExpenseAlreadyProcessed(uint256 expenseId);
    error ExpenseNotPending(uint256 expenseId);
    error AlreadyApproved(uint256 expenseId, address approver);
    error NotAuthorized();
    error InsufficientDebt(address debtor, uint256 required, int256 actualBalance);
    error InsufficientCredit(address creditor, uint256 required, int256 actualBalance);
    error IncorrectTransferValue(uint256 expected, uint256 actual);
    error TransferAlreadyExecuted(bytes32 planHash, uint256 transferIndex);
    error InvalidSettlementPlan();
    error PlanAlreadyCompleted(bytes32 planHash);
    error PlanDoesNotExist(bytes32 planHash);
    error PlanMismatch(bytes32 expectedHash, bytes32 actualHash);
    error NothingToWithdraw();
    error TransferFailed();

    // --- External Functions ---
    function createGroup(
        string calldata name,
        address[] calldata initialMembers,
        uint256 requiredApprovals
    ) external returns (uint256 groupId);

    function addMember(uint256 groupId, address newMember) external;

    function recordExpense(
        uint256 groupId,
        address payer,
        uint256 amount,
        string calldata description,
        address[] calldata participants
    ) external returns (uint256 expenseId);

    function approveExpense(uint256 groupId, uint256 expenseId) external;

    function rejectExpense(uint256 groupId, uint256 expenseId) external;

    function getSettlementPlan(uint256 groupId) external view returns (DebtTransfer[] memory);

    function proposeSettlementPlan(
        uint256 groupId,
        DebtTransfer[] calldata transfers
    ) external returns (bytes32 planHash);

    function executeSettlementTransfer(
        uint256 groupId,
        bytes32 planHash,
        uint256 transferIndex
    ) external payable;

    function settleDirect(uint256 groupId, address to) external payable;

    function withdrawClaimable() external;

    // --- View Functions ---
    function getGroup(uint256 groupId) external view returns (
        string memory name,
        address creator,
        uint256 memberCount,
        uint256 expenseCount,
        uint256 requiredApprovals,
        uint256 currentSettlementRound,
        bool isActive
    );

    function getMembers(uint256 groupId) external view returns (address[] memory);

    function isMember(uint256 groupId, address account) external view returns (bool);

    function getExpense(uint256 groupId, uint256 expenseId) external view returns (Expense memory);

    function hasApprovedExpense(uint256 expenseId, address member) external view returns (bool);

    function getNetBalance(uint256 groupId, address member) external view returns (int256);

    function getAllNetBalances(uint256 groupId) external view returns (
        address[] memory membersList,
        int256[] memory balances
    );

    function getClaimableFunds(address recipient) external view returns (uint256);
}
