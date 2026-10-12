'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAddExpense } from '@/hooks/useExpenses';
import { parseEther, shortenAddress } from '@/lib/utils';
import { getDemoName } from '@/lib/mock/mockData';
import { Receipt, Check, AlertCircle, CheckCircle2, Users } from 'lucide-react';

export interface AddExpenseModalProps {
  groupId: bigint;
  members: `0x${string}`[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddExpenseModal({
  groupId,
  members,
  isOpen,
  onClose,
  onSuccess,
}: AddExpenseModalProps) {
  const { address, isConnected } = useAccount();
  const { addExpense, status } = useAddExpense(groupId);
  const { success, error: toastError } = useToast();

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<`0x${string}`[]>([]);
  const [validationError, setValidationError] = useState('');

  // Default to selecting all group members when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedParticipants([...members]);
      setDescription('');
      setAmountStr('');
      setValidationError('');
    }
  }, [isOpen, members]);

  // Handle success / error feedback
  useEffect(() => {
    if (status.status === 'success') {
      success('Expense added successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } else if (status.status === 'error') {
      toastError(status.error || 'Failed to add expense');
    }
  }, [status.status, status.error, success, toastError, onClose, onSuccess]);

  const toggleParticipant = (member: `0x${string}`) => {
    setSelectedParticipants((prev) => {
      const exists = prev.some((m) => m.toLowerCase() === member.toLowerCase());
      if (exists) {
        return prev.filter((m) => m.toLowerCase() !== member.toLowerCase());
      } else {
        return [...prev, member];
      }
    });
  };

  const selectAll = () => setSelectedParticipants([...members]);
  const deselectAll = () => setSelectedParticipants([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      setValidationError('Please connect your wallet first.');
      return;
    }

    if (!description.trim()) {
      setValidationError('Please provide a description.');
      return;
    }

    const numAmount = parseFloat(amountStr);
    if (!amountStr || isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please enter a valid amount greater than 0.');
      return;
    }

    if (selectedParticipants.length < 2) {
      setValidationError('At least 2 participants are required to split an expense.');
      return;
    }

    setValidationError('');

    try {
      const parsedWei = parseEther(amountStr);
      await addExpense(description.trim(), parsedWei, selectedParticipants);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding expense';
      setValidationError(msg);
    }
  };

  const isLoading = status.status === 'pending' || status.status === 'confirming';

  const numAmount = parseFloat(amountStr);
  const splitAmount =
    !isNaN(numAmount) && numAmount > 0 && selectedParticipants.length > 0
      ? (numAmount / selectedParticipants.length).toFixed(4)
      : '0.00';

  const payerAddress = address || (members[0] as `0x${string}`);
  const payerName = getDemoName(payerAddress);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary-400" />
          <span>Add Group Expense</span>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description */}
        <Input
          label="Description"
          placeholder="e.g. Dinner at Mario's, Airbnb deposit, Groceries"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (validationError) setValidationError('');
          }}
          disabled={isLoading}
          autoFocus
        />

        {/* Amount */}
        <Input
          label="Total Amount"
          type="number"
          step="any"
          min="0.0001"
          prefix="MON"
          placeholder="0.00"
          value={amountStr}
          onChange={(e) => {
            setAmountStr(e.target.value);
            if (validationError) setValidationError('');
          }}
          disabled={isLoading}
        />

        {/* Payer (Read-only) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-surface-200 mb-1.5">
            Paid By
          </label>
          <div className="p-2.5 rounded-xl bg-surface-900/60 border border-surface-700/80 text-xs flex items-center justify-between">
            <span className="font-medium text-white">
              {payerName} (You)
            </span>
            <span className="font-mono text-surface-400">
              {shortenAddress(payerAddress)}
            </span>
          </div>
        </div>

        {/* Participant Select */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-surface-200">
              Split Between ({selectedParticipants.length}/{members.length})
            </label>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAll}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                All
              </button>
              <span className="text-surface-600">•</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-surface-400 hover:text-surface-300"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-xl bg-surface-900/60 border border-surface-700/80 p-2">
            {members.map((member) => {
              const isSelected = selectedParticipants.some(
                (m) => m.toLowerCase() === member.toLowerCase()
              );
              const name = getDemoName(member);

              return (
                <div
                  key={member}
                  onClick={() => !isLoading && toggleParticipant(member)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                    isSelected
                      ? 'bg-primary-500/15 border border-primary-500/30 text-white'
                      : 'hover:bg-surface-800 text-surface-400 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-primary-500 border-primary-400 text-white'
                          : 'border-surface-600 bg-surface-800'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <span className="font-medium text-white">{name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-surface-400">
                    {shortenAddress(member)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Split Preview */}
        <div className="p-3 rounded-xl bg-surface-800/80 border border-surface-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-surface-300">
            <Users className="h-4 w-4 text-primary-400" />
            <span>Split per person:</span>
          </div>
          <span className="font-bold text-sm text-primary-300">
            {splitAmount} MON
          </span>
        </div>

        {validationError && (
          <p className="text-xs text-rose-400 font-medium">{validationError}</p>
        )}

        {/* Transaction Status */}
        {status.status === 'pending' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span>Confirm transaction in your wallet...</span>
          </div>
        )}

        {status.status === 'confirming' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs">
            <span className="h-2 w-2 rounded-full bg-primary-400 animate-ping" />
            <span>Confirming on Monad...</span>
          </div>
        )}

        {status.status === 'error' && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{status.error || 'Failed to submit expense'}</span>
          </div>
        )}

        {/* Modal Actions */}
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
            disabled={!isConnected || isLoading || !description.trim() || !amountStr}
          >
            {isLoading ? 'Submitting...' : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
