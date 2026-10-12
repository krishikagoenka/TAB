# TAB Protocol — Contract Interface & Integration Guide
> **For Person 2 (Frontend Engineer) & Integration Partners**  
> **Blockchain Architecture Owner:** Person 1 (Blockchain Engineer)  
> **Network:** Monad Testnet (Chain ID `10143`) / Local Hardhat (`31337`)  
> **Native Currency:** `MON` (18 decimals, 1 MON = $10^{18}$ wei)

---

## 1. Overview & Shared Artifact Locations

All shared blockchain artifacts are located in the `shared/` directory:

| Artifact | File Path | Description |
|---|---|---|
| **Contract ABI** | [`shared/abi/TabGroupWallet.json`](file:///c:/Users/me225/OneDrive/Desktop/TAB/shared/abi/TabGroupWallet.json) | Complete JSON ABI for ethers.js / viem / wagmi |
| **Interface ABI** | [`shared/abi/ITabGroupWallet.json`](file:///c:/Users/me225/OneDrive/Desktop/TAB/shared/abi/ITabGroupWallet.json) | Interface-only ABI |
| **Deployment Info** | [`shared/deployment.json`](file:///c:/Users/me225/OneDrive/Desktop/TAB/shared/deployment.json) | Live network deployment address, txHash, timestamp |
| **Solidity Interfaces** | [`contracts/interfaces/ITabGroupWallet.sol`](file:///c:/Users/me225/OneDrive/Desktop/TAB/contracts/interfaces/ITabGroupWallet.sol) | Source interface definitions |

### Reading Contract in Frontend:
```typescript
import TabGroupWalletABI from "../shared/abi/TabGroupWallet.json";
import deployment from "../shared/deployment.json";

const contractAddress = deployment.contracts.TabGroupWallet.address;
const tabContract = new ethers.Contract(contractAddress, TabGroupWalletABI, signerOrProvider);
```

---

## 2. Core Concepts & Conventions

### A. Balance Convention
TAB enforces integer arithmetic in native MON wei units (never floating-point):
- **Positive balance (`> 0`)**: The member is a **CREDITOR** (is owed money, should receive MON).
- **Negative balance (`< 0`)**: The member is a **DEBTOR** (owes money, must pay MON).
- **Zero balance (`== 0`)**: The member is completely settled.
- **Closed Group Invariant**: In any group at any time, $\sum \text{netBalances} \equiv 0$. The sum of all member balances is strictly zero.

### B. Expense Approval & Processing Rules
1. **Creation**: When an expense is recorded via `recordExpense(...)`, the recorder (`msg.sender`) automatically approves it.
2. **Threshold**: Each group has a `requiredApprovals` setting (configured at group creation):
   - If `requiredApprovals == 1`: The expense is **automatically processed immediately** into net balances upon recording (fast-track).
   - If `requiredApprovals > 1`: The expense remains in `Pending` (`status = 0`) state.
3. **Approval**: Participating group members call `approveExpense(groupId, expenseId)`.
   - Prevented: Duplicate approvals by the same member (`AlreadyApproved`).
   - Prevented: Approvals on already processed expenses (`ExpenseAlreadyProcessed`).
4. **Balance Impact**: At the exact moment `approvalCount >= requiredApprovals`, the expense state flips to `Processed` (`status = 1`) and balances are updated **exactly once**.
5. **Rejection**: Any participant or creator can reject a pending expense via `rejectExpense(groupId, expenseId)`, transitioning it to `Rejected` (`status = 2`).

### C. Deterministic Equal Splitting & Rounding
When an expense amount $A$ is split equally among $N$ participants:
- Base share: $\text{baseShare} = \lfloor A / N \rfloor$
- Remainder: $R = A \pmod N$
- The first $R$ participants in the list pay $\text{baseShare} + 1\text{ wei}$, and the remaining $N - R$ participants pay $\text{baseShare}$.
- Payer is credited $+A$, participants are debited their calculated shares.
- Net delta for the group is identically $0$ wei. No rounding drift.

---

## 3. Settlement Workflow

TAB provides two complementary ways to settle debts using native MON:

```
+-----------------------------------------------------------------------------------+
|                            Settlement Workflows                                   |
+-----------------------------------------------------------------------------------+
|  Workflow 1: Multi-party Optimized Plan (Greedy Debt Simplification)             |
|                                                                                   |
|  1. Frontend calls getSettlementPlan(groupId) [Free View Call, 0 Gas]             |
|     --> Contract returns simplified transfers: DebtTransfer[]                     |
|                                                                                   |
|  2. Member/Coordinator calls proposeSettlementPlan(groupId, transfers)            |
|     --> Emits SettlementPlanProposed(groupId, planHash, roundId, count)          |
|                                                                                   |
|  3. Each debtor calls executeSettlementTransfer{value: amount}(groupId, planHash) |
|     --> Replay protected. Prevents double-settlement. Updates net balances.      |
|     --> When all transfers complete: advances currentSettlementRound              |
+-----------------------------------------------------------------------------------+
|  Workflow 2: Direct 1-on-1 Settle                                                 |
|                                                                                   |
|  Debtor calls settleDirect{value: amount}(groupId, creditorAddress)               |
|     --> Settles instantly for any amount <= debtor's debt & creditor's credit     |
+-----------------------------------------------------------------------------------+
```

### Explanation of the Greedy Settlement Algorithm & Limitations
- **Greedy Matching**: Matches the current largest debtor with the current largest creditor, settling $\min(\text{debt}, \text{credit})$ at each step.
- **Complexity Reduction**: Reduces bilateral debts from up to $O(N^2)$ (specifically $N(N-1)/2$) down to at most $N - 1$ transfers.
- **Theoretical Limitation**: Finding the absolute global minimum number of transfers across arbitrary subsets is equivalent to the **Subset Sum / Partition Problem**, which is NP-hard. Greedy heuristic is optimal or near-optimal for real-world groups and eliminates $80-90\%$ of unnecessary transactions without requiring exponential off-chain compute.

---

## 4. Contract Function Reference

### Group Management

#### `createGroup`
```solidity
function createGroup(
    string calldata name,
    address[] calldata initialMembers,
    uint256 requiredApprovals
) external returns (uint256 groupId)
```
- **Description:** Creates a group. Creator (`msg.sender`) is automatically added as a member.
- **Parameters:**
  - `name`: Human-readable group name (e.g., "Monad Hacker House"). Cannot be empty.
  - `initialMembers`: Array of initial member addresses (excluding creator). Zero address and duplicates revert.
  - `requiredApprovals`: Minimum approvals needed for expenses to affect balances (pass `1` for auto-approve).
- **Returns:** `groupId` (starts at `1`).
- **Events:** `GroupCreated(uint256 indexed groupId, string name, address indexed creator, uint256 requiredApprovals, address[] members)`.

#### `addMember`
```solidity
function addMember(uint256 groupId, address newMember) external
```
- **Description:** Adds an additional member to an existing group.
- **Access:** Only existing group members.
- **Events:** `MemberAdded(uint256 indexed groupId, address indexed member, address indexed addedBy)`.

#### `getGroup`
```solidity
function getGroup(uint256 groupId) external view returns (
    string memory name,
    address creator,
    uint256 memberCount,
    uint256 expenseCount,
    uint256 requiredApprovals,
    uint256 currentSettlementRound,
    bool isActive
)
```

#### `getMembers`
```solidity
function getMembers(uint256 groupId) external view returns (address[] memory)
```

#### `isMember`
```solidity
function isMember(uint256 groupId, address account) external view returns (bool)
```

---

### Expense Management

#### `recordExpense`
```solidity
function recordExpense(
    uint256 groupId,
    address payer,
    uint256 amount,
    string calldata description,
    address[] calldata participants
) external returns (uint256 expenseId)
```
- **Description:** Records an expense in native MON wei. If `requiredApprovals == 1`, processes immediately.
- **Parameters:**
  - `groupId`: Group ID.
  - `payer`: Member who paid upfront (must be a group member).
  - `amount`: Total expense amount in wei (`> 0`).
  - `description`: Expense title / memo.
  - `participants`: Distinct array of group members sharing this expense.
- **Events:**
  - `ExpenseRecorded(groupId, expenseId, payer, amount, description, participants, requiredApprovals, autoProcessed)`
  - `ExpenseProcessed(groupId, expenseId, amount)` (if auto-processed)
  - `BalanceUpdated(groupId, member, newBalance, delta)`

#### `approveExpense`
```solidity
function approveExpense(uint256 groupId, uint256 expenseId) external
```
- **Description:** Approves a pending expense.
- **Access:** Group members.
- **Events:** `ExpenseApproved`, and `ExpenseProcessed` once threshold reached.

#### `rejectExpense`
```solidity
function rejectExpense(uint256 groupId, uint256 expenseId) external
```
- **Description:** Rejects a pending expense.
- **Access:** Group creator, payer, or any participant of the expense.
- **Events:** `ExpenseRejected(groupId, expenseId, rejectedBy)`.

#### `getExpense`
```solidity
function getExpense(uint256 groupId, uint256 expenseId) external view returns (Expense memory)
```

---

### Balance Inquiries

#### `getNetBalance`
```solidity
function getNetBalance(uint256 groupId, address member) external view returns (int256)
```
- **Returns:** Signed integer (`int256`) in wei. `> 0` is creditor, `< 0` is debtor.

#### `getAllNetBalances`
```solidity
function getAllNetBalances(uint256 groupId) external view returns (
    address[] memory membersList,
    int256[] memory balances
)
```
- **Description:** Perfect for rendering the group dashboard leaderboard in one call.

---

### Settlement Execution

#### `getSettlementPlan`
```solidity
function getSettlementPlan(uint256 groupId) external view returns (DebtTransfer[] memory)
```
- **Description:** Calculates and returns the simplified greedy settlement plan.
- **Gas cost:** 0 gas (view call).
- **Return Struct:**
  ```solidity
  struct DebtTransfer {
      address from;   // Debtor
      address to;     // Creditor
      uint256 amount; // Amount in wei
  }
  ```

#### `proposeSettlementPlan`
```solidity
function proposeSettlementPlan(
    uint256 groupId,
    DebtTransfer[] calldata transfers
) external returns (bytes32 planHash)
```
- **Description:** Registers a verified settlement plan for the current round.

#### `executeSettlementTransfer`
```solidity
function executeSettlementTransfer(
    uint256 groupId,
    bytes32 planHash,
    uint256 transferIndex
) external payable
```
- **Description:** Debtor executes their assigned transfer by sending `msg.value == amount` native MON.
- **Reentrancy & Safety:** Reentrancy-guarded. If creditor contract reverts on receiving MON, funds are safely escrowed into `getClaimableFunds` (pull-payment pattern) to prevent DoS attacks.

#### `settleDirect`
```solidity
function settleDirect(uint256 groupId, address to) external payable
```
- **Description:** Quick direct payment from debtor to creditor. `msg.value` sent as native MON.

#### `withdrawClaimable`
```solidity
function withdrawClaimable() external
```
- **Description:** Allows creditors to withdraw any escrowed funds from failed push transfers.

---

## 5. Required Environment Variables

For frontend and integration:
```env
# Monad Testnet RPC URL
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143

# Deployed Contract Address (read from shared/deployment.json)
NEXT_PUBLIC_TAB_CONTRACT_ADDRESS=<DEPLOYED_ADDRESS>
```
