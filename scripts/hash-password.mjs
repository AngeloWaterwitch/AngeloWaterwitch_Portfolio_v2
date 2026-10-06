// Usage: node scripts/hash-password.mjs "your-new-password"
// Put the output in ADMIN_PASSWORD_HASH (local .env.local AND your Vercel env vars),
// then delete ADMIN_PASSWORD.
import bcrypt from 'bcryptjs';

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error('Provide a password of at least 12 characters: node scripts/hash-password.mjs "<password>"');
  process.exit(1);
}
const hash = await bcrypt.hash(pw, 12);
console.log('Hosting (Vercel) env var, paste as-is:');
console.log('ADMIN_PASSWORD_HASH=' + hash);
console.log('\n.env.local, with $ escaped so dotenv does not expand it:');
console.log('ADMIN_PASSWORD_HASH=' + hash.replace(/\$/g, '\\$'));