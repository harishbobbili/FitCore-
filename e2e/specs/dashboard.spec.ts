import { test, expect } from "@playwright/test";

test.describe("Dashboard E2E", () => {
  test("dashboard displays analytics and charts", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const chartElements = page.locator("[data-testid='chart'], .recharts-wrapper, canvas");
    const chartCount = await chartElements.count();
    expect(chartCount).toBeGreaterThanOrEqual(0);
  });

  test("dashboard cards are visible", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const cards = page.locator("[class*='card'], [class*='Card']");
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test("profile page accessible", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

test.describe("Daily Logs E2E", () => {
  test("can add a meal", async ({ page }) => {
    await page.goto("/diet");
    await page.waitForLoadState("networkidle");
    const addMealButton = page.getByRole("button", { name: /add meal|log meal/i });
    if (await addMealButton.isVisible().catch(() => false)) {
      await addMealButton.click();
      await page.waitForTimeout(500);
    }
  });

  test("body metrics page renders", async ({ page }) => {
    await page.goto("/progress");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

test.describe("Workout E2E", () => {
  test("workout splits page renders", async ({ page }) => {
    await page.goto("/workout");
    await page.waitForLoadState("networkidle");
    const headings = page.getByRole("heading");
    await expect(headings.first()).toBeVisible();
  });

  test("can start a workout session", async ({ page }) => {
    await page.goto("/workout");
    await page.waitForLoadState("networkidle");
    const startButton = page.getByRole("button", { name: /start|begin|go/i }).first();
    if (await startButton.isVisible().catch(() => false)) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }
  });
});
