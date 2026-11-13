import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const target = path.join(root, 'config', 'contact.json');
const rl = readline.createInterface({ input, output });

try {
  console.log('NemAffald – local waste-responsible contact setup');
  console.log('Your details are saved locally in config/contact.json and are not included in the project ZIP.');
  const firstName = (await rl.question('First name: ')).trim();
  const lastName = (await rl.question('Last name: ')).trim();
  const email = (await rl.question('Email address: ')).trim();
  const phone = (await rl.question('Mobile number: ')).trim();
  if (!firstName || !lastName || !email || !phone) throw new Error('All four fields are required.');

  const responsible = (await rl.question('Are you authorized as the waste-responsible person for this property? Type YES to confirm: ')).trim();
  if (responsible !== 'YES') throw new Error('Authorization was not confirmed. No contact profile was saved.');
  const remember = (await rl.question('Do you consent to NemAffald remembering this computer for six months? Type YES to confirm: ')).trim();
  if (remember !== 'YES') throw new Error('Six-month remember consent was not confirmed. No contact profile was saved.');

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify({ firstName, lastName, email, phone, isWasteResponsible: true, rememberMe: true, savedAt: new Date().toISOString() }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  console.log('\nContact profile saved locally to config/contact.json.');
  console.log('Keep this file private; it contains personal contact details.');
} catch (error) {
  console.error(`\nContact setup not completed: ${error.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
