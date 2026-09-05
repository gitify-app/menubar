import { screen, Tray } from 'electron';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getWindowPosition, taskbarLocation } from './getWindowPosition';

vi.mock('electron', () => import('../__mocks__/electron'));

const originalPlatform = process.platform;
const bounds = { x: 0, y: 0, width: 2560, height: 1440 };
const display = screen.getDisplayMatching(bounds);

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(process, 'platform', { value: 'win32' });
});

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform });
});

describe('Windows taskbar detection', () => {
  it('preserves a left taskbar when the tray is equally close to the bottom edge', () => {
    vi.mocked(screen.getDisplayMatching).mockReturnValue({
      ...display,
      bounds,
      workArea: { x: 48, y: 0, width: 2512, height: 1440 },
    });
    const tray = new Tray('');
    vi.mocked(tray.getBounds).mockReturnValue({
      x: 0,
      y: 1392,
      width: 48,
      height: 48,
    });
    expect(getWindowPosition(tray)).toBe('leftCenter');
  });
  it.each([
    ['top', { x: 0, y: 38, width: 2560, height: 1354 }],
    ['left', { x: 38, y: 0, width: 2522, height: 1392 }],
    ['right', { x: 0, y: 0, width: 2522, height: 1392 }],
  ])(
    'keeps a bottom tray popup at the bottom-right with a %s dock',
    (_, workArea) => {
      vi.mocked(screen.getDisplayMatching).mockReturnValue({
        ...display,
        bounds,
        workArea,
      });
      const tray = new Tray('');
      vi.mocked(tray.getBounds).mockReturnValue({
        x: 2318,
        y: 1392,
        width: 32,
        height: 48,
      });

      expect(taskbarLocation(tray)).toBe('bottom');
      expect(getWindowPosition(tray)).toBe('bottomRight');
    },
  );

  it.each([
    ['top', { x: 2318, y: 0, width: 32, height: 48 }],
    ['bottom', { x: 2318, y: 1392, width: 32, height: 48 }],
    ['left', { x: 0, y: 1200, width: 48, height: 32 }],
    ['right', { x: 2512, y: 1200, width: 48, height: 32 }],
  ])(
    'detects a %s taskbar even when work-area insets are ambiguous',
    (side, trayBounds) => {
      vi.mocked(screen.getDisplayMatching).mockReturnValue({
        ...display,
        bounds,
        workArea: { x: 48, y: 48, width: 2464, height: 1344 },
      });
      const tray = new Tray('');
      vi.mocked(tray.getBounds).mockReturnValue(trayBounds);
      expect(taskbarLocation(tray)).toBe(side);
    },
  );

  it('uses screen-relative coordinates on a secondary display', () => {
    vi.mocked(screen.getDisplayMatching).mockReturnValue({
      ...display,
      bounds: { ...bounds, x: -2560, y: -1440 },
      workArea: { x: -2560, y: -1402, width: 2560, height: 1354 },
    });
    const tray = new Tray('');
    vi.mocked(tray.getBounds).mockReturnValue({
      x: -242,
      y: -48,
      width: 32,
      height: 48,
    });
    expect(getWindowPosition(tray)).toBe('bottomRight');
  });

  it('uses the work-area fallback when tray bounds are empty', () => {
    vi.mocked(screen.getDisplayMatching).mockReturnValue({
      ...display,
      bounds,
      workArea: { x: 48, y: 0, width: 2512, height: 1440 },
    });
    const tray = new Tray('');
    vi.mocked(tray.getBounds).mockReturnValue({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    expect(taskbarLocation(tray)).toBe('left');
  });

  it.each([
    ['auto-hidden taskbar', { x: 2318, y: 1438, width: 32, height: 48 }],
    ['hidden-icons flyout', { x: 2318, y: 1250, width: 32, height: 32 }],
  ])('detects the bottom edge for an %s', (_, trayBounds) => {
    vi.mocked(screen.getDisplayMatching).mockReturnValue({
      ...display,
      bounds,
      workArea: { x: 0, y: 38, width: 2560, height: 1402 },
    });
    const tray = new Tray('');
    vi.mocked(tray.getBounds).mockReturnValue(trayBounds);
    expect(getWindowPosition(tray)).toBe('bottomRight');
  });

  it.each(['linux', 'darwin'])(
    'preserves the existing %s positioning',
    async (platform) => {
      Object.defineProperty(process, 'platform', { value: platform });
      vi.resetModules();
      const { getWindowPosition: platformPosition } =
        await import('./getWindowPosition');
      const { screen: platformScreen, Tray: PlatformTray } =
        await import('electron');
      vi.mocked(platformScreen.getDisplayMatching).mockReturnValue({
        ...display,
        bounds,
        workArea: { x: 48, y: 38, width: 2512, height: 1402 },
      });
      expect(platformPosition(new PlatformTray(''))).toBe(
        platform === 'linux' ? 'topRight' : 'trayCenter',
      );
    },
  );
});
