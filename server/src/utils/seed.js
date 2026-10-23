import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Group from '../models/Group.js';
import Expense from '../models/Expense.js';
import Settlement from '../models/Settlement.js';
import Activity from '../models/Activity.js';
import { calculateEqualShares } from '../services/balanceService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splitsmart';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected.');

    // Check if main user already exists
    const existing = await User.findOne({ email: 'jon@splitsmart.com' });
    if (existing) {
      console.log('[Seed] Demo data already exists. Skipping seed to prevent duplicate or overwritten data.');
      process.exit(0);
    }

    console.log('[Seed] Seeding realistic demo users and groups...');

    const pwdHash = await User.hashPassword('password123');

    // 1. Create Users
    const users = await User.create([
      {
        name: 'Jon',
        email: 'jon@splitsmart.com',
        passwordHash: pwdHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Aditi Verma',
        email: 'aditi@splitsmart.com',
        passwordHash: pwdHash,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Rahul Sharma',
        email: 'rahul@splitsmart.com',
        passwordHash: pwdHash,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Karan Patel',
        email: 'karan@splitsmart.com',
        passwordHash: pwdHash,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Priya Singh',
        email: 'priya@splitsmart.com',
        passwordHash: pwdHash,
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
      },
    ]);

    const [jon, aditi, rahul, karan, priya] = users;

    // 2. Create Groups
    const group1 = await Group.create({
      name: 'Goa Weekend Getaway',
      description: 'Flight tickets, beach villa, water sports, and food',
      owner: jon._id,
      members: [
        { user: jon._id, role: 'owner' },
        { user: aditi._id, role: 'member' },
        { user: rahul._id, role: 'member' },
        { user: karan._id, role: 'member' },
      ],
    });

    const group2 = await Group.create({
      name: 'Flat 402 Roommates',
      description: 'Monthly flat rent, groceries, high-speed WiFi, and utilities',
      owner: aditi._id,
      members: [
        { user: aditi._id, role: 'owner' },
        { user: jon._id, role: 'member' },
        { user: priya._id, role: 'member' },
      ],
    });

    const group3 = await Group.create({
      name: 'College Capstone Project',
      description: 'Cloud hosting, domain registration, API tokens, and printing',
      owner: rahul._id,
      members: [
        { user: rahul._id, role: 'owner' },
        { user: jon._id, role: 'member' },
        { user: karan._id, role: 'member' },
      ],
    });

    const group4 = await Group.create({
      name: 'Weekend Dinners & Socials',
      description: 'Casual dinners, cafe runs, and weekend outings',
      owner: jon._id,
      members: [
        { user: jon._id, role: 'owner' },
        { user: aditi._id, role: 'member' },
        { user: rahul._id, role: 'member' },
        { user: priya._id, role: 'member' },
      ],
    });

    // 3. Create Expenses
    // Expense 1: Villa Booking in Goa (₹32,000 paid by Jon, equal among 4)
    await Expense.create({
      groupId: group1._id,
      description: 'Luxury Sea-view Villa (3 nights)',
      amountPaise: 3200000,
      paidBy: jon._id,
      splitType: 'EQUAL',
      category: 'Accommodation',
      notes: 'Paid via credit card booking confirmation #GOA9821',
      expenseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      participants: calculateEqualShares(3200000, [jon._id, aditi._id, rahul._id, karan._id]),
    });

    // Expense 2: Seafood Dinner (₹8,400 paid by Aditi, equal among 4)
    await Expense.create({
      groupId: group1._id,
      description: 'Fisherman’s Wharf Dinner & Drinks',
      amountPaise: 840000,
      paidBy: aditi._id,
      splitType: 'EQUAL',
      category: 'Food',
      expenseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      participants: calculateEqualShares(840000, [jon._id, aditi._id, rahul._id, karan._id]),
    });

    // Expense 3: Car Rental & Fuel (₹6,000 paid by Rahul, equal among 4)
    await Expense.create({
      groupId: group1._id,
      description: 'Thar Self-Drive Car Rental + Petrol',
      amountPaise: 600000,
      paidBy: rahul._id,
      splitType: 'EQUAL',
      category: 'Travel',
      expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      participants: calculateEqualShares(600000, [jon._id, aditi._id, rahul._id, karan._id]),
    });

    // Expense 4: Monthly Rent in Flat 402 (₹45,000 paid by Jon, custom split)
    await Expense.create({
      groupId: group2._id,
      description: 'October Apartment Rent',
      amountPaise: 4500000,
      paidBy: jon._id,
      splitType: 'CUSTOM',
      category: 'Rent',
      expenseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      participants: [
        { user: jon._id, sharePaise: 1600000 }, // Master bedroom ₹16,000
        { user: aditi._id, sharePaise: 1500000 }, // Balcony room ₹15,000
        { user: priya._id, sharePaise: 1400000 }, // Standard room ₹14,000
      ],
    });

    // Expense 5: Groceries Nature's Basket (₹4,250 paid by Aditi, equal among 3)
    await Expense.create({
      groupId: group2._id,
      description: 'Bi-weekly Organic Groceries & Supplies',
      amountPaise: 425000,
      paidBy: aditi._id,
      splitType: 'EQUAL',
      category: 'Groceries',
      expenseDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      participants: calculateEqualShares(425000, [jon._id, aditi._id, priya._id]),
    });

    // Expense 6: Cloud Server Hosting & Domain (₹3,500 paid by Rahul, equal among 3)
    await Expense.create({
      groupId: group3._id,
      description: 'AWS Cloud EC2 & Domain Name',
      amountPaise: 350000,
      paidBy: rahul._id,
      splitType: 'EQUAL',
      category: 'Utilities',
      expenseDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      participants: calculateEqualShares(350000, [rahul._id, jon._id, karan._id]),
    });

    // 4. Create Settlements
    // Rahul pays Jon ₹5,000 via UPI (completed)
    await Settlement.create({
      groupId: group1._id,
      paidBy: rahul._id,
      paidTo: jon._id,
      amountPaise: 500000,
      status: 'completed',
      note: 'UPI transfer for Goa Villa share',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // Priya pays Jon ₹10,000 via NEFT (completed)
    await Settlement.create({
      groupId: group2._id,
      paidBy: priya._id,
      paidTo: jon._id,
      amountPaise: 1000000,
      status: 'completed',
      note: 'Part payment for October rent',
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    // Karan to Jon ₹4,000 (pending)
    await Settlement.create({
      groupId: group1._id,
      paidBy: karan._id,
      paidTo: jon._id,
      amountPaise: 400000,
      status: 'pending',
      note: 'Will settle by Friday salary day',
    });

    // 5. Create Activity Logs
    await Activity.create([
      {
        groupId: group1._id,
        actor: jon._id,
        actionType: 'GROUP_CREATED',
        message: 'Jon created the group "Goa Weekend Getaway"',
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        groupId: group1._id,
        actor: jon._id,
        actionType: 'EXPENSE_CREATED',
        message: 'Jon added expense "Luxury Sea-view Villa (3 nights)" for ₹32,000.00',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        groupId: group1._id,
        actor: aditi._id,
        actionType: 'EXPENSE_CREATED',
        message: 'Aditi Verma added expense "Fisherman’s Wharf Dinner & Drinks" for ₹8,400.00',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        groupId: group1._id,
        actor: rahul._id,
        actionType: 'SETTLEMENT_COMPLETED',
        message: 'Rahul Sharma paid Jon ₹5,000.00 (completed)',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('✅ [Seed] Database seeded successfully!');
    console.log('👉 Default Login:');
    console.log('   Email:    jon@splitsmart.com');
    console.log('   Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
