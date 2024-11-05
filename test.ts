[...document.querySelectorAll("div[class^='voiceUser']")].filter((el) => el.textContent?.includes('Live'))[0]?.click?.()

setTimeout(() => {
  document.querySelector("div[class^='preview']")?.click()
}, 1e3)