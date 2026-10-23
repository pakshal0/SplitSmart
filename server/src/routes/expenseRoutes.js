import express from 'express';
import {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  scanReceipt,
} from '../controllers/expenseController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireGroupMember, validateObjectId } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createExpenseSchema } from '../utils/validators.js';
import { receiptUpload } from '../middleware/upload.js';

// Router for /api/v1/groups/:groupId/expenses
export const groupExpenseRouter = express.Router({ mergeParams: true });
groupExpenseRouter.use(authenticate);
groupExpenseRouter.use(validateObjectId('groupId'), requireGroupMember);

groupExpenseRouter.post('/', validate(createExpenseSchema), createExpense);
groupExpenseRouter.get('/', getGroupExpenses);

// Standalone router for /api/v1/expenses/:expenseId
export const singleExpenseRouter = express.Router();
singleExpenseRouter.use(authenticate);

// Receipt Scanning OCR endpoint
singleExpenseRouter.post('/scan-receipt', receiptUpload.single('receipt'), scanReceipt);

singleExpenseRouter.get('/:expenseId', validateObjectId('expenseId'), getExpenseById);
singleExpenseRouter.patch('/:expenseId', validateObjectId('expenseId'), updateExpense);
singleExpenseRouter.delete('/:expenseId', validateObjectId('expenseId'), deleteExpense);
