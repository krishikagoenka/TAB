'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, Menu, X, LayoutDashboard } from 'lucide-react';
import WalletButton from './WalletButton';
import NetworkBadge from './NetworkBadge';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-surface-900/80 backdrop-blur-md border-b border-surface-700/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-purple-400 text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight gradient-text">
                TAB
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-full border border-primary-500/20">
                Monad
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-surface-800 text-white border border-surface-600/60'
                      : 'text-surface-300 hover:text-white hover:bg-surface-800/60'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Network Badge + Wallet Button */}
        <div className="hidden sm:flex items-center gap-3">
          <NetworkBadge />
          <WalletButton />
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 sm:hidden">
          <WalletButton />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-surface-300 hover:text-white hover:bg-surface-800 border border-surface-700/60 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-surface-700/60 bg-surface-900/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-surface-800">
            <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">
              Network
            </span>
            <NetworkBadge />
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-surface-800 text-white font-semibold'
                      : 'text-surface-300 hover:text-white hover:bg-surface-800/60'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
