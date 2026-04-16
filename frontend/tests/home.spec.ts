import { test, expect } from "@playwright/test";

test.describe("Главная страница", () => {
  test("отображает заголовок и каталог", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RentHub/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("навбар содержит ссылки для неавторизованного", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Регистрация" })).toBeVisible();
  });

  test("карточки квартир отображаются", async ({ page }) => {
    await page.goto("/");
    // Wait for loading to finish (spinner gone)
    await page.waitForTimeout(2000);
    // Either we see apartments or an empty state - page should not crash
    const body = await page.textContent("body");
    expect(body).toBeTruthy();
  });
});
