'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Group, Expense, Balance, Settlement } from '@/lib/types';
import { initialGroups, initialExpenses } from '@/lib/mock/mockData';

export interface MockContextType {
  groups: Group[];
  expenses: Expense[];
  getGroupCount: () => bigint;
  getGroup: (groupId: bigint) => Group | undefined;
  createGroup: (name: string, creator: `0x${string}`) => Promise<bigint>;
  addMember: (groupId: bigint, member: `0x${string}`) => Promise<void>;
  getExpenses: (groupId: bigint) => Expense[];
  addExpense: (
    groupId: bigint,
    description: string,
    amount: bigint,
    payer: `0x${string}`,
    participants: `0x${string}`[]
  ) => Promise<void>;
  approveExpense: (
    groupId: bigint,
    expenseId: bigint,
    approver: `0x${string}`
  ) => Promise<void>;
  getBalances: (groupId: bigint) => Balance[];
  calculateSettlement: (groupId: bigint) => Settlement[];
  settleUp: (groupId: bigint) => Promise<void>;
}

const MockContext = createContext<MockContextType | null>(null);

const delay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms));

export function MockProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [settledExpenseIds, setSettledExpenseIds] = useState<Set<bigint>>(new Set());

  const getGroupCount = useCallback((): bigint => {
    return BigInt(groups.length);
  }, [groups]);

  const getGroup = useCallback(
    (groupId: bigint): Group | undefined => {
      return groups.find((g) => g.id === groupId);
    },
    [groups]
  );

  const createGroup = useCallback(
    async (name: string, creator: `0x${string}`): Promise<bigint> => {
      await delay(1000);
      const newId = BigInt(groups.length + 1);
      const newGroup: Group = {
        id: newId,
        name,
        members: [creator],
        creator,
        createdAt: Math.floor(Date.now() / 1000),
      };
      setGroups((prev) => [...prev, newGroup]);
      return newId;
    },
    [groups]
  );

  const addMember = useCallback(
    async (groupId: bigint, member: `0x${string}`): Promise<void> => {
      await delay(1000);
      setGroups((prev) =>
        prev.map((group) => {
          if (group.id !== groupId) return group;
          const exists = group.members.some(
            (m) => m.toLowerCase() === member.toLowerCase()
          );
          if (exists) return group;
          return {
            ...group,
            members: [...group.members, member],
          };
        })
      );
    },
    []
  );

  const getExpenses = useCallback(
    (groupId: bigint): Expense[] => {
      return expenses.filter((e) => e.groupId === groupId);
    },
    [expenses]
  );

  const addExpense = useCallback(
    async (
      groupId: bigint,
      description: string,
      amount: bigint,
      payer: `0x${string}`,
      participants: `0x${string}`[]
    ): Promise<void> => {
      await delay(1000);
      const newExpense: Expense = {
        id: BigInt(expenses.length + 1),
        groupId,
        description,
        amount,
        payer,
        participants,
        approvals: [payer], // payer auto-approves
        approved: participants.length === 1 && participants[0].toLowerCase() === payer.toLowerCase(),
        createdAt: Math.floor(Date.now() / 1000),
      };
      setExpenses((prev) => [...prev, newExpense]);
    },
    [expenses]
  );

  const approveExpense = useCallback(
    async (
      groupId: bigint,
      expenseId: bigint,
      approver: `0x${string}`
    ): Promise<void> => {
      await delay(1000);
      setExpenses((prev) =>
        prev.map((exp) => {
          if (exp.groupId !== groupId || exp.id !== expenseId) return exp;
          const alreadyApproved = exp.approvals.some(
            (a) => a.toLowerCase() === approver.toLowerCase()
          );
          const nextApprovals = alreadyApproved
            ? exp.approvals
            : [...exp.approvals, approver];

          const allApproved = exp.participants.every((p) =>
            nextApprovals.some((a) => a.toLowerCase() === p.toLowerCase())
          );

          return {
            ...exp,
            approvals: nextApprovals,
            approved: allApproved,
          };
        })
      );
    },
    []
  );

  const getBalances = useCallback(
    (groupId: bigint): Balance[] => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return [];

      const balanceMap = new Map<string, bigint>();
      for (const m of group.members) {
        balanceMap.set(m.toLowerCase(), 0n);
      }

      const activeExpenses = expenses.filter(
        (e) => e.groupId === groupId && e.approved && !settledExpenseIds.has(e.id)
      );

      for (const exp of activeExpenses) {
        const payerKey = exp.payer.toLowerCase();
        const curPayerBalance = balanceMap.get(payerKey) ?? 0n;
        balanceMap.set(payerKey, curPayerBalance + exp.amount);

        const count = BigInt(exp.participants.length);
        if (count > 0n) {
          const share = exp.amount / count;
          const remainder = exp.amount % count;

          exp.participants.forEach((p, idx) => {
            const pKey = p.toLowerCase();
            const curBalance = balanceMap.get(pKey) ?? 0n;
            const extra = BigInt(idx) < remainder ? 1n : 0n;
            balanceMap.set(pKey, curBalance - (share + extra));
          });
        }
      }

      return group.members.map((m) => ({
        member: m,
        amount: balanceMap.get(m.toLowerCase()) ?? 0n,
      }));
    },
    [groups, expenses, settledExpenseIds]
  );

  const calculateSettlement = useCallback(
    (groupId: bigint): Settlement[] => {
      const balances = getBalances(groupId);

      // Separate into debtors (negative balance) and creditors (positive balance)
      const debtors: { member: `0x${string}`; owed: bigint }[] = [];
      const creditors: { member: `0x${string}`; owed: bigint }[] = [];

      for (const b of balances) {
        if (b.amount < 0n) {
          debtors.push({ member: b.member, owed: -b.amount });
        } else if (b.amount > 0n) {
          creditors.push({ member: b.member, owed: b.amount });
        }
      }

      // Sort both descending by absolute amount
      debtors.sort((a, b) => (b.owed > a.owed ? 1 : b.owed < a.owed ? -1 : 0));
      creditors.sort((a, b) => (b.owed > a.owed ? 1 : b.owed < a.owed ? -1 : 0));

      const settlements: Settlement[] = [];
      let i = 0;
      let j = 0;

      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const settleAmount = debtor.owed < creditor.owed ? debtor.owed : creditor.owed;

        if (settleAmount > 0n) {
          settlements.push({
            from: debtor.member,
            to: creditor.member,
            amount: settleAmount,
          });
          debtor.owed -= settleAmount;
          creditor.owed -= settleAmount;
        }

        if (debtor.owed === 0n) i++;
        if (creditor.owed === 0n) j++;
      }

      return settlements;
    },
    [getBalances]
  );

  const settleUp = useCallback(
    async (groupId: bigint): Promise<void> => {
      await delay(1000);
      setSettledExpenseIds((prev) => {
        const next = new Set(prev);
        expenses
          .filter((e) => e.groupId === groupId && e.approved)
          .forEach((e) => next.add(e.id));
        return next;
      });
    },
    [expenses]
  );

  const value: MockContextType = {
    groups,
    expenses,
    getGroupCount,
    getGroup,
    createGroup,
    addMember,
    getExpenses,
    addExpense,
    approveExpense,
    getBalances,
    calculateSettlement,
    settleUp,
  };

  return React.createElement(MockContext.Provider, { value }, children);
}

export function useMock(): MockContextType {
  const context = useContext(MockContext);
  if (!context) {
    throw new Error('useMock must be used within a MockProvider');
  }
  return context;
}

export default MockProvider;
