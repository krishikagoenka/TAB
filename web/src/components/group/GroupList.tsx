'use client';

import React from 'react';
import { useGroups } from '@/hooks/useGroups';
import GroupCard from './GroupCard';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import { Users, AlertCircle, Plus } from 'lucide-react';

export interface GroupListProps {
  onCreateGroup?: () => void;
}

export default function GroupList({ onCreateGroup }: GroupListProps) {
  const { groups, isLoading, error, refetch } = useGroups();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="glass-card p-6 border-surface-700/60 animate-pulse space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="h-6 w-3/5 bg-surface-700 rounded-lg" />
              <div className="h-6 w-6 bg-surface-700 rounded-md" />
            </div>
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-surface-700 rounded" />
              <div className="h-4 w-28 bg-surface-700 rounded" />
            </div>
            <div className="pt-6 border-t border-surface-700/40 flex justify-between">
              <div className="h-3 w-28 bg-surface-700 rounded" />
              <div className="h-3 w-16 bg-surface-700 rounded" />
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
          <span>Error loading groups</span>
        </div>
        <p className="text-sm text-surface-300 max-w-md mx-auto">{error}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8 text-primary-400" />}
        title="No groups yet"
        description="Create your first group to start splitting expenses with friends on Monad."
        action={
          onCreateGroup ? (
            <Button
              variant="primary"
              onClick={onCreateGroup}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Group</span>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <GroupCard key={group.id.toString()} group={group} />
      ))}
    </div>
  );
}
