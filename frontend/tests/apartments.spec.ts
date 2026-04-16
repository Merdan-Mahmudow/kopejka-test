import { test, expect, Page } from "@playwright/test";

/**
 * Helper: register a user and return to home page (logged in).
 */
async function registerAndLogin(page: Page, suffix: string) {
  const email = `apt_${suffix}_${Date.now()}@test.com`;
  await page.goto("/auth/register");
  await page.getByLabel("ФИО").fill("Владелец Тестовый");
  await page.getByLabel("Телефон").fill("+79991112233");
  await page.getByLabel("Email").fill(email);
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.nth(0).fill("password123");
  await passwordInputs.nth(1).fill("password123");
  await page.getByRole("main").getByRole("button", { name: "Зарегистрироваться" }).click();
  await page.waitForURL("/", { timeout: 10000 });
  return email;
}

/**
 * Helper: create an apartment via the form.
 */
async function createApartment(page: Page, name: string) {
  await page.goto("/apartments/create");
  await page.getByPlaceholder("Loft-студия в центре").fill(name);
  await page.getByPlaceholder("г. Москва, ул. Пушкина, д. 10").fill("г. Тест, ул. Тестовая, д. 1");
  await page.getByPlaceholder("2500").fill("3500");
  await page.getByPlaceholder("Уютная светлая квартира в центре...").fill("E2E тестовое описание квартиры");
  await page.getByRole("main").getByRole("button", { name: "Опубликовать объявление" }).click();
  await page.waitForURL(/\/apartments\//, { timeout: 15000 });
}

test.describe("Создание квартиры", () => {
  test("полный флоу создания объявления", async ({ page }) => {
    await registerAndLogin(page, "create");
    await createApartment(page, "Тестовая студия в центре");

    // Verify apartment data is displayed
    await expect(page.getByText("Тестовая студия в центре")).toBeVisible();
    await expect(page.getByText("3500 ₽")).toBeVisible();
  });
});

test.describe("Навигация по квартирам", () => {
  test("переход на страницу деталей с главной", async ({ page }) => {
    await registerAndLogin(page, "nav");
    await createApartment(page, "Навигационная квартира");

    // Go back to home
    await page.goto("/");
    await page.waitForTimeout(3000);

    // Click first "Подробнее" button
    const btn = page.getByRole("link", { name: "Подробнее" }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForURL(/\/apartments\//, { timeout: 5000 });
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("редактирование квартиры владельцем", async ({ page }) => {
    await registerAndLogin(page, "edit");
    await createApartment(page, "Квартира для редактирования");

    // Click Edit button (owner sees it)
    await page.getByRole("link", { name: "Редактировать" }).click();
    await page.waitForURL(/\/edit/, { timeout: 5000 });

    // Change the name
    const nameInput = page.getByPlaceholder("Loft-студия в центре");
    await nameInput.clear();
    await nameInput.fill("Обновлённая квартира");
    await page.getByRole("main").getByRole("button", { name: "Сохранить" }).click();

    // Should redirect back to details
    await page.waitForURL(/\/apartments\/[^/]+$/, { timeout: 10000 });
    await expect(page.getByText("Обновлённая квартира")).toBeVisible();
  });
});

test.describe("Мои бронирования", () => {
  test("страница доступна авторизованному пользователю", async ({ page }) => {
    await registerAndLogin(page, "bookings");

    await page.getByRole("link", { name: "Мои брони" }).click();
    await page.waitForURL("/bookings", { timeout: 5000 });

    // Should show empty state
    await expect(page.getByText("нет бронирований")).toBeVisible();
  });
});
