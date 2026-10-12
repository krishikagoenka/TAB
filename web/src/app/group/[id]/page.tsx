'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MemberList from '@/components/group/MemberList';
import ExpenseList from '@/components/expense/ExpenseList';
import AddExpenseModal from '@/components/expense/AddExpenseModal';
import BalanceSummary from '@/components/balance/BalanceSummary';
import SettlementPreview from '@/components/balance/SettlementPreview';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useGroupDetails } from '@/hooks/useGroupDetails';
import { shortenAddress, formatTimestamp, cn } from '@/lib/utils';
import {
  ArrowLeft,
  Plus,
  Receipt,
  Scale,
  ArrowRightLeft,
  Users,
  Calendar,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export default function GroupDetailsPage() {
  const params = useParams();
  const idStr = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);
  const { address } = useAccount();

  let groupId = 0n;
  let isValidId = true;
  try {
    if (idStr) {
      groupId = BigInt(idStr);
    } else {
      isValidId = false;
    }
  } catch {
    isValidId = false;
  }

  const { group, isLoading, error, refetch } = useGroupDetails(groupId);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlement'>('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  if (!isValidId || groupId <= 0n) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-900 text-white">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 pt-32 pb-16 w-full">
          <EmptyState
            icon={<AlertCircle className="h-10 w-10 text-rose-400" />}
            title="Invalid Group ID"
            description="The group identifier specified in the URL is not valid."
            action={
              <Link href="/dashboard" className="btn-secondary inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Link>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-900 text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full space-y-6">
          <div className="h-6 w-32 bg-surface-800 rounded animate-pulse" />
          <div className="h-12 w-64 bg-surface-800 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="h-80 bg-surface-800 rounded-2xl animate-pulse" />
            <div className="lg:col-span-2 h-80 bg-surface-800 rounded-2xl animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-900 text-white">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 pt-32 pb-16 w-full">
          <EmptyState
            icon={<AlertCircle className="h-10 w-10 text-rose-400" />}
            title="Group Not Found"
            description={error || "This group does not exist on Monad or couldn't be loaded."}
            action={
              <Link href="/dashboard" className="btn-secondary inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Dashboard</span>
              </Link>
            }
          />
        </main>
        <Footer />
      </div>
    );
  }

  const isMember =
    !address ||
    group.members.some((m) => m.toLowerCase() === address.toLowerCase());

  const tabs = [
    { id: 'expenses' as const, label: 'Expenses', icon: Receipt },
    { id: 'balances' as const, label: 'Balances', icon: Scale },
    { id: 'settlement' as const, label: 'Settlement', icon: ArrowRightLeft },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-900 text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Group Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-surface-700/60">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              {group.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary-400" />
                <span>{group.members.length} members</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {formatTimestamp(group.createdAt)}</span>
              </span>
              <span>•</span>
              <span>ID #{group.id.toString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsAddExpenseOpen(true)}
              className="inline-flex items-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </Button>
          </div>
        </div>

        {/* Not a member warning banner */}
        {address && !isMember && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <span className="font-semibold">Viewer Notice:</span> Your connected wallet ({shortenAddress(address)}) is not a member of this group. You can inspect the group, but cannot propose expenses or vote.
            </div>
          </div>
        )}

        {/* Two-column layout: Left = Members, Right = Tabs & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Member List Column */}
          <div className="lg:col-span-1">
            <MemberList
              members={group.members}
              groupId={group.id}
              onMemberAdded={refetch}
            />
          </div>

          {/* Main Action Tabs Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab selection header */}
            <div className="flex items-center gap-2 border-b border-surface-700/80 pb-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all select-none',
                      isActive
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                        : 'text-surface-400 hover:text-white hover:bg-surface-800'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div>
              {activeTab === 'expenses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">
                      Group Expenses
                    </h3>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsAddExpenseOpen(true)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Expense</span>
                    </Button>
                  </div>
                  <ExpenseList
                    groupId={group.id}
                    onAddExpense={() => setIsAddExpenseOpen(true)}
                  />
                </div>
              )}

              {activeTab === 'balances' && (
                <BalanceSummary groupId={group.id} />
              )}

              {activeTab === 'settlement' && (
                <SettlementPreview groupId={group.id} onSettled={refetch} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add Expense Modal */}
      <AddExpenseModal
        groupId={group.id}
        members={group.members}
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={refetch}
      />

      <Footer />
    </div>
  );
}
