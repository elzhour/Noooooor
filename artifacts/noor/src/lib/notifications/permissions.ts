/**
 * Bridge to the native NoorPermissions Capacitor plugin (Android).
 *
 * Wraps the Java methods exposed in
 * android/app/src/main/java/com/noor/app/NoorPermissionsPlugin.java so the
 * React layer can read each Android permission state and open the matching
 * system settings pane with one tap.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export interface PermissionStatus {
  /** App is allowed to post notifications (Android 13+). */
  notifications: boolean;
  /** App is allowed to schedule exact alarms (Android 12+). */
  exactAlarm: boolean;
  /** App is whitelisted from battery optimisation (Doze). */
  batteryOptimization: boolean;
  /** App can draw on top of other apps (full-screen athan over lock). */
  overlay: boolean;
}

interface NoorPermissionsAPI {
  status(): Promise<PermissionStatus>;
  openAppSettings(): Promise<void>;
  requestBatteryWhitelist(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  openExactAlarmSettings(): Promise<void>;
  openAutostartSettings(): Promise<void>;
}

const NoorPermissions = registerPlugin<NoorPermissionsAPI>('NoorPermissions');

export const ALL_GRANTED: PermissionStatus = {
  notifications: true,
  exactAlarm: true,
  batteryOptimization: true,
  overlay: true,
};

/**
 * Returns the current state of every Android permission we care about.
 * On non-native platforms we fall back to the browser Notification API.
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (!Capacitor.isNativePlatform()) {
    const notif =
      typeof Notification !== 'undefined'
        ? Notification.permission === 'granted'
        : false;
    return { ...ALL_GRANTED, notifications: notif };
  }
  if (Capacitor.getPlatform() !== 'android') {
    return { ...ALL_GRANTED };
  }
  try {
    return await NoorPermissions.status();
  } catch (e) {
    console.warn('[perm] status failed', e);
    return { ...ALL_GRANTED };
  }
}

/**
 * Trigger the system's standard notification-permission prompt
 * (Android 13+). On older Android versions this is a no-op because
 * notifications are granted at install time.
 */
export async function requestNotificationsPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const r = await Notification.requestPermission();
    return r === 'granted';
  }
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch (e) {
    console.warn('[perm] requestNotifications failed', e);
    return false;
  }
}

export async function openNotificationSettings(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await NoorPermissions.openAppSettings();
  } catch (e) {
    console.warn('[perm] openAppSettings failed', e);
  }
}

export async function requestIgnoreBattery(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await NoorPermissions.requestBatteryWhitelist();
  } catch (e) {
    console.warn('[perm] requestBatteryWhitelist failed', e);
  }
}

export async function openOverlaySettings(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await NoorPermissions.openOverlaySettings();
  } catch (e) {
    console.warn('[perm] openOverlaySettings failed', e);
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await NoorPermissions.openExactAlarmSettings();
  } catch (e) {
    console.warn('[perm] openExactAlarmSettings failed', e);
  }
}

export async function openAutostartSettings(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    await NoorPermissions.openAutostartSettings();
  } catch (e) {
    console.warn('[perm] openAutostartSettings failed', e);
  }
}
