import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/track', '/dashboard', '/profile', '/demo'];

for (const route of routes) {
  test(`accessibility scan passes on ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast', 'scrollable-region-focusable'])
      .analyze();

    const blockingViolations = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    );

    expect(blockingViolations).toEqual([]);
  });
}
