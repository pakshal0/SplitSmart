import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  leaveGroup,
  getGroupActivity,
  setGroupBudget,
} from '../controllers/groupController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireGroupMember, requireGroupOwner, validateObjectId } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createGroupSchema, updateGroupSchema, addMemberSchema, setBudgetSchema } from '../utils/validators.js';

const router = express.Router();

// All group routes require authentication
router.use(authenticate);

router.post('/', validate(createGroupSchema), createGroup);
router.get('/', getMyGroups);

router.get('/:groupId', validateObjectId('groupId'), requireGroupMember, getGroupById);
router.patch(
  '/:groupId',
  validateObjectId('groupId'),
  requireGroupMember,
  requireGroupOwner,
  validate(updateGroupSchema),
  updateGroup
);
router.patch(
  '/:groupId/budget',
  validateObjectId('groupId'),
  requireGroupMember,
  validate(setBudgetSchema),
  setGroupBudget
);
router.delete(
  '/:groupId',
  validateObjectId('groupId'),
  requireGroupMember,
  requireGroupOwner,
  deleteGroup
);

router.post(
  '/:groupId/members',
  validateObjectId('groupId'),
  requireGroupMember,
  requireGroupOwner,
  validate(addMemberSchema),
  addMember
);
router.delete(
  '/:groupId/members/:userId',
  validateObjectId('groupId'),
  validateObjectId('userId'),
  requireGroupMember,
  requireGroupOwner,
  removeMember
);
router.post(
  '/:groupId/leave',
  validateObjectId('groupId'),
  requireGroupMember,
  leaveGroup
);

router.get(
  '/:groupId/activity',
  validateObjectId('groupId'),
  requireGroupMember,
  getGroupActivity
);

export default router;
