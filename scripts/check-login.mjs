// Usage: node scripts/check-login.mjs
// Asks for your admin email and password (hidden) and checks them against ADMIN_EMAIL and
// ADMIN_PASSWORD_HASH in .env.local. Nothing is printed except pass/fail.
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

const clean = (v) => (v ?? '').trim().replace(/^["']+|["']+$/g, '').trim();

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    }
    rl.question(question, (answer) => { rl.close(); if (hidden) console.log(); resolve(answer); });
  });
}

const email = (await ask('Admin email: ')).trim().toLowerCase();
const password = await ask('Password (hidden): ', true);

const envEmail = clean(process.env.ADMIN_EMAIL).toLowerCase();
const hash = clean(process.env.ADMIN_PASSWORD_HASH);

console.log('\nADMIN_EMAIL set:', !!envEmail, '| email matches:', email === envEmail);
console.log('ADMIN_PASSWORD_HASH set:', !!hash, '| length:', hash.length, '(expected 60)');
console.log('hash ends with:', hash ? '…' + hash.slice(-6) : '-', '(compare with the value in Vercel)');
console.log('password matches hash:', hash ? await bcrypt.compare(password, hash) : false);
