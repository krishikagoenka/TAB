export const TAB_ABI = [
  // Functions
  {
    type: 'function',
    name: 'createGroup',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'addMember',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'member', type: 'address' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getGroupCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getGroup',
    stateMutability: 'view',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'members', type: 'address[]' },
      { name: 'creator', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'addExpense',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'participants', type: 'address[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'approveExpense',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'expenseId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getExpenseCount',
    stateMutability: 'view',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getExpense',
    stateMutability: 'view',
    inputs: [
      { name: 'groupId', type: 'uint256' },
      { name: 'expenseId', type: 'uint256' },
    ],
    outputs: [
      { name: 'description', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'payer', type: 'address' },
      { name: 'participants', type: 'address[]' },
      { name: 'approvals', type: 'address[]' },
      { name: 'approved', type: 'bool' },
      { name: 'createdAt', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getBalances',
    stateMutability: 'view',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [
      { name: 'members', type: 'address[]' },
      { name: 'balances', type: 'int256[]' },
    ],
  },
  {
    type: 'function',
    name: 'calculateSettlement',
    stateMutability: 'view',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [
      { name: 'froms', type: 'address[]' },
      { name: 'tos', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
    ],
  },
  {
    type: 'function',
    name: 'settleUp',
    stateMutability: 'payable',
    inputs: [{ name: 'groupId', type: 'uint256' }],
    outputs: [],
  },
  // Events
  {
    type: 'event',
    name: 'GroupCreated',
    inputs: [
      { indexed: true, name: 'groupId', type: 'uint256' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'creator', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'MemberAdded',
    inputs: [
      { indexed: true, name: 'groupId', type: 'uint256' },
      { indexed: false, name: 'member', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'ExpenseAdded',
    inputs: [
      { indexed: true, name: 'groupId', type: 'uint256' },
      { indexed: false, name: 'expenseId', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'payer', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'ExpenseApproved',
    inputs: [
      { indexed: true, name: 'groupId', type: 'uint256' },
      { indexed: false, name: 'expenseId', type: 'uint256' },
      { indexed: false, name: 'approver', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'SettlementExecuted',
    inputs: [
      { indexed: true, name: 'groupId', type: 'uint256' },
      { indexed: false, name: 'from', type: 'address' },
      { indexed: false, name: 'to', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
  },
] as const;

export default TAB_ABI;
