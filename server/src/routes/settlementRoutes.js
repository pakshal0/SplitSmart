import express from 'express';
import {
  createSettlement,
  getGroupSettlements,
  updateSettlementStatus,
} from '../controllers/settlementController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireGroupMember, validateObjectId } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createSettlementSchema, updateSettlementStatusSchema } from '../utils/validators.js';

// Router for /api/v1/groups/:groupId/settlements
export const groupSettlementRouter = express.Router({ mergeParams: true });
groupSettlementRouter.use(authenticate);
groupSettlementRouter.use(validateObjectId('groupId'), requireGroupMember);

groupSettlementRouter.post('/', validate(createSettlementSchema), createSettlement);
groupSettlementRouter.get('/', getGroupSettlements);

// Standalone router for /api/v1/settlements/:settlementId
export const singleSettlementRouter = express.Router();
singleSettlementRouter.use(authenticate);

singleSettlementRouter.patch(
  '/:settlementId',
  validateObjectId('settlementId'),
  validate(updateSettlementStatusSchema),
  updateSettlementStatus
);
