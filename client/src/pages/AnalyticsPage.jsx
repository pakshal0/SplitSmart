import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon, Calendar } from 'lucide-react';
import api from '../lib/api';
import { formatPaise, CATEGORY_COLORS } from '../lib/formatCurrency';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#64748b'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs text-slate-400">
        Aggregating spending analytics...
      </div>
    );
  }

  const { categoryBreakdown = [], timeline = [], summary = {} } = data;

  const pieData = categoryBreakdown.map((item) => ({
    name: item.category,
    value: item.amountPaise / 100,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Financial Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          In-depth insights into your group expenses, personal shares, and categories.
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Group Spending
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatPaise(summary.totalGroupExpensesPaise || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Across all active groups</span>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            You Personally Paid
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {formatPaise(summary.userPaidTotalPaise || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Gross payments you fronted</span>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Your True Share
          </span>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {formatPaise(summary.userShareTotalPaise || 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">What you actually consumed</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Timeline Bar Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Spending Over Time (₹)</span>
            </h3>
            <span className="text-xs text-slate-400">Last 6 Months</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="totalExpense" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Group Total" />
                <Bar dataKey="userShare" fill="#ec4899" radius={[6, 6, 0, 0]} name="Your Share" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>Spending by Category</span>
            </h3>
            <span className="text-xs text-slate-400">{categoryBreakdown.length} Categories</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Share']}
                    contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No category data</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
