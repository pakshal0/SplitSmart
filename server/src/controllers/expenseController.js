import Expense from '../models/Expense.js';
import Activity from '../models/Activity.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  calculateEqualShares,
  calculatePercentageShares,
  validateCustomShares,
} from '../services/balanceService.js';
import { createWorker } from 'tesseract.js';
import { parseReceiptText } from '../services/receiptParser.js';

export const scanReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No receipt image uploaded. Please upload a receipt file.', 400));
    }

    let rawText = '';
    let worker = null;
    try {
      worker = await createWorker('eng');
      const ret = await worker.recognize(req.file.buffer);
      rawText = ret.data.text || '';
    } catch (ocrErr) {
      console.error('[OCR Recognition Error]', ocrErr);
      return next(
        new AppError(
          'Failed to process receipt image. Please ensure the image is clear and under 5MB.',
          500
        )
      );
    } finally {
      if (worker) {
        await worker.terminate().catch(() => {});
      }
    }

    const parsed = parseReceiptText(rawText);

    res.status(200).json({
      success: true,
      message: 'Receipt scanned successfully',
      data: parsed,
    });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const {
      description,
      amountPaise,
      paidBy,
      splitType,
      category = 'Other',
      notes = '',
      expenseDate,
      participants,
      percentageShares,
    } = req.body;

    const group = req.group; // From requireGroupMember middleware

    // Validate payer is a member of the group
    const isPayerMember = group.members.some(
      (m) => m.user._id.toString() === paidBy.toString()
    );
    if (!isPayerMember) {
      return next(new AppError('The selected payer is not a member of this group', 400));
    }

    // Process participant shares according to splitType
    let processedParticipants = [];

    if (splitType === 'EQUAL') {
      const participantIds = participants.map((p) => (p.userId || p.user || p).toString());
      processedParticipants = calculateEqualShares(amountPaise, participantIds);
    } else if (splitType === 'PERCENTAGE') {
      if (!percentageShares) {
        return next(new AppError('Percentage breakdown is required for percentage split', 400));
      }
      processedParticipants = calculatePercentageShares(amountPaise, percentageShares);
    } else if (splitType === 'CUSTOM') {
      validateCustomShares(amountPaise, participants);
      processedParticipants = participants.map((p) => ({
        user: p.userId || p.user,
        sharePaise: p.sharePaise,
      }));
    } else {
      return next(new AppError(`Invalid split type: ${splitType}`, 400));
    }

    // Ensure all participants belong to the group
    for (const p of processedParticipants) {
      const isMember = group.members.some(
        (m) => m.user._id.toString() === p.user.toString()
      );
      if (!isMember) {
        return next(
          new AppError(`Participant ${p.user} is not a member of this group`, 400)
        );
      }
    }

    // Verify sum of shares equals total amount down to the exact paise
    const sumShares = processedParticipants.reduce((sum, p) => sum + p.sharePaise, 0);
    if (sumShares !== amountPaise) {
      return next(
        new AppError(
          `Sum of shares (₹${(sumShares / 100).toFixed(2)}) does not match total amount (₹${(amountPaise / 100).toFixed(2)})`,
          400
        )
      );
    }

    const expense = await Expense.create({
      groupId,
      description,
      amountPaise,
      paidBy,
      participants: processedParticipants,
      splitType,
      category,
      notes,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    // Record Activity
    await Activity.create({
      groupId,
      actor: req.user._id,
      actionType: 'EXPENSE_CREATED',
      resourceId: expense._id,
      message: `${req.user.name} added expense "${description}" for ₹${(amountPaise / 100).toFixed(2)}`,
      metadata: {
        amountPaise,
        category,
        splitType,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: { expense: populatedExpense },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupExpenses = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { category, search, startDate, endDate, sort = 'date_desc', page = 1, limit = 50 } = req.query;

    const filter = { groupId };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.description = { $regex: search.trim(), $options: 'i' };
    }

    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    // Sorting
    let sortOptions = { expenseDate: -1, createdAt: -1 };
    if (sort === 'date_asc') sortOptions = { expenseDate: 1, createdAt: 1 };
    if (sort === 'amount_desc') sortOptions = { amountPaise: -1 };
    if (sort === 'amount_asc') sortOptions = { amountPaise: 1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [expenses, totalCount] = await Promise.all([
      Expense.find(filter)
        .populate('paidBy', 'name email avatar')
        .populate('participants.user', 'name email avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Expense.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        expenses,
        pagination: {
          total: totalCount,
          page: Number(page),
          pages: Math.ceil(totalCount / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId)
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    if (!expense) {
      return next(new AppError('Expense not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return next(new AppError('Expense not found', 404));
    }

    const {
      description,
      amountPaise,
      paidBy,
      splitType,
      category,
      notes,
      expenseDate,
      participants,
      percentageShares,
    } = req.body;

    if (description) expense.description = description;
    if (category) expense.category = category;
    if (notes !== undefined) expense.notes = notes;
    if (expenseDate) expense.expenseDate = new Date(expenseDate);
    if (paidBy) expense.paidBy = paidBy;

    // If amount or participants changed, recompute shares
    if (amountPaise || participants || splitType) {
      const newAmount = amountPaise || expense.amountPaise;
      const newSplit = splitType || expense.splitType;
      let newParticipants = participants || expense.participants;

      if (newSplit === 'EQUAL') {
        const participantIds = newParticipants.map((p) => (p.userId || p.user || p).toString());
        expense.participants = calculateEqualShares(newAmount, participantIds);
      } else if (newSplit === 'PERCENTAGE' && percentageShares) {
        expense.participants = calculatePercentageShares(newAmount, percentageShares);
      } else if (newSplit === 'CUSTOM' && participants) {
        validateCustomShares(newAmount, participants);
        expense.participants = participants.map((p) => ({
          user: p.userId || p.user,
          sharePaise: p.sharePaise,
        }));
      }

      expense.amountPaise = newAmount;
      expense.splitType = newSplit;
    }

    await expense.save();

    await Activity.create({
      groupId: expense.groupId,
      actor: req.user._id,
      actionType: 'EXPENSE_UPDATED',
      resourceId: expense._id,
      message: `${req.user.name} updated expense "${expense.description}"`,
    });

    const updatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('participants.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense: updatedExpense },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return next(new AppError('Expense not found', 404));
    }

    await Expense.findByIdAndDelete(expenseId);

    await Activity.create({
      groupId: expense.groupId,
      actor: req.user._id,
      actionType: 'EXPENSE_DELETED',
      resourceId: expense._id,
      message: `${req.user.name} deleted expense "${expense.description}" (₹${(expense.amountPaise / 100).toFixed(2)})`,
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
