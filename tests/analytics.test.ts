import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { FinancialEntry } from '../src/models/entry.model';

const ANALYTICS = '/api/v1/analytics';
const AUTH = '/api/v1/auth';
const ENTRIES = '/api/v1/entries';

let adminToken: string;
let viewerToken: string;

const registerAndLogin = async (role: string) => {
  const email = `analytics_${role}@example.com`;
  await request(app).post(`${AUTH}/register`).send({ name: `${role}`, email, password: 'Password1' });
  if (role !== 'viewer') await User.findOneAndUpdate({ email }, { role });
  const res = await request(app).post(`${AUTH}/login`).send({ email, password: 'Password1' });
  return res.body.data.tokens.accessToken as string;
};

const seedEntries = async (token: string) => {
  const entries = [
    { title: 'Salary', amount: 5000, type: 'income', category: 'HR', date: '2024-03-01' },
    { title: 'Rent', amount: 1500, type: 'expense', category: 'Operations', date: '2024-03-05' },
    { title: 'Freelance', amount: 2000, type: 'income', category: 'Sales', date: '2024-03-10' },
    { title: 'Utilities', amount: 300, type: 'expense', category: 'Operations', date: '2024-04-01' },
    { title: 'Fund Transfer', amount: 1000, type: 'transfer', category: 'Finance', date: '2024-04-15' },
  ];
  for (const e of entries) {
    await request(app).post(ENTRIES).set('Authorization', `Bearer ${token}`).send(e);
  }
};

beforeAll(async () => {
  await User.deleteMany({});
  await FinancialEntry.deleteMany({});
  adminToken  = await registerAndLogin('admin');
  viewerToken = await registerAndLogin('viewer');
  await seedEntries(adminToken);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('GET /analytics/summary', () => {
  it('returns income, expense, net balance', async () => {
    const res = await request(app)
      .get(`${ANALYTICS}/summary`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const { summary } = res.body.data;
    expect(summary).toHaveProperty('income');
    expect(summary).toHaveProperty('expense');
    expect(summary).toHaveProperty('netBalance');
    expect(summary).toHaveProperty('totalEntries');
    expect(summary.income).toBe(7000);
    expect(summary.expense).toBe(1800);
    expect(summary.netBalance).toBe(5200);
  });

  it('viewer can access summary', async () => {
    const res = await request(app)
      .get(`${ANALYTICS}/summary`)
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
  });

  it('filters by date range', async () => {
    const res = await request(app)
      .get(`${ANALYTICS}/summary?from=2024-03-01&to=2024-03-31`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const { summary } = res.body.data;
    expect(summary.income).toBe(7000);  // Salary + Freelance
    expect(summary.expense).toBe(1500); // Rent only
  });
});

describe('GET /analytics/by-category', () => {
  it('returns category breakdown', async () => {
    const res = await request(app)
      .get(`${ANALYTICS}/by-category`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.breakdown).toBeInstanceOf(Array);
    expect(res.body.data.breakdown.length).toBeGreaterThan(0);
    const categories = res.body.data.breakdown.map((b: { category: string }) => b.category);
    expect(categories).toContain('Operations');
  });
});

describe('GET /analytics/by-period', () => {
  it('returns monthly trends by default', async () => {
    const res = await request(app)
      .get(`${ANALYTICS}/by-period`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.trends).toBeInstanceOf(Array);
    expect(res.body.data.period).toBe('monthly');
  });

  it('returns weekly breakdown when period=weekly', async () => {
    const res = await request(app)
      .get(`${ANALYTICS}/by-period?period=weekly`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.period).toBe('weekly');
  });
});

describe('GET /analytics/recent', () => {
  it('returns recent entries', async () => {
    const res = await request(app)
      .get(`${ANALYTICS}/recent?limit=3`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.entries.length).toBeLessThanOrEqual(3);
  });
});
