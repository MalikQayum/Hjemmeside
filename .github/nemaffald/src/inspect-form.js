import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  artifactsDir,
  closeContext,
  inspectPage,
  launchPortal,
  loadSettings,
  waitForUserToReachForm
} from './browser.js';

let context;

try {
  const settings = await loadSettings();
  const launched = await launchPortal(settings);
  context = launched.context;
  const { page } = launched;

  await waitForUserToReachForm();

  // Allow a short pause for page transitions/late-rendered portal widgets.
  await page.waitForTimeout(1500);
  const report = await inspectPage(page);

  await mkdir(artifactsDir, { recursive: true });
  const outputPath = path.join(artifactsDir, 'form-inspection.json');
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const totalControls = report.frames.reduce(
    (count, frame) => count + (frame.controls?.length || 0), 0
  );

  console.log(`\nSaved page inspection to: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Page: ${report.pageTitle}`);
  console.log(`Frames inspected: ${report.frameCount}`);
  console.log(`Interactive/action-like elements found: ${totalControls}`);
  console.log('No form values were read and no order was submitted.');
  console.log('Note: link query strings and customer/session identifiers are omitted from the report.');
} catch (error) {
  console.error('\nPage inspection failed:', error.message);
  process.exitCode = 1;
} finally {
  await closeContext(context);
}
