import mongoose from 'mongoose';

const MONGO_TEST_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/finance_test_db';

export default async function setup() {
  process.env['NODE_ENV'] = 'test';
  process.env['MONGODB_URI'] = MONGO_TEST_URI;
  process.env['JWT_ACCESS_SECRET'] = 'test_access_secret';
  process.env['JWT_REFRESH_SECRET'] = 'test_refresh_secret';
  process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
  process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';

  await mongoose.connect(MONGO_TEST_URI);
}
