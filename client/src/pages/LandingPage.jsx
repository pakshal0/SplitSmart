import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  PieChart,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Scale,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              SplitSmart
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-16 pb-20 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MERN Stack Financial Expense Engine</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.15] mb-6">
            Split expenses. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Simplify settlements.
            </span>
            <br />
            Stay financially organized.
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Eliminate awkward math and multi-party debt confusion. Split expenses equally, by custom amounts, or by percentage — backed by integer-paise calculations and smart debt simplification.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Explore Demo Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 shadow-xs transition-all active:scale-95"
            >
              Create Free Account
            </Link>
          </div>

          {/* Interactive UI Mockup Card */}
          <div className="mt-14 p-4 md:p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl mx-auto text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-semibold text-slate-400">
                  splitsmart.app/dashboard
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Live Engine Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Goa Vacation Villa</span>
                <div className="text-xl font-bold text-slate-900 mt-1">₹32,000.00</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Split equally among 4 members
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100/60">
                <span className="text-xs font-semibold text-blue-700">Debt Simplification</span>
                <div className="text-xl font-bold text-blue-900 mt-1">1 Transfer Only</div>
                <div className="text-[11px] text-blue-700 font-medium mt-1">
                  Replaces 4 pairwise settlements
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
                <span className="text-xs font-semibold text-emerald-700">Reconciliation</span>
                <div className="text-xl font-bold text-emerald-900 mt-1">Net Balance 0.00</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">
                  Guaranteed zero balance theorem
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-white border-y border-slate-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Designed for mathematical perfection
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                Built from the ground up to eliminate rounding errors and complex debt loops.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">3 Split Methods</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Support Equal, Custom, and Percentage splits with deterministic remainder paise distribution.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Smart Debt Simplification</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Greedy debt reduction algorithm calculates optimal direct payment recommendations so members make the minimum transfers.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Real-Time SaaS Analytics</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interactive Recharts dashboards show category trends, spending over time, and personal share reconciliation.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 px-6 text-center text-xs text-slate-400">
        <p>© 2026 SplitSmart MERN Stack Platform. Built with Express, MongoDB, React & Tailwind CSS.</p>
      </footer>
    </div>
  );
}
