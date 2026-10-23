import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Activity from '../models/Activity.js';
import { calculateGroupBalances, simplifyDebts } from '../services/balanceService.js';
import { calculateSmartInsights } from '../services/analyticsService.js';

export const getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();

    // 1. Fetch user's groups
    const userGroups = await Group.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    const groupIds = userGroups.map((g) => g._id);

    // 2. Fetch expenses and completed settlements across these groups
    const [expenses, settlements, recentActivities] = await Promise.all([
      Expense.find({ groupId: { $in: groupIds } })
        .populate('paidBy', 'name email avatar')
        .populate('groupId', 'name')
        .sort({ expenseDate: -1 }),
      Settlement.find({ groupId: { $in: groupIds }, status: 'completed' })
        .populate('paidBy', 'name email avatar')
        .populate('paidTo', 'name email avatar')
        .populate('groupId', 'name')
        .sort({ completedAt: -1 }),
      Activity.find({ groupId: { $in: groupIds } })
        .populate('actor', 'name email avatar')
        .populate('groupId', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // 3. Compute aggregate balances across all groups
    let totalGroupExpensesPaise = 0;
    let userPaidTotalPaise = 0;
    let userShareTotalPaise = 0;
    let totalOwesPaise = 0; // Money user needs to pay
    let totalOwedPaise = 0; // Money others owe user
    const groupBalancesOverview = [];
    const allPendingSuggestions = [];

    for (const group of userGroups) {
      const gBalances = await calculateGroupBalances(group._id);
      const userBal = gBalances.find((b) => b.userId === userId);
      const suggestions = simplifyDebts(gBalances);

      // Suggestions involving current user
      const userSuggestions = suggestions.filter(
        (s) => s.from.id === userId || s.to.id === userId
      );
      allPendingSuggestions.push(...userSuggestions.map((s) => ({ ...s, groupName: group.name, groupId: group._id })));

      const net = userBal ? userBal.netBalancePaise : 0;
      if (net < 0) totalOwesPaise += Math.abs(net);
      if (net > 0) totalOwedPaise += net;

      // Group total expense
      const gExpenses = expenses.filter((e) => e.groupId._id.toString() === group._id.toString());
      const gTotal = gExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

      groupBalancesOverview.push({
        groupId: group._id,
        name: group.name,
        description: group.description,
        memberCount: group.members.length,
        members: group.members.map((m) => m.user),
        totalExpensesPaise: gTotal,
        userNetBalancePaise: net,
        status: net > 0 ? 'OWED' : net < 0 ? 'OWES' : 'SETTLED',
      });
    }

    // 4. Category breakdown
    const categoryTotals = {};
    const monthsMap = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize last 6 months for chart
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthsMap[key] = { month: key, totalExpensePaise: 0, userSharePaise: 0, settlementsPaise: 0 };
    }

    for (const exp of expenses) {
      totalGroupExpensesPaise += exp.amountPaise;

      // Check if user paid
      if (exp.paidBy && exp.paidBy._id.toString() === userId) {
        userPaidTotalPaise += exp.amountPaise;
      }

      // Check user's participant share
      const userPart = exp.participants.find((p) => p.user && p.user.toString() === userId);
      if (userPart) {
        userShareTotalPaise += userPart.sharePaise;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + userPart.sharePaise;
      }

      // Timeline month
      const d = new Date(exp.expenseDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthsMap[key]) {
        monthsMap[key].totalExpensePaise += exp.amountPaise;
        if (userPart) {
          monthsMap[key].userSharePaise += userPart.sharePaise;
        }
      }
    }

    for (const set of settlements) {
      const d = new Date(set.completedAt || set.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthsMap[key]) {
        monthsMap[key].settlementsPaise += set.amountPaise;
      }
    }

    // Convert categoryTotals to percentages and sorted array
    const totalCategoriesPaise = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amountPaise]) => ({
        category,
        amountPaise,
        percentage: Math.round((amountPaise / totalCategoriesPaise) * 100),
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // Timeline array for Recharts
    const timeline = Object.values(monthsMap).map((m) => ({
      name: m.month.split(' ')[0],
      month: m.month,
      totalExpense: m.totalExpensePaise / 100,
      userShare: m.userSharePaise / 100,
      settlements: m.settlementsPaise / 100,
    }));

    const summary = {
      totalGroupExpensesPaise,
      userPaidTotalPaise,
      userShareTotalPaise,
      totalOwesPaise,
      totalOwedPaise,
      netBalancePaise: totalOwedPaise - totalOwesPaise,
      activeGroupsCount: userGroups.length,
    };

    const smartInsights = calculateSmartInsights({
      expenses,
      userGroups,
      userId,
      settlementSuggestions: allPendingSuggestions,
      summary,
      periodDays: req.query.periodDays ? parseInt(req.query.periodDays, 10) : 30,
    });

    res.status(200).json({
      success: true,
      data: {
        summary,
        groupBalancesOverview,
        recentExpenses: expenses.slice(0, 5),
        recentSettlements: settlements.slice(0, 5),
        recentActivities: recentActivities.slice(0, 6),
        categoryBreakdown,
        timeline,
        settlementSuggestions: allPendingSuggestions.slice(0, 5),
        smartInsights,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupAnalytics = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = req.group;

    const [expenses, settlements, balances] = await Promise.all([
      Expense.find({ groupId })
        .populate('paidBy', 'name email avatar')
        .populate('participants.user', 'name email avatar')
        .sort({ expenseDate: 1 }),
      Settlement.find({ groupId, status: 'completed' })
        .populate('paidBy', 'name email avatar')
        .populate('paidTo', 'name email avatar'),
      calculateGroupBalances(groupId),
    ]);

    // 1. Category breakdown for group
    const categoryMap = {};
    let totalExpensesPaise = 0;

    for (const e of expenses) {
      totalExpensesPaise += e.amountPaise;
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amountPaise;
    }

    const categoryBreakdown = Object.entries(categoryMap).map(([category, amountPaise]) => ({
      category,
      amountPaise,
      percentage: totalExpensesPaise > 0 ? Math.round((amountPaise / totalExpensesPaise) * 100) : 0,
    }));

    // 2. Member contributions
    const memberContributions = balances.map((b) => ({
      name: b.name,
      paid: b.paidForExpensesPaise / 100,
      owed: b.shareOwedPaise / 100,
      net: b.netBalancePaise / 100,
    }));

    // 3. Debt simplification suggestions
    const suggestions = simplifyDebts(balances);

    res.status(200).json({
      success: true,
      data: {
        groupName: group.name,
        totalExpensesPaise,
        totalExpensesCount: expenses.length,
        totalSettlementsCount: settlements.length,
        categoryBreakdown,
        memberContributions,
        balances,
        suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};
