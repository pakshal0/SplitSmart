import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AddExpenseModal from '../expenses/AddExpenseModal';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet context={{ openAddExpense: () => setIsAddExpenseOpen(true) }} />
        </main>
      </div>

      {/* Global Add Expense Modal */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          onExpenseCreated={() => {
            setIsAddExpenseOpen(false);
            // Refresh data or broadcast event
            window.dispatchEvent(new Event('expense-updated'));
          }}
        />
      )}
    </div>
  );
}
