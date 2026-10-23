import express from 'express';
import { getDashboardOverview, getGroupAnalytics } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireGroupMember, validateObjectId } from '../middleware/authorize.js';

const router = express.Router();
router.use(authenticate);

// Global user dashboard analytics overview
router.get('/overview', getDashboardOverview);

// Specific group analytics
router.get('/groups/:groupId', validateObjectId('groupId'), requireGroupMember, getGroupAnalytics);

export default router;
