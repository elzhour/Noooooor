import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Volume2,
  Type,
  PlayCircle,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  Battery,
  Layers,
  AlarmClock,
  Settings as SettingsIcon,
} from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import {
  loadPrefs,
  setPrayerMode,
  setAthanReciter,
  setEnabled,
  PRAYER_KEYS,
  PRAYER_NAMES_AR,
  type NotifyMode,
  type PrayerKey,
} from '@/lib/notifications/prefs';
import {
  scheduleMonthOfPrayers,
  scheduleTestNotification,
} from '@/lib/notifications/scheduler';
import {
  getPermissionStatus,
  requestNotificationsPermission,
  openNotificationSettings,
  requestIgnoreBattery,
  openOverlaySettings,
  openExactAlarmSettings,
  openAutostartSettings,
  type PermissionStatus,
  ALL_GRANTED,
} from '@/lib/notifications/permissions';
import { ADHAN_RECITERS } from '@/lib/constants';
import { getCacheValue } from '@/lib/rtdb';
import type { UserProfile } from '@/lib/rtdb';

const MODE_OPTIONS: { value: NotifyMode; label: string; icon: typeof Bell }[] = [
  { value: 'silent', label: 'صامت', icon: BellOff },
  { value: 'text', label: 'إشعار نصي', icon: Type },
  { value: 'athan', label: 'أذان', icon: Volume2 },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [busy, setBusy] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [status, setStatus] = useState<{
    text: string;
    tone: 'ok' | 'warn' | 'err';
  } | null>(null);
  const [perm, setPerm] = useState<PermissionStatus>(ALL_GRANTED);

  const profile = useMemo(
    () => getCacheValue<UserProfile | null>('profile', null),
    [],
  );

  const refreshPerm = useCallback(async () => {
    try {
      const p = await getPermissionStatus();
      setPerm(p);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshPerm();
  }, [refreshPerm]);

  // Re-check permission status whenever the user returns from the system
  // settings pane (Capacitor `appStateChange`) or the page regains focus.
  useEffect(() => {
    const onFocus = () => refreshPerm();
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshPerm();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);

    let remove: (() => void) | null = null;
    CapApp.addListener('appStateChange', (s) => {
      if (s.isActive) refreshPerm();
    })
      .then((h) => {
        remove = () => h.remove();
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      if (remove) remove();
    };
  }, [refreshPerm]);

  const flash = (text: string, tone: 'ok' | 'warn' | 'err' = 'ok') => {
    setStatus({ text, tone });
    setTimeout(() => setStatus(null), 3000);
  };

  const handleModeChange = (key: PrayerKey, mode: NotifyMode) => {
    setPrefs(setPrayerMode(key, mode));
  };

  const handleReciter = (id: string) => {
    setPrefs(setAthanReciter(id));
  };

  /**
   * One-tap permission flow: requests notification permission, then quietly
   * asks for battery whitelist. The user only ever sees standard system
   * popups — no need to navigate any settings page manually.
   */
  const handleAllow = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const ok = await requestNotificationsPermission();
      if (!ok) {
        flash('يرجى السماح بالإشعارات لتشغيل الأذان', 'warn');
        // If the user denied or the prompt couldn't show, send them to the
        // app's notifications settings as a last-resort.
        await openNotificationSettings();
      } else {
        // Quietly request battery whitelist as a follow-up popup.
        try {
          await requestIgnoreBattery();
        } catch {
          /* ignore */
        }
        flash('تم تفعيل الإشعارات بنجاح', 'ok');
        if (!prefs.enabled) setPrefs(setEnabled(true));
      }
    } finally {
      // Give Android a moment to update its state before re-reading.
      setTimeout(() => {
        refreshPerm();
        setRequesting(false);
      }, 500);
    }
  };

  const handleToggleEnabled = async (v: boolean) => {
    setPrefs(setEnabled(v));
    if (v && !perm.notifications) {
      // Turning the master switch on without permission? Ask immediately.
      await handleAllow();
    }
  };

  const handleReschedule = async () => {
    if (!profile?.lat || !profile?.lng) {
      flash('لم يتم تحديد المحافظة بعد', 'warn');
      return;
    }
    setBusy(true);
    try {
      const ok = await requestNotificationsPermission();
      await refreshPerm();
      if (!ok) {
        flash('يرجى السماح بالإشعارات أولاً', 'warn');
        return;
      }
      const r = await scheduleMonthOfPrayers({
        lat: profile.lat,
        lng: profile.lng,
        days: 30,
      });
      if (r.error) {
        flash(r.error, 'err');
      } else if (r.scheduled > 0) {
        flash(`تمت جدولة ${r.scheduled} تنبيه للشهر القادم`, 'ok');
      } else {
        flash(`تم تحضير ${r.events} موعد صلاة (سيتم التذكير داخل التطبيق)`, 'ok');
      }
    } catch (e) {
      console.error(e);
      flash('تعذر جدولة الإشعارات — تأكد من الاتصال بالإنترنت', 'err');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      // Make sure we actually have permission before trying.
      const ok = await requestNotificationsPermission();
      if (!ok) {
        flash('يرجى السماح بالإشعارات أولاً', 'warn');
        await refreshPerm();
        return;
      }
      const r = await scheduleTestNotification('Dhuhr');
      if (r.error) {
        flash(`التجربة ظهرت داخل التطبيق — ${r.error}`, 'warn');
      } else if (r.scheduled) {
        flash('التجربة ظهرت الآن، وسيظهر إشعار النظام خلال ٥ ثوان', 'ok');
      } else {
        flash('التجربة ظهرت داخل التطبيق', 'ok');
      }
    } catch (e) {
      console.error(e);
      flash('تعذر إطلاق التجربة', 'err');
    } finally {
      setBusy(false);
    }
  };

  const advancedRows: {
    key: keyof PermissionStatus | 'autostart';
    title: string;
    desc: string;
    icon: typeof Bell;
    action: () => Promise<void>;
    verifiable: boolean;
  }[] = [
    {
      key: 'exactAlarm',
      title: 'تنبيهات في الموعد بالضبط',
      desc: 'لتشغيل الأذان في وقته الدقيق دون تأخير',
      icon: AlarmClock,
      verifiable: true,
      action: openExactAlarmSettings,
    },
    {
      key: 'overlay',
      title: 'الظهور فوق التطبيقات الأخرى',
      desc: 'لإظهار شاشة الأذان كاملة فوق أي تطبيق',
      icon: Layers,
      verifiable: true,
      action: openOverlaySettings,
    },
    {
      key: 'autostart',
      title: 'التشغيل التلقائي (Xiaomi و Huawei و Oppo)',
      desc: 'لكي يستمر التطبيق في إرسال التنبيهات بعد إعادة التشغيل',
      icon: SettingsIcon,
      verifiable: false,
      action: openAutostartSettings,
    },
  ];

  const allowed = perm.notifications;

  return (
    <div className="min-h-[100dvh] pb-24 px-4 pt-6" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(193,154,107,0.15)' }}
          data-testid="link-back-settings"
        >
          <ArrowLeft className="w-5 h-5 text-[#C19A6B] rotate-180" />
        </Link>
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
        >
          إشعارات الصلاة
        </h1>
      </div>

      {/* governorate banner */}
      {profile?.governorateName && (
        <div
          className="rounded-2xl p-4 mb-4 flex items-center justify-between"
          style={{
            background: 'rgba(193,154,107,0.1)',
            border: '1px solid rgba(193,154,107,0.2)',
          }}
        >
          <div>
            <div
              className="text-xs opacity-70"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
            >
              المحافظة المحددة
            </div>
            <div
              className="text-base font-bold"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
              data-testid="text-governorate"
            >
              {profile.governorateName}
            </div>
          </div>
          <Bell className="w-6 h-6 text-[#C19A6B] opacity-70" />
        </div>
      )}

      {/* one-tap permission card */}
      <div
        className="rounded-2xl p-5 mb-4"
        style={{
          background: allowed
            ? 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(193,154,107,0.05))'
            : 'linear-gradient(135deg, rgba(193,154,107,0.18), rgba(193,154,107,0.05))',
          border: `1px solid ${allowed ? 'rgba(34,197,94,0.30)' : 'rgba(193,154,107,0.30)'}`,
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: allowed ? 'rgba(34,197,94,0.20)' : 'rgba(193,154,107,0.20)',
            }}
          >
            {allowed ? (
              <Check className="w-6 h-6 text-green-400" />
            ) : (
              <Bell className="w-6 h-6 text-[#C19A6B]" />
            )}
          </div>
          <div className="flex-1 text-right min-w-0">
            <div
              className="text-base font-bold"
              style={{
                fontFamily: '"Tajawal", sans-serif',
                color: allowed ? '#86efac' : '#C19A6B',
              }}
              data-testid="text-perm-status"
            >
              {allowed ? 'الإشعارات مفعّلة' : 'الإشعارات غير مفعّلة'}
            </div>
            <div
              className="text-xs opacity-80 mt-0.5"
              style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
            >
              {allowed
                ? 'سيصلك الأذان في وقته بإذن الله'
                : 'اضغط زر السماح وسيظهر لك إذن الجهاز'}
            </div>
          </div>
        </div>

        {!allowed && (
          <button
            onClick={handleAllow}
            disabled={requesting}
            data-testid="button-allow-notifications"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold disabled:opacity-60 active:scale-[0.99] transition-transform"
            style={{
              background: 'linear-gradient(135deg, #C19A6B, #8B6340)',
              color: '#fff',
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            {requesting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            السماح بالإشعارات
          </button>
        )}
      </div>

      {/* master switch */}
      <div
        className="rounded-2xl p-4 mb-4 flex items-center justify-between"
        style={{
          background: 'rgba(193,154,107,0.06)',
          border: '1px solid rgba(193,154,107,0.18)',
        }}
      >
        <div>
          <div
            className="text-base font-bold"
            style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
          >
            تفعيل تنبيهات الأذان
          </div>
          <div
            className="text-xs opacity-70"
            style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
          >
            يتم إعادة الجدولة لمدة ٣٠ يوم عند كل تسجيل دخول
          </div>
        </div>
        <button
          onClick={() => handleToggleEnabled(!prefs.enabled)}
          data-testid="switch-enabled"
          className="relative w-14 h-8 rounded-full transition-colors"
          style={{
            background: prefs.enabled ? '#C19A6B' : 'rgba(193,154,107,0.25)',
          }}
          aria-label="تفعيل التنبيهات"
        >
          <motion.div
            animate={{ x: prefs.enabled ? -24 : 0 }}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white shadow"
          />
        </button>
      </div>

      {/* per-prayer mode picker */}
      <div className="space-y-3 mb-4">
        {PRAYER_KEYS.map((key) => {
          const current = prefs.modes[key];
          return (
            <div
              key={key}
              className="rounded-2xl p-3"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(193,154,107,0.18)',
                opacity: prefs.enabled ? 1 : 0.45,
              }}
            >
              <div
                className="text-base font-bold mb-2 px-1"
                style={{ fontFamily: '"Amiri", serif', color: '#C19A6B' }}
                data-testid={`text-prayer-${key}`}
              >
                {PRAYER_NAMES_AR[key]}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={!prefs.enabled}
                      onClick={() => handleModeChange(key, opt.value)}
                      data-testid={`button-mode-${key}-${opt.value}`}
                      className="flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                      style={{
                        background: active
                          ? 'linear-gradient(135deg, rgba(193,154,107,0.35), rgba(193,154,107,0.12))'
                          : 'rgba(255,255,255,0.03)',
                        border: active
                          ? '1.5px solid rgba(193,154,107,0.7)'
                          : '1px solid rgba(193,154,107,0.18)',
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: active ? '#FFE08A' : '#C19A6B' }}
                      />
                      <span
                        className="text-xs"
                        style={{
                          fontFamily: '"Tajawal", sans-serif',
                          color: active ? '#FFE08A' : '#C19A6B',
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* athan reciter picker */}
      <div
        className="rounded-2xl p-3 mb-4"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(193,154,107,0.18)',
        }}
      >
        <div
          className="text-base font-bold mb-3 px-1"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
        >
          صوت الأذان
        </div>
        <div
          className="space-y-2 overflow-y-auto pr-1"
          style={{ maxHeight: '40vh' }}
        >
          {ADHAN_RECITERS.map((r) => {
            const active = prefs.athanReciterId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => handleReciter(r.id)}
                data-testid={`button-reciter-${r.id}`}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-right"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(193,154,107,0.3), rgba(193,154,107,0.08))'
                    : 'rgba(255,255,255,0.03)',
                  border: active
                    ? '1.5px solid rgba(193,154,107,0.6)'
                    : '1px solid rgba(193,154,107,0.15)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: active ? '#C19A6B' : 'rgba(193,154,107,0.15)',
                  }}
                >
                  {active ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#C19A6B]" />
                  )}
                </div>
                <div className="flex-1 text-right">
                  <div
                    className="text-sm font-bold"
                    style={{
                      fontFamily: '"Tajawal", sans-serif',
                      color: active ? '#FFE08A' : '#C19A6B',
                    }}
                  >
                    {r.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={handleTest}
          disabled={busy}
          data-testid="button-test-notification"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold disabled:opacity-50"
          style={{
            background: 'rgba(193,154,107,0.15)',
            border: '1.5px solid rgba(193,154,107,0.4)',
            color: '#C19A6B',
            fontFamily: '"Tajawal", sans-serif',
          }}
        >
          <PlayCircle className="w-5 h-5" />
          تجربة
        </button>
        <button
          onClick={handleReschedule}
          disabled={busy || !prefs.enabled}
          data-testid="button-reschedule"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl font-bold disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #C19A6B, #8B6340)',
            color: '#fff',
            fontFamily: '"Tajawal", sans-serif',
          }}
        >
          {busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          جدولة الشهر
        </button>
      </div>

      {/* status flash */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-3 text-sm text-center mb-3"
          style={{
            background:
              status.tone === 'err'
                ? 'rgba(239,68,68,0.12)'
                : status.tone === 'warn'
                  ? 'rgba(234,179,8,0.12)'
                  : 'rgba(193,154,107,0.15)',
            border: `1px solid ${
              status.tone === 'err'
                ? 'rgba(239,68,68,0.35)'
                : status.tone === 'warn'
                  ? 'rgba(234,179,8,0.35)'
                  : 'rgba(193,154,107,0.35)'
            }`,
            color:
              status.tone === 'err'
                ? '#fca5a5'
                : status.tone === 'warn'
                  ? '#fde68a'
                  : '#FFE08A',
            fontFamily: '"Tajawal", sans-serif',
          }}
          data-testid="text-status"
        >
          {status.text}
        </motion.div>
      )}

      {/* advanced (collapsed by default) */}
      <button
        onClick={() => setAdvancedOpen((o) => !o)}
        data-testid="button-toggle-advanced"
        className="w-full flex items-center justify-between py-3 px-4 rounded-2xl mb-2"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(193,154,107,0.18)',
        }}
      >
        <span
          className="text-sm font-bold"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}
        >
          إعدادات متقدمة (إن لم تصل التنبيهات)
        </span>
        <motion.div animate={{ rotate: advancedOpen ? 180 : 0 }}>
          <ChevronDown className="w-4 h-4 text-[#C19A6B]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {advancedOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-2">
              {advancedRows.map((row) => {
                const Icon = row.icon;
                const ok = row.verifiable
                  ? perm[row.key as keyof PermissionStatus]
                  : null;
                return (
                  <button
                    key={row.key}
                    onClick={async () => {
                      await row.action();
                      setTimeout(refreshPerm, 600);
                    }}
                    data-testid={`button-perm-${row.key}`}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-right transition-all active:scale-[0.98]"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(193,154,107,0.15)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          ok === true
                            ? 'rgba(34,197,94,0.18)'
                            : 'rgba(193,154,107,0.15)',
                      }}
                    >
                      {ok === true ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Icon className="w-4 h-4 text-[#C19A6B]" />
                      )}
                    </div>
                    <div className="flex-1 text-right min-w-0">
                      <div
                        className="text-sm font-bold"
                        style={{
                          fontFamily: '"Tajawal", sans-serif',
                          color: ok === true ? '#86efac' : '#C19A6B',
                        }}
                      >
                        {row.title}
                      </div>
                      <div
                        className="text-xs opacity-75"
                        style={{
                          fontFamily: '"Tajawal", sans-serif',
                          color: '#C19A6B',
                        }}
                      >
                        {row.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
