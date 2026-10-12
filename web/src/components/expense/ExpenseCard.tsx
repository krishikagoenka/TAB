'use client';

import React, { useEffect } from 'react';
import { Expense } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ApprovalBadge from './ApprovalBadge';
import { formatEther, formatTimestamp, shortenAddress } from '@/lib/utils';
import { getDemoName } from '@/lib/mock/mockData';
import { useApproveExpense } from '@/hooks/useExpenses';
import { useToast } from '@/components/ui/Toast';
import { Receipt, Users, Check, Calendar, ArrowRight } from 'lucide-react';

export interface ExpenseCardProps {
  expense: Expense;
  currentUser?: `0x${string}`;
  onApproved?: () => void;
}

export default function ExpenseCard({
  expense,
  currentUser,
  onApproved,
}: ExpenseCardProps) {
  const { approveExpense, status } = useApproveExpense(expense.groupId);
  const { success, error: toastError } = useToast();

  const isParticipant = !!currentUser && expense.participants.some(
    (p) => p.toLowerCase() === currentUser.toLowerCase()
  );

  const hasApproved = !!currentUser && expense.approvals.some(
    (a) => a.toLowerCase() === currentUser.toLowerCase()
  );

  const canApprove = isParticipant && !hasApproved && !expense.approved;

  useEffect(() => {
    if (status.status === 'success') {
      success(`Approved expense: "${expense.description}"`);
      if (onApproved) onApproved();
    } else if (status.status === 'error') {
      toastError(status.error || 'Failed to approve expense');
    }
  }, [status.status, status.error, expense.description, success, toastError, onApproved]);

  const handleApprove = async () => {
    try {
      await approveExpense(expense.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving expense';
      toastError(msg);
    }
  };

  const payerName = getDemoName(expense.payer);
  const isPayer =
    !!currentUser && expense.payer.toLowerCase() === currentUser.toLowerCase();

  const perPersonAmount =
    expense.participants.length > 0
      ? formatEther(expense.amount / BigInt(expense.participants.length))
      : '0';

  const isPending = status.status === 'pending' || status.status === 'confirming';

  return (
    <Card className="border-surface-600/50 hover:border-surface-500/80 transition-all p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Expense details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h4 className="text-base font-bold text-white tracking-wide">
              {expense.description}
            </h4>
            <ApprovalBadge expense={expense} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-surface-300">
            <div className="flex items-center gap-1.5">
              <span className="text-surface-400">Paid by:</span>
              <span className="font-medium text-white">
                {isPayer ? 'You' : payerName || shortenAddress(expense.payer)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-surface-400">
              <Users className="h-3.5 w-3.5 text-primary-400" />
              <span>
                {expense.participants.length}{' '}
                {expense.participants.length === 1 ? 'person' : 'people'} ({perPersonAmount} MON each)
              </span>
            </div>

            <div className="flex items-center gap-1 text-surface-400">
              <Calendar className="h-3 w-3" />
              <span>{formatTimestamp(expense.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Amount & Action */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-700/60">
          <div className="text-left sm:text-right">
            <div className="text-lg font-extrabold text-primary-300">
              {formatEther(expense.amount)} MON
            </div>
            <div className="text-[11px] text-surface-400">Total expense</div>
          </div>

          {canApprove && (
            <Button
              variant="primary"
              size="sm"
              loading={isPending}
              disabled={isPending}
              onClick={handleApprove}
              className="gap-1.5 shadow-md shadow-primary-500/20"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Approve</span>
            </Button>
          )}

          {isParticipant && hasApproved && !expense.approved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              <Check className="h-3 w-3" />
              <span>You approved</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
