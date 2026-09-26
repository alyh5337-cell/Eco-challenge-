/**
 * Eco Challenge v2.1 - Native Capacitor Bridge
 * 
 * Provides native camera capture, photo library access, and hardware info
 * when running inside iOS/Android Capacitor containers, while gracefully
 * falling back to HTML5 Web APIs in web/PWA mode.
 */

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Device } from '@capacitor/device';
export * from './haptics';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatformName = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Capture a photo using native iOS/Android Camera or prompt photo picker.
 * Returns base64 Data URL string ready for Karin AI verification & safety moderation.
 */
export async function captureNativePhoto(
  source: 'camera' | 'photos' = 'camera'
): Promise<string | null> {
  if (isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        correctOrientation: true,
      });

      return photo.dataUrl || null;
    } catch (err: any) {
      console.warn('Native camera capture dismissed or cancelled:', err);
      return null;
    }
  }

  // In Web/PWA mode, return null to let standard file input handle the action
  return null;
}

/**
 * Fetch native device telemetry for diagnostic checks and device integrity.
 */
export async function getNativeDeviceInfo() {
  if (isNativePlatform()) {
    try {
      const info = await Device.getInfo();
      const battery = await Device.getBatteryInfo();
      return {
        platform: info.platform,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        model: info.model,
        isVirtual: info.isVirtual,
        batteryLevel: battery.batteryLevel,
      };
    } catch (err) {
      console.warn('Device info error:', err);
    }
  }

  return {
    platform: 'web',
    operatingSystem: 'browser',
    userAgent: navigator.userAgent,
  };
}
