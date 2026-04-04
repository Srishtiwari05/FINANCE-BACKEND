import mongoose from 'mongoose';
import { env } from './env';
import { User } from '../models/user.model';
import { FinancialEntry } from '../models/entry.model';
import { hashPassword } from '../utils/password';

const SEED_USERS = [
  { name: 'Super Admin',   email: env.seed.adminEmail,       password: env.seed.adminPassword, role: 'admin'   as const },
  { name: 'Alice Analyst', email: 'analyst@finance.com',     password: 'Analyst@123',          role: 'analyst' as const },
  { name: 'Victor Viewer', email: 'viewer@finance.com',      password: 'Viewer@123',           role: 'viewer'  as const },
];

const CATEGORIES = ['Operations', 'Marketing', 'Sales', 'HR', 'Technology', 'Finance', 'Legal'];
const ENTRY_TYPES = ['income', 'expense', 'transfer'] as const;

const randomItem = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randomAmount = () => parseFloat((Math.random() * 9900 + 100).toFixed(2));
const randomDate = () => {
  const start = new Date('2024-01-01');
  const end   = new Date('2024-12-31');
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const seed = async () => {
  await mongoose.connect(env.mongoUri);
  console.log('🌱 Connected to MongoDB — starting seed...');

  // Clear existing data
  await User.deleteMany({});
  await FinancialEntry.deleteMany({});
  console.log('🗑️  Cleared existing users and entries');

  // Create users
  const createdUsers: InstanceType<typeof User>[] = [];
  for (const u of SEED_USERS) {
    const passwordHash = await hashPassword(u.password);
    const user = await User.create({ name: u.name, email: u.email, passwordHash, role: u.role });
    createdUsers.push(user);
    console.log(`👤 Created ${u.role}: ${u.email} / ${u.password}`);
  }

  // Create 40 sample financial entries
  const adminUser  = createdUsers[0]!;
  const analystUser = createdUsers[1]!;
  const entryData  = [];

  for (let i = 0; i < 40; i++) {
    const type = randomItem(ENTRY_TYPES);
    entryData.push({
      title:     `${randomItem(CATEGORIES)} ${type} #${i + 1}`,
      amount:    randomAmount(),
      type,
      category:  randomItem(CATEGORIES),
      date:      randomDate(),
      notes:     `Seeded entry ${i + 1} for testing`,
      tags:      [type, randomItem(CATEGORIES).toLowerCase()],
      createdBy: i % 3 === 0 ? analystUser._id : adminUser._id,
      updatedBy: adminUser._id,
    });
  }

  await FinancialEntry.insertMany(entryData);
  console.log(`📊 Created 40 sample financial entries`);

  console.log('\n✅ Seed complete!\n');
  console.log('──────────────────────────────────────────');
  console.log('Login credentials:');
  SEED_USERS.forEach(u => console.log(`  ${u.role.padEnd(8)} → ${u.email} / ${u.password}`));
  console.log('──────────────────────────────────────────');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
