import React from 'react';
import { Expense } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, Clock } from 'lucide-react';

export interface ApprovalBadgeProps {
  expense: Expense;
  className?: string;
}

export default function ApprovalBadge({ expense, className }: ApprovalBadgeProps) {
  if (expense.approved) {
    return (
      <Badge variant="success" className={`gap-1 font-medium ${className || ''}`}>
        <CheckCircle2 className="h-3 w-3 shrink-0" />
        <span>Approved</span>
      </Badge>
    );
  }

  const approvedCount = expense.approvals ? expense.approvals.length : 0;
  const totalCount = expense.participants ? expense.participants.length : 0;

  return (
    <Badge variant="warning" className={`gap-1 font-medium ${className || ''}`}>
      <Clock className="h-3 w-3 shrink-0" />
      <span>
        {approvedCount}/{totalCount} approved
      </span>
    </Badge>
  );
}
