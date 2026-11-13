import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ask,
  artifactsDir,
  closeContext,
  inspectPage,
  launchPortal
} from './browser.js';

let context;

function printInspection(inspection, label) {
  console.log(`\nCaptured ${label}: ${inspection.pageTitle}`);
  try {
    console.log(`Path: ${new URL(inspection.pageUrl).pathname}`);
  } catch {
    console.log(`URL: ${inspection.pageUrl}`);
  }
  for (const frame of inspection.frames || []) {
    for (const heading of frame.headings || []) {
      console.log(`  Heading: ${heading}`);
    }
    for (const control of frame.controls || []) {
      if (control.text || control.title || control.ariaLabel || control.labels?.length) {
        const labelText = control.text || control.title || control.ariaLabel || control.labels.join(' / ');
        const safeId = control.id ? `#${control.id}` : '';
        const safeClass = control.className ? `.${control.className}` : '';
        console.log(`  ${control.tag}${safeId}${safeClass}: ${labelText}`);
      }
    }
    if (frame.visibleText) {
      console.log('  Visible page text (redacted):');
      for (const line of frame.visibleText.split('\n').slice(0, 24)) {
        console.log(`    ${line}`);
      }
    }
  }
}

async function capture(page, step) {
  const inspection = await inspectPage(page);
  return {
    step,
    capturedAt: inspection.capturedAt,
    pageTitle: inspection.pageTitle,
    pageUrl: inspection.pageUrl,
    frameCount: inspection.frameCount,
    frames: inspection.frames
  };
}

async function main() {
  const { context: browserContext, page } = await launchPortal({
    portalUrl: 'https://nemaffaldsservice.kk.dk/'
  });
  context = browserContext;

  const steps = [];
  console.log('\nNemAffald route inspector v0.7.3');
  console.log('The browser starts at the official front page.');
  console.log('IMPORTANT: The initial front page is now captured automatically as step 0.');
  console.log('Sign in and proceed through the normal menus one step at a time.');
  console.log('After each navigation, return here and press Enter to record that page.');
  console.log('Type DONE when you have captured the Haveaffald form for VIGERSLEVVEJ 148.');
  console.log('The report records redacted visible text and control metadata, never input values, cookies or session data.');

  const initial = await capture(page, 0);
  steps.push(initial);
  printInspection(initial, 'initial page (step 0)');

  for (;;) {
    const answer = await ask(`\nAfter navigating to the next page, press Enter to capture it (or type DONE to finish): `);
    if (answer.toUpperCase() === 'DONE') break;

    const current = await capture(page, steps.length);
    steps.push(current);
    printInspection(current, `step ${current.step}`);
  }

  const outputPath = path.join(artifactsDir, 'navigation-inspection.json');
  await writeFile(outputPath, `${JSON.stringify({
    capturedAt: new Date().toISOString(),
    inspectorVersion: '0.7.3',
    pageCount: steps.length,
    steps,
    note: 'Redacted visible text and control metadata only. No input values, typed form data, cookies or session information are recorded. Review for personal information before sharing.'
  }, null, 2)}\n`, 'utf8');

  console.log(`\nSaved ${steps.length} navigation page(s) to ${path.relative(process.cwd(), outputPath)}.`);
  console.log('The initial front page is included as step 0.');
  console.log('Review the report for personal information before sharing it.');
}

try {
  await main();
} catch (error) {
  console.error(`\nRoute inspection failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await closeContext(context);
}
