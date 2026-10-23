import Settlement from '../models/Settlement.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export const createSettlement = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { paidBy, paidTo, amountPaise, note = '', status = 'completed' } = req.body;
    const group = req.group;

    if (paidBy.toString() === paidTo.toString()) {
      return next(new AppError('Payer and recipient cannot be the same person', 400));
    }

    // Verify both are group members
    const isPayerInGroup = group.members.some(
      (m) => m.user._id.toString() === paidBy.toString()
    );
    const isRecipientInGroup = group.members.some(
      (m) => m.user._id.toString() === paidTo.toString()
    );

    if (!isPayerInGroup || !isRecipientInGroup) {
      return next(new AppError('Both payer and recipient must be members of the group', 400));
    }

    const settlement = await Settlement.create({
      groupId,
      paidBy,
      paidTo,
      amountPaise,
      note,
      status,
      completedAt: status === 'completed' ? new Date() : null,
    });

    const populated = await Settlement.findById(settlement._id)
      .populate('paidBy', 'name email avatar')
      .populate('paidTo', 'name email avatar');

    const formattedAmount = `₹${(amountPaise / 100).toFixed(2)}`;

    await Activity.create({
      groupId,
      actor: req.user._id,
      actionType: status === 'completed' ? 'SETTLEMENT_COMPLETED' : 'SETTLEMENT_CREATED',
      resourceId: settlement._id,
      message: `${populated.paidBy.name} paid ${populated.paidTo.name} ${formattedAmount} (${status})`,
      metadata: {
        amountPaise,
        status,
      },
    });

    res.status(201).json({
      success: true,
      message: `Settlement of ${formattedAmount} recorded successfully`,
      data: { settlement: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupSettlements = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const settlements = await Settlement.find({ groupId })
      .populate('paidBy', 'name email avatar')
      .populate('paidTo', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: settlements.length,
      data: { settlements },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettlementStatus = async (req, res, next) => {
  try {
    const { settlementId } = req.params;
    const { status } = req.body;

    const settlement = await Settlement.findById(settlementId)
      .populate('paidBy', 'name email avatar')
      .populate('paidTo', 'name email avatar');

    if (!settlement) {
      return next(new AppError('Settlement record not found', 404));
    }

    settlement.status = status;
    if (status === 'completed' && !settlement.completedAt) {
      settlement.completedAt = new Date();
    }
    await settlement.save();

    await Activity.create({
      groupId: settlement.groupId,
      actor: req.user._id,
      actionType: status === 'completed' ? 'SETTLEMENT_COMPLETED' : 'SETTLEMENT_CANCELLED',
      resourceId: settlement._id,
      message: `${req.user.name} marked settlement of ₹${(settlement.amountPaise / 100).toFixed(2)} between ${settlement.paidBy.name} and ${settlement.paidTo.name} as ${status}`,
    });

    res.status(200).json({
      success: true,
      message: `Settlement status updated to ${status}`,
      data: { settlement },
    });
  } catch (error) {
    next(error);
  }
};
