import { Group, Expense } from '@/lib/types';
import { shortenAddress } from '@/lib/utils';

export const DEMO_ADDRESSES: `0x${string}`[] = [
  '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Alice
  '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Bob
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Charlie
  '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Diana
  '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df', // Eve
];

export const DEMO_NAMES: Record<string, string> = {
  [DEMO_ADDRESSES[0].toLowerCase()]: 'Alice',
  [DEMO_ADDRESSES[1].toLowerCase()]: 'Bob',
  [DEMO_ADDRESSES[2].toLowerCase()]: 'Charlie',
  [DEMO_ADDRESSES[3].toLowerCase()]: 'Diana',
  [DEMO_ADDRESSES[4].toLowerCase()]: 'Eve',
  // Keep original casing mapping too
  [DEMO_ADDRESSES[0]]: 'Alice',
  [DEMO_ADDRESSES[1]]: 'Bob',
  [DEMO_ADDRESSES[2]]: 'Charlie',
  [DEMO_ADDRESSES[3]]: 'Diana',
  [DEMO_ADDRESSES[4]]: 'Eve',
};

export function getDemoName(address: string): string {
  if (!address) return '';
  const found = DEMO_NAMES[address] || DEMO_NAMES[address.toLowerCase()];
  return found || shortenAddress(address);
}

const NOW = Date.now();
const ONE_HOUR = 3600 * 1000;
const ONE_DAY = 24 * 3600 * 1000;

export const initialGroups: Group[] = [
  {
    id: 1n,
    name: 'Weekend Trip',
    members: [...DEMO_ADDRESSES],
    creator: DEMO_ADDRESSES[0],
    createdAt: Math.floor((NOW - 3 * ONE_DAY) / 1000),
  },
  {
    id: 2n,
    name: 'Lunch Squad',
    members: [DEMO_ADDRESSES[0], DEMO_ADDRESSES[1], DEMO_ADDRESSES[2]],
    creator: DEMO_ADDRESSES[1],
    createdAt: Math.floor((NOW - 1 * ONE_DAY) / 1000),
  },
];

export const initialExpenses: Expense[] = [
  {
    id: 1n,
    groupId: 1n,
    description: 'Groceries & BBQ supplies',
    amount: BigInt('50000000000000000000'), // 50 MON
    payer: DEMO_ADDRESSES[0], // Alice paid
    participants: [...DEMO_ADDRESSES], // all 5 participants
    approvals: [
      DEMO_ADDRESSES[0],
      DEMO_ADDRESSES[1],
      DEMO_ADDRESSES[2],
      DEMO_ADDRESSES[3],
      DEMO_ADDRESSES[4],
    ],
    approved: true,
    createdAt: Math.floor((NOW - 2 * ONE_DAY) / 1000),
  },
  {
    id: 2n,
    groupId: 1n,
    description: 'Uber ride to cabin',
    amount: BigInt('15000000000000000000'), // 15 MON
    payer: DEMO_ADDRESSES[1], // Bob paid
    participants: [DEMO_ADDRESSES[0], DEMO_ADDRESSES[1], DEMO_ADDRESSES[2], DEMO_ADDRESSES[3]],
    approvals: [DEMO_ADDRESSES[1], DEMO_ADDRESSES[0], DEMO_ADDRESSES[2]],
    approved: false, // Diana hasn't approved
    createdAt: Math.floor((NOW - 36 * ONE_HOUR) / 1000),
  },
  {
    id: 3n,
    groupId: 1n,
    description: 'Movie tickets',
    amount: BigInt('20000000000000000000'), // 20 MON
    payer: DEMO_ADDRESSES[3], // Diana paid
    participants: [DEMO_ADDRESSES[0], DEMO_ADDRESSES[2], DEMO_ADDRESSES[3], DEMO_ADDRESSES[4]],
    approvals: [
      DEMO_ADDRESSES[3],
      DEMO_ADDRESSES[0],
      DEMO_ADDRESSES[2],
      DEMO_ADDRESSES[4],
    ],
    approved: true,
    createdAt: Math.floor((NOW - 20 * ONE_HOUR) / 1000),
  },
  {
    id: 4n,
    groupId: 2n,
    description: 'Pizza dinner',
    amount: BigInt('30000000000000000000'), // 30 MON
    payer: DEMO_ADDRESSES[1], // Bob paid
    participants: [DEMO_ADDRESSES[0], DEMO_ADDRESSES[1], DEMO_ADDRESSES[2]],
    approvals: [DEMO_ADDRESSES[1], DEMO_ADDRESSES[0], DEMO_ADDRESSES[2]],
    approved: true,
    createdAt: Math.floor((NOW - 18 * ONE_HOUR) / 1000),
  },
  {
    id: 5n,
    groupId: 2n,
    description: 'Coffee run',
    amount: BigInt('6000000000000000000'), // 6 MON
    payer: DEMO_ADDRESSES[0], // Alice paid
    participants: [DEMO_ADDRESSES[0], DEMO_ADDRESSES[1], DEMO_ADDRESSES[2]],
    approvals: [DEMO_ADDRESSES[0], DEMO_ADDRESSES[1]],
    approved: false, // Charlie hasn't approved
    createdAt: Math.floor((NOW - 4 * ONE_HOUR) / 1000),
  },
];

const mockData = {
  DEMO_ADDRESSES,
  DEMO_NAMES,
  getDemoName,
  initialGroups,
  initialExpenses,
};

export default mockData;
