import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { User } from '../src/models/user.model';

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

const BASE = '/api/v1/auth';

const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password1',
};

describe('POST /auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post(`${BASE}/register`).send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
    expect(res.body.data.user.role).toBe('viewer');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email', async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
    const res = await request(app).post(`${BASE}/register`).send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects weak password', async () => {
    const res = await request(app).post(`${BASE}/register`).send({ ...validUser, password: 'weak' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects missing email', async () => {
    const res = await request(app).post(`${BASE}/register`).send({ name: 'Test', password: 'Password1' });
    expect(res.status).toBe(422);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post(`${BASE}/register`).send({ ...validUser, email: 'not-an-email' });
    expect(res.status).toBe(422);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${BASE}/register`).send(validUser);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: validUser.email,
      password: validUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: validUser.email,
      password: 'WrongPass1',
    });
    expect(res.status).toBe(401);
  });

  it('rejects non-existent email', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email: 'ghost@example.com',
      password: 'Password1',
    });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/refresh', () => {
  it('issues new tokens with valid refresh token', async () => {
    const reg = await request(app).post(`${BASE}/register`).send(validUser);
    const { refreshToken } = reg.body.data.tokens;

    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.tokens).toHaveProperty('accessToken');
  });

  it('rejects invalid refresh token', async () => {
    const res = await request(app).post(`${BASE}/refresh`).send({ refreshToken: 'bad.token.here' });
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('logs out successfully', async () => {
    const reg = await request(app).post(`${BASE}/register`).send(validUser);
    const { accessToken } = reg.body.data.tokens;

    const res = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  it('rejects logout without token', async () => {
    const res = await request(app).post(`${BASE}/logout`);
    expect(res.status).toBe(401);
  });
});
