/**
 * Eco Challenge v2.1 - Arcade Haptics Engine
 * Powered by @capacitor/haptics with Web Vibration API fallback.
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Check if haptics is globally enabled by user preferences (defaults to enabled)
export const isHapticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('eco_haptics_enabled') !== 'false';
};

export const setHapticsEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('eco_haptics_enabled', enabled ? 'true' : 'false');
  }
};

/**
 * Check if the current environment supports native or web vibration
 */
export const isHapticsSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform() || 'vibrate' in navigator;
};

/**
 * Tactile micro-tap for arcade button presses, tab switching, and chips
 */
export async function triggerLightImpact(): Promise<void> {
  if (!isHapticsEnabled()) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch {
    // Graceful no-op on desktop or unsupported devices
  }
}

/**
 * Medium tactile feedback for modal triggers, camera captures, and action confirms
 */
export async function triggerMediumImpact(): Promise<void> {
  if (!isHapticsEnabled()) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  } catch {
    // Graceful no-op
  }
}

/**
 * Heavy impact for critical actions (purchases, resets)
 */
export async function triggerHeavyImpact(): Promise<void> {
  if (!isHapticsEnabled()) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }
  } catch {
    // Graceful no-op
  }
}

/**
 * Celebratory arcade sequence for successful quest completions
 * Generates an arcade dual-burst pattern (Pulse -> Brief pause -> Victory burst)
 */
export async function triggerQuestCompleteHaptic(): Promise<void> {
  if (!isHapticsEnabled()) return;
  try {
    if (Capacitor.isNativePlatform()) {
      // Step 1: Crisp impact on achievement unlock
      await Haptics.impact({ style: ImpactStyle.Medium });
      // Step 2: Victory notification pattern
      setTimeout(async () => {
        try {
          await Haptics.notification({ type: NotificationType.Success });
        } catch {
          // Ignore
        }
      }, 120);
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Arcade victory buzz rhythm: [buzz, rest, buzz, rest, long buzz]
      navigator.vibrate([35, 60, 45, 70, 80]);
    }
  } catch {
    // Graceful no-op
  }
}

/**
 * Error / Warning vibration
 */
export async function triggerErrorHaptic(): Promise<void> {
  if (!isHapticsEnabled()) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Error });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([60, 50, 60]);
    }
  } catch {
    // Graceful no-op
  }
}

/**
 * Selection tick for radio choices and toggles
 */
export async function triggerSelectionHaptic(): Promise<void> {
  if (!isHapticsEnabled()) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.selectionChanged();
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
  } catch {
    // Graceful no-op
  }
}
