import mongoose from 'mongoose';
import Group from '../models/Group.js';
import { AppError } from './errorHandler.js';

export const validateObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError(`Invalid ID parameter: ${paramName}`, 400));
  }
  next();
};

export const requireGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.groupId;
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return next(new AppError('Invalid group ID format', 400));
    }

    const group = await Group.findById(groupId)
      .populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar');

    if (!group) {
      return next(new AppError('Group not found', 404));
    }

    const membership = group.members.find(
      (m) => m.user && m.user._id.toString() === req.user._id.toString()
    );

    if (!membership) {
      return next(new AppError('You are not authorized to access this group', 403));
    }

    req.group = group;
    req.groupRole = membership.role;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireGroupOwner = async (req, res, next) => {
  try {
    // If requireGroupMember already ran, req.group is set
    if (req.group) {
      if (req.group.owner._id.toString() !== req.user._id.toString() && req.groupRole !== 'owner') {
        return next(new AppError('Only the group owner can perform this action', 403));
      }
      return next();
    }

    const groupId = req.params.groupId;
    const group = await Group.findById(groupId);
    if (!group) {
      return next(new AppError('Group not found', 404));
    }

    if (group.owner.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the group owner can perform this action', 403));
    }

    req.group = group;
    next();
  } catch (error) {
    next(error);
  }
};
