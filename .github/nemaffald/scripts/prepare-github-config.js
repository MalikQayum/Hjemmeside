import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configDir = path.join(root, 'config');
const settingsSource = path.join(configDir, 'settings.github.json');
const settingsTarget = path.join(configDir, 'settings.json');
const contactTarget = path.join(configDir, 'contact.json');

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`NEMAFFALD_CONTACT_JSON is missing ${label}.`);
  }
  return value.trim();
}

async function main() {
  await mkdir(configDir, { recursive: true });

  const settings = JSON.parse(await readFile(settingsSource, 'utf8'));
  if (settings.property?.lookupValue !== 'Vigerslevvej 148') {
    throw new Error('GitHub settings do not target the expected property.');
  }
  if (settings.weekly?.timezone !== 'Europe/Copenhagen' || settings.weekly?.scheduleTime !== '04:00') {
    throw new Error('GitHub settings must use Friday at 04:00 Europe/Copenhagen.');
  }
  await writeFile(settingsTarget, `${JSON.stringify(settings, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });

  const raw = process.env.NEMAFFALD_CONTACT_JSON;
  if (!raw) {
    throw new Error('Missing repository secret NEMAFFALD_CONTACT_JSON. Add the JSON contents of your local config/contact.json as an encrypted Actions secret.');
  }

  let contact;
  try {
    contact = JSON.parse(raw);
  } catch {
    throw new Error('NEMAFFALD_CONTACT_JSON is not valid JSON. The secret value must contain the contents of config/contact.json.');
  }

  const validated = {
    firstName: requireString(contact.firstName, 'firstName'),
    lastName: requireString(contact.lastName, 'lastName'),
    email: requireString(contact.email, 'email'),
    phone: requireString(contact.phone, 'phone'),
    isWasteResponsible: contact.isWasteResponsible === true,
    rememberMe: contact.rememberMe === true
  };

  if (!validated.isWasteResponsible) {
    throw new Error('The contact secret must explicitly confirm isWasteResponsible: true. Only set this if the person is authorized as the waste-responsible contact.');
  }
  if (!validated.rememberMe) {
    throw new Error('The contact secret must explicitly confirm rememberMe: true. Only set this if the person consented to the six-month remember option.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validated.email)) {
    throw new Error('The email address in NEMAFFALD_CONTACT_JSON does not appear valid.');
  }
  if (validated.phone.replace(/\D/g, '').length < 8) {
    throw new Error('The phone number in NEMAFFALD_CONTACT_JSON does not appear valid.');
  }

  await writeFile(contactTarget, `${JSON.stringify(validated, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  console.log('GitHub runtime configuration prepared. Contact values were validated and were not printed.');
}

main().catch((error) => {
  console.error(`GitHub configuration setup failed: ${error.message}`);
  process.exitCode = 1;
});
