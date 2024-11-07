const { app } = require("@electron/remote");

export async function checkForUpdate (): Promise<{ newUpdateAvailable: boolean, latestUpdateVersion: string }> {
  const apiUrl = 'https://api.github.com/repos/Seblor/presscorp-stream-controller/releases/latest';

  const response = await fetch(apiUrl);
  const data = await response.json();
  const latestVersion = data.tag_name;
  const currentVersion = app.getVersion();
  if (latestVersion === currentVersion || latestVersion === 'v' + currentVersion) {
    return { newUpdateAvailable: false, latestUpdateVersion: latestVersion };
  }
  return { newUpdateAvailable: true, latestUpdateVersion: latestVersion };
}
