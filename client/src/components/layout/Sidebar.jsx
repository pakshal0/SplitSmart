import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Scale,
  BarChart3,
  History,
  CheckCircle2,
  Settings,
  LogOut,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 px-4 py-5 select-none">
      {/* Brand Logo */}
      <div className="flex items-center justify-between px-2 mb-6">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            SplitSmart
          </span>
        </NavLink>
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-1">
        {/* Workspace */}
        <div>
          <div className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Workspace
          </div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" end className={navItemClass}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/groups" className={navItemClass}>
              <Users className="w-4 h-4" />
              <span>Groups</span>
            </NavLink>
            <NavLink to="/expenses" className={navItemClass}>
              <Receipt className="w-4 h-4" />
              <span>Expenses</span>
            </NavLink>
            <NavLink to="/balances" className={navItemClass}>
              <Scale className="w-4 h-4" />
              <span>Balances & Settle</span>
            </NavLink>
          </nav>
        </div>

        {/* Insights */}
        <div>
          <div className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Insights
          </div>
          <nav className="space-y-1">
            <NavLink to="/analytics" className={navItemClass}>
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </NavLink>
            <NavLink to="/activity" className={navItemClass}>
              <History className="w-4 h-4" />
              <span>Activities</span>
            </NavLink>
          </nav>
        </div>

        {/* Management */}
        <div>
          <div className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Management
          </div>
          <nav className="space-y-1">
            <NavLink to="/settlements" className={navItemClass}>
              <CheckCircle2 className="w-4 h-4" />
              <span>Settlements</span>
            </NavLink>
            <NavLink to="/profile" className={navItemClass}>
              <UserCheck className="w-4 h-4" />
              <span>Account Profile</span>
            </NavLink>
          </nav>
        </div>

        {/* Appearance / Preferences */}
        <div>
          <div className="px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Settings
          </div>
          <nav className="space-y-1">
            <NavLink to="/profile" className={navItemClass}>
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* User profile bottom card */}
      <div className="pt-4 border-t border-slate-100 mt-2">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-900 truncate">{user?.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer backdrop and overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
