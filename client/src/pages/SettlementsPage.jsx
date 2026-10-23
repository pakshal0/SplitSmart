import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, Plus, Search, Filter } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatPaise, formatDate } from '../lib/formatCurrency';
import toast from 'react-hot-toast';

export default function SettlementsPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const loadSettlements = async () => {
    try {
      setLoading(true);
      // Fetch overview which includes settlements across all groups
      const res = await api.get('/analytics/overview');
      setSettlements(res.data.data.recentSettlements || []);
    } catch (err) {
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const filtered = settlements.filter((s) => {
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Settlement History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit record of completed and pending payments between group members.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
          {['ALL', 'COMPLETED', 'PENDING'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-xs text-slate-400">
          Loading settlements...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-md mx-auto">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Settlements Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Settlements recorded in groups will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
          {filtered.map((set) => {
            const isCompleted = set.status === 'completed';
            const isPending = set.status === 'pending';

            return (
              <div
                key={set._id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-600'
                        : isPending
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {set.paidBy?.name} <span className="font-normal text-slate-500">paid</span>{' '}
                      {set.paidTo?.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {set.groupId?.name} • {formatDate(set.completedAt || set.createdAt)}
                    </div>
                    {set.note && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        "{set.note}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-slate-900">
                    {formatPaise(set.amountPaise)}
                  </div>
                  <span
                    className={`inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700'
                        : isPending
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {set.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
