'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAddMember } from '@/hooks/useGroupDetails';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface AddMemberFormProps {
  groupId: bigint;
  members?: `0x${string}`[];
  onSuccess?: () => void;
}

export default function AddMemberForm({
  groupId,
  members = [],
  onSuccess,
}: AddMemberFormProps) {
  const { address, isConnected } = useAccount();
  const { addMember, status } = useAddMember(groupId);
  const { success, error: toastError } = useToast();

  const [inputAddress, setInputAddress] = useState('');
  const [validationError, setValidationError] = useState('');

  // Connected user must be an existing member to add others
  const isMember =
    !isConnected ||
    members.length === 0 ||
    members.some((m) => m.toLowerCase() === address?.toLowerCase());

  useEffect(() => {
    if (status.status === 'success') {
      success('Member added successfully!');
      setInputAddress('');
      if (onSuccess) onSuccess();
    } else if (status.status === 'error') {
      toastError(status.error || 'Failed to add member');
    }
  }, [status.status, status.error, success, toastError, onSuccess]);

  if (!isMember) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddr = inputAddress.trim();

    if (!cleanAddr.startsWith('0x') || cleanAddr.length !== 42) {
      setValidationError('Please enter a valid 42-character Ethereum address (0x...)');
      return;
    }

    const alreadyMember = members.some(
      (m) => m.toLowerCase() === cleanAddr.toLowerCase()
    );
    if (alreadyMember) {
      setValidationError('This address is already a member of the group');
      return;
    }

    setValidationError('');

    try {
      await addMember(cleanAddr as `0x${string}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding member';
      setValidationError(msg);
    }
  };

  const isLoading = status.status === 'pending' || status.status === 'confirming';

  return (
    <div className="pt-4 border-t border-surface-700/60">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-300">
          <UserPlus className="h-4 w-4 text-primary-400" />
          <span>Add New Member</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2">
          <div className="flex-1">
            <Input
              placeholder="0x..."
              value={inputAddress}
              onChange={(e) => {
                setInputAddress(e.target.value);
                if (validationError) setValidationError('');
              }}
              error={validationError}
              disabled={isLoading}
              className="font-mono text-xs"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            size="md"
            loading={isLoading}
            disabled={!inputAddress.trim() || isLoading}
            className="shrink-0"
          >
            Add Member
          </Button>
        </div>

        {status.status === 'pending' && (
          <p className="text-xs text-amber-300 animate-pulse flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Sign transaction in wallet...
          </p>
        )}

        {status.status === 'confirming' && (
          <p className="text-xs text-primary-300 animate-pulse flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-400" />
            Confirming on Monad...
          </p>
        )}

        {status.status === 'error' && (
          <p className="text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {status.error || 'Failed to add member'}
          </p>
        )}

        {status.status === 'success' && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Member added!
          </p>
        )}
      </form>
    </div>
  );
}
