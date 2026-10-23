import { calculateGroupBalances, simplifyDebts } from '../services/balanceService.js';

export const getGroupBalances = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const balances = await calculateGroupBalances(groupId);

    const currentUserId = req.user._id.toString();
    const currentUserBalance = balances.find((b) => b.userId === currentUserId) || {
      userId: currentUserId,
      netBalancePaise: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        balances,
        currentUser: {
          netBalancePaise: currentUserBalance.netBalancePaise,
          formattedNetBalance: `₹${(Math.abs(currentUserBalance.netBalancePaise) / 100).toFixed(2)}`,
          status:
            currentUserBalance.netBalancePaise > 0
              ? 'OWED'
              : currentUserBalance.netBalancePaise < 0
              ? 'OWES'
              : 'SETTLED',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSettlementSuggestions = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const balances = await calculateGroupBalances(groupId);
    const suggestions = simplifyDebts(balances);

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
