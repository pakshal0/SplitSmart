import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Group from '../src/models/Group.js';

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
});

describe('Group Management API', () => {
  let user1Token, user1, user2Token, user2, user3;

  beforeEach(async () => {
    // Create user 1 (Owner)
    const res1 = await request(app).post('/api/v1/auth/register').send({
      name: 'Aditi Verma',
      email: 'aditi@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    user1Token = res1.body.data.token;
    user1 = res1.body.data.user;

    // Create user 2 (Member)
    const res2 = await request(app).post('/api/v1/auth/register').send({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    user2Token = res2.body.data.token;
    user2 = res2.body.data.user;

    // Create user 3 (External)
    const res3 = await request(app).post('/api/v1/auth/register').send({
      name: 'Karan Patel',
      email: 'karan@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    user3 = res3.body.data.user;
  });

  it('POST /api/v1/groups should create group with creator as owner', async () => {
    const res = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Goa Trip 2026',
        description: 'Expenses for weekend trip to Goa',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.group.name).toBe('Goa Trip 2026');
    expect(res.body.data.group.owner._id.toString()).toBe(user1.id);
    expect(res.body.data.group.members.length).toBe(1);
    expect(res.body.data.group.members[0].role).toBe('owner');
  });

  it('GET /api/v1/groups should list groups user is a member of', async () => {
    // User 1 creates group
    await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Goa Trip' });

    // User 1 listing groups
    const res1 = await request(app)
      .get('/api/v1/groups')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res1.status).toBe(200);
    expect(res1.body.count).toBe(1);

    // User 2 listing groups (should be 0)
    const res2 = await request(app)
      .get('/api/v1/groups')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.count).toBe(0);
  });

  it('GET /api/v1/groups/:groupId should reject unauthorized non-member', async () => {
    const createRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Private Group' });

    const groupId = createRes.body.data.group._id;

    // User 2 is not a member yet
    const res = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/groups/:groupId/members should allow owner to add member', async () => {
    const createRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Flat 402 Roommates' });

    const groupId = createRes.body.data.group._id;

    const addRes = await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: 'rahul@example.com' });

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.group.members.length).toBe(2);

    // Now User 2 can access group
    const viewRes = await request(app)
      .get(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(viewRes.status).toBe(200);
    expect(viewRes.body.data.userRole).toBe('member');
  });

  it('PATCH /api/v1/groups/:groupId should allow owner but reject non-owner edit', async () => {
    const createRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Old Name' });

    const groupId = createRes.body.data.group._id;

    // Add user 2
    await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: 'rahul@example.com' });

    // User 2 tries to rename group (forbidden)
    const failRes = await request(app)
      .patch(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ name: 'Hacked Name' });

    expect(failRes.status).toBe(403);

    // User 1 renames group (success)
    const successRes = await request(app)
      .patch(`/api/v1/groups/${groupId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'New Goa Trip' });

    expect(successRes.status).toBe(200);
    expect(successRes.body.data.group.name).toBe('New Goa Trip');
  });

  it('DELETE /api/v1/groups/:groupId/members/:userId should remove member', async () => {
    const createRes = await request(app)
      .post('/api/v1/groups')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Team Dinner' });

    const groupId = createRes.body.data.group._id;

    // Add user 2
    await request(app)
      .post(`/api/v1/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: 'rahul@example.com' });

    // Remove user 2
    const removeRes = await request(app)
      .delete(`/api/v1/groups/${groupId}/members/${user2.id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.group.members.length).toBe(1);
  });
});
