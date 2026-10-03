// Usage: npm run create-superadmin
// Optional non-interactive mode: SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD env vars.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const readline = require('readline');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));

const main = async () => {
  await connectDB();

  const name = process.env.SUPERADMIN_NAME || (await ask('Name: '));
  const email = (process.env.SUPERADMIN_EMAIL || (await ask('Email: '))).toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || (await ask('Password (min 8 chars): '));

  if (!name || !email || password.length < 8) {
    throw new Error('Name, email and a password of at least 8 characters are required');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role === 'superadmin') throw new Error('A super admin with this email already exists');
    const answer = process.env.SUPERADMIN_PASSWORD ? 'n' : await ask('User exists. Promote to superadmin? (y/N): ');
    if (answer.toLowerCase() !== 'y') throw new Error('Cancelled');
    existing.role = 'superadmin';
    await existing.save();
    console.log(`Promoted ${email} to superadmin.`);
    return;
  }

  await User.create({ name, email, password, role: 'superadmin' });
  console.log(`Super admin created: ${email}`);
};

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await mongoose.disconnect();
  });
