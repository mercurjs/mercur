import { type Page, type Locator } from "@playwright/test"

// Page object for the dashboard login screen. Admin and vendor panels render the
// same login UI, so this object is area-agnostic. It encapsulates actions, never
// exposes raw locators to tests as steps, and holds no assertions — tests own
// every expect(). Navigation is relative; baseURL is provided by the fixture.
export class LoginPage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.emailInput = page.getByRole("textbox", { name: "Email" })
    this.passwordInput = page.getByPlaceholder("Password")
    this.submitButton = page.getByRole("button", { name: /continue with email/i })
    this.errorMessage = page.getByRole("alert")
  }

  async goto() {
    await this.page.goto("/login")
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
