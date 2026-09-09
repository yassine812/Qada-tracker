import { Capacitor } from '@capacitor/core';

/** Native installs load the packaged app, independently of browser PWA support. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
