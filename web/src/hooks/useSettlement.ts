'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Balance, Settlement, TransactionStatus } from '@/lib/types';
import { CONTRACT_ADDRESS, USE_MOCK } from '@/lib/contracts';
import { TAB_ABI } from '@/lib/abi';
import { useMock } from '@/lib/mock/mockAdapter';

export function useBalances(groupId: bigint): {
  balances: Balance[];
  isLoading: boolean;
  error: string | null;
} {
  const mock = USE_MOCK ? useMock() : null;

  const {
    data,
    isLoading,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TAB_ABI,
    functionName: 'getBalances',
    args: [groupId],
    query: {
      enabled: !USE_MOCK && groupId > 0n,
    },
  });

  if (USE_MOCK && mock) {
    return {
      balances: mock.getBalances(groupId),
      isLoading: false,
      error: null,
    };
  }

  let balances: Balance[] = [];
  if (data && Array.isArray(data)) {
    const [members, amounts] = data as [`0x${string}`[], bigint[]];
    balances = members.map((member, i) => ({
      member,
      amount: amounts[i],
    }));
  }

  return {
    balances,
    isLoading,
    error: error?.message || null,
  };
}

export function useSettlement(groupId: bigint): {
  settlements: Settlement[];
  isLoading: boolean;
  error: string | null;
  settleUp: () => Promise<void>;
  status: TransactionStatus;
} {
  const mock = USE_MOCK ? useMock() : null;

  const [mockStatus, setMockStatus] = useState<TransactionStatus>({
    status: 'idle',
  });

  const {
    data,
    isLoading: isContractLoading,
    error: contractError,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TAB_ABI,
    functionName: 'calculateSettlement',
    args: [groupId],
    query: {
      enabled: !USE_MOCK && groupId > 0n,
    },
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

  const settleUp = useCallback(async () => {
    if (USE_MOCK && mock) {
      try {
        setMockStatus({ status: 'pending' });
        await mock.settleUp(groupId);
        setMockStatus({ status: 'confirming' });
        await new Promise((r) => setTimeout(r, 400));
        setMockStatus({ status: 'success' });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to settle up';
        setMockStatus({ status: 'error', error: message });
        throw err;
      }
      return;
    }

    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: TAB_ABI,
        functionName: 'settleUp',
        args: [groupId],
      });
    } catch (err: unknown) {
      throw err;
    }
  }, [groupId, mock, writeContractAsync]);

  if (USE_MOCK && mock) {
    return {
      settlements: mock.calculateSettlement(groupId),
      isLoading: false,
      error: null,
      settleUp,
      status: mockStatus,
    };
  }

  let settlements: Settlement[] = [];
  if (data && Array.isArray(data)) {
    const [froms, tos, amounts] = data as [
      `0x${string}`[],
      `0x${string}`[],
      bigint[]
    ];
    settlements = froms.map((from, idx) => ({
      from,
      to: tos[idx],
      amount: amounts[idx],
    }));
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
    settlements,
    isLoading: isContractLoading,
    error: contractError?.message || null,
    settleUp,
    status: realStatus,
  };
}

export default useSettlement;
