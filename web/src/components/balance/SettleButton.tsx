'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSettlement } from '@/hooks/useSettlement';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ArrowRightLeft, Check, AlertTriangle } from 'lucide-react';

export interface SettleButtonProps {
  groupId: bigint;
  onSettled?: () => void;
  disabled?: boolean;
}

export default function SettleButton({
  groupId,
  onSettled,
  disabled = false,
}: SettleButtonProps) {
  const { isConnected } = useAccount();
  const { settleUp, status } = useSettlement(groupId);
  const { success, error: toastError } = useToast();

  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (status.status === 'success') {
      success('Group debts successfully settled up on Monad!');
      setConfirming(false);
      if (onSettled) onSettled();
    } else if (status.status === 'error') {
      toastError(status.error || 'Failed to settle up');
      setConfirming(false);
    }
  }, [status.status, status.error, success, toastError, onSettled]);

  const handleSettleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    try {
      await settleUp();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error executing settlement';
      toastError(msg);
    }
  };

  const isLoading = status.status === 'pending' || status.status === 'confirming';

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="danger"
          size="md"
          loading={isLoading}
          disabled={isLoading}
          onClick={handleSettleClick}
          className="gap-2 shadow-lg shadow-rose-500/20"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Confirm Settle Up</span>
        </Button>
        <Button
          variant="ghost"
          size="md"
          disabled={isLoading}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      loading={isLoading}
      disabled={disabled || !isConnected || isLoading}
      onClick={handleSettleClick}
      className="gap-2 shadow-lg shadow-primary-500/25"
    >
      <ArrowRightLeft className="h-4 w-4" />
      <span>Settle All Debts</span>
    </Button>
  );
}
