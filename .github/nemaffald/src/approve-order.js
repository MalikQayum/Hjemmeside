import { writeFile } from 'node:fs/promises';
import {
  ask,
  artifactsDir,
  closeContext,
  launchPortal,
  loadSettings
} from './browser.js';

let context;
let approvalAttempted = false;

const normalize = (value) => String(value || '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLocaleLowerCase('da-DK');

async function visibleElementCount(locator) {
  return locator.evaluateAll((elements) => elements.filter((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' &&
      rect.width > 0 && rect.height > 0;
  }).length);
}

async function waitForBasket(page) {
  console.log('\nThe browser is open.');
  console.log('Sign in if necessary and navigate to Kurv / Basket.');
  console.log('Do not click GODKEND yourself; this script will do that only after a separate confirmation.');
  await ask('When the basket page is visible, press Enter here... ');

  const current = new URL(page.url());
  if (
    current.hostname !== 'nemaffaldsservice.kk.dk' ||
    current.pathname !== '/Basket/Overview'
  ) {
    throw new Error(
      `Expected NemAffald basket page /Basket/Overview, but found ${current.pathname}. No order was approved.`
    );
  }
}

async function verifyBasket(page, order) {
  const bodyText = await page.locator('body').innerText({ timeout: 10000 });
  const normalizedBody = normalize(bodyText);

  const requiredDetails = [
    ['collection type', order.expectedBasketText || 'Haveaffald'],
    ['service description', order.expectedServiceDescription || 'Tømning af materiel'],
    ['standplads', order.expectedSite || 'VIGERSLEVVEJ 148'],
    ['equipment', order.expectedEquipment || '240 l Havebeholder']
  ];

  for (const [label, expected] of requiredDetails) {
    if (!normalizedBody.includes(normalize(expected))) {
      throw new Error(
        `Basket verification failed: expected ${label} "${expected}" was not found. No order was approved.`
      );
    }
  }

  const itemCount = await visibleElementCount(page.locator('a.deleteLineButton'));
  if (itemCount !== 1) {
    throw new Error(
      `Expected exactly one visible basket line item, but found ${itemCount}. This script only approves the single Haveaffald order. No order was approved.`
    );
  }

  const totalMatch = bodyText.match(/\bTOTAL\s*(DKK\s*[\d.,]+)/i);
  if (!totalMatch) {
    throw new Error('Could not read the basket total. No order was approved.');
  }

  const totalText = totalMatch[1].replace(/\s+/g, ' ').trim();
  const expectedTotal = order.expectedTotal || 'DKK 0,00';
  if (normalize(totalText) !== normalize(expectedTotal)) {
    throw new Error(
      `Basket total is ${totalText}, but the configured expected total is ${expectedTotal}. Review the basket and update the configuration only if this amount is correct. No order was approved.`
    );
  }

  const terms = page.locator('#TermsOfDeliveryChecked');
  if (await terms.count() !== 1) {
    throw new Error('Could not uniquely identify the delivery-terms checkbox. No order was approved.');
  }
  if (!(await terms.isEnabled())) {
    throw new Error('The delivery-terms checkbox is disabled. No order was approved.');
  }

  const submit = page.locator('#submitButton');
  if (await submit.count() !== 1) {
    throw new Error('Could not uniquely identify the GODKEND control (#submitButton). No order was approved.');
  }

  const submitText = normalize(await submit.innerText().catch(() => ''));
  if (submitText !== 'godkend' || !(await submit.isVisible()) || !(await submit.isEnabled())) {
    throw new Error('The final control is not a visible, enabled GODKEND link. No order was approved.');
  }

  const submitUrl = await submit.getAttribute('href');
  if (!submitUrl || new URL(submitUrl, page.url()).pathname !== '/Basket/Overview') {
    throw new Error('The GODKEND control does not match the inspected basket action. No order was approved.');
  }

  const termsLabel = page.locator('label[for="TermsOfDeliveryChecked"]');
  const termsLabelVisible = await termsLabel.count() > 0 && await termsLabel.first().isVisible().catch(() => false);

  return {
    itemCount,
    totalText,
    terms,
    termsLabel,
    termsLabelVisible,
    submit,
    bodyText
  };
}

async function checkDeliveryTerms(terms, termsLabel, termsLabelVisible) {
  if (!(await terms.isChecked())) {
    if (await terms.isVisible().catch(() => false)) {
      await terms.check({ timeout: 10000 });
    } else if (termsLabelVisible) {
      await termsLabel.first().click({ timeout: 10000 });
    } else {
      throw new Error('The delivery-terms checkbox is not interactable. The order was not approved.');
    }
  }

  if (!(await terms.isChecked())) {
    throw new Error('Could not verify that delivery terms were accepted. GODKEND was not clicked.');
  }
}

async function captureResult(page, details, resultStatus, errorMessage = null) {
  const result = {
    capturedAt: new Date().toISOString(),
    status: resultStatus,
    order: {
      collectionType: details.collectionType,
      serviceDescription: details.serviceDescription,
      standplads: details.standplads,
      equipment: details.equipment,
      itemCount: details.itemCount,
      total: details.totalText
    },
    approvalAttempted,
    finalPageTitle: await page.title().catch(() => ''),
    finalPagePath: (() => {
      try { return new URL(page.url()).pathname; }
      catch { return 'unavailable'; }
    })(),
    error: errorMessage
  };

  await writeFile(
    `${artifactsDir}/approval-result.json`,
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8'
  );
  return result;
}

async function verifySubmissionOutcome(page, beforePath) {
  // Do not retry the click if the outcome is unclear; the request may already
  // have reached the municipality even when the browser reports a timeout.
  await page.waitForTimeout(6000);

  const afterPath = (() => {
    try { return new URL(page.url()).pathname; }
    catch { return ''; }
  })();
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const successText = /(?:tak for din bestilling|bestilling(?:en)? (?:er )?(?:modtaget|sendt|gennemført|oprettet)|ordre(?:n)? (?:er )?(?:modtaget|oprettet)|kvittering)/i.test(bodyText);

  const remainingItems = afterPath === '/Basket/Overview'
    ? await visibleElementCount(page.locator('a.deleteLineButton')).catch(() => -1)
    : 0;
  const submitStillVisible = afterPath === '/Basket/Overview'
    ? await page.locator('#submitButton').isVisible().catch(() => false)
    : false;

  if (successText || (afterPath !== beforePath && remainingItems === 0) ||
      (afterPath === '/Basket/Overview' && remainingItems === 0 && !submitStillVisible)) {
    return { verified: true, afterPath };
  }

  return { verified: false, afterPath };
}

async function main() {
  const settings = await loadSettings();
  const order = settings.order || {};
  const submission = settings.submission || {};

  if (submission.enabled === false) {
    console.log('Note: The existing submission.enabled setting is false.');
    console.log('This command uses its own explicit, typed confirmation and still checks the configured basket safeguards.');
  }

  const { context: browserContext, page } = await launchPortal(settings);
  context = browserContext;

  await waitForBasket(page);

  const verified = await verifyBasket(page, order);
  const details = {
    collectionType: order.expectedBasketText || 'Haveaffald',
    serviceDescription: order.expectedServiceDescription || 'Tømning af materiel',
    standplads: order.expectedSite || 'VIGERSLEVVEJ 148',
    equipment: order.expectedEquipment || '240 l Havebeholder',
    itemCount: verified.itemCount,
    totalText: verified.totalText
  };

  console.log('\nVerified basket contents:');
  console.log(`  Collection: ${details.collectionType}`);
  console.log(`  Service: ${details.serviceDescription}`);
  console.log(`  Standplads: ${details.standplads}`);
  console.log(`  Equipment: ${details.equipment}`);
  console.log(`  Basket items: ${details.itemCount}`);
  console.log(`  Total: ${details.totalText}`);
  console.log('\nThe script will:');
  console.log('  1. Accept the delivery terms checkbox.');
  console.log('  2. Click GODKEND exactly once.');
  console.log('  3. Check the resulting page for a confirmation.');
  console.log('\nThis sends the order to Københavns Kommune.');

  const phrase = submission.confirmationPhrase || 'APPROVE NEMAFFALD ORDER';
  const confirmation = await ask(`\nTo submit this exact order, type exactly "${phrase}": `);
  if (confirmation !== phrase) {
    console.log('Confirmation did not match. No checkbox was changed and no order was submitted.');
    await ask('Press Enter to close the browser... ');
    return;
  }

  await checkDeliveryTerms(verified.terms, verified.termsLabel, verified.termsLabelVisible);
  console.log('Delivery terms accepted and checkbox state verified.');

  const beforePath = new URL(page.url()).pathname;
  approvalAttempted = true;
  try {
    await verified.submit.click({ timeout: 15000 });
  } catch (error) {
    console.error(`The approval click returned an error: ${error.message}`);
    console.error('The order may still have reached the municipality. Do not run approval again until you have checked the portal or your email.');
  }

  const outcome = await verifySubmissionOutcome(page, beforePath);
  const status = outcome.verified ? 'submitted_and_confirmation_observed' : 'approval_attempted_outcome_unconfirmed';
  await captureResult(page, details, status);

  if (outcome.verified) {
    console.log('\nThe portal shows a post-submission confirmation or an emptied basket.');
    console.log('Please review the browser and any confirmation message/email for the municipality\'s requested-date response.');
  } else {
    console.log('\nThe approval action was attempted, but the script could not independently verify the final outcome.');
    console.log('DO NOT run the approval command again yet. Check the portal basket and your email for a confirmation first.');
  }

  await ask('\nPress Enter to close the browser... ');
}

try {
  await main();
} catch (error) {
  console.error(`\nApproval stopped safely: ${error.message}`);
  if (context) {
    await ask('No approval was completed by this script. Press Enter to close the browser... ').catch(() => {});
  }
  process.exitCode = 1;
} finally {
  await closeContext(context);
}
