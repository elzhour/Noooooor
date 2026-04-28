import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Volume2,
  Type,
  PlayCircle,
  Loader2,
  Check,
} from 'lucide-react';
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
  ensurePermission,
} from '@/lib/notifications/scheduler';
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
  const [status, setStatus] = useState<string | null>(null);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);

  const profile = useMemo(
    () => getCacheValue<UserProfile | null>('profile', null),
    []
  );

  useEffect(() => {
    ensurePermission().then(setPermGranted).catch(() => setPermGranted(false));
  }, []);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2400);
  };

  const handleModeChange = (key: PrayerKey, mode: NotifyMode) => {
    const updated = setPrayerMode(key, mode);
    setPrefs(updated);
  };

  const handleReciter = (id: string) => {
    const updated = setAthanReciter(id);
    setPrefs(updated);
  };

  const handleToggleEnabled = (v: boolean) => {
    const updated = setEnabled(v);
    setPrefs(updated);
  };

  const handleReschedule = async () => {
    if (!profile?.lat || !profile?.lng) {
      flash('لم يتم تحديد المحافظة بعد');
      return;
    }
    setBusy(true);
    try {
      const ok = await ensurePermission();
      setPermGranted(ok);
      if (!ok) {
        flash('يرجى السماح للتطبيق بإرسال الإشعارات من إعدادات الجهاز');
        return;
      }
      const r = await scheduleMonthOfPrayers({
        lat: profile.lat,
        lng: profile.lng,
        days: 30,
      });
      flash(`تمت جدولة ${r.scheduled || r.events} تنبيه للشهر القادم`);
    } catch (e) {
      console.error(e);
      flash('تعذر جدولة الإشعارات — تأكد من الاتصال بالإنترنت');
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      await scheduleTestNotification('Dhuhr');
      flash('سيتم إطلاق التجربة بعد ٥ ثوانٍ');
    } catch (e) {
      console.error(e);
      flash('تعذر إطلاق التجربة');
    } finally {
      setBusy(false);
    }
  };

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
          style={{ background: prefs.enabled ? '#C19A6B' : 'rgba(193,154,107,0.25)' }}
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
        {PRAYER_KEYS.map(key => {
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
                {MODE_OPTIONS.map(opt => {
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
          {ADHAN_RECITERS.map(r => {
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

      {permGranted === false && (
        <div
          className="rounded-xl p-3 text-sm text-center mb-2"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontFamily: '"Tajawal", sans-serif',
          }}
          data-testid="text-permission-warning"
        >
          إذن الإشعارات غير مفعَّل — افتح إعدادات النظام واسمح للتطبيق بالإشعارات
        </div>
      )}

      {status && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-3 text-sm text-center"
          style={{
            background: 'rgba(193,154,107,0.15)',
            border: '1px solid rgba(193,154,107,0.35)',
            color: '#FFE08A',
            fontFamily: '"Tajawal", sans-serif',
          }}
          data-testid="text-status"
        >
          {status}
        </motion.div>
      )}
    </div>
  );
}
