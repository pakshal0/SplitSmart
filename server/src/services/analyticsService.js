/**
 * Analytics and Smart Spending Insights Service
 * Computes period-over-period statistics, category concentration,
 * and dynamic, data-driven actionable financial tips from actual MongoDB records.
 */

export const calculateSmartInsights = ({
  expenses = [],
  userGroups = [],
  userId,
  settlementSuggestions = [],
  summary = {},
  periodDays = 30,
}) => {
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 2 * periodDays * 24 * 60 * 60 * 1000);

  let currentPeriodSpendPaise = 0;
  let previousPeriodSpendPaise = 0;
  let currentExpenseCount = 0;
  const currentCategoryMap = {};
  const groupActivityMap = {};

  for (const exp of expenses) {
    const expDate = new Date(exp.expenseDate || exp.createdAt);
    const userPart = exp.participants?.find(
      (p) => (p.user?._id || p.user || '').toString() === userId.toString()
    );
    const userShare = userPart ? userPart.sharePaise : 0;

    // Track group spend
    const gId = (exp.groupId?._id || exp.groupId || '').toString();
    const gName = exp.groupId?.name || 'Group';
    if (!groupActivityMap[gId]) {
      groupActivityMap[gId] = { name: gName, totalPaise: 0, count: 0 };
    }
    groupActivityMap[gId].totalPaise += exp.amountPaise;
    groupActivityMap[gId].count += 1;

    // Current period
    if (expDate >= currentPeriodStart && expDate <= now) {
      if (userShare > 0) {
        currentPeriodSpendPaise += userShare;
        currentExpenseCount += 1;
        currentCategoryMap[exp.category] = (currentCategoryMap[exp.category] || 0) + userShare;
      }
    }
    // Previous period
    else if (expDate >= previousPeriodStart && expDate < currentPeriodStart) {
      if (userShare > 0) {
        previousPeriodSpendPaise += userShare;
      }
    }
  }

  // Calculate highest category in current period
  let highestCategory = null;
  let highestCategoryPaise = 0;

  for (const [cat, amt] of Object.entries(currentCategoryMap)) {
    if (amt > highestCategoryPaise) {
      highestCategoryPaise = amt;
      highestCategory = cat;
    }
  }

  const highestCategoryPercentage =
    currentPeriodSpendPaise > 0
      ? Math.round((highestCategoryPaise / currentPeriodSpendPaise) * 100)
      : 0;

  // Percentage change vs previous period
  let percentageChange = 0;
  let trendDirection = 'STEADY';

  if (previousPeriodSpendPaise > 0) {
    percentageChange = Math.round(
      ((currentPeriodSpendPaise - previousPeriodSpendPaise) / previousPeriodSpendPaise) * 100
    );
    if (percentageChange > 2) trendDirection = 'INCREASE';
    else if (percentageChange < -2) trendDirection = 'DECREASE';
    else trendDirection = 'STEADY';
  } else if (currentPeriodSpendPaise > 0) {
    percentageChange = 100;
    trendDirection = 'INCREASE';
  }

  // Outstanding settlements involving user
  const userSuggestions = settlementSuggestions.filter(
    (s) => s.from.id === userId.toString() || s.to.id === userId.toString()
  );

  // Generate Actionable Suggestions based on real patterns
  const suggestions = [];

  // 1. Category advice
  if (highestCategory && highestCategoryPercentage >= 30) {
    let advice = '';
    if (highestCategory === 'Food') {
      advice = `Food is your top expense category (${highestCategoryPercentage}% of your spending, ₹${(highestCategoryPaise / 100).toFixed(2)}). Splitting wholesale grocery runs or cooking shared dinners can save up to 25%.`;
    } else if (highestCategory === 'Travel') {
      advice = `Travel accounted for ${highestCategoryPercentage}% of your expenses (₹${(highestCategoryPaise / 100).toFixed(2)}). Pre-booking shared cabs and intercity transport in advance avoids surge pricing.`;
    } else if (highestCategory === 'Rent') {
      advice = `Rent is your largest shared commitment at ${highestCategoryPercentage}% (₹${(highestCategoryPaise / 100).toFixed(2)}). Keep rent settlements automated on the 1st of each month to avoid late fees.`;
    } else if (highestCategory === 'Entertainment') {
      advice = `Entertainment represents ${highestCategoryPercentage}% of your spending. Check for student and group pass bundle discounts on upcoming events.`;
    } else {
      advice = `${highestCategory} represents ${highestCategoryPercentage}% of your recent expenses (₹${(highestCategoryPaise / 100).toFixed(2)}). Review this category regularly to maintain a balanced budget.`;
    }
    suggestions.push({
      type: 'CATEGORY_CONCENTRATION',
      title: `${highestCategory} is your #1 Expense`,
      message: advice,
      severity: highestCategoryPercentage > 50 ? 'warning' : 'info',
    });
  }

  // 2. Spending Trend Advice
  if (trendDirection === 'DECREASE') {
    suggestions.push({
      type: 'SPENDING_TREND',
      title: 'Spending Down vs Previous Period',
      message: `Your spending decreased by ${Math.abs(percentageChange)}% compared to the previous ${periodDays}-day window. Excellent financial control across your shared groups!`,
      severity: 'success',
    });
  } else if (trendDirection === 'INCREASE' && previousPeriodSpendPaise > 0) {
    suggestions.push({
      type: 'SPENDING_TREND',
      title: 'Spending Up vs Previous Period',
      message: `Your spending increased by ${percentageChange}% compared to the prior ${periodDays} days. Consider reviewing recent high-ticket group items.`,
      severity: 'warning',
    });
  }

  // 3. Outstanding Settlements Advice
  if (summary.totalOwedPaise > 0) {
    suggestions.push({
      type: 'SETTLEMENT_RECEIVABLE',
      title: `₹${(summary.totalOwedPaise / 100).toFixed(2)} in Receivables`,
      message: `You are owed money across your groups. Tap "Balances & Settle" to send friendly reminders or record payments received via UPI.`,
      severity: 'info',
    });
  } else if (summary.totalOwesPaise > 0) {
    suggestions.push({
      type: 'SETTLEMENT_PAYABLE',
      title: `₹${(summary.totalOwesPaise / 100).toFixed(2)} Outstanding Debt`,
      message: `You have outstanding dues in ${userSuggestions.length} group transaction(s). Clear them through the recommended direct transfers to stay balanced.`,
      severity: 'warning',
    });
  } else {
    suggestions.push({
      type: 'ALL_SETTLED',
      title: 'All Debts Settled',
      message: 'You have zero outstanding balances across all your groups. Everything is completely reconciled!',
      severity: 'success',
    });
  }

  // 4. Most active group
  const mostActiveGroup = Object.values(groupActivityMap).sort((a, b) => b.totalPaise - a.totalPaise)[0];
  if (mostActiveGroup && mostActiveGroup.totalPaise > 0) {
    suggestions.push({
      type: 'ACTIVE_GROUP',
      title: `Most Active: ${mostActiveGroup.name}`,
      message: `"${mostActiveGroup.name}" is your highest-volume group with ₹${(mostActiveGroup.totalPaise / 100).toFixed(2)} in shared expenses across ${mostActiveGroup.count} bills.`,
      severity: 'info',
    });
  }

  return {
    periodDays,
    currentPeriodSpendPaise,
    previousPeriodSpendPaise,
    percentageChange,
    trendDirection, // 'INCREASE' | 'DECREASE' | 'STEADY'
    currentExpenseCount,
    highestCategory: highestCategory || 'None',
    highestCategoryPaise,
    highestCategoryPercentage,
    totalOwedPaise: summary.totalOwedPaise || 0,
    totalOwesPaise: summary.totalOwesPaise || 0,
    netBalancePaise: summary.netBalancePaise || 0,
    actionableSuggestions: suggestions,
  };
};
