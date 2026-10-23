import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Receipt, Search, Plus, Filter, Calendar, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPaise, formatDate, CATEGORY_COLORS } from '../lib/formatCurrency';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { openAddExpense } = useOutletContext() || {};

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setExpenses(res.data.data.recentExpenses || []);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();

    const handleUpdate = () => loadExpenses();
    window.addEventListener('expense-updated', handleUpdate);
    return () => window.removeEventListener('expense-updated', handleUpdate);
  }, []);

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted');
      loadExpenses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    }
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch = e.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            All Shared Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, search, and manage expenses across all your groups.
          </p>
        </div>

        <button
          onClick={openAddExpense}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs text-slate-700 font-medium"
        >
          <option value="All">All Categories</option>
          <option value="Food">Food</option>
          <option value="Travel">Travel</option>
          <option value="Accommodation">Accommodation</option>
          <option value="Shopping">Shopping</option>
          <option value="Entertainment">Entertainment</option>
          <option value="Groceries">Groceries</option>
          <option value="Rent">Rent</option>
          <option value="Utilities">Utilities</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Expenses List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-xs text-slate-400">
          Loading expenses...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-md mx-auto">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Expenses Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try adjusting your search filters or record a new expense.
          </p>
          <button
            onClick={openAddExpense}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm"
          >
            Add Expense Now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
          {filtered.map((exp) => {
            const catColor = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
            const userShare = exp.participants?.find((p) => (p.user?._id || p.user) === user?.id);

            return (
              <div
                key={exp._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${catColor.bg} ${catColor.text}`}
                  >
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{exp.description}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${catColor.bg} ${catColor.text}`}
                      >
                        {exp.category}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {exp.splitType} Split
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Group: <strong className="text-slate-800">{exp.groupId?.name}</strong> • Paid by{' '}
                      <strong className="text-slate-800">{exp.paidBy?.name}</strong> on{' '}
                      {formatDate(exp.expenseDate)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">
                      {formatPaise(exp.amountPaise)}
                    </div>
                    {userShare ? (
                      <span className="text-[11px] text-slate-500">
                        Your share: <strong className="text-slate-700">{formatPaise(userShare.sharePaise)}</strong>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Not included</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteExpense(exp._id)}
                    title="Delete expense"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
