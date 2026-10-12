'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { useExpenses } from '@/hooks/useExpenses';
import ExpenseCard from './ExpenseCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Receipt, AlertCircle, Plus } from 'lucide-react';

export interface ExpenseListProps {
  groupId: bigint;
  onAddExpense?: () => void;
}

export default function ExpenseList({
  groupId,
  onAddExpense,
}: ExpenseListProps) {
  const { address } = useAccount();
  const { expenses, isLoading, error, refetch } = useExpenses(groupId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card p-5 border-surface-700/60 animate-pulse flex justify-between items-center"
          >
            <div className="space-y-2.5 w-1/2">
              <div className="h-5 bg-surface-700 rounded-lg w-3/4" />
              <div className="h-3.5 bg-surface-700 rounded w-1/2" />
            </div>
            <div className="space-y-2 w-24">
              <div className="h-6 bg-surface-700 rounded-lg w-full" />
              <div className="h-3 bg-surface-700 rounded w-3/4 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 border-rose-500/30 bg-rose-500/5 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-rose-400 font-medium">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading expenses</span>
        </div>
        <p className="text-sm text-surface-300 max-w-md mx-auto">{error}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-8 w-8 text-primary-400" />}
        title="No expenses logged"
        description="No expenses have been added to this group yet. Add the first one to start splitting!"
        action={
          onAddExpense ? (
            <Button
              variant="primary"
              onClick={onAddExpense}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </Button>
          ) : undefined
        }
      />
    );
  }

  // Sort descending by createdAt
  const sortedExpenses = [...expenses].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-3">
      {sortedExpenses.map((expense) => (
        <ExpenseCard
          key={expense.id.toString()}
          expense={expense}
          currentUser={address}
          onApproved={refetch}
        />
      ))}
    </div>
  );
}
