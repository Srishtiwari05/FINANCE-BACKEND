import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { FinancialEntry } from '../src/models/entry.model';

const BASE = '/api/v1/entries';
const AUTH = '/api/v1/auth';

let adminToken: string;
let analystToken: string;
let viewerToken: string;
let analystId: string;

const registerAndLogin = async (role: string) => {
  const email = `${role}test@example.com`;
  const password = 'Password1';
  await request(app).post(`${AUTH}/register`).send({ name: `${role} User`, email, password });

  // Promote to correct role if needed
  if (role !== 'viewer') {
    await User.findOneAndUpdate({ email }, { role });
  }

  const loginRes = await request(app).post(`${AUTH}/login`).send({ email, password });
  return {
    token: loginRes.body.data.tokens.accessToken,
    userId: loginRes.body.data.user._id,
  };
};

const validEntry = {
  title: 'Test Office Supplies',
  amount: 250.00,
  type: 'expense',
  category: 'Operations',
  date: '2024-06-15',
  notes: 'Monthly supplies',
  tags: ['office', 'monthly'],
};

beforeAll(async () => {
  await User.deleteMany({});
  await FinancialEntry.deleteMany({});

  const admin   = await registerAndLogin('admin');
  const analyst = await registerAndLogin('analyst');
  const viewer  = await registerAndLogin('viewer');

  adminToken   = admin.token;
  analystToken = analyst.token;
  viewerToken  = viewer.token;
  analystId    = analyst.userId;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /entries — Create', () => {
  it('analyst can create an entry', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${analystToken}`)
      .send(validEntry);
    expect(res.status).toBe(201);
    expect(res.body.data.entry.amount).toBe(250);
    expect(res.body.data.entry.type).toBe('expense');
  });

  it('admin can create an entry', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEntry, title: 'Admin Entry', type: 'income', amount: 5000 });
    expect(res.status).toBe(201);
  });

  it('viewer cannot create an entry (403)', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(validEntry);
    expect(res.status).toBe(403);
  });

  it('rejects negative amount', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ ...validEntry, amount: -100 });
    expect(res.status).toBe(422);
  });

  it('rejects invalid type', async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ ...validEntry, type: 'invalid' });
    expect(res.status).toBe(422);
  });

  it('rejects unauthenticated request', async () => {
    const res = await request(app).post(BASE).send(validEntry);
    expect(res.status).toBe(401);
  });
});

describe('GET /entries — List', () => {
  it('analyst can list all entries', async () => {
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toBeDefined();
  });

  it('viewer only sees own entries', async () => {
    // Create an entry as the viewer... viewers can't, so list should be empty for viewer
    const res = await request(app)
      .get(BASE)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0); // viewer hasn't created any
  });

  it('supports type filter', async () => {
    const res = await request(app)
      .get(`${BASE}?type=expense`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    res.body.data.forEach((e: { type: string }) => expect(e.type).toBe('expense'));
  });

  it('supports pagination', async () => {
    const res = await request(app)
      .get(`${BASE}?page=1&limit=1`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    expect(res.body.pagination.limit).toBe(1);
  });
});

describe('PATCH /entries/:id — Update', () => {
  let entryId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ ...validEntry, title: 'Entry to Update' });
    entryId = res.body.data.entry._id;
  });

  it('analyst can update own entry', async () => {
    const res = await request(app)
      .patch(`${BASE}/${entryId}`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ title: 'Updated Title', amount: 300 });
    expect(res.status).toBe(200);
    expect(res.body.data.entry.title).toBe('Updated Title');
  });

  it('viewer cannot update entries (403)', async () => {
    const res = await request(app)
      .patch(`${BASE}/${entryId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Viewer Update' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent entry', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`${BASE}/${fakeId}`)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ title: 'Ghost' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /entries/:id — Soft Delete', () => {
  let entryId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEntry, title: 'Entry to Delete' });
    entryId = res.body.data.entry._id;
  });

  it('admin can soft-delete an entry', async () => {
    const res = await request(app)
      .delete(`${BASE}/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    // Deleted entry should not appear in listing
    const listRes = await request(app)
      .get(`${BASE}/${entryId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(404);
  });

  it('analyst cannot delete entries (403)', async () => {
    const createRes = await request(app)
      .post(BASE)
      .set('Authorization', `Bearer ${analystToken}`)
      .send({ ...validEntry, title: 'Should Survive' });
    const id = createRes.body.data.entry._id;

    const res = await request(app)
      .delete(`${BASE}/${id}`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(403);
  });
});
