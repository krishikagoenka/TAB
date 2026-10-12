'use client';

import { useState, useCallback } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Group, TransactionStatus } from '@/lib/types';
import { CONTRACT_ADDRESS, USE_MOCK } from '@/lib/contracts';
import { TAB_ABI } from '@/lib/abi';
import { useMock } from '@/lib/mock/mockAdapter';

export function useGroupDetails(groupId: bigint): {
  group: Group | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const mock = USE_MOCK ? useMock() : null;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TAB_ABI,
    functionName: 'getGroup',
    args: [groupId],
    query: {
      enabled: !USE_MOCK && groupId > 0n,
    },
  });

  if (USE_MOCK && mock) {
    const group = mock.getGroup(groupId) || null;
    return {
      group,
      isLoading: false,
      error: null,
      refetch: () => {},
    };
  }

  let group: Group | null = null;
  if (data && Array.isArray(data)) {
    const [name, members, creator, createdAt] = data as [
      string,
      `0x${string}`[],
      `0x${string}`,
      bigint
    ];
    group = {
      id: groupId,
      name,
      members: [...members],
      creator,
      createdAt: Number(createdAt),
    };
  }

  return {
    group,
    isLoading,
    error: error?.message || null,
    refetch,
  };
}

export function useAddMember(groupId: bigint): {
  addMember: (member: `0x${string}`) => Promise<void>;
  status: TransactionStatus;
} {
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

  const addMember = useCallback(
    async (member: `0x${string}`) => {
      if (USE_MOCK && mock) {
        try {
          setMockStatus({ status: 'pending' });
          await mock.addMember(groupId, member);
          setMockStatus({ status: 'confirming' });
          await new Promise((r) => setTimeout(r, 400));
          setMockStatus({ status: 'success' });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to add member';
          setMockStatus({ status: 'error', error: message });
          throw err;
        }
        return;
      }

      try {
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: TAB_ABI,
          functionName: 'addMember',
          args: [groupId, member],
        });
      } catch (err: unknown) {
        throw err;
      }
    },
    [groupId, mock, writeContractAsync]
  );

  if (USE_MOCK) {
    return {
      addMember,
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
    addMember,
    status: realStatus,
  };
}

export default useGroupDetails;
