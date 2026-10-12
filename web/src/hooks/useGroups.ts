'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Group, TransactionStatus } from '@/lib/types';
import { CONTRACT_ADDRESS, USE_MOCK } from '@/lib/contracts';
import { TAB_ABI } from '@/lib/abi';
import { useMock } from '@/lib/mock/mockAdapter';
import { DEMO_ADDRESSES } from '@/lib/mock/mockData';

export function useGroups(): {
  groups: Group[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const mock = USE_MOCK ? useMock() : null;

  // Real contract read for group count
  const {
    data: countData,
    isLoading: isCountLoading,
    error: countError,
    refetch: refetchCount,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: TAB_ABI,
    functionName: 'getGroupCount',
    query: {
      enabled: !USE_MOCK,
    },
  });

  const count = typeof countData === 'bigint' ? Number(countData) : 0;

  const groupQueries = Array.from({ length: count }, (_, i) => ({
    address: CONTRACT_ADDRESS,
    abi: TAB_ABI,
    functionName: 'getGroup' as const,
    args: [BigInt(i + 1)],
  }));

  const {
    data: groupsData,
    isLoading: areGroupsLoading,
    error: groupsError,
    refetch: refetchGroupDetails,
  } = useReadContracts({
    contracts: groupQueries,
    query: {
      enabled: !USE_MOCK && count > 0,
    },
  });

  if (USE_MOCK && mock) {
    return {
      groups: mock.groups,
      isLoading: false,
      error: null,
      refetch: () => {},
    };
  }

  const realGroups: Group[] = (groupsData || [])
    .map((item, idx) => {
      if (item.status === 'success' && Array.isArray(item.result)) {
        const [name, members, creator, createdAt] = item.result as [
          string,
          `0x${string}`[],
          `0x${string}`,
          bigint
        ];
        return {
          id: BigInt(idx + 1),
          name,
          members: [...members],
          creator,
          createdAt: Number(createdAt),
        };
      }
      return null;
    })
    .filter((g): g is Group => g !== null);

  const refetch = () => {
    refetchCount();
    if (count > 0) {
      refetchGroupDetails();
    }
  };

  return {
    groups: realGroups,
    isLoading: isCountLoading || areGroupsLoading,
    error: countError?.message || groupsError?.message || null,
    refetch,
  };
}

export function useCreateGroup(): {
  createGroup: (name: string) => Promise<void>;
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

  const createGroup = useCallback(
    async (name: string) => {
      if (USE_MOCK && mock) {
        try {
          setMockStatus({ status: 'pending' });
          const creator = address || DEMO_ADDRESSES[0];
          await mock.createGroup(name, creator);
          setMockStatus({ status: 'confirming' });
          await new Promise((r) => setTimeout(r, 400));
          setMockStatus({ status: 'success' });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to create group';
          setMockStatus({ status: 'error', error: message });
          throw err;
        }
        return;
      }

      try {
        await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: TAB_ABI,
          functionName: 'createGroup',
          args: [name],
        });
      } catch (err: unknown) {
        throw err;
      }
    },
    [address, mock, writeContractAsync]
  );

  if (USE_MOCK) {
    return {
      createGroup,
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
    createGroup,
    status: realStatus,
  };
}

export default useGroups;
