import express from 'express';
import { getGroupBalances, getSettlementSuggestions } from '../controllers/balanceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireGroupMember, validateObjectId } from '../middleware/authorize.js';

const router = express.Router({ mergeParams: true });
router.use(authenticate);
router.use(validateObjectId('groupId'), requireGroupMember);

router.get('/balances', getGroupBalances);
router.get('/settlement-suggestions', getSettlementSuggestions);

export default router;
