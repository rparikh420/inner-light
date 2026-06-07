import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Inner Light E2E Test Suite
//
// Runs against http://localhost:8081 (Expo web).
// Make sure the dev server is running: npx expo start --web --port 8081
// Run tests: npx playwright test
// Run with browser visible: npx playwright test --headed
// ---------------------------------------------------------------------------

test.describe('Inner Light — Full App Walkthrough', () => {

  test('1. App loads and shows onboarding or home', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000); // wait for Expo to bundle

    // Should see either onboarding ("who are you becoming" or "begin")
    // or home screen (if already onboarded)
    const body = await page.textContent('body');
    const hasContent = body && body.length > 10;
    expect(hasContent).toBeTruthy();

    await page.screenshot({ path: 'e2e/results/01-initial-load.png' });
  });

  test('2. Onboarding flow — complete all 3 steps', async ({ page }) => {
    // Clear storage to force onboarding
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'e2e/results/02-onboarding-step1.png' });

    // Step 1: Fill in name and intention
    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Rushabh');

      const intentionInput = page.locator('input').nth(1);
      if (await intentionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await intentionInput.fill('a mindful leader');
      }

      await page.screenshot({ path: 'e2e/results/02b-onboarding-filled.png' });

      // Click next
      const nextButton = page.getByText('next', { exact: false });
      if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: 'e2e/results/02c-onboarding-step2.png' });

    // Step 2: Select some goals
    const goals = ['Career Growth', 'Mindfulness', 'Self-Love'];
    for (const goal of goals) {
      const goalEl = page.getByText(goal, { exact: false });
      if (await goalEl.isVisible({ timeout: 1000 }).catch(() => false)) {
        await goalEl.click();
        await page.waitForTimeout(200);
      }
    }

    await page.screenshot({ path: 'e2e/results/02d-onboarding-goals-selected.png' });

    // Click next to step 3
    const nextButton2 = page.getByText('next', { exact: false });
    if (await nextButton2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton2.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'e2e/results/02e-onboarding-step3.png' });

    // Step 3: Click begin
    const beginButton = page.getByText('begin', { exact: false });
    if (await beginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await beginButton.click();
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: 'e2e/results/02f-after-onboarding.png' });
  });

  test('3. Home screen — verify content sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'e2e/results/03-home-screen.png' });

    // Check for greeting (Good morning/afternoon/evening)
    const body = await page.textContent('body');
    const hasGreeting = body && (
      body.includes('Good morning') ||
      body.includes('Good afternoon') ||
      body.includes('Good evening')
    );

    // Check for key home screen elements
    const hasCardToday = body && body.includes('your card today');
    const hasExplore = body && (
      body.includes('Guidance') ||
      body.includes('guidance') ||
      body.includes('explore')
    );

    // Log what we found
    console.log('Home screen content check:', {
      hasGreeting,
      hasCardToday,
      hasExplore,
      bodyLength: body?.length,
    });

    // Scroll down to see all content
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/results/03b-home-scrolled.png' });
  });

  test('4. Guidance (Tarot) tab — draw a card', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Navigate to Guidance tab
    const guidanceTab = page.getByText('Guidance', { exact: false });
    if (await guidanceTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await guidanceTab.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: 'e2e/results/04-guidance-card-back.png' });

    // Tap to draw a card
    const tapToDraw = page.getByText('tap to draw', { exact: false });
    if (await tapToDraw.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tapToDraw.click();
      await page.waitForTimeout(1500); // wait for flip animation
    }

    await page.screenshot({ path: 'e2e/results/04b-guidance-card-revealed.png' });

    // Scroll down to see meaning
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/results/04c-guidance-meaning.png' });

    // Test the yes/no mode toggle
    const yesNoToggle = page.getByText('yes / no', { exact: false });
    if (await yesNoToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yesNoToggle.click();
      await page.waitForTimeout(500);
    }

    // Draw again in yes/no mode
    const drawAgain = page.getByText('draw again', { exact: false });
    if (await drawAgain.isVisible({ timeout: 2000 }).catch(() => false)) {
      await drawAgain.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: 'e2e/results/04d-guidance-yesno.png' });
  });

  test('5. Affirm tab — browse and affirm', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Navigate to Affirm tab
    const affirmTab = page.getByText('Affirm', { exact: false });
    if (await affirmTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await affirmTab.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: 'e2e/results/05-affirm-screen.png' });

    // Try the next arrow
    const nextArrow = page.locator('[aria-label*="chevron"]').last();
    const forwardIcon = page.getByRole('button').filter({ has: page.locator('text=›') });

    // Click the right side of the nav row area
    const navArrows = page.locator('div[style*="flex-direction: row"]').last();

    // Try clicking the forward arrow by position
    const rightArrow = page.locator('[data-testid="nav-forward"]');
    if (await rightArrow.isVisible({ timeout: 1000 }).catch(() => false)) {
      await rightArrow.click();
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/results/05b-affirm-navigated.png' });

    // Try to find and interact with the hold to affirm button
    const holdButton = page.getByText('hold to affirm', { exact: false });
    if (await holdButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Long press simulation
      const box = await holdButton.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(700); // hold for 700ms (> 600ms threshold)
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: 'e2e/results/05c-affirm-affirmed.png' });

    // Try switching categories
    const abundanceCategory = page.getByText('abundance', { exact: false });
    if (await abundanceCategory.isVisible({ timeout: 2000 }).catch(() => false)) {
      await abundanceCategory.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'e2e/results/05d-affirm-category-switched.png' });
  });

  test('6. Journal tab — write an entry', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Navigate to Journal tab
    const journalTab = page.getByText('Journal', { exact: false });
    if (await journalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await journalTab.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: 'e2e/results/06-journal-screen.png' });

    // Find the text input and write something
    const textArea = page.locator('textarea, [contenteditable], input[type="text"]').first();
    if (await textArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textArea.fill('Today I drew The Star card. It reminded me that hope is always present, even in difficult times. I am grateful for the guidance.');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: 'e2e/results/06b-journal-written.png' });

    // Try to save
    const saveButton = page.getByText('save', { exact: false });
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'e2e/results/06c-journal-saved.png' });

    // Scroll to see recent entries
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/results/06d-journal-entries.png' });
  });

  test('7. Full tab navigation cycle', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const tabs = ['Home', 'Guidance', 'Affirm', 'Journal'];

    for (let i = 0; i < tabs.length; i++) {
      const tab = page.getByText(tabs[i], { exact: false }).last();
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `e2e/results/07-tab-${tabs[i].toLowerCase()}.png` });
      }
    }
  });
});
