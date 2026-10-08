// Usage: node scripts/hash-password.mjs
// Asks for the new admin password (hidden, typed twice) so the shell can never alter it,
// then prints ADMIN_PASSWORD_HASH for Vercel and for .env.local.
import readline from 'node:readline';
import bcrypt from 'bcryptjs';

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (answer) => { rl.close(); console.log(); resolve(answer); });
  });
}

const pw = process.argv[2] ?? (await askHidden('New admin password (min 12 characters): '));
if (!pw || pw.length < 12) {
  console.error('The password must be at least 12 characters.');
  process.exit(1);
}
if (process.argv[2] === undefined) {
  const again = await askHidden('Type it again to confirm: ');
  if (again !== pw) {
    console.error('The two passwords did not match. Nothing was created.');
    process.exit(1);
  }
}

const hash = await bcrypt.hash(pw, 12);
console.log('Length:', hash.length, '(must be 60)  Starts with:', hash.slice(0, 7), '(must be $2b$12$)');
console.log('\n--- 1) VERCEL: paste ONLY the part after the = sign, no quotes, no backslashes ---');
console.log('ADMIN_PASSWORD_HASH=' + hash);
console.log('\n--- 2) .env.local: paste this line exactly as shown, no quotes added ---');
console.log('ADMIN_PASSWORD_HASH=' + hash.replace(/\$/g, '\\$'));
