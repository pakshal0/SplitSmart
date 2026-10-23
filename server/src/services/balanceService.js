import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Calculates equal shares deterministically with remainder paise distributed
 * to the first remainder participants.
 */
export const calculateEqualShares = (totalAmountPaise, participantUserIds) => {
  if (!Array.isArray(participantUserIds) || participantUserIds.length === 0) {
    throw new AppError('Participant list cannot be empty for equal split', 400);
  }

  // Deterministic sorting of user IDs
  const sortedIds = [...participantUserIds].map((id) => id.toString()).sort();
  const n = sortedIds.length;
  const baseShare = Math.floor(totalAmountPaise / n);
  const remainder = totalAmountPaise % n;

  return sortedIds.map((userId, index) => ({
    user: userId,
    sharePaise: index < remainder ? baseShare + 1 : baseShare,
  }));
};

/**
 * Calculates percentage shares deterministically with rounding remainders distributed.
 */
export const calculatePercentageShares = (totalAmountPaise, percentageMap) => {
  const userIds = Object.keys(percentageMap).sort();
  if (userIds.length === 0) {
    throw new AppError('Percentage split requires participant percentages', 400);
  }

  const totalPercentage = userIds.reduce((sum, id) => sum + Number(percentageMap[id] || 0), 0);
  // Allow epsilon for float precision (e.g. 100.0)
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new AppError(`Percentages must total exactly 100%. Current sum: ${totalPercentage}%`, 400);
  }

  let allocated = 0;
  const shares = userIds.map((userId) => {
    const pct = Number(percentageMap[userId]);
    const sharePaise = Math.floor((pct / 100) * totalAmountPaise);
    allocated += sharePaise;
    return {
      user: userId,
      sharePaise,
    };
  });

  // Distribute any remainder paise deterministically
  const remainder = totalAmountPaise - allocated;
  for (let i = 0; i < remainder; i++) {
    shares[i % shares.length].sharePaise += 1;
  }

  return shares;
};

/**
 * Validates custom shares sum up to totalAmountPaise
 */
export const validateCustomShares = (totalAmountPaise, participants) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    throw new AppError('Custom split requires at least one participant', 400);
  }

  const totalShares = participants.reduce((sum, p) => sum + (Number(p.sharePaise) || 0), 0);
  if (totalShares !== totalAmountPaise) {
    throw new AppError(
      `Custom split shares (₹${(totalShares / 100).toFixed(2)}) must exactly match total expense amount (₹${(totalAmountPaise / 100).toFixed(2)})`,
      400
    );
  }
};

/**
 * Calculates net balances for all members of a group
 */
export const calculateGroupBalances = async (groupId) => {
  const group = await Group.findById(groupId).populate('members.user', 'name email avatar');
  if (!group) {
    throw new AppError('Group not found', 404);
  }

  // Fetch all expenses in this group
  const expenses = await Expense.find({ groupId });

  // Fetch only COMPLETED settlements (pending and cancelled do not affect balances)
  const settlements = await Settlement.find({ groupId, status: 'completed' });

  // Map of userId -> balance stats
  const memberMap = new Map();

  for (const m of group.members) {
    if (!m.user) continue;
    const uid = m.user._id.toString();
    memberMap.set(uid, {
      userId: uid,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar,
      role: m.role,
      paidForExpensesPaise: 0,
      shareOwedPaise: 0,
      settlementsPaidPaise: 0,
      settlementsReceivedPaise: 0,
      netBalancePaise: 0,
    });
  }

  // 1. Process Expenses
  for (const expense of expenses) {
    const payerId = expense.paidBy.toString();
    if (memberMap.has(payerId)) {
      memberMap.get(payerId).paidForExpensesPaise += expense.amountPaise;
    }

    for (const participant of expense.participants) {
      const partId = participant.user.toString();
      if (memberMap.has(partId)) {
        memberMap.get(partId).shareOwedPaise += participant.sharePaise;
      }
    }
  }

  // 2. Process Completed Settlements
  for (const settlement of settlements) {
    const payerId = settlement.paidBy.toString();
    const recipientId = settlement.paidTo.toString();

    if (memberMap.has(payerId)) {
      memberMap.get(payerId).settlementsPaidPaise += settlement.amountPaise;
    }
    if (memberMap.has(recipientId)) {
      memberMap.get(recipientId).settlementsReceivedPaise += settlement.amountPaise;
    }
  }

  // 3. Compute Net Balance for each member
  // Net Balance = (Paid for Expenses - Share Owed) + (Settlements Paid - Settlements Received)
  const balances = [];
  let sumCheck = 0;

  for (const member of memberMap.values()) {
    const net =
      member.paidForExpensesPaise -
      member.shareOwedPaise +
      member.settlementsPaidPaise -
      member.settlementsReceivedPaise;

    member.netBalancePaise = net;
    sumCheck += net;
    balances.push(member);
  }

  // Verification invariant: sum of net balances must be 0
  if (Math.abs(sumCheck) > 0) {
    console.warn(`[BALANCE WARNING] Group ${groupId} balance sum deviation: ${sumCheck} paise`);
  }

  return balances;
};

/**
 * Smart Debt Simplification Algorithm:
 * Converts multiple pairwise debts into the minimal number of direct settlement transfers.
 */
export const simplifyDebts = (balances) => {
  // Separate into debtors and creditors
  // Clone to avoid mutating input objects
  const debtors = [];
  const creditors = [];

  for (const b of balances) {
    if (b.netBalancePaise < 0) {
      debtors.push({
        userId: b.userId,
        name: b.name,
        email: b.email,
        avatar: b.avatar,
        amount: Math.abs(b.netBalancePaise),
      });
    } else if (b.netBalancePaise > 0) {
      creditors.push({
        userId: b.userId,
        name: b.name,
        email: b.email,
        avatar: b.avatar,
        amount: b.netBalancePaise,
      });
    }
  }

  // Sort deterministically: highest amount first, then by userId
  debtors.sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId));
  creditors.sort((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId));

  const recommendations = [];
  let debtorIdx = 0;
  let creditorIdx = 0;

  while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
    const debtor = debtors[debtorIdx];
    const creditor = creditors[creditorIdx];

    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0) {
      recommendations.push({
        from: {
          id: debtor.userId,
          name: debtor.name,
          email: debtor.email,
          avatar: debtor.avatar,
        },
        to: {
          id: creditor.userId,
          name: creditor.name,
          email: creditor.email,
          avatar: creditor.avatar,
        },
        amountPaise: transferAmount,
        formattedAmount: `₹${(transferAmount / 100).toFixed(2)}`,
        suggestion: `${debtor.name} pays ${creditor.name} ₹${(transferAmount / 100).toFixed(2)}`,
      });

      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;
    }

    if (debtor.amount === 0) debtorIdx++;
    if (creditor.amount === 0) creditorIdx++;
  }

  return recommendations;
};
