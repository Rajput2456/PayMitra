import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("overview, sections, and search are usable", async ({ page }) => {
  await expect(page.getByRole("heading", { name: /Namaste, Aanya/i })).toBeVisible();
  await expect(page.getByTestId("stat-groups")).toContainText("05");
  await page.getByTestId("nav-expenses").click();
  await expect(page.getByRole("heading", { name: "Expenses" })).toBeVisible();
  const search = page.getByTestId("expense-search");
  await search.fill("Mizu");
  await expect(page.getByText("Dinner at Mizu")).toBeVisible();
  await expect(page.getByTestId("expense-row-exp-coffee")).toHaveCount(0);
});

test("friend and group creation persist locally", async ({ page }) => {
  await page.getByTestId("nav-friends").click();
  await page.getByTestId("add-friend").click();
  await page.getByTestId("friend-name").fill("Test Friend");
  await page.getByTestId("save-friend").click();
  await expect(page.getByText("Test Friend", { exact: true })).toBeVisible();
  await page.getByTestId("nav-groups").click();
  await page.getByTestId("create-group").click();
  await page.getByTestId("group-name").fill("Weekend Test");
  await page.locator(".member-picker-row").filter({ hasText: "Test Friend" }).locator("input[type=checkbox]").check();
  await page.getByTestId("save-group").click();
  await expect(page.getByRole("heading", { name: "Weekend Test" })).toBeVisible();
  await page.reload();
  await page.getByTestId("nav-friends").click();
  await expect(page.getByText("Test Friend", { exact: true })).toBeVisible();
});

test("expense creation supports equal, amount and percentage splits", async ({ page }) => {
  await page.getByTestId("quick-add-expense").click();
  await page.getByTestId("expense-title").fill("Playwright lunch");
  await page.getByTestId("expense-amount").fill("1200");
  await expect(page.getByTestId("split-validation")).toContainText("Splits add up correctly");
  await page.getByTestId("split-amount").click();
  await expect(page.getByTestId("amount-split-fields")).toBeVisible();
  await page.getByTestId("share-me").fill("600");
  await page.getByTestId("share-maya").fill("600");
  await expect(page.getByTestId("split-validation")).toContainText("Splits add up correctly");
  await page.getByTestId("split-percent").click();
  await page.getByTestId("percent-me").fill("50");
  await page.getByTestId("percent-maya").fill("50");
  await expect(page.getByTestId("split-validation")).toContainText("Splits add up correctly");
  await page.getByTestId("save-expense").click();
  await page.getByTestId("nav-expenses").click();
  await expect(page.getByText("Playwright lunch")).toBeVisible();
});

test("settlement dialog records a simulated suggested transfer", async ({ page }) => {
  await page.getByTestId("nav-settle").click();
  await expect(page.getByRole("heading", { name: /Settle up/i })).toBeVisible();
  const settle = page.locator("[data-testid^=record-transfer-]").first();
  await settle.click();
  await expect(page.getByTestId("settlement-dialog")).toBeVisible();
  await expect(page.getByTestId("settlement-amount")).not.toHaveValue("");
  await expect(page.getByText(/does not send money/i)).toBeVisible();
  await page.getByTestId("save-settlement").click();
  await expect(page.getByTestId("toast")).toContainText("Settlement recorded");
});

test("manual bill entry adds a bill without scanning", async ({ page }) => {
  await page.getByTestId("nav-expenses").click();
  await page.getByRole("button", { name: /Split a bill/i }).click();
  await page.getByTestId("bill-title").fill("Manual receipt test");
  await page.getByLabel("Amount for item 1").fill("250");
  await page.getByTestId("use-bill-details").click();
  await expect(page.getByTestId("toast")).toContainText("Bill details added");
});

test("mobile navigation remains accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: /Namaste, Aanya/i })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByTestId("nav-trip").click();
  await expect(page.getByRole("heading", { name: /Trip planner/i })).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
});

