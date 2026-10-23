import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Group from '../src/models/Group.js';
import Expense from '../src/models/Expense.js';
import Settlement from '../src/models/Settlement.js';
import {
  calculateEqualShares,
  calculatePercentageShares,
  validateCustomShares,
  simplifyDebts,
} from '../src/services/balanceService.js';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/splitsmart_test';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Group.deleteMany({});
  await Expense.deleteMany({});
  await Settlement.deleteMany({});
});

describe('Split Calculation Unit Tests', () => {
  it('calculateEqualShares: should divide 1000 paise among 3 participants deterministically', () => {
    const userIds = ['userA', 'userB', 'userC'];
    const shares = calculateEqualShares(1000, userIds);

    expect(shares.length).toBe(3);
    const sum = shares.reduce((acc, s) => acc + s.sharePaise, 0);
    expect(sum).toBe(1000); // Exactly 1000 paise (₹10.00)

    // 1000 / 3 = 333 with remainder 1. Exactly one participant gets 334, two get 333.
    const sortedShares = shares.map((s) => s.sharePaise).sort();
    expect(sortedShares).toEqual([333, 333, 334]);
  });

  it('calculatePercentageShares: should correctly distribute shares based on percentages', () => {
    const percentages = {
      userA: 50,
      userB: 30,
      userC: 20,
    };
    const shares = calculatePercentageShares(200000, percentages); // ₹2,000.00 (200,000 paise)

    const sum = shares.reduce((acc, s) => acc + s.sharePaise, 0);
    expect(sum).toBe(200000);

    const shareA = shares.find((s) => s.user === 'userA').sharePaise;
    const shareB = shares.find((s) => s.user === 'userB').sharePaise;
    const shareC = shares.find((s) => s.user === 'userC').sharePaise;

    expect(shareA).toBe(100000); // 50% = ₹1000
    expect(shareB).toBe(60000);  // 30% = ₹600
    expect(shareC).toBe(40000);  // 20% = ₹400
  });

  it('calculatePercentageShares: should reject if percentages do not sum to 100', () => {
    expect(() => {
      calculatePercentageShares(10000, { userA: 40, userB: 40 });
    }).toThrow(/must total exactly 100%/);
  });

  it('validateCustomShares: should reject if custom shares do not equal total', () => {
    expect(() => {
      validateCustomShares(100000, [
        { user: 'u1', sharePaise: 50000 },
        { user: 'u2', sharePaise: 40000 },
      ]);
    }).toThrow(/must exactly match/);
  });

  it('simplifyDebts: should simplify circular debts correctly', () => {
    // Rahul owes Aditi ₹500 (50,000 paise), Karan owes Aditi ₹250 (25,000 paise)
    const balances = [
      { userId: 'aditi', name: 'Aditi', netBalancePaise: 75000 },
      { userId: 'rahul', name: 'Rahul', netBalancePaise: -50000 },
      { userId: 'karan', name: 'Karan', netBalancePaise: -25000 },
    ];

    const suggestions = simplifyDebts(balances);
    expect(suggestions.length).toBe(2);

    expect(suggestions[0].from.name).toBe('Rahul');
    expect(suggestions[0].to.name).toBe('Aditi');
    expect(suggestions[0].amountPaise).toBe(50000);

    expect(suggestions[1].from.name).toBe('Karan');
    expect(suggestions[1].to.name).toBe('Aditi');
    expect(suggestions[1].amountPaise).toBe(25000);
  });
});

describe('Expenses, Balances, and Settlements End-to-End API', () => {
  let userA, userB, userC, tokenA, tokenB, group;

  beforeEach(async () => {
    // Create 3 users
    const rA = await request(app).post('/api/v1/auth/register').send({
      name: 'Aditi',
      email: 'aditi@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    userA = rA.body.data.user;
    tokenA = rA.body.data.token;

    const rB = await request(app).post('/api/v1/auth/register').send({
      name: 'Rahul',
      email: 'rahul@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    userB = rB.body.data.user;
    tokenB = rB.body.data.token;

    const rC = await request(app).post('/api/v1/auth/register').send({
      name: 'Karan',
      email: 'karan@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    userC = rC.body.data.user;

    // Create group with Aditi as owner and add Rahul and Karan
    const gRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Goa Holiday',
        members: [userB.id, userC.id],
      });
    group = gRes.body.data.group;
  });

  it('Scenario from prompt: A pays ₹900 equally shared among A, B, and C', async () => {
    // 1. Add ₹900 expense (90,000 paise)
    const expRes = await request(app)
      .post(`/api/v1/groups/${group._id}/expenses`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        description: 'Seafood Beach Dinner',
        amountPaise: 90000,
        paidBy: userA.id,
        splitType: 'EQUAL',
        category: 'Food',
        participants: [{ userId: userA.id }, { userId: userB.id }, { userId: userC.id }],
      });

    expect(expRes.status).toBe(201);
    expect(expRes.body.data.expense.participants.length).toBe(3);

    // 2. Fetch Group Balances
    const balRes = await request(app)
      .get(`/api/v1/groups/${group._id}/balances`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(balRes.status).toBe(200);
    const balances = balRes.body.data.balances;

    const balA = balances.find((b) => b.userId === userA.id);
    const balB = balances.find((b) => b.userId === userB.id);
    const balC = balances.find((b) => b.userId === userC.id);

    // Expected balances: A: +₹600 (+60,000 paise), B: -₹300 (-30,000 paise), C: -₹300 (-30,000 paise)
    expect(balA.netBalancePaise).toBe(60000);
    expect(balB.netBalancePaise).toBe(-30000);
    expect(balC.netBalancePaise).toBe(-30000);

    // Sum of net balances MUST be 0
    const netSum = balances.reduce((sum, b) => sum + b.netBalancePaise, 0);
    expect(netSum).toBe(0);

    // 3. Check settlement suggestions: Rahul pays Aditi ₹300, Karan pays Aditi ₹300
    const sugRes = await request(app)
      .get(`/api/v1/groups/${group._id}/settlement-suggestions`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(sugRes.status).toBe(200);
    expect(sugRes.body.data.suggestions.length).toBe(2);

    // 4. Record Rahul settling ₹300 with Aditi
    const settleRes = await request(app)
      .post(`/api/v1/groups/${group._id}/settlements`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        paidBy: userB.id,
        paidTo: userA.id,
        amountPaise: 30000,
        note: 'UPI payment for Goa dinner',
      });

    expect(settleRes.status).toBe(201);

    // 5. Re-check balances: Rahul should now be settled (net 0), Aditi should be +₹300, Karan -₹300
    const updatedBalRes = await request(app)
      .get(`/api/v1/groups/${group._id}/balances`)
      .set('Authorization', `Bearer ${tokenA}`);

    const newBalances = updatedBalRes.body.data.balances;
    const newBalA = newBalances.find((b) => b.userId === userA.id);
    const newBalB = newBalances.find((b) => b.userId === userB.id);
    const newBalC = newBalances.find((b) => b.userId === userC.id);

    expect(newBalB.netBalancePaise).toBe(0);
    expect(newBalA.netBalancePaise).toBe(30000);
    expect(newBalC.netBalancePaise).toBe(-30000);
  });

  it('Pending settlements do not affect balances', async () => {
    // Add ₹600 expense paid by Aditi shared between Aditi and Rahul
    await request(app)
      .post(`/api/v1/groups/${group._id}/expenses`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        description: 'Taxi',
        amountPaise: 60000,
        paidBy: userA.id,
        splitType: 'EQUAL',
        category: 'Travel',
        participants: [{ userId: userA.id }, { userId: userB.id }],
      });

    // Create a PENDING settlement
    await request(app)
      .post(`/api/v1/groups/${group._id}/settlements`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        paidBy: userB.id,
        paidTo: userA.id,
        amountPaise: 30000,
        status: 'pending',
      });

    const balRes = await request(app)
      .get(`/api/v1/groups/${group._id}/balances`)
      .set('Authorization', `Bearer ${tokenA}`);

    const balB = balRes.body.data.balances.find((b) => b.userId === userB.id);
    // Balance should STILL be -30000 paise because pending settlements do not apply
    expect(balB.netBalancePaise).toBe(-30000);
  });
});
