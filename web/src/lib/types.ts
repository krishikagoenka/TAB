export interface Group {
  id: bigint;
  name: string;
  members: `0x${string}`[];
  creator: `0x${string}`;
  createdAt: number;
}

export interface Expense {
  id: bigint;
  groupId: bigint;
  description: string;
  amount: bigint; // in wei
  payer: `0x${string}`;
  participants: `0x${string}`[];
  approvals: `0x${string}`[];
  approved: boolean;
  createdAt: number;
}

export interface Balance {
  member: `0x${string}`;
  amount: bigint; // positive = owed money, negative = owes money
}

export interface Settlement {
  from: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
}

export interface TransactionStatus {
  status: 'idle' | 'pending' | 'confirming' | 'success' | 'error';
  hash?: `0x${string}`;
  error?: string;
}
