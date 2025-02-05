const { ResolvedForgeConfig } = require('@electron-forge/shared-types');
const path = require('path');

const iconPath = path.resolve(__dirname, './public/favicon.ico');

/**
 * @type {ResolvedForgeConfig}
 */
module.exports = {
  packagerConfig: {
    icon: iconPath,
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: iconPath,
        icon: iconPath,
        iconUrl: 'https://raw.githubusercontent.com/Seblor/Presscorp-Stream-Controller/main/public/favicon.png',
        authors: 'Sébastien "Seblor" Lorentz',
        description: 'Presscorp Stream Controller',
        title: 'Presscorp Stream Controller',
        setupExe: 'Presscorp Stream Controller.exe',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
};
