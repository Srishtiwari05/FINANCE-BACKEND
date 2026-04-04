import dotenv from 'dotenv';
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  port: parseInt(process.env['PORT'] || '3000', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  mongoUri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/finance_db',
  jwt: {
    accessSecret: process.env['JWT_ACCESS_SECRET'] || 'access_secret_dev',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || 'refresh_secret_dev',
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  seed: {
    adminEmail: process.env['SEED_ADMIN_EMAIL'] || 'admin@finance.com',
    adminPassword: process.env['SEED_ADMIN_PASSWORD'] || 'Admin@123',
  },
};
