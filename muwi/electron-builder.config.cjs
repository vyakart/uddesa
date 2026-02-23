/**
 * Electron Builder Configuration
 * @see https://www.electron.build/configuration/configuration
 */

const config = {
  appId: 'com.muwi.app',
  productName: 'MUWI',
  copyright: 'Copyright (C) 2026',

  directories: {
    output: 'release/${version}',
    buildResources: 'build',
  },

  files: [
    'dist/**/*',
    'dist-electron/**/*',
    '!node_modules/**/*',
  ],

  extraResources: [
    {
      from: 'build/icons',
      to: 'icons',
      filter: ['**/*'],
    },
  ],

  // macOS Configuration
  mac: {
    target: [
      { target: 'dmg', arch: ['x64', 'arm64'] },
      { target: 'zip', arch: ['x64', 'arm64'] },
    ],
    category: 'public.app-category.productivity',
    icon: 'build/icons/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },

  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
    ],
    window: {
      width: 540,
      height: 380,
    },
  },

  // Windows Configuration
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] },
    ],
    icon: 'build/icons/icon.ico',
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build/icons/icon.ico',
    uninstallerIcon: 'build/icons/icon.ico',
    installerHeaderIcon: 'build/icons/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'MUWI',
  },

  portable: {
    artifactName: '${productName}-${version}-portable.${ext}',
  },

  // Linux Configuration
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] },
    ],
    category: 'Office',
    icon: 'build/icons',
    artifactName: '${productName}-${version}-${arch}.${ext}',
    desktop: {
      Name: 'MUWI',
      Comment: 'Multi-Utility Writing Interface',
      Categories: 'Office;TextEditor;',
      Keywords: 'writing;notes;diary;drafts;academic;',
    },
  },

  appImage: {
    artifactName: '${productName}-${version}.${ext}',
  },

  deb: {
    depends: ['libnotify4', 'libxtst6', 'libnss3'],
    artifactName: '${productName}-${version}-${arch}.${ext}',
  },

  // Auto-update configuration (electron-updater)
  publish: {
    provider: 'generic',
    url: 'https://releases.muwi.app/',
    channel: 'latest',
  },

  // Compression and optimization
  compression: 'maximum',
  removePackageScripts: true,

  // ASAR packaging
  asar: true,
  asarUnpack: [
    '**/*.node',
    '**/node_modules/sharp/**',
  ],

  // Build hooks
  afterSign: 'scripts/notarize.cjs',
};

module.exports = config;
