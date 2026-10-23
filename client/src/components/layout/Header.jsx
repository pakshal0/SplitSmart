import React from 'react';
import { Menu, Search, Bell, MessageSquare, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Header({ onOpenMobileMenu, onOpenAddExpense }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-100">
      {/* Left: Mobile hamburger & Global Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input matching the reference image */}
        <div className="relative w-full hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search groups, expenses, members..."
            className="w-full pl-9 pr-12 py-2 text-sm bg-slate-50/80 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 rounded-full border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white text-slate-400 border border-slate-200 shadow-xs">
              ⌘ K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Utility Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Expense Button */}
        {onOpenAddExpense && (
          <button
            onClick={onOpenAddExpense}
            className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-full shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
        )}

        {/* Message Square Button */}
        <button
          title="Group Chats & Discussions"
          className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            title="Notifications"
            className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>
        </div>

        {/* Profile Avatar Pill */}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
        >
          <div className="relative">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1.5 ring-white"></span>
          </div>
        </Link>
      </div>
    </header>
  );
}
