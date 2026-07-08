import { test, expect } from '@playwright/test';

test.describe('Image Gallery App', () => {
  test('should load the app and render the sidebar', async ({ page }) => {
    await page.goto('/');
    // Sidebar should be visible
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to settings from sidebar', async ({ page }) => {
    await page.goto('/');
    // Click the settings icon in sidebar
    await page.locator('.sidebar-item').last().click();
    // Settings page should appear
    await expect(page.locator('.settings-page')).toBeVisible({ timeout: 10000 });
  });

  test('should show main content area', async ({ page }) => {
    await page.goto('/');
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});
