import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, ArrowUpRight, Search, X, Check, Shield } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPaise, rupeesToPaise } from '../lib/formatCurrency';
import toast from 'react-hot-toast';

export default function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Group Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budgetRupees, setBudgetRupees] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [addedEmails, setAddedEmails] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      setGroups(res.data.data.groups || []);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    if (addedEmails.includes(memberEmail.trim().toLowerCase())) {
      toast.error('Email already added');
      return;
    }
    setAddedEmails([...addedEmails, memberEmail.trim().toLowerCase()]);
    setMemberEmail('');
  };

  const handleRemoveEmail = (email) => {
    setAddedEmails(addedEmails.filter((e) => e !== email));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      setCreateLoading(true);
      const budgetPaise = budgetRupees && !isNaN(parseFloat(budgetRupees)) && parseFloat(budgetRupees) > 0
        ? rupeesToPaise(parseFloat(budgetRupees))
        : 0;

      await api.post('/groups', {
        name: name.trim(),
        description: description.trim(),
        members: addedEmails,
        budgetPaise,
      });

      toast.success('Group created successfully!');
      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setBudgetRupees('');
      setAddedEmails([]);
      loadGroups();
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Expense Groups
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage trips, roommates, projects, and shared bills.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by group name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors shadow-2xs"
        />
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-xs text-slate-400">
          Loading groups...
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-md mx-auto">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Groups Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {search ? 'No groups matched your search filter.' : 'Create your first expense group to start splitting bills.'}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm"
          >
            Create Group Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const isOwner = group.owner?._id === user?.id;

            return (
              <Link
                key={group._id}
                to={`/groups/${group._id}`}
                className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                      {group.members.length} Members
                    </span>
                    {isOwner && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        <Shield className="w-3 h-3" />
                        Owner
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {group.description || 'No description provided.'}
                  </p>

                  {/* Budget Tracker Progress Mini Indicator */}
                  {group.budgetPaise > 0 && (
                    <div className="mt-3.5 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-semibold text-slate-500">
                          {group.isExceeded ? '🚨 Over Budget' : group.isWarning ? '⚠️ Budget Alert' : 'Budget Progress'}
                        </span>
                        <span className={`font-black ${group.isExceeded ? 'text-rose-600' : group.isWarning ? 'text-amber-600' : 'text-blue-600'}`}>
                          {group.budgetUsedPercentage}% ({formatPaise(group.totalSpentPaise || 0, false)} / {formatPaise(group.budgetPaise, false)})
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            group.isExceeded
                              ? 'bg-rose-500'
                              : group.isWarning
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, group.budgetUsedPercentage || 0))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  {/* Member Avatar Stack */}
                  <div className="flex -space-x-2">
                    {group.members?.slice(0, 4).map((m, idx) => (
                      <img
                        key={m.user?._id || idx}
                        src={
                          m.user?.avatar ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${m.user?.name}`
                        }
                        alt={m.user?.name}
                        title={m.user?.name}
                        className="w-7 h-7 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Manage</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Group</h3>
                  <p className="text-xs text-slate-500">Add group members and start splitting</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Goa Vacation, Apartment 402, Friday Dinner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shared expenses for hotel, travel, and food"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Group Budget (₹ - Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 50000"
                  value={budgetRupees}
                  onChange={(e) => setBudgetRupees(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invite Members by Email (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="registered.user@splitsmart.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                  >
                    Add
                  </button>
                </div>

                {/* Email pills */}
                {addedEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {addedEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
