import { test, expect, Page } from "@playwright/test";

const TEST_PASSWORD = "TestPassword123";
const TEST_NAME = "E2E Тестовый Пользователь";
const TEST_PHONE = "+79991234567";

/**
 * Helper: fill registration form and submit.
 */
async function fillAndSubmitRegister(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto("/auth/register");
  await page.getByLabel("ФИО").fill(TEST_NAME);
  await page.getByLabel("Телефон").fill(TEST_PHONE);
  await page.getByLabel("Email").fill(email);
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill(password);
  await passwordInputs.nth(1).fill(password);
  await page.getByRole("main").getByRole("button", { name: "Зарегистрироваться" }).click();
}

test.describe("Регистрация и вход", () => {
  test("регистрация нового пользователя", async ({ page }) => {
    const email = `e2e_reg_${Date.now()}@test.com`;
    await fillAndSubmitRegister(page, email);

    // Should redirect to home
    await page.waitForURL("/", { timeout: 10000 });
    // Should show user email in navbar
    await expect(page.getByText(email)).toBeVisible();
  });

  test("выход из системы", async ({ page }) => {
    const email = `e2e_logout_${Date.now()}@test.com`;
    await fillAndSubmitRegister(page, email);
    await page.waitForURL("/", { timeout: 10000 });

    // Now logout
    await page.getByRole("button", { name: "Выйти" }).click();

    // Should see login/register links again
    await expect(page.getByRole("link", { name: "Войти" })).toBeVisible();
  });

  test("ошибка при неверном пароле", async ({ page }) => {
    await page.goto("/auth/login");

    await page.getByLabel("Email").fill("nonexistent@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    // Use main area to avoid conflict with navbar "Войти" link
    await page.getByRole("main").getByRole("button", { name: "Войти" }).click();

    // Should show error toast
    await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5000 });
  });

  test("валидация: не совпадают пароли", async ({ page }) => {
    await page.goto("/auth/register");

    await page.getByLabel("ФИО").fill("Тест");
    await page.getByLabel("Телефон").fill("+79990000000");
    await page.getByLabel("Email").fill("mismatch@test.com");
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill("password123");
    await passwordInputs.nth(1).fill("differentpassword");
    await page.getByRole("main").getByRole("button", { name: "Зарегистрироваться" }).click();

    // Should show error toast about passwords not matching
    await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5000 });
  });
});
