import Group from '../models/Group.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import Expense from '../models/Expense.js';
import { AppError } from '../middleware/errorHandler.js';

export const createGroup = async (req, res, next) => {
  try {
    const { name, description, members, budgetPaise = 0 } = req.body;

    const initialMembers = [
      {
        user: req.user._id,
        role: 'owner',
        joinedAt: new Date(),
      },
    ];

    // If additional member IDs/emails are provided
    if (members && Array.isArray(members)) {
      for (const item of members) {
        // Can be an email or an ObjectId string
        let userToAdd = null;
        if (item.includes && item.includes('@')) {
          userToAdd = await User.findOne({ email: item.toLowerCase().trim() });
        } else {
          userToAdd = await User.findById(item);
        }

        if (userToAdd && userToAdd._id.toString() !== req.user._id.toString()) {
          const alreadyAdded = initialMembers.some(
            (m) => m.user.toString() === userToAdd._id.toString()
          );
          if (!alreadyAdded) {
            initialMembers.push({
              user: userToAdd._id,
              role: 'member',
              joinedAt: new Date(),
            });
          }
        }
      }
    }

    const group = await Group.create({
      name,
      description: description || '',
      owner: req.user._id,
      members: initialMembers,
      budgetPaise: budgetPaise || 0,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    // Log Activity
    await Activity.create({
      groupId: group._id,
      actor: req.user._id,
      actionType: 'GROUP_CREATED',
      resourceId: group._id,
      message: `${req.user.name} created the group "${name}"`,
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: { group: populatedGroup },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ 'members.user': req.user._id })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ updatedAt: -1 });

    const groupIds = groups.map((g) => g._id);
    const spentStats = await Expense.aggregate([
      { $match: { groupId: { $in: groupIds } } },
      { $group: { _id: '$groupId', totalSpentPaise: { $sum: '$amountPaise' } } },
    ]);

    const spentMap = new Map();
    spentStats.forEach((s) => spentMap.set(s._id.toString(), s.totalSpentPaise));

    const enrichedGroups = groups.map((g) => {
      const gObj = g.toObject();
      const totalSpentPaise = spentMap.get(g._id.toString()) || 0;
      const budgetPaise = gObj.budgetPaise || 0;
      const remainingBudgetPaise = Math.max(0, budgetPaise - totalSpentPaise);
      const budgetUsedPercentage = budgetPaise > 0
        ? Math.round((totalSpentPaise / budgetPaise) * 100 * 10) / 10
        : 0;

      return {
        ...gObj,
        totalSpentPaise,
        remainingBudgetPaise,
        budgetUsedPercentage,
        isWarning: budgetPaise > 0 && budgetUsedPercentage >= 80 && budgetUsedPercentage <= 100,
        isExceeded: budgetPaise > 0 && totalSpentPaise > budgetPaise,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedGroups.length,
      data: { groups: enrichedGroups },
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req, res, next) => {
  try {
    const group = req.group;
    const expenses = await Expense.find({ groupId: group._id });
    const totalSpentPaise = expenses.reduce((sum, e) => sum + e.amountPaise, 0);
    const budgetPaise = group.budgetPaise || 0;
    const remainingBudgetPaise = Math.max(0, budgetPaise - totalSpentPaise);
    const budgetUsedPercentage = budgetPaise > 0
      ? Math.round((totalSpentPaise / budgetPaise) * 100 * 10) / 10
      : 0;
    const isWarning = budgetPaise > 0 && budgetUsedPercentage >= 80 && budgetUsedPercentage <= 100;
    const isExceeded = budgetPaise > 0 && totalSpentPaise > budgetPaise;

    res.status(200).json({
      success: true,
      data: {
        group,
        userRole: req.groupRole,
        budget: {
          budgetPaise,
          totalSpentPaise,
          remainingBudgetPaise,
          budgetUsedPercentage,
          isWarning,
          isExceeded,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const setGroupBudget = async (req, res, next) => {
  try {
    const { budgetPaise } = req.body;
    const group = req.group;

    group.budgetPaise = budgetPaise;
    await group.save();

    await Activity.create({
      groupId: group._id,
      actor: req.user._id,
      actionType: 'GROUP_UPDATED',
      resourceId: group._id,
      message: `${req.user.name} set group budget to ₹${(budgetPaise / 100).toLocaleString('en-IN')}`,
    });

    const expenses = await Expense.find({ groupId: group._id });
    const totalSpentPaise = expenses.reduce((sum, e) => sum + e.amountPaise, 0);
    const remainingBudgetPaise = Math.max(0, budgetPaise - totalSpentPaise);
    const budgetUsedPercentage = budgetPaise > 0
      ? Math.round((totalSpentPaise / budgetPaise) * 100 * 10) / 10
      : 0;
    const isWarning = budgetPaise > 0 && budgetUsedPercentage >= 80 && budgetUsedPercentage <= 100;
    const isExceeded = budgetPaise > 0 && totalSpentPaise > budgetPaise;

    res.status(200).json({
      success: true,
      message: 'Group budget updated successfully',
      data: {
        group,
        budget: {
          budgetPaise,
          totalSpentPaise,
          remainingBudgetPaise,
          budgetUsedPercentage,
          isWarning,
          isExceeded,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { name, description, budgetPaise } = req.body;
    const group = req.group;

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (budgetPaise !== undefined) group.budgetPaise = budgetPaise;

    await group.save();

    await Activity.create({
      groupId: group._id,
      actor: req.user._id,
      actionType: 'GROUP_UPDATED',
      resourceId: group._id,
      message: `${req.user.name} updated group details`,
    });

    res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: { group },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req, res, next) => {
  try {
    const group = req.group;
    await Group.findByIdAndDelete(group._id);

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { email, role = 'member' } = req.body;
    const group = req.group;

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return next(new AppError(`No registered user found with email: ${email}`, 404));
    }

    const isAlreadyMember = group.members.some(
      (m) => m.user._id.toString() === userToAdd._id.toString()
    );

    if (isAlreadyMember) {
      return next(new AppError('User is already a member of this group', 400));
    }

    group.members.push({
      user: userToAdd._id,
      role: role || 'member',
      joinedAt: new Date(),
    });

    await group.save();

    await Activity.create({
      groupId: group._id,
      actor: req.user._id,
      actionType: 'MEMBER_ADDED',
      resourceId: userToAdd._id,
      message: `${req.user.name} added ${userToAdd.name} (${userToAdd.email}) to the group`,
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: `${userToAdd.name} added to group successfully`,
      data: { group: updatedGroup },
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const group = req.group;

    if (group.owner._id.toString() === userId) {
      return next(new AppError('Group owner cannot be removed. Transfer ownership or delete the group.', 400));
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user._id.toString() === userId
    );

    if (memberIndex === -1) {
      return next(new AppError('Member not found in this group', 404));
    }

    const removedMemberName = group.members[memberIndex].user.name || 'Member';
    group.members.splice(memberIndex, 1);
    await group.save();

    await Activity.create({
      groupId: group._id,
      actor: req.user._id,
      actionType: 'MEMBER_REMOVED',
      resourceId: userId,
      message: `${req.user.name} removed ${removedMemberName} from the group`,
    });

    const updatedGroup = await Group.findById(group._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
      data: { group: updatedGroup },
    });
  } catch (error) {
    next(error);
  }
};

export const leaveGroup = async (req, res, next) => {
  try {
    const group = req.group;
    const userId = req.user._id.toString();

    if (group.owner._id.toString() === userId) {
      return next(new AppError('As the owner, you cannot leave the group. You can delete the group instead.', 400));
    }

    const memberIndex = group.members.findIndex(
      (m) => m.user._id.toString() === userId
    );

    if (memberIndex === -1) {
      return next(new AppError('You are not a member of this group', 400));
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    await Activity.create({
      groupId: group._id,
      actor: req.user._id,
      actionType: 'MEMBER_LEFT',
      resourceId: req.user._id,
      message: `${req.user.name} left the group`,
    });

    res.status(200).json({
      success: true,
      message: 'You have left the group successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getGroupActivity = async (req, res, next) => {
  try {
    const activities = await Activity.find({ groupId: req.params.groupId })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: { activities },
    });
  } catch (error) {
    next(error);
  }
};
