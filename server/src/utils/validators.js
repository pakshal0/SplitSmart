import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(50, 'Group name cannot exceed 50 characters').trim(),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional().default(''),
  members: z.array(z.string()).optional(),
  budgetPaise: z.number().int().min(0, 'Budget must be non-negative integer paise').optional().default(0),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(50, 'Group name cannot exceed 50 characters').trim().optional(),
  description: z.string().max(200, 'Description cannot exceed 200 characters').optional(),
  budgetPaise: z.number().int().min(0, 'Budget must be non-negative integer paise').optional(),
});

export const setBudgetSchema = z.object({
  budgetPaise: z.number().int().min(0, 'Budget must be non-negative integer paise'),
});

export const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid user email address').toLowerCase().trim(),
  role: z.enum(['owner', 'member']).optional().default('member'),
});

export const expenseParticipantSchema = z.object({
  userId: z.string().min(1, 'Participant user ID is required'),
  sharePaise: z.number().int().min(0, 'Share amount must be non-negative integer paise').optional(),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(100, 'Description cannot exceed 100 characters').trim(),
  amountPaise: z.number().int().positive('Total amount must be a positive integer in paise'),
  paidBy: z.string().min(1, 'Payer user ID is required'),
  splitType: z.enum(['EQUAL', 'CUSTOM', 'PERCENTAGE']),
  category: z.enum(['Food', 'Travel', 'Accommodation', 'Shopping', 'Entertainment', 'Groceries', 'Rent', 'Utilities', 'Other']).default('Other'),
  notes: z.string().max(300, 'Notes cannot exceed 300 characters').optional().default(''),
  expenseDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  participants: z.array(expenseParticipantSchema).min(1, 'At least one participant is required'),
  percentageShares: z.record(z.string(), z.number()).optional(), // Optional client map for percentage split validation
});

export const createSettlementSchema = z.object({
  paidBy: z.string().min(1, 'Payer user ID is required'),
  paidTo: z.string().min(1, 'Recipient user ID is required'),
  amountPaise: z.number().int().positive('Settlement amount must be positive integer paise'),
  note: z.string().max(200, 'Note cannot exceed 200 characters').optional().default(''),
  status: z.enum(['pending', 'completed', 'cancelled']).optional().default('completed'),
});

export const updateSettlementStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']),
});
