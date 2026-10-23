import { describe, it, expect } from 'vitest';
import { calculateSmartInsights } from '../src/services/analyticsService.js';

describe('Smart Spending Insights Unit Tests', () => {
  const userId = 'user_123';

  it('should accurately compute period spending, top category, and trend', () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

    const expenses = [
      // Current period expense: Rent (User share ₹15,000 = 1500000 paise)
      {
        expenseDate: tenDaysAgo,
        category: 'Rent',
        amountPaise: 4500000,
        participants: [{ user: userId, sharePaise: 1500000 }],
        groupId: { _id: 'g1', name: 'Apartment 402' },
      },
      // Current period expense: Food (User share ₹3,000 = 300000 paise)
      {
        expenseDate: tenDaysAgo,
        category: 'Food',
        amountPaise: 600000,
        participants: [{ user: userId, sharePaise: 300000 }],
        groupId: { _id: 'g1', name: 'Apartment 402' },
      },
      // Previous period expense: Travel (User share ₹10,000 = 1000000 paise)
      {
        expenseDate: fortyDaysAgo,
        category: 'Travel',
        amountPaise: 2000000,
        participants: [{ user: userId, sharePaise: 1000000 }],
        groupId: { _id: 'g2', name: 'Goa Trip' },
      },
    ];

    const summary = {
      totalOwedPaise: 500000, // ₹5,000
      totalOwesPaise: 0,
      netBalancePaise: 500000,
    };

    const insights = calculateSmartInsights({
      expenses,
      userGroups: [{ _id: 'g1' }, { _id: 'g2' }],
      userId,
      summary,
      periodDays: 30,
    });

    // 1. Current period spend: ₹15,000 + ₹3,000 = 1,800,000 paise
    expect(insights.currentPeriodSpendPaise).toBe(1800000);
    expect(insights.currentExpenseCount).toBe(2);

    // 2. Previous period spend: 1,000,000 paise
    expect(insights.previousPeriodSpendPaise).toBe(1000000);

    // 3. Trend: ((1800000 - 1000000) / 1000000) * 100 = +80% increase
    expect(insights.trendDirection).toBe('INCREASE');
    expect(insights.percentageChange).toBe(80);

    // 4. Highest category: Rent (1,500,000 / 1,800,000 = ~83%)
    expect(insights.highestCategory).toBe('Rent');
    expect(insights.highestCategoryPercentage).toBe(83);

    // 5. Actionable suggestions generated
    expect(insights.actionableSuggestions.length).toBeGreaterThanOrEqual(3);
    const rentTip = insights.actionableSuggestions.find((s) => s.type === 'CATEGORY_CONCENTRATION');
    expect(rentTip).toBeDefined();
    expect(rentTip.title).toContain('Rent');
  });

  it('should detect when all debts are settled', () => {
    const insights = calculateSmartInsights({
      expenses: [],
      userGroups: [],
      userId,
      summary: { totalOwedPaise: 0, totalOwesPaise: 0, netBalancePaise: 0 },
      periodDays: 30,
    });

    const settledTip = insights.actionableSuggestions.find((s) => s.type === 'ALL_SETTLED');
    expect(settledTip).toBeDefined();
  });
});
