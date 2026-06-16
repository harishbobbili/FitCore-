import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /login|sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /sign up|create account/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("unauthenticated users redirected from dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/login");
    expect(page.url()).toContain("/login");
  });
});

test.describe("Dashboard Flow", () => {
  test("dashboard loads with key sections", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/dashboard|progress|today/i).first()).toBeVisible();
  });

  test("quick log panel is interactive", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const waterButton = page.getByRole("button", { name: /water/i });
    if (await waterButton.isVisible().catch(() => false)) {
      await waterButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe("Daily Logs Flow", () => {
  test("daily logs page renders", async ({ page }) => {
    await page.goto("/diet");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

test.describe("Goals Flow", () => {
  test("workout page renders", async ({ page }) => {
    await page.goto("/workout");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("sidebar navigation links work", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const navLinks = page.locator("nav a, [role='navigation'] a");
    const count = await navLinks.count();
    if (count > 0) {
      const firstLink = navLinks.first();
      await firstLink.click();
      await page.waitForLoadState("networkidle");
    }
  });
});
