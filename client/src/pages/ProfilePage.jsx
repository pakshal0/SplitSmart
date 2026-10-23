import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, LogOut, Shield, UserCheck } from 'lucide-react';
import { formatDate } from '../lib/formatCurrency';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSwitchUser = async (email) => {
    try {
      await login(email, 'password123');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to switch user');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Account Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your account credentials, sessions, and demo switching.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
        <img
          src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
          alt={user?.name}
          className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-200 shadow-md"
        />

        <div className="space-y-1 text-center md:text-left flex-1">
          <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
          <p className="text-sm text-slate-500 flex items-center justify-center md:justify-start gap-1.5">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{user?.email}</span>
          </p>
          <p className="text-xs text-slate-400 flex items-center justify-center md:justify-start gap-1.5 pt-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Member since {formatDate(user?.createdAt || new Date())}</span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Demo Multi-User Switcher for Faculty & Presentation */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">
            One-Click Presentation Switcher
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Switch between users to demonstrate cross-user balances and settlement recommendations from different perspectives.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { name: 'Jon', email: 'jon@splitsmart.com', role: 'Trip Organizer' },
            { name: 'Aditi Verma', email: 'aditi@splitsmart.com', role: 'Flatmate' },
            { name: 'Rahul Sharma', email: 'rahul@splitsmart.com', role: 'Project Peer' },
          ].map((u) => (
            <button
              key={u.email}
              onClick={() => handleSwitchUser(u.email)}
              disabled={user?.email === u.email}
              className={`p-4 rounded-2xl border text-left transition-all ${
                user?.email === u.email
                  ? 'border-blue-600 bg-blue-50/50 cursor-default'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900">{u.name}</div>
              <div className="text-[11px] text-slate-500">{u.email}</div>
              <span className="inline-block mt-2 text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                {u.role}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
