import type PlayWrightType from 'playwright-core';
const PlayWright: typeof PlayWrightType = require('playwright-core');

class Browser {
  browser: PlayWrightType.Browser | undefined;
  page: PlayWrightType.Page | undefined;
  constructor() {
    console.log('Browser constructor');
  }

  async startBrowser (executablePath: string) {
    this.browser = await PlayWright.chromium.launch({
      executablePath,
      headless: false,
    });

    console.log('Browser started');

    this.page = await this.browser.newPage()

    console.log('Page created');

    await this.page.goto('https://discord.gg/');

    console.log('Page visited');

    await this.page.waitForLoadState('domcontentloaded');

    console.log('Page loaded');
  }

  async startStream(userDisplayName: string) {
    // [...document.querySelectorAll("div[class^='voiceUser']")]
    // const userElement = await this.page?.locator("div[class^='voiceUser']", (el) => el.textContent?.includes(userDisplayName));
    const userElement = this.page?.locator("div[class^='voiceUser']", {
      hasText: userDisplayName
    });
    if (!userElement) {
      return;
    }
    userElement.hover();
  }
}

const browser = new Browser();

export default browser;
