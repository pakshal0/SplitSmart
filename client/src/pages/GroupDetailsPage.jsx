import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Receipt,
  Scale,
  CheckCircle2,
  History,
  Trash2,
  UserPlus,
  ArrowRight,
  Shield,
  Calendar,
  X,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Target,
  Edit2,
  TrendingUp,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPaise, formatDate, CATEGORY_COLORS, paiseToRupees, rupeesToPaise } from '../lib/formatCurrency';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import toast from 'react-hot-toast';

export default function GroupDetailsPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [budget, setBudget] = useState(null);
  const [userRole, setUserRole] = useState('member');
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Budget Modal State
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetInputRupees, setBudgetInputRupees] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);

  // Tabs: 'expenses', 'balances', 'settlements', 'activity'
  const [activeTab, setActiveTab] = useState('expenses');

  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);
  const [settlementPreset, setSettlementPreset] = useState(null);

  const loadAllGroupData = async () => {
    try {
      setLoading(true);
      const [gRes, expRes, balRes, sugRes, setRes, actRes] = await Promise.all([
        api.get(`/groups/${groupId}`),
        api.get(`/groups/${groupId}/expenses`),
        api.get(`/groups/${groupId}/balances`),
        api.get(`/groups/${groupId}/settlement-suggestions`),
        api.get(`/groups/${groupId}/settlements`),
        api.get(`/groups/${groupId}/activity`),
      ]);

      setGroup(gRes.data.data.group);
      setBudget(gRes.data.data.budget);
      setUserRole(gRes.data.data.userRole);
      setExpenses(expRes.data.data.expenses || []);
      setBalances(balRes.data.data.balances || []);
      setSuggestions(sugRes.data.data.suggestions || []);
      setSettlements(setRes.data.data.settlements || []);
      setActivities(actRes.data.data.activities || []);
    } catch (err) {
      toast.error('Failed to load group details');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllGroupData();
  }, [groupId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    try {
      await api.post(`/groups/${groupId}/members`, {
        email: newMemberEmail.trim(),
      });
      toast.success('Member added successfully!');
      setIsAddMemberOpen(false);
      setNewMemberEmail('');
      loadAllGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName}?`)) return;

    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      toast.success('Member removed');
      loadAllGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success('Expense deleted');
      loadAllGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    }
  };

  const handleOpenSettlement = (suggestion) => {
    setSettlementPreset(suggestion);
    setIsSettlementOpen(true);
  };

  const handleRecordSettlement = async (e) => {
    e.preventDefault();
    if (!settlementPreset) return;

    try {
      await api.post(`/groups/${groupId}/settlements`, {
        paidBy: settlementPreset.from.id,
        paidTo: settlementPreset.to.id,
        amountPaise: settlementPreset.amountPaise,
        note: `Direct settlement recommendation`,
        status: 'completed',
      });

      toast.success('Payment recorded successfully!');
      setIsSettlementOpen(false);
      setSettlementPreset(null);
      loadAllGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to record payment');
    }
  };

  const handleOpenBudgetModal = () => {
    const currentRupees = budget?.budgetPaise ? paiseToRupees(budget.budgetPaise) : '';
    setBudgetInputRupees(currentRupees ? String(currentRupees) : '');
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    const num = parseFloat(budgetInputRupees);
    if (isNaN(num) || num < 0) {
      toast.error('Please enter a valid non-negative budget amount');
      return;
    }

    try {
      setBudgetSaving(true);
      const budgetPaise = rupeesToPaise(num);
      const res = await api.patch(`/groups/${groupId}/budget`, { budgetPaise });
      setGroup(res.data.data.group);
      setBudget(res.data.data.budget);
      setIsBudgetModalOpen(false);
      toast.success(
        budgetPaise > 0
          ? `Budget set to ${formatPaise(budgetPaise)}`
          : 'Budget limit removed'
      );
      // Refresh activity log
      const actRes = await api.get(`/groups/${groupId}/activity`);
      setActivities(actRes.data.data.activities || []);
    } catch (err) {
      toast.error(err.message || 'Failed to update group budget');
    } finally {
      setBudgetSaving(false);
    }
  };

  const handleClearBudget = async () => {
    try {
      setBudgetSaving(true);
      const res = await api.patch(`/groups/${groupId}/budget`, { budgetPaise: 0 });
      setGroup(res.data.data.group);
      setBudget(res.data.data.budget);
      setIsBudgetModalOpen(false);
      toast.success('Group budget cleared');
      const actRes = await api.get(`/groups/${groupId}/activity`);
      setActivities(actRes.data.data.activities || []);
    } catch (err) {
      toast.error(err.message || 'Failed to clear group budget');
    } finally {
      setBudgetSaving(false);
    }
  };

  if (loading && !group) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xs text-slate-400">
        Loading group workspace...
      </div>
    );
  }

  const isOwner = group?.owner?._id === user?.id;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Group Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                Group
              </span>
              {isOwner && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  <Shield className="w-3 h-3" />
                  Owner
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {group?.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-2xl">
              {group?.description || 'No description provided.'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isOwner && (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}

            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Member Avatars Row */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-2">Members:</span>
          {group?.members.map((m) => (
            <div
              key={m.user?._id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800"
            >
              <img
                src={m.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user?.name}`}
                alt={m.user?.name}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span>{m.user?.name} {m.user?._id === user?.id ? '(You)' : ''}</span>
              {isOwner && m.user?._id !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(m.user._id, m.user.name)}
                  title="Remove member"
                  className="text-slate-400 hover:text-rose-600 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 1.5 Group Budget Tracker Card */}
      {budget && budget.budgetPaise > 0 ? (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Group Budget Tracker</h3>
                  {budget.isExceeded && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      Exceeded
                    </span>
                  )}
                  {budget.isWarning && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      80% Limit Alert
                    </span>
                  )}
                  {!budget.isExceeded && !budget.isWarning && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      On Track
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live spend monitoring against group spending ceiling
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenBudgetModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all self-start sm:self-auto"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Budget</span>
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Budget
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {formatPaise(budget.budgetPaise)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Spent
              </div>
              <div className={`text-lg font-black mt-1 ${budget.isExceeded ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatPaise(budget.totalSpentPaise)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {budget.isExceeded ? 'Over Budget By' : 'Remaining'}
              </div>
              <div className={`text-lg font-black mt-1 ${budget.isExceeded ? 'text-rose-600' : 'text-emerald-600'}`}>
                {budget.isExceeded
                  ? formatPaise(budget.totalSpentPaise - budget.budgetPaise)
                  : formatPaise(budget.remainingBudgetPaise)}
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Spending Usage</span>
              <span className={`font-black ${budget.isExceeded ? 'text-rose-600' : budget.isWarning ? 'text-amber-600' : 'text-blue-600'}`}>
                {budget.budgetUsedPercentage}% Used
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budget.isExceeded
                    ? 'bg-rose-500'
                    : budget.isWarning
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, budget.budgetUsedPercentage))}%` }}
              />
            </div>
          </div>

          {/* Alert Message Box */}
          {budget.isExceeded && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Budget Exceeded!</strong> Group expenses have exceeded the allocated limit by{' '}
                <strong>{formatPaise(budget.totalSpentPaise - budget.budgetPaise)}</strong>.
              </span>
            </div>
          )}
          {budget.isWarning && !budget.isExceeded && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Spending Warning:</strong> You have reached {budget.budgetUsedPercentage}% of the group budget. Only{' '}
                <strong>{formatPaise(budget.remainingBudgetPaise)}</strong> left before exceeding the limit.
              </span>
            </div>
          )}
          {!budget.isWarning && !budget.isExceeded && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Budget On Track:</strong> {formatPaise(budget.remainingBudgetPaise)} remains available for upcoming group expenses.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Set a Group Budget</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set a spending ceiling to monitor collective expenses and receive automated 80% warning and over-budget alerts.
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenBudgetModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm shadow-blue-500/20 transition-all shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Set Budget</span>
          </button>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        {[
          { id: 'expenses', label: `Expenses (${expenses.length})`, icon: Receipt },
          { id: 'balances', label: 'Balances & Settle', icon: Scale },
          { id: 'settlements', label: `Settlements (${settlements.length})`, icon: CheckCircle2 },
          { id: 'activity', label: 'Activity Log', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}
      {/* TAB 1: Expenses List */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {expenses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Expenses Recorded</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Be the first to add an expense to this group.
              </p>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Add Expense Now
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
              {expenses.map((exp) => {
                const categoryColor = CATEGORY_COLORS[exp.category] || CATEGORY_COLORS.Other;
                const userShare = exp.participants.find((p) => p.user?._id === user?.id);

                return (
                  <div
                    key={exp._id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${categoryColor.bg} ${categoryColor.text}`}
                      >
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {exp.description}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${categoryColor.bg} ${categoryColor.text}`}
                          >
                            {exp.category}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {exp.splitType} Split
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          Paid by <strong className="text-slate-800">{exp.paidBy?.name}</strong> on {formatDate(exp.expenseDate)}
                        </p>
                        {exp.notes && (
                          <p className="text-[11px] text-slate-400 italic mt-0.5">
                            "{exp.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">
                          {formatPaise(exp.amountPaise)}
                        </div>
                        {userShare ? (
                          <span className="text-[11px] text-slate-500">
                            Your share: <strong className="text-slate-700">{formatPaise(userShare.sharePaise)}</strong>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not involved</span>
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
      )}

      {/* TAB 2: Balances & Smart Simplification */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          {/* Smart Debt Simplification Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                Smart Debt Simplification
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              Recommended Minimum Payments
            </h3>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              Instead of everyone paying everyone else, our debt reduction algorithm computes the fewest direct transactions to settle all debts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {suggestions.length > 0 ? (
                suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">
                        {sug.from.name} <span className="font-normal text-white/70">pays</span> {sug.to.name}
                      </div>
                      <div className="text-lg font-black text-white mt-0.5">
                        {sug.formattedAmount}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenSettlement(sug)}
                      className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl transition-colors shadow-xs"
                    >
                      Record Payment
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-xs text-white/80 py-2">
                  No settlements needed! All members are currently even.
                </div>
              )}
            </div>
          </div>

          {/* Individual Member Balances Table */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Member Balances</h3>
              <span className="text-xs text-slate-400">Total Group Balance = ₹0.00</span>
            </div>

            <div className="divide-y divide-slate-100">
              {balances.map((b) => {
                const isOwed = b.netBalancePaise > 0;
                const isOwes = b.netBalancePaise < 0;

                return (
                  <div
                    key={b.userId}
                    className="p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={b.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${b.name}`}
                        alt={b.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {b.name} {b.userId === user?.id ? '(You)' : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          Paid: {formatPaise(b.paidForExpensesPaise)} • Share: {formatPaise(b.shareOwedPaise)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isOwed && (
                        <div className="text-emerald-600 font-extrabold text-sm">
                          + {formatPaise(b.netBalancePaise)}
                          <span className="block text-[10px] text-emerald-600 font-medium">should receive</span>
                        </div>
                      )}
                      {isOwes && (
                        <div className="text-rose-600 font-extrabold text-sm">
                          - {formatPaise(Math.abs(b.netBalancePaise))}
                          <span className="block text-[10px] text-rose-600 font-medium">owes</span>
                        </div>
                      )}
                      {!isOwed && !isOwes && (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                          Settled Up
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Settlements History */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          {settlements.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No payment settlements recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
              {settlements.map((set) => (
                <div key={set._id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {set.paidBy?.name} paid {set.paidTo?.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(set.completedAt || set.createdAt)} • {set.note || 'Direct payment'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">
                      {formatPaise(set.amountPaise)}
                    </div>
                    <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {set.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Activity Log */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Group Audit Trail</h3>
          <div className="space-y-3.5">
            {activities.map((act) => (
              <div key={act._id} className="flex items-start gap-3 text-xs">
                <img
                  src={
                    act.actor?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${act.actor?.name}`
                  }
                  alt={act.actor?.name}
                  className="w-7 h-7 rounded-full object-cover mt-0.5 border border-slate-200"
                />
                <div>
                  <p className="text-slate-800 font-medium">{act.message}</p>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(act.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          defaultGroupId={groupId}
          onClose={() => setIsAddExpenseOpen(false)}
          onExpenseCreated={() => {
            setIsAddExpenseOpen(false);
            loadAllGroupData();
          }}
        />
      )}

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Registered Member</h3>
              <button onClick={() => setIsAddMemberOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. rahul@splitsmart.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Add to Group
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Settlement Modal */}
      {isSettlementOpen && settlementPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Record Settlement</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Confirm that {settlementPreset.from.name} has paid {settlementPreset.to.name}{' '}
              <strong>{settlementPreset.formattedAmount}</strong> outside SplitSmart (e.g. UPI / Cash).
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsSettlementOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordSettlement}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set / Edit Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {budget?.budgetPaise > 0 ? 'Edit Group Budget' : 'Set Group Budget'}
                  </h3>
                  <p className="text-xs text-slate-500">Track and manage collective spending</p>
                </div>
              </div>
              <button
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm font-semibold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 25000"
                    value={budgetInputRupees}
                    onChange={(e) => setBudgetInputRupees(e.target.value)}
                    className="w-full pl-7 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter whole rupees. You'll receive warnings when spending reaches 80% and 100%.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 mb-1.5 block">
                  Quick Presets:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[5000, 10000, 25000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBudgetInputRupees(String(preset))}
                      className="py-1.5 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                    >
                      ₹{(preset / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                {budget?.budgetPaise > 0 && (
                  <button
                    type="button"
                    onClick={handleClearBudget}
                    disabled={budgetSaving}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    Clear Budget
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={budgetSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {budgetSaving ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
