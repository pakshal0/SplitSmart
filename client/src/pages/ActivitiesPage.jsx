import React, { useState, useEffect } from 'react';
import { History, Clock } from 'lucide-react';
import api from '../lib/api';
import { formatRelativeTime } from '../lib/formatCurrency';
import toast from 'react-hot-toast';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setActivities(res.data.data.recentActivities || []);
    } catch (err) {
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Activities
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time event stream of group creations, expense additions, and payments.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-xs text-slate-400">
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-md mx-auto">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No activities recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 divide-y divide-slate-100">
          {activities.map((act) => (
            <div key={act._id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
              <img
                src={
                  act.actor?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${act.actor?.name}`
                }
                alt={act.actor?.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-200 mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{act.message}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span className="font-semibold text-slate-500">{act.groupId?.name}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(act.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
