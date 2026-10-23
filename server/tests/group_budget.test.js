import { describe, it, expect } from 'vitest';
import { setBudgetSchema } from '../src/utils/validators.js';

describe('Group Budget Tracker Logic Tests', () => {
  const calculateBudgetStats = (budgetPaise, totalSpentPaise) => {
    const remainingBudgetPaise = Math.max(0, budgetPaise - totalSpentPaise);
    const budgetUsedPercentage = budgetPaise > 0
      ? Math.round((totalSpentPaise / budgetPaise) * 100 * 10) / 10
      : 0;
    const isWarning = budgetPaise > 0 && budgetUsedPercentage >= 80 && budgetUsedPercentage <= 100;
    const isExceeded = budgetPaise > 0 && totalSpentPaise > budgetPaise;

    return {
      budgetPaise,
      totalSpentPaise,
      remainingBudgetPaise,
      budgetUsedPercentage,
      isWarning,
      isExceeded,
    };
  };

  it('should validate budget inputs using Zod schema', () => {
    expect(() => setBudgetSchema.parse({ budgetPaise: 500000 })).not.toThrow();
    expect(() => setBudgetSchema.parse({ budgetPaise: 0 })).not.toThrow();
    expect(() => setBudgetSchema.parse({ budgetPaise: -100 })).toThrow();
    expect(() => setBudgetSchema.parse({ budgetPaise: 12.5 })).toThrow(); // Must be integer
  });

  it('should calculate under-budget status correctly (<80%)', () => {
    const budgetPaise = 1000000; // ₹10,000
    const totalSpentPaise = 500000; // ₹5,000 (50%)

    const stats = calculateBudgetStats(budgetPaise, totalSpentPaise);

    expect(stats.budgetPaise).toBe(1000000);
    expect(stats.totalSpentPaise).toBe(500000);
    expect(stats.remainingBudgetPaise).toBe(500000);
    expect(stats.budgetUsedPercentage).toBe(50);
    expect(stats.isWarning).toBe(false);
    expect(stats.isExceeded).toBe(false);
  });

  it('should trigger warning when spending is between 80% and 100%', () => {
    const budgetPaise = 1000000; // ₹10,000
    const totalSpentPaise = 850000; // ₹8,500 (85%)

    const stats = calculateBudgetStats(budgetPaise, totalSpentPaise);

    expect(stats.budgetUsedPercentage).toBe(85);
    expect(stats.remainingBudgetPaise).toBe(150000);
    expect(stats.isWarning).toBe(true);
    expect(stats.isExceeded).toBe(false);
  });

  it('should trigger exceeded alert when spending exceeds 100%', () => {
    const budgetPaise = 1000000; // ₹10,000
    const totalSpentPaise = 1200000; // ₹12,000 (120%)

    const stats = calculateBudgetStats(budgetPaise, totalSpentPaise);

    expect(stats.budgetUsedPercentage).toBe(120);
    expect(stats.remainingBudgetPaise).toBe(0);
    expect(stats.isWarning).toBe(false);
    expect(stats.isExceeded).toBe(true);
  });

  it('should handle zero budget without divide-by-zero error', () => {
    const stats = calculateBudgetStats(0, 50000);

    expect(stats.budgetUsedPercentage).toBe(0);
    expect(stats.remainingBudgetPaise).toBe(0);
    expect(stats.isWarning).toBe(false);
    expect(stats.isExceeded).toBe(false);
  });
});
