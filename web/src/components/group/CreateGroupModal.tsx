'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useCreateGroup } from '@/hooks/useGroups';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState('');
  const { isConnected } = useAccount();
  const { createGroup, status } = useCreateGroup();
  const { success, error: toastError } = useToast();

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setValidationError('');
    }
  }, [isOpen]);

  // Handle successful creation
  useEffect(() => {
    if (status.status === 'success') {
      success(`Group "${name.trim()}" created successfully!`);
      onClose();
      if (onCreated) {
        onCreated();
      }
    } else if (status.status === 'error') {
      toastError(status.error || 'Failed to create group');
    }
  }, [status.status, status.error, name, success, toastError, onClose, onCreated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!isConnected) {
      setValidationError('Please connect your wallet first');
      return;
    }

    if (trimmed.length < 2) {
      setValidationError('Group name must be at least 2 characters long');
      return;
    }

    setValidationError('');

    try {
      await createGroup(trimmed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating group';
      setValidationError(msg);
    }
  };

  const isLoading = status.status === 'pending' || status.status === 'confirming';

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-400" />
          <span>Create New Group</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            label="Group Name"
            placeholder="e.g. Summer Vacation, Flatmates, Dinner Squad"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (validationError) setValidationError('');
            }}
            error={validationError}
            disabled={isLoading}
            autoFocus
          />
          <p className="mt-1 text-xs text-surface-400">
            A shared wallet space where members can log and settle group expenses.
          </p>
        </div>

        {/* Transaction Status feedback */}
        {status.status === 'pending' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>Confirming in your wallet...</span>
          </div>
        )}

        {status.status === 'confirming' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs">
            <span className="h-2 w-2 rounded-full bg-primary-400 animate-ping" />
            <span>Waiting for block confirmation on Monad...</span>
          </div>
        )}

        {status.status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="truncate">{status.error || 'Transaction failed'}</span>
          </div>
        )}

        {status.status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Group successfully created!</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={!name.trim() || isLoading}
          >
            {status.status === 'pending'
              ? 'Approve in Wallet...'
              : status.status === 'confirming'
              ? 'Creating...'
              : 'Create Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
