package com.noor.app;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Bridges Android system-permission settings panes to JavaScript.
 *
 * Exposes:
 *   status()                   -> { notifications, exactAlarm, batteryOptimization, overlay }
 *   openAppSettings()          -> opens this app's notification settings
 *   openBatterySettings()      -> opens battery-optimization settings
 *   requestBatteryWhitelist()  -> direct prompt to ignore battery optimization
 *   openOverlaySettings()      -> opens "draw over other apps" settings
 *   openExactAlarmSettings()   -> opens schedule-exact-alarm settings (Android 12+)
 *   openAutostartSettings()    -> best-effort: opens common Chinese-OEM autostart pages
 */
@CapacitorPlugin(name = "NoorPermissions")
public class NoorPermissionsPlugin extends Plugin {

    @PluginMethod
    public void status(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();

        // Notifications enabled?
        boolean notif = true;
        try {
            android.app.NotificationManager nm =
                (android.app.NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                notif = nm.areNotificationsEnabled();
            }
        } catch (Throwable ignored) {}
        ret.put("notifications", notif);

        // Exact alarms (Android 12+)
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
                if (am != null) exact = am.canScheduleExactAlarms();
            } catch (Throwable ignored) {}
        }
        ret.put("exactAlarm", exact);

        // Battery optimization whitelist
        boolean battery = true;
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null) battery = pm.isIgnoringBatteryOptimizations(ctx.getPackageName());
        } catch (Throwable ignored) {}
        ret.put("batteryOptimization", battery);

        // Overlay
        boolean overlay = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                overlay = Settings.canDrawOverlays(ctx);
            } catch (Throwable ignored) {}
        }
        ret.put("overlay", overlay);

        call.resolve(ret);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Throwable t) {
            call.reject("openAppSettings failed: " + t.getMessage());
        }
    }

    @PluginMethod
    public void requestBatteryWhitelist(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Throwable t) {
            // Fallback: open the general battery-opt list
            try {
                Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Throwable t2) {
                call.reject("requestBatteryWhitelist failed: " + t2.getMessage());
            }
        }
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Throwable t) {
            call.reject("openOverlaySettings failed: " + t.getMessage());
        }
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Throwable t) {
            call.reject("openExactAlarmSettings failed: " + t.getMessage());
        }
    }

    @PluginMethod
    public void openAutostartSettings(PluginCall call) {
        // Best-effort across the common Chinese OEMs (Xiaomi, Huawei, Oppo, Vivo, Samsung).
        String[][] candidates = new String[][] {
            {"com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
            {"com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"},
            {"com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"},
            {"com.coloros.safecenter", "com.coloros.safecenter.permission.startup.FakeActivity"},
            {"com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"},
            {"com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity"},
        };
        for (String[] c : candidates) {
            try {
                Intent intent = new Intent();
                intent.setClassName(c[0], c[1]);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
                return;
            } catch (Throwable ignored) {}
        }
        // Generic fallback to app details
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Throwable t) {
            call.reject("openAutostartSettings failed: " + t.getMessage());
        }
    }
}
