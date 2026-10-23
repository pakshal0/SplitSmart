import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Users,
  ChevronDown,
  CheckCircle2,
  Clock,
  Wallet,
  ArrowRight,
  FolderPlus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPaise, formatRelativeTime, CATEGORY_COLORS } from '../lib/formatCurrency';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { openAddExpense } = useOutletContext() || {};

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [timeFilter, setTimeFilter] = useState('Last 30 days');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('All groups');

  // Load dashboard overview from backend
  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setDashboardData(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const handleUpdate = () => loadDashboard();
    window.addEventListener('expense-updated', handleUpdate);
    return () => window.removeEventListener('expense-updated', handleUpdate);
  }, []);

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  const {
    summary = {},
    groupBalancesOverview = [],
    recentActivities = [],
    categoryBreakdown = [],
    timeline = [],
    settlementSuggestions = [],
    smartInsights = null,
  } = dashboardData || {};

  // Custom Chart Tooltip matching the image
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-100 text-xs space-y-1.5 min-w-[170px]">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">{label}</div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Group Spending:
            </span>
            <span className="font-semibold text-slate-900">
              ₹{payload[0]?.value?.toLocaleString('en-IN') || 0}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              Your Share:
            </span>
            <span className="font-semibold text-slate-900">
              ₹{payload[1]?.value?.toLocaleString('en-IN') || 0}
            </span>
          </div>
          <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Net Status:</span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const topSuggestion = settlementSuggestions[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Greeting & Filters Bar (Matching Screenshot) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
            Welcome back, {user?.name || 'Jon'}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here's what's happening with your expenses today.
          </p>
        </div>

        {/* Action & Dropdown Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Filter Pill */}
          <div className="relative inline-flex items-center bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer">
            <span className="text-slate-400 mr-1.5">Time:</span>
            <span>{timeFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
          </div>

          {/* Group Filter Pill */}
          <div className="relative inline-flex items-center bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer">
            <span className="text-slate-400 mr-1.5">Group:</span>
            <span>{selectedGroupFilter}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
          </div>

          {/* Add Expense Action Button */}
          <button
            onClick={openAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Top Row: Spending Flow Chart (2/3) + AI Settlement & Health Cards (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Spending & Settlement Flow Chart Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Spending & Settlement Flow
              </div>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatPaise(summary.totalGroupExpensesPaise || 0)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +14.6%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Total Group Expenditure</p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Group Spending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                <span>Your Share</span>
              </div>
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorShare" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalExpense"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
                <Area
                  type="monotone"
                  dataKey="userShare"
                  stroke="#ec4899"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorShare)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: AI Alert Gradient Card + Settlement Health Card */}
        <div className="flex flex-col gap-6">
          {/* Smart Debt Simplification Card (Matching the vibrant blue gradient card in the image) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-6 text-white shadow-xl shadow-blue-500/20 flex flex-col justify-between">
            {/* Background Glow Elements */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase text-white mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SMART SETTLEMENT</span>
              </div>

              {/* Title & Amount */}
              <h3 className="text-xl font-black tracking-tight leading-snug">
                {topSuggestion ? (
                  <>
                    Recommended: {topSuggestion.formattedAmount} transfer
                  </>
                ) : (
                  <>All Balances Settled Cleanly 🎉</>
                )}
              </h3>

              <p className="text-xs text-white/85 mt-2 leading-relaxed">
                {topSuggestion
                  ? `${topSuggestion.suggestion}. Debt simplification eliminates multi-party transfers.`
                  : 'You have no outstanding debts across your groups. Everything is balanced perfectly.'}
              </p>
            </div>

            {/* High-contrast Action Button */}
            <Link
              to="/balances"
              className="mt-5 w-full py-2.5 bg-white hover:bg-slate-50 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md text-center transition-all active:scale-95 block"
            >
              {topSuggestion ? 'Settle Now' : 'View Balances'}
            </Link>
          </div>

          {/* Project / Settlement Health Card (Matching Lower Right Card in screenshot) */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Settlement Health
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">92%</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +11%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
                <span>⚡</span>
                <span>{summary.activeGroupsCount || 0} active groups</span>
              </div>
            </div>

            {/* Mini Visual Bar indicator from screenshot */}
            <div className="flex items-end gap-1 h-12">
              <div className="w-2.5 h-6 bg-blue-200 rounded-full" />
              <div className="w-2.5 h-8 bg-blue-300 rounded-full" />
              <div className="w-2.5 h-11 bg-blue-500 rounded-full" />
              <div className="w-2.5 h-9 bg-blue-400 rounded-full" />
              <div className="w-2.5 h-12 bg-blue-600 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Smart Spending Insights Section */}
      {smartInsights && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Smart Spending Insights</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    Live Analysis
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated from your actual database transactions over the last {smartInsights.periodDays || 30} days.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              <span>Comparing: Current {smartInsights.periodDays || 30}d vs Prior {smartInsights.periodDays || 30}d</span>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {/* 1. Period Spending */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Period Spend
              </span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {formatPaise(smartInsights.currentPeriodSpendPaise || 0)}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {smartInsights.currentExpenseCount || 0} bills in last {smartInsights.periodDays || 30} days
              </span>
            </div>

            {/* 2. Spending Trend */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Spending Trend
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                {smartInsights.trendDirection === 'INCREASE' ? (
                  <span className="inline-flex items-center gap-1 text-sm font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{Math.abs(smartInsights.percentageChange)}%
                  </span>
                ) : smartInsights.trendDirection === 'DECREASE' ? (
                  <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <TrendingDown className="w-3.5 h-3.5" />
                    -{Math.abs(smartInsights.percentageChange)}%
                  </span>
                ) : (
                  <span className="text-sm font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    Steady (0%)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                vs prior {smartInsights.periodDays || 30} days
              </span>
            </div>

            {/* 3. Top Category */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Top Category
              </span>
              <div className="text-lg font-black text-slate-900 mt-1 truncate">
                {smartInsights.highestCategory}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {smartInsights.highestCategoryPercentage}% of your share
              </span>
            </div>

            {/* 4. Outstanding Settlements */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Settlements Status
              </span>
              <div className="text-lg font-black text-slate-900 mt-1">
                {smartInsights.totalOwedPaise > 0
                  ? `+${formatPaise(smartInsights.totalOwedPaise, false)}`
                  : smartInsights.totalOwesPaise > 0
                  ? `-${formatPaise(smartInsights.totalOwesPaise, false)}`
                  : 'Reconciled'}
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {smartInsights.totalOwedPaise > 0
                  ? 'Receivable from group'
                  : smartInsights.totalOwesPaise > 0
                  ? 'Due to settle'
                  : 'All zero balances'}
              </span>
            </div>
          </div>

          {/* Actionable Suggestions */}
          {smartInsights.actionableSuggestions?.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Actionable Insights & Recommendations
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {smartInsights.actionableSuggestions.map((sug, idx) => {
                  const isSuccess = sug.severity === 'success';
                  const isWarning = sug.severity === 'warning';
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                        isSuccess
                          ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
                          : isWarning
                          ? 'bg-amber-50/60 border-amber-100 text-amber-900'
                          : 'bg-blue-50/60 border-blue-100 text-blue-900'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSuccess
                            ? 'bg-emerald-200/60 text-emerald-800'
                            : isWarning
                            ? 'bg-amber-200/60 text-amber-800'
                            : 'bg-blue-200/60 text-blue-800'
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight">{sug.title}</div>
                        <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{sug.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Middle Row: 3 Equal Columns (Category Breakdown + Activity Feed + Budget/Performance) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Spending by Category (Matching "Lead Source" in screenshot) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Spending by Category</h3>
            <span className="text-xs text-slate-400">Share</span>
          </div>

          <div className="space-y-3 flex-1">
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.slice(0, 5).map((item) => {
                const colors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        {item.category}
                      </span>
                      <span className="font-semibold text-slate-900">{item.percentage}%</span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.dot} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(item.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No categorized expenses yet.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Recent Activity Feed (Matching "Team Feed" in screenshot) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Activity Feed</h3>
            <Link to="/activity" className="text-xs text-blue-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3.5 flex-1">
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 4).map((act) => (
                <div key={act._id} className="flex items-start gap-3 text-xs">
                  <img
                    src={
                      act.actor?.avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${act.actor?.name}`
                    }
                    alt={act.actor?.name}
                    className="w-7 h-7 rounded-full object-cover mt-0.5 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium line-clamp-1 leading-snug">
                      {act.message}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Financial Performance & Position (Matching "Performance" in screenshot) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Financial Summary</h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Healthy
            </span>
          </div>

          {/* Monthly Budget Goal Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600">Settlement Completion</span>
              <span className="font-bold text-slate-900">82%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
              <span className="text-[11px] font-semibold text-emerald-700 block">You are Owed</span>
              <span className="text-lg font-extrabold text-emerald-700 tracking-tight mt-0.5 block">
                {formatPaise(summary.totalOwedPaise || 0)}
              </span>
            </div>
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100/60">
              <span className="text-[11px] font-semibold text-amber-700 block">You Owe</span>
              <span className="text-lg font-extrabold text-amber-700 tracking-tight mt-0.5 block">
                {formatPaise(summary.totalOwesPaise || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Active Groups Cards (Matching bottom cards in user reference image) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">My Active Groups</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {groupBalancesOverview.length}
            </span>
          </div>

          <Link
            to="/groups"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>View All Groups</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal Group Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {groupBalancesOverview.map((group) => {
            const isOwed = group.userNetBalancePaise > 0;
            const isOwes = group.userNetBalancePaise < 0;

            return (
              <Link
                key={group.groupId}
                to={`/groups/${group.groupId}`}
                className="group bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill Tag */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                      {group.name.includes('Goa')
                        ? 'Trip'
                        : group.name.includes('Flat')
                        ? 'Roommates'
                        : group.name.includes('College')
                        ? 'Project'
                        : 'Social'}
                    </span>
                    <span className="text-slate-300 group-hover:text-blue-600 transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {group.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {group.description || `${group.memberCount} active members`}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  {/* Avatar Stack */}
                  <div className="flex -space-x-2">
                    {group.members?.slice(0, 3).map((m, idx) => (
                      <img
                        key={m?._id || idx}
                        src={m?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m?.name}`}
                        alt={m?.name}
                        className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                    {group.memberCount > 3 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                        +{group.memberCount - 3}
                      </div>
                    )}
                  </div>

                  {/* Net Balance Status */}
                  <div>
                    {isOwed && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        +{formatPaise(group.userNetBalancePaise, false)}
                      </span>
                    )}
                    {isOwes && (
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">
                        -{formatPaise(Math.abs(group.userNetBalancePaise), false)}
                      </span>
                    )}
                    {!isOwed && !isOwes && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                        Settled
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
