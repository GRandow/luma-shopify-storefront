import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** WCAG 2.1 levels A and AA. */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Waits until no finite animation or transition is running (fade-ins, the bag
 * drawer sliding in), so contrast is measured on the final frame rather than on a
 * half-faded one. Infinite animations, like skeleton pulses, are ignored.
 */
async function settleAnimations(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' ||
          !Number.isFinite(animation.effect?.getComputedTiming().endTime),
      ),
  );
}

export async function expectNoViolations(page: Page) {
  await settleAnimations(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const violations = results.violations.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
  }));
  expect(violations, 'axe-core violations').toEqual([]);
}
