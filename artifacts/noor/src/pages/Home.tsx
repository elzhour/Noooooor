import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { usePrayerTimes } from '@/hooks/use-api';
import { HomeTracker } from '@/components/HomeTracker';
import { getProfileCache } from '@/lib/rtdb';
import { SkyScene } from '@/components/SkyScene';

const PRAYERS = [
  { id: 'Fajr',    name: 'الفجر'  },
  { id: 'Sunrise', name: 'الشروق' },
  { id: 'Dhuhr',   name: 'الظهر'  },
  { id: 'Asr',     name: 'العصر'  },
  { id: 'Maghrib', name: 'المغرب' },
  { id: 'Isha',    name: 'العشاء' },
];

function fmt12(time: string): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = (mStr ?? '00').substring(0, 2);
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function offsetDate(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

/* 3D Clock SVG icon */
function Clock3DIcon({ size = 20 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.42;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <defs>
        <radialGradient id="clockFace" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.06" />
        </radialGradient>
      </defs>
      {/* Shadow */}
      <circle cx={c + size * 0.04} cy={c + size * 0.05} r={r} fill="currentColor" fillOpacity="0.12" />
      {/* Face */}
      <circle cx={c} cy={c} r={r} fill="url(#clockFace)" stroke="currentColor" strokeWidth={size * 0.07} strokeOpacity="0.9" />
      {/* Top highlight arc */}
      <path
        d={`M ${c - r * 0.55} ${c - r * 0.55} A ${r * 0.85} ${r * 0.85} 0 0 1 ${c + r * 0.45} ${c - r * 0.65}`}
        stroke="white" strokeWidth={size * 0.045} strokeOpacity="0.38" fill="none" strokeLinecap="round"
      />
      {/* Hour marks */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => {
        const rad = (deg - 90) * Math.PI / 180;
        const len = i % 3 === 0 ? size * 0.09 : size * 0.05;
        const x1 = c + (r - size * 0.03) * Math.cos(rad);
        const y1 = c + (r - size * 0.03) * Math.sin(rad);
        const x2 = c + (r - size * 0.03 - len) * Math.cos(rad);
        const y2 = c + (r - size * 0.03 - len) * Math.sin(rad);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="currentColor" strokeWidth={i % 3 === 0 ? size * 0.055 : size * 0.03}
            strokeOpacity={i % 3 === 0 ? 0.8 : 0.45} strokeLinecap="round" />
        );
      })}
      {/* Hour hand (pointing to ~10) */}
      <line x1={c} y1={c}
        x2={c + r * 0.5 * Math.cos((300 - 90) * Math.PI / 180)}
        y2={c + r * 0.5 * Math.sin((300 - 90) * Math.PI / 180)}
        stroke="currentColor" strokeWidth={size * 0.09} strokeLinecap="round" strokeOpacity="0.95" />
      {/* Minute hand (pointing to ~12) */}
      <line x1={c} y1={c}
        x2={c + r * 0.7 * Math.cos((-90) * Math.PI / 180)}
        y2={c + r * 0.7 * Math.sin((-90) * Math.PI / 180)}
        stroke="currentColor" strokeWidth={size * 0.06} strokeLinecap="round" strokeOpacity="0.85" />
      {/* Center dot */}
      <circle cx={c} cy={c} r={size * 0.07} fill="currentColor" />
      <circle cx={c - size * 0.02} cy={c - size * 0.02} r={size * 0.03} fill="white" fillOpacity="0.6" />
    </svg>
  );
}

export function Home() {
  const [dateOffset, setDateOffset] = useState(0);

  const userProfile = getProfileCache();
  const lat = userProfile?.lat ?? null;
  const lng = userProfile?.lng ?? null;

  const { data: prayerResult } = usePrayerTimes(lat, lng, dateOffset);
  const times = prayerResult?.timings;
  const hijri = prayerResult?.hijri;

  const [nextPrayer, setNextPrayer] = useState<{ name: string; time24: string } | null>(null);
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!times || dateOffset !== 0) return;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let found = false;
    for (const p of PRAYERS) {
      const t24 = (times[p.id] ?? '').substring(0, 5);
      if (t24 && toMins(t24) > nowMins) {
        setNextPrayer({ name: p.name, time24: t24 });
        found = true;
        break;
      }
    }
    if (!found && times['Fajr']) {
      setNextPrayer({ name: 'الفجر', time24: times['Fajr'].substring(0, 5) });
    }
  }, [times, dateOffset]);

  useEffect(() => {
    if (!nextPrayer || dateOffset !== 0) return;
    const tick = () => {
      const now = new Date();
      const [ph, pm] = nextPrayer.time24.split(':').map(Number);
      const target = new Date();
      target.setHours(ph, pm, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const totalSecs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      const hh = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
      const mm = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
      const ss = (totalSecs % 60).toString().padStart(2, '0');
      setCountdown(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextPrayer, dateOffset]);

  const displayDate = offsetDate(dateOffset);
  const displayHijriLabel = hijri
    ? `${hijri.day} ${hijri.month?.ar ?? ''} ${hijri.year} هـ`
    : new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(displayDate);

  const displayGregorianLabel = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(displayDate);

  const hijriDayNum = hijri?.day ? parseInt(String(hijri.day), 10) : 1;

  return (
    <div className="pb-24 pt-4 max-w-xl mx-auto space-y-5" dir="rtl">
      {/* Sky + Sea Hero Scene */}
      <div className="px-3">
        <SkyScene
          timings={times}
          hijriLabel={displayHijriLabel}
          gregorianLabel={displayGregorianLabel}
          hijriDay={hijriDayNum}
          dateOffset={dateOffset}
          onPrev={() => setDateOffset(d => d - 1)}
          onNext={() => setDateOffset(d => d + 1)}
          onResetDate={() => setDateOffset(0)}
          nextPrayerName={dateOffset === 0 && nextPrayer ? nextPrayer.name : undefined}
          nextPrayerTime={dateOffset === 0 && nextPrayer ? nextPrayer.time24 : undefined}
          countdown={countdown}
        />
      </div>

      {/* Prayer Times Grid */}
      <div className="mx-4 bg-card rounded-3xl p-5 shadow-sm border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            <span className="text-primary">
              <Clock3DIcon size={22} />
            </span>
            مواقيت الصلاة
          </h2>
          {userProfile?.governorateName && (
            <span className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              <MapPin className="w-3 h-3" />
              {userProfile.governorateName}
            </span>
          )}
        </div>

        {times ? (
          <div className="grid grid-cols-2 gap-2.5">
            {PRAYERS.map(p => {
              const t24 = (times[p.id] ?? '').substring(0, 5);
              const isNext = dateOffset === 0 && nextPrayer?.name === p.name;
              return (
                <div
                  key={p.id}
                  className={`flex justify-between items-center px-4 py-3 rounded-2xl border transition-all ${
                    isNext ? 'bg-primary/15 border-primary/50 shadow-sm shadow-primary/10' : 'bg-secondary/40 border-border/40'
                  }`}
                >
                  <span className={`font-medium text-sm ${isNext ? 'text-primary font-bold' : 'text-foreground/70'}`} style={{ fontFamily: '"Tajawal", sans-serif' }}>{p.name}</span>
                  <span className={`font-bold text-base tabular-nums ${isNext ? 'text-primary' : 'text-foreground/90'}`} style={{ fontFamily: '"Tajawal", sans-serif' }}>{fmt12(t24)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            {!lat ? (
              <div>
                <p>لم يتم تحديد الموقع</p>
                <p className="text-xs mt-1">اذهب للمزيد وحدد محافظتك</p>
              </div>
            ) : (
              <div className="animate-pulse">جاري تحميل المواقيت...</div>
            )}
          </div>
        )}
      </div>

      {/* Daily Tracker */}
      <HomeTracker />

      {/* Dhikr Footer */}
      <div className="mt-6 mb-4 mx-4 text-center">
        <div className="h-px mb-4 opacity-20" style={{ background: 'linear-gradient(to left, transparent, currentColor, transparent)' }} />
        <p className="text-sm leading-loose text-muted-foreground" style={{ fontFamily: '"Amiri", serif' }}>
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ ۝ البقرة: 201
        </p>
      </div>
    </div>
  );
}
