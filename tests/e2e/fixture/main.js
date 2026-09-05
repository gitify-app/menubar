const path = require('node:path');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { app, globalShortcut, Menu } = require('electron');
const { menubar } = require('../../../lib/index.cjs');

app.setPath('userData', mkdtempSync(path.join(tmpdir(), 'menubar-e2e-')));

const scenario = process.env.E2E_SCENARIO || 'default';

const options = {
  index: `file://${path.join(__dirname, 'index.html')}`,
  preloadWindow: true,
  browserWindow: { width: 320, height: 240 },
};

switch (scenario) {
  case 'hideOnBlur':
    options.hideOnBlur = true;
    options.browserWindow.alwaysOnTop = true;
    break;
  case 'hideOnClose':
    options.hideOnClose = true;
    break;
  case 'globalShortcut':
    options.globalShortcut = 'CmdOrCtrl+Alt+Shift+E';
    break;
  case 'contextMenu':
    options.contextMenu = Menu.buildFromTemplate([
      { label: 'First', type: 'normal' },
      { label: 'Second', type: 'normal' },
    ]);
    break;
}

const mb = menubar(options);
globalThis.__menubar = mb;
globalThis.__electron = { globalShortcut };

mb.on('ready', () => {
  console.log('E2E:ready');
});
