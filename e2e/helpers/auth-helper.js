class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  async signInWithMock() {
    await this.page.goto('/sample');
    await this.page.waitForLoadState('networkidle');
  }

  async signOut() {
    const signOutButton = this.page.locator('[data-testid="sign-out-button"]');
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await this.page.waitForURL('/');
    }
  }
}

export default AuthHelper;
