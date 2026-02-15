declare global {
  interface Window {
    electronRemote: {
      app: {
        getVersion: () => Promise<string>;
      };
      dialog: {
        showMessageBoxSync: (options: {
          type?: string;
          buttons?: string[];
          defaultId?: number;
          cancelId?: number;
          detail?: string;
          message?: string;
        }) => Promise<number>;
      };
    };
  }
}

export async function checkForUpdate (): Promise<{ newUpdateAvailable: boolean, latestUpdateVersion: string }> {
  const apiUrl = 'https://api.github.com/repos/Seblor/presscorp-stream-controller/releases/latest';

  const response = await fetch(apiUrl);
  const data = await response.json();
  const latestVersion = data.tag_name;
  const currentVersion = await window.electronRemote.app.getVersion();
  if (latestVersion === currentVersion || latestVersion === 'v' + currentVersion) {
    return { newUpdateAvailable: false, latestUpdateVersion: latestVersion };
  }
  return { newUpdateAvailable: true, latestUpdateVersion: latestVersion };
}
