import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Users,
  DollarSign,
  ArrowRightLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wallet,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: 'Group Wallets',
      description:
        'Create shared wallet environments for roommates, road trips, dinners, or any group of friends.',
      badge: 'Multi-User',
    },
    {
      icon: DollarSign,
      title: 'Smart Splitting',
      description:
        'Add expenses and split them seamlessly among selected participants with transparent multi-signature approval.',
      badge: 'Transparent',
    },
    {
      icon: ArrowRightLeft,
      title: 'Optimized Settlement',
      description:
        'Minimize total transactions with our smart net-debt settlement algorithm executed on-chain.',
      badge: 'Zero Waste',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Connect your wallet',
      description: 'Plug in your Web3 wallet on Monad Testnet with just one click.',
      icon: Wallet,
    },
    {
      step: '02',
      title: 'Create a group',
      description: 'Add your friends as group members using their public wallet addresses.',
      icon: Users,
    },
    {
      step: '03',
      title: 'Add expenses',
      description: 'Log group costs, select who was involved, and collect approvals.',
      icon: DollarSign,
    },
    {
      step: '04',
      title: 'Settle up with minimal transfers',
      description: 'Our algorithm computes the shortest transfer route to square everyone up.',
      icon: ArrowRightLeft,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-900 text-white selection:bg-primary-500 selection:text-white">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-24 pb-28 md:pt-36 md:pb-40 px-4 sm:px-6 lg:px-8">
          {/* Subtle animated gradient background orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary-500/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
          <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Social Finance on Monad</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              The Group Wallet That <br />
              <span className="gradient-text">Settles Itself</span>
            </h1>

            <p className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-surface-300 leading-relaxed font-normal">
              Split bills, track expenses, and settle debts with your friends — all on Monad.
              No more awkward Venmo reminders or tedious spreadsheets.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto btn-primary inline-flex items-center justify-center gap-2 text-base py-3.5 px-8 shadow-xl shadow-primary-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto btn-secondary inline-flex items-center justify-center gap-2 text-base py-3.5 px-8 hover:bg-surface-600"
              >
                <span>Learn More</span>
              </a>
            </div>

            {/* Quick trust pill */}
            <div className="pt-8 flex items-center justify-center gap-6 text-xs text-surface-400">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-primary-400" />
                <span>Instant Sub-Second Finality</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>On-Chain Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-surface-850/50 border-t border-b border-surface-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary-400">
                Core Architecture
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                Everything you need for effortless shared spending
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="glass-card p-8 hover:border-primary-500/50 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 relative group flex flex-col justify-between"
                  >
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="h-12 w-12 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 bg-surface-800 px-2.5 py-0.5 rounded-full border border-surface-700">
                          {feat.badge}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors">
                        {feat.title}
                      </h3>

                      <p className="text-sm text-surface-300 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>

                    <div className="mt-8 pt-4 border-t border-surface-700/60 flex items-center text-xs font-semibold text-primary-400 group-hover:translate-x-1 transition-transform">
                      <span>Explore feature →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary-400">
                How It Works
              </h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">
                Settling debts in 4 simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((st) => {
                const StepIcon = st.icon;
                return (
                  <div
                    key={st.step}
                    className="glass-card p-6 border-surface-700/70 hover:border-surface-600 transition-all relative space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black font-mono text-primary-500/60">
                        {st.step}
                      </span>
                      <div className="h-9 w-9 rounded-xl bg-surface-800 border border-surface-700 flex items-center justify-center text-primary-300">
                        <StepIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white">
                      {st.title}
                    </h4>

                    <p className="text-xs text-surface-300 leading-relaxed">
                      {st.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA banner */}
            <div className="glass-card p-8 sm:p-12 border-primary-500/30 bg-gradient-to-r from-primary-950/40 via-surface-800 to-primary-950/40 text-center space-y-6">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Ready to take the friction out of group expenses?
              </h3>
              <p className="max-w-xl mx-auto text-sm text-surface-300">
                Launch your first shared wallet in seconds and test out automated Monad settlements.
              </p>
              <div>
                <Link
                  href="/dashboard"
                  className="btn-primary inline-flex items-center gap-2 text-base py-3 px-8 shadow-xl shadow-primary-500/30 hover:scale-105 active:scale-95 transition-all"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Launch Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
