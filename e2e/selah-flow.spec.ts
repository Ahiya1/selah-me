import { test, expect } from '@playwright/test';

test.describe('Selah Session Flow', () => {
  test('completes full session from question to close nudge', async ({ page }) => {
    // Navigate to home
    await page.goto('/');

    // Verify question appears
    const question = page.locator('p.text-lg');
    await expect(question).toBeVisible();
    await expect(question).not.toBeEmpty();

    // Verify input is focused
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toBeFocused();

    // Verify submit button exists
    const submitButton = page.getByRole('button', { name: 'Continue' });
    await expect(submitButton).toBeVisible();

    // Type response
    await textarea.fill('I am present in this moment.');

    // Submit
    await submitButton.click();

    // Verify loading state
    await expect(page.getByRole('button', { name: '...' })).toBeVisible();

    // Wait for session complete (AI response may take time)
    await expect(page.getByText('Close this tab.')).toBeVisible({
      timeout: 15000,
    });

    // Verify input is gone (session is complete)
    await expect(textarea).not.toBeVisible();

    // Verify no retry/continue button exists
    await expect(
      page.getByRole('button', { name: 'Continue' })
    ).not.toBeVisible();
  });

  test('prevents empty submission', async ({ page }) => {
    await page.goto('/');

    const textarea = page.locator('textarea');
    const submitButton = page.getByRole('button', { name: 'Continue' });

    await expect(textarea).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Empty textarea - button should be disabled
    await expect(textarea).toHaveValue('');
    await expect(submitButton).toBeDisabled();

    // Type something - button should be enabled
    await textarea.fill('test');
    await expect(submitButton).toBeEnabled();

    // Clear - button should be disabled again
    await textarea.fill('');
    await expect(submitButton).toBeDisabled();
  });
});
