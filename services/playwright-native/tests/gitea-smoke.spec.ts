import { test, expect } from "@playwright/test";

test("the instance serves its landing page to an anonymous visitor", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /register/i }).first()).toBeVisible();
});

test("the sign-up page renders the fields an account needs", async ({ page }) => {
  await page.goto("/user/sign_up");

  // The field names the pipeline's own account seeding posts to.
  for (const field of ["user_name", "email", "password", "retype"]) {
    await expect(page.locator(`input[name="${field}"]`)).toBeVisible();
  }
});
