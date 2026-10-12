'use client';

import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Expense, TransactionStatus } from '@/lib/types';
import { CONTRACT_ADDRESS, USE_MOCK } from '@/lib/contracts';
import { TAB_ABI } from '@/lib/abi';
import { useMock } from '@/lib/mock/mockAdapter';
import { DEMO_ADDRESSES } from '@/lib/mock/mockData';

export function useExpenses(groupId: bigint): {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const mock = USE_MOCK ? useMock() : null;

  const {
    data: countData,
    isLoading: isCountLoading,
    error: countError,
    refetch: refetchCount,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TAB_ABI,
    functionName: 'getExpenseCount',
    args: [groupId],
    query: {
      enabled: !USE_MOCK && groupId > 0n,
    },
  });

  const count = typeof countData === 'bigint' ? Number(countData) : 0;

  const expenseQueries = Array.from({ length: count }, (_, i) => ({
    address: CONTRACT_ADDRESS,
    abi: TAB_ABI,
    functionName: 'getExpense' as const,
    args: [groupId, BigInt(i + 1)],
  }));

  const {
    data: expensesData,
    isLoading: areExpensesLoading,
    error: expensesError,
    refetch: refetchExpenseDetails,
  } = useReadContracts({
    contracts: expenseQueries,
    query: {
      enabled: !USE_MOCK && count > 0,
    },
  });

  if (USE_MOCK && mock) {
    return {
      expenses: mock.getExpenses(groupId),
      isLoading: false,
      error: null,
      refetch: () => {},
    };
  }

  const realExpenses: Expense[] = (expensesData || [])
    .map((item, idx) => {
      if (item.status === 'success' && Array.isArray(item.result)) {
        const [
          description,
          amount,
          payer,
          participants,
          approvals,
          approved,
          createdAt,
        ] = item.result as [
          string,
          bigint,
          `0x${string}`,
          `0x${string}`[],
          `0x${string}`[],
          boolean,
          bigint
        ];

        return {
          id: BigInt(idx + 1),
          groupId,
          description,
          amount,
          payer,
          participants: [...participants],
          approvals: [...approvals],
          approved,
          createdAt: Number(createdAt),
        };
      }
      return null;
    })
    .filter((e): e is Expense => e !== null);

  const refetch = () => {
    refetchCount();
    if (count > 0) {
      refetchExpenseDetails();
    }
  };

  return {
    expenses: realExpenses,
    isLoading: isCountLoading || areExpensesLoading,
    error: countError?.message || expensesError?.message || null,
    refetch,
  };
}

export function useAddExpense(groupId: bigint): {
  addExpense: (
    desc: string,
    amount: bigint,
    participants: `0x${string}`[]
  ) => Promise<void>;
  status: TransactionStatus;
} {
  const { address } = useAccount();
  const mock = USE_MOCK ? useMock() : null;

  const [mockStatus, setMockStatus] = useState<TransactionStatus>({
    status: 'idle',
  });

  const {
    writeContractAsync,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !USE_MOCK && !!hash,
    },
  });

  const addExpense = useCallback(
    async (
      desc: string,
      amount: bigint,
      participants: `0x${string}`[]
    ) => {
      if (USE_MOCK && mock) {
        try {
          setMockStatus({ status: 'pending' });
          const payer = address || DEMO_ADDRESSES[0];
          await mock.addExpense(groupId, desc, amount, payer, participants);
          setMockStatus({ status: 'confirming' });
          await new Promise((r) => setTimeout(r, 400));
          setMockStatus({ status: 'success' });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Failed to add expense';
          setMockStatus({ status: 'error', error: message });
          throw err;
        }
        return;
      }

      try {
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: TAB_ABI,
          functionName: 'addExpense',
          args: [groupId, desc, amount, participants],
        });
      } catch (err: unknown) {
        throw err;
      }
    },
    [address, groupId, mock, writeContractAsync]
  );

  if (USE_MOCK) {
    return {
      addExpense,
      status: mockStatus,
    };
  }

  let realStatus: TransactionStatus = { status: 'idle' };
  if (isWritePending) {
    realStatus = { status: 'pending' };
  } else if (isConfirming) {
    realStatus = { status: 'confirming', hash };
  } else if (isSuccess) {
    realStatus = { status: 'success', hash };
  } else if (writeError || receiptError) {
    realStatus = {
      status: 'error',
      hash,
      error: writeError?.message || receiptError?.message,
    };
  }

  return {
    addExpense,
    status: realStatus,
  };
}

export function useApproveExpense(groupId: bigint): {
  approveExpense: (expenseId: bigint) => Promise<void>;
  status: TransactionStatus;
} {
  const { address } = useAccount();
  const mock = USE_MOCK ? useMock() : null;

  const [mockStatus, setMockStatus] = useState<TransactionStatus>({
    status: 'idle',
  });

  const {
    writeContractAsync,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !USE_MOCK && !!hash,
    },
  });

  const approveExpense = useCallback(
    async (expenseId: bigint) => {
      if (USE_MOCK && mock) {
        try {
          setMockStatus({ status: 'pending' });
          const approver = address || DEMO_ADDRESSES[0];
          await mock.approveExpense(groupId, expenseId, approver);
          setMockStatus({ status: 'confirming' });
          await new Promise((r) => setTimeout(r, 400));
          setMockStatus({ status: 'success' });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Failed to approve expense';
          setMockStatus({ status: 'error', error: message });
          throw err;
        }
        return;
      }

      try {
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: TAB_ABI,
          functionName: 'approveExpense',
          args: [groupId, expenseId],
        });
      } catch (err: unknown) {
        throw err;
      }
    },
    [address, groupId, mock, writeContractAsync]
  );

  if (USE_MOCK) {
    return {
      approveExpense,
      status: mockStatus,
    };
  }

  let realStatus: TransactionStatus = { status: 'idle' };
  if (isWritePending) {
    realStatus = { status: 'pending' };
  } else if (isConfirming) {
    realStatus = { status: 'confirming', hash };
  } else if (isSuccess) {
    realStatus = { status: 'success', hash };
  } else if (writeError || receiptError) {
    realStatus = {
      status: 'error',
      hash,
      error: writeError?.message || receiptError?.message,
    };
  }

  return {
    approveExpense,
    status: realStatus,
  };
}

export default useExpenses;
