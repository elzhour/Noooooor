import { useState, useEffect, useMemo, type MouseEvent as ReactMouseEvent } from 'react';
import { ChevronLeft, ChevronRight, X, Sun as SunIcon, Moon as MoonIcon, Sparkles } from 'lucide-react';

type Timings = Record<string, string>;

interface SkySceneProps {
  timings?: Timings;
  hijriLabel: string;
  gregorianLabel: string;
  hijriDay?: number;
  hijriMonthName?: string;
  hijriYear?: string | number;
  dateOffset: number;
  onPrev: () => void;
  onNext: () => void;
  onResetDate: () => void;
  nextPrayerName?: string;
  nextPrayerTime?: string;
  countdown?: string;
}

const DHIKR_POOL = [
  'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
  'سُبْحَانَ اللَّهِ الْعَظِيمِ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
  'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
  'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
  'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
  'اللَّهُ أَكْبَرُ كَبِيرًا',
  'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
  'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
  'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ',
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ',
  'سُبْحَانَ اللَّهِ عَدَدَ خَلْقِهِ',
  'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا',
  'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ',
  'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ',
  'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ',
  'رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا',
];

function toMins(t?: string): number {
  if (!t) return 0;
  const [h, m] = t.substring(0, 5).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fmt12(time?: string): string {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = (mStr ?? '00').substring(0, 2);
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${m} ${period}`;
}

type RGB = [number, number, number];
const hex2rgb = (hex: string): RGB => {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const rgbCss = ([r, g, b]: RGB, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRgb = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

type Keyframe = { mins: number; top: RGB; mid: RGB; bot: RGB; sea: RGB; sun: number; moon: number };

function buildKeyframes(t?: Timings): Keyframe[] {
  const fajr = t ? toMins(t.Fajr) : 5 * 60;
  const sunrise = t ? toMins(t.Sunrise) : 6 * 60;
  const dhuhr = t ? toMins(t.Dhuhr) : 12 * 60;
  const asr = t ? toMins(t.Asr) : 15 * 60 + 30;
  const maghrib = t ? toMins(t.Maghrib) : 17 * 60 + 45;
  const isha = t ? toMins(t.Isha) : 19 * 60;
  return [
    { mins: 0,                        top: hex2rgb('#020314'), mid: hex2rgb('#070a26'), bot: hex2rgb('#0c1240'), sea: hex2rgb('#020a1c'), sun: 0,    moon: 1    },
    { mins: Math.max(0, fajr - 50),   top: hex2rgb('#070a26'), mid: hex2rgb('#0e1338'), bot: hex2rgb('#1a1f4a'), sea: hex2rgb('#040d22'), sun: 0,    moon: 0.95 },
    { mins: fajr,                     top: hex2rgb('#1a1545'), mid: hex2rgb('#5a3370'), bot: hex2rgb('#c45770'), sea: hex2rgb('#1a1640'), sun: 0,    moon: 0.65 },
    { mins: Math.round((fajr + sunrise) / 2), top: hex2rgb('#3d4a8a'), mid: hex2rgb('#c4708e'), bot: hex2rgb('#ffb47b'), sea: hex2rgb('#2d3560'), sun: 0.4, moon: 0.3 },
    { mins: sunrise,                  top: hex2rgb('#7ab2d4'), mid: hex2rgb('#ffc080'), bot: hex2rgb('#ff9050'), sea: hex2rgb('#2a4a6e'), sun: 1,    moon: 0.05 },
    { mins: Math.min(sunrise + 75, dhuhr - 30), top: hex2rgb('#3d8ec4'), mid: hex2rgb('#7ab9dd'), bot: hex2rgb('#b3dcf3'), sea: hex2rgb('#1a4a78'), sun: 1, moon: 0 },
    { mins: dhuhr,                    top: hex2rgb('#1a6fb8'), mid: hex2rgb('#4aa4d6'), bot: hex2rgb('#a8d8f0'), sea: hex2rgb('#0e3868'), sun: 1,    moon: 0    },
    { mins: asr,                      top: hex2rgb('#3a7eb8'), mid: hex2rgb('#7aa8d0'), bot: hex2rgb('#d4c896'), sea: hex2rgb('#143a60'), sun: 1,    moon: 0    },
    { mins: Math.max(0, maghrib - 35), top: hex2rgb('#4a5c8a'), mid: hex2rgb('#d68a55'), bot: hex2rgb('#ffa86e'), sea: hex2rgb('#1f3050'), sun: 1,   moon: 0    },
    { mins: maghrib,                  top: hex2rgb('#2d2960'), mid: hex2rgb('#c4577e'), bot: hex2rgb('#ff6b35'), sea: hex2rgb('#1a1c45'), sun: 0.4, moon: 0.2 },
    { mins: maghrib + 30,             top: hex2rgb('#0f1240'), mid: hex2rgb('#3a2865'), bot: hex2rgb('#7a3a6e'), sea: hex2rgb('#0a1030'), sun: 0,    moon: 0.6 },
    { mins: isha,                     top: hex2rgb('#070a26'), mid: hex2rgb('#0e1338'), bot: hex2rgb('#1a1f4a'), sea: hex2rgb('#040d22'), sun: 0,    moon: 0.92 },
    { mins: 24 * 60,                  top: hex2rgb('#020314'), mid: hex2rgb('#070a26'), bot: hex2rgb('#0c1240'), sea: hex2rgb('#020a1c'), sun: 0,    moon: 1    },
  ];
}

function interpolateSky(nowMins: number, kfs: Keyframe[]) {
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i], b = kfs[i + 1];
    if (nowMins >= a.mins && nowMins <= b.mins) {
      const span = Math.max(1, b.mins - a.mins);
      const t = (nowMins - a.mins) / span;
      return {
        top: lerpRgb(a.top, b.top, t),
        mid: lerpRgb(a.mid, b.mid, t),
        bot: lerpRgb(a.bot, b.bot, t),
        sea: lerpRgb(a.sea, b.sea, t),
        sun: lerp(a.sun, b.sun, t),
        moon: lerp(a.moon, b.moon, t),
      };
    }
  }
  const k = kfs[0];
  return { top: k.top, mid: k.mid, bot: k.bot, sea: k.sea, sun: k.sun, moon: k.moon };
}

function getSunPos(nowMins: number, t?: Timings) {
  if (!t) return null;
  const sunrise = toMins(t.Sunrise);
  const maghrib = toMins(t.Maghrib);
  if (nowMins < sunrise || nowMins > maghrib) return null;
  const p = (nowMins - sunrise) / Math.max(1, maghrib - sunrise);
  return { x: 0.92 - p * 0.84, y: 0.55 - Math.sin(p * Math.PI) * 0.42 };
}

function getMoonPos(nowMins: number, t?: Timings) {
  if (!t) return null;
  const sunrise = toMins(t.Sunrise);
  const maghrib = toMins(t.Maghrib);
  const nightLen = (24 * 60 - maghrib) + sunrise;
  let p: number;
  if (nowMins >= maghrib) p = (nowMins - maghrib) / Math.max(1, nightLen);
  else if (nowMins <= sunrise) p = ((24 * 60 - maghrib) + nowMins) / Math.max(1, nightLen);
  else return null;
  return { x: 0.08 + p * 0.84, y: 0.55 - Math.sin(p * Math.PI) * 0.42 };
}

function moonPhaseInfo(day: number) {
  const d = ((Math.max(1, day) - 1) % 30) + 1;
  const ill = Math.round(50 - 50 * Math.cos(((d - 1) / 29) * 2 * Math.PI));
  let name: string;
  if (d <= 1) name = 'محاق';
  else if (d <= 6) name = 'هلال متزايد';
  else if (d === 7 || d === 8) name = 'تربيع أوّل';
  else if (d <= 13) name = 'أحدب متزايد';
  else if (d <= 16) name = 'بدر مكتمل';
  else if (d <= 20) name = 'أحدب متناقص';
  else if (d <= 23) name = 'تربيع أخير';
  else if (d <= 28) name = 'هلال متناقص';
  else name = 'محاق';
  return { name, illumination: ill, isWaxing: d <= 14, day: d };
}

/* Sun SVG with realistic corona */
function SunSvg({ opacity }: { opacity: number }) {
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" style={{ opacity }}>
      <defs>
        <radialGradient id="sun-corona" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor="#fffbe5" stopOpacity="0.95" />
          <stop offset="14%" stopColor="#ffe88a" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#ffb24a" stopOpacity="0.22" />
          <stop offset="75%" stopColor="#ff7a35" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sun-body" cx="38%" cy="36%" r="68%">
          <stop offset="0%"  stopColor="#ffffff" />
          <stop offset="35%" stopColor="#fff2c0" />
          <stop offset="75%" stopColor="#ffc870" />
          <stop offset="100%" stopColor="#fa9a3a" />
        </radialGradient>
        <radialGradient id="sun-flare" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="42" cy="42" r="42" fill="url(#sun-corona)" />
      <circle cx="42" cy="42" r="26" fill="url(#sun-flare)" />
      <circle cx="42" cy="42" r="14" fill="url(#sun-body)" />
      <circle cx="37" cy="37" r="3.5" fill="#ffffff" fillOpacity="0.6" />
    </svg>
  );
}

/* Moon SVG with phase rendering */
function MoonSvg({ phase, opacity, skyDarkColor }: { phase: ReturnType<typeof moonPhaseInfo>; opacity: number; skyDarkColor: string }) {
  const r = 18, cx = 32, cy = 32;
  const i = phase.illumination / 100;
  const offset = phase.isWaxing ? -2 * r * i : 2 * r * i;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ opacity, filter: 'drop-shadow(0 0 18px rgba(220,225,255,0.4))' }}>
      <defs>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="40%" stopColor="#dde2f0" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#a8b0d0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-body" cx="35%" cy="30%" r="72%">
          <stop offset="0%"  stopColor="#fafbf6" />
          <stop offset="50%" stopColor="#e6e2d0" />
          <stop offset="100%" stopColor="#b4ad94" />
        </radialGradient>
        <clipPath id="moon-clip"><circle cx={cx} cy={cy} r={r} /></clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r + 12} fill="url(#moon-glow)" />
      <g clipPath="url(#moon-clip)">
        <circle cx={cx} cy={cy} r={r} fill="url(#moon-body)" />
        {/* Subtle craters */}
        <ellipse cx={cx + 5}  cy={cy - 5} rx="3.2" ry="2.6" fill="rgba(120,115,100,0.22)" />
        <ellipse cx={cx - 4}  cy={cy + 4} rx="2.4" ry="2.0" fill="rgba(120,115,100,0.18)" />
        <circle  cx={cx - 6}  cy={cy - 7} r="1.4"  fill="rgba(120,115,100,0.22)" />
        <circle  cx={cx + 7}  cy={cy + 7} r="1.7"  fill="rgba(120,115,100,0.20)" />
        <circle  cx={cx + 2}  cy={cy + 7} r="0.9"  fill="rgba(120,115,100,0.16)" />
        {/* Phase shadow disc */}
        <circle cx={cx + offset} cy={cy} r={r} fill={skyDarkColor} />
      </g>
    </svg>
  );
}

/* Animated wave layer */
function WaveLayer({ color, duration, top, height }: { color: string; duration: number; top: number; height: number }) {
  return (
    <div className="absolute left-0 right-0 overflow-hidden" style={{ top: `${top}px`, height: `${height}px` }}>
      <svg
        preserveAspectRatio="none"
        viewBox="0 0 200 20"
        style={{ width: '200%', height: '100%', display: 'block', animation: `noor-wave ${duration}s linear infinite` }}
      >
        <path d="M 0,12 Q 12.5,4 25,12 T 50,12 T 75,12 T 100,12 T 125,12 T 150,12 T 175,12 T 200,12 L 200,20 L 0,20 Z" fill={color} />
      </svg>
    </div>
  );
}

/* Bottom sheet for sun/moon info */
function InfoSheet({
  type, onClose, timings, phase, hijriLabel,
}: {
  type: 'sun' | 'moon';
  onClose: () => void;
  timings?: Timings;
  phase: ReturnType<typeof moonPhaseInfo>;
  hijriLabel: string;
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const title = type === 'sun' ? 'الشمس' : 'القمر';
  const Icon = type === 'sun' ? SunIcon : MoonIcon;
  const accent = type === 'sun' ? '#f4a73a' : '#c5cdea';

  const items: { label: string; value: string }[] = [];
  if (type === 'sun' && timings) {
    items.push({ label: 'الشروق', value: fmt12(timings.Sunrise?.substring(0, 5)) });
    items.push({ label: 'الزوال (الظهر)', value: fmt12(timings.Dhuhr?.substring(0, 5)) });
    items.push({ label: 'الغروب', value: fmt12(timings.Maghrib?.substring(0, 5)) });
    const sunrise = toMins(timings.Sunrise);
    const maghrib = toMins(timings.Maghrib);
    const dayLen = maghrib - sunrise;
    items.push({ label: 'طول النهار', value: `${Math.floor(dayLen / 60)} س ${dayLen % 60} د` });
  } else if (type === 'moon') {
    items.push({ label: 'التاريخ الهجري', value: hijriLabel });
    items.push({ label: 'طور القمر', value: phase.name });
    items.push({ label: 'نسبة الإضاءة', value: `${phase.illumination}%` });
    items.push({ label: 'يوم من الشهر', value: `اليوم ${phase.day} من 29/30` });
  }

  const verse = type === 'sun'
    ? { text: 'وَجَعَلَ الْقَمَرَ فِيهِنَّ نُورًا وَجَعَلَ الشَّمْسَ سِرَاجًا', src: 'نوح: 16' }
    : { text: 'هُوَ الَّذِي جَعَلَ الشَّمْسَ ضِيَاءً وَالْقَمَرَ نُورًا وَقَدَّرَهُ مَنَازِلَ', src: 'يونس: 5' };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" dir="rtl" onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-t-3xl shadow-2xl"
        style={{
          background: type === 'sun' ? 'linear-gradient(180deg,#1a0e2a 0%,#0a0816 100%)' : 'linear-gradient(180deg,#0a0e2a 0%,#040814 100%)',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2 bg-white/30" />
        <div className="flex items-center justify-between px-5 pb-3 border-b border-white/10">
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10">
            <X size={16} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: accent }} />
            <span className="text-sm font-bold text-white" style={{ fontFamily: '"Tajawal", sans-serif' }}>{title}</span>
          </div>
        </div>

        <div className="px-5 py-5 space-y-2.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-white/70" style={{ fontFamily: '"Tajawal", sans-serif' }}>{it.label}</span>
              <span className="text-sm font-bold text-white tabular-nums" style={{ fontFamily: '"Tajawal", sans-serif' }}>{it.value}</span>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <p className="text-base leading-loose mb-1" style={{ fontFamily: '"Amiri", serif', color: accent }}>
              {verse.text}
            </p>
            <p className="text-[10px] text-white/50" style={{ fontFamily: '"Tajawal", sans-serif' }}>{verse.src}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Floating dhikr that appears when a star is clicked */
function StarDhikrFloat({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <div
      className="absolute z-40 pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: 'noor-dhikr-float 5s ease-out forwards',
      }}
    >
      <div
        className="px-3 py-1.5 rounded-2xl border border-white/20 shadow-2xl whitespace-nowrap flex items-center gap-1.5"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 20px rgba(255,220,140,0.25)',
        }}
      >
        <Sparkles size={11} style={{ color: '#ffe082' }} />
        <p className="text-xs font-bold text-white" style={{ fontFamily: '"Amiri", serif' }}>{text}</p>
      </div>
    </div>
  );
}

export function SkyScene({
  timings, hijriLabel, gregorianLabel, hijriDay = 1,
  dateOffset, onPrev, onNext, onResetDate,
  nextPrayerName, nextPrayerTime, countdown,
}: SkySceneProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [info, setInfo] = useState<null | 'sun' | 'moon'>(null);
  const [starDhikr, setStarDhikr] = useState<null | { id: number; text: string; x: number; y: number }>(null);

  /* Re-evaluate scene every minute (sun moves slowly) */
  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = window.setInterval(tick, 60000);
    const onVis = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const keyframes = useMemo(() => buildKeyframes(timings), [timings]);
  const sky = useMemo(() => interpolateSky(nowMins, keyframes), [nowMins, keyframes]);
  const sunPos = useMemo(() => getSunPos(nowMins, timings), [nowMins, timings]);
  const moonPos = useMemo(() => getMoonPos(nowMins, timings), [nowMins, timings]);
  const phase = useMemo(() => moonPhaseInfo(hijriDay), [hijriDay]);

  /* Generate stars once with deterministic seed */
  const stars = useMemo(() => {
    let seed = 42;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const arr: { id: number; x: number; y: number; size: number; brightness: number; delay: number; duration: number; spike?: boolean }[] = [];
    for (let i = 0; i < 110; i++) {
      arr.push({
        id: i,
        x: rand() * 98 + 1,
        y: rand() * 55 + 2,
        size: 0.4 + Math.pow(rand(), 2.5) * 1.6,
        brightness: 0.4 + rand() * 0.6,
        delay: rand() * 5,
        duration: 2.4 + rand() * 3.2,
        spike: rand() > 0.92,
      });
    }
    return arr;
  }, []);

  /* Stars only visible when sky is dark; fade with sun */
  const starOpacity = Math.max(0, Math.min(1, 1 - sky.sun));

  const skyGradient = `linear-gradient(to bottom, ${rgbCss(sky.top)} 0%, ${rgbCss(sky.mid)} 45%, ${rgbCss(sky.bot)} 88%, ${rgbCss(sky.bot, 0.92)} 100%)`;

  const handleStarClick = (e: ReactMouseEvent, s: typeof stars[0]) => {
    e.stopPropagation();
    const text = DHIKR_POOL[Math.floor(Math.random() * DHIKR_POOL.length)];
    const id = Date.now();
    setStarDhikr({ id, text, x: s.x, y: s.y });
    window.setTimeout(() => {
      setStarDhikr(prev => (prev?.id === id ? null : prev));
    }, 5100);
  };

  const SCENE_HEIGHT = 380;
  const SKY_PCT = 62; // top portion that is "sky"

  return (
    <>
      <style>{`
        @keyframes noor-wave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes noor-twinkle {
          0%, 100% { opacity: var(--tw-min,0.3); transform: scale(1); }
          50% { opacity: var(--tw-max,1); transform: scale(1.15); }
        }
        @keyframes noor-dhikr-float {
          0%   { opacity: 0; transform: translate(-50%, 6px) scale(0.6); }
          18%  { opacity: 1; transform: translate(-50%, -6px) scale(1); }
          78%  { opacity: 1; transform: translate(-50%, -28px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50px) scale(1); }
        }
        @keyframes noor-shimmer {
          0%, 100% { opacity: 0.18; }
          50% { opacity: 0.32; }
        }
      `}</style>

      <div
        className="relative w-full overflow-hidden rounded-3xl shadow-2xl select-none"
        style={{ height: SCENE_HEIGHT, background: skyGradient, boxShadow: '0 16px 48px -12px rgba(8,12,30,0.55)' }}
      >
        {/* ─── STARS (clipped to sky region) ────────────────────── */}
        <div
          className="absolute inset-x-0 top-0"
          style={{ height: `${SKY_PCT}%`, opacity: starOpacity, transition: 'opacity 1.5s ease-out' }}
        >
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            {stars.map(s => (
              <g key={s.id}>
                {s.spike && (
                  <line
                    x1={s.x - s.size * 1.6} y1={s.y}
                    x2={s.x + s.size * 1.6} y2={s.y}
                    stroke="#ffffff" strokeWidth={s.size * 0.18} strokeLinecap="round" opacity={s.brightness * 0.45}
                    pointerEvents="none"
                  />
                )}
                {s.spike && (
                  <line
                    x1={s.x} y1={s.y - s.size * 1.6}
                    x2={s.x} y2={s.y + s.size * 1.6}
                    stroke="#ffffff" strokeWidth={s.size * 0.18} strokeLinecap="round" opacity={s.brightness * 0.45}
                    pointerEvents="none"
                  />
                )}
                <circle
                  cx={s.x} cy={s.y} r={s.size * 0.6}
                  fill="#ffffff"
                  opacity={s.brightness}
                  style={{
                    animation: `noor-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
                    transformOrigin: `${s.x}% ${s.y}%`,
                    cursor: 'pointer',
                    ['--tw-min' as string]: String(s.brightness * 0.35),
                    ['--tw-max' as string]: String(s.brightness),
                  } as React.CSSProperties}
                  onClick={(e) => handleStarClick(e, s)}
                />
              </g>
            ))}
          </svg>
        </div>

        {/* ─── SUN ───────────────────────────────────────────── */}
        {sunPos && sky.sun > 0.08 && (
          <button
            type="button"
            onClick={() => setInfo('sun')}
            className="absolute z-10 transition-transform active:scale-95"
            style={{
              left: `${sunPos.x * 100}%`,
              top: `${sunPos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              padding: 0, background: 'transparent', border: 'none', cursor: 'pointer',
            }}
            aria-label="معلومات الشمس"
          >
            <SunSvg opacity={sky.sun} />
          </button>
        )}

        {/* ─── MOON ──────────────────────────────────────────── */}
        {moonPos && sky.moon > 0.08 && (
          <button
            type="button"
            onClick={() => setInfo('moon')}
            className="absolute z-10 transition-transform active:scale-95"
            style={{
              left: `${moonPos.x * 100}%`,
              top: `${moonPos.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              padding: 0, background: 'transparent', border: 'none', cursor: 'pointer',
            }}
            aria-label="معلومات القمر"
          >
            <MoonSvg phase={phase} opacity={sky.moon} skyDarkColor={rgbCss(sky.top)} />
          </button>
        )}

        {/* ─── HORIZON GLOW (subtle line where sky meets sea) ─── */}
        <div
          className="absolute inset-x-0 z-[5] pointer-events-none"
          style={{
            top: `${SKY_PCT}%`,
            transform: 'translateY(-50%)',
            height: 24,
            background: `radial-gradient(ellipse at center, ${rgbCss(sky.bot, 0.5)} 0%, transparent 70%)`,
            filter: 'blur(2px)',
          }}
        />

        {/* ─── SEA ───────────────────────────────────────────── */}
        <div className="absolute inset-x-0 bottom-0 z-[6] overflow-hidden" style={{ height: `${100 - SKY_PCT}%` }}>
          {/* Sea base gradient (top reflects sky horizon, deepens to dark) */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${rgbCss(sky.bot, 0.85)} 0%, ${rgbCss(sky.sea, 1)} 55%, ${rgbCss(sky.sea, 1)} 100%)`,
            }}
          />
          {/* Reflection shimmer */}
          <div
            className="absolute inset-x-0"
            style={{
              top: 0, height: 40,
              background: `linear-gradient(to bottom, ${rgbCss([255, 255, 255], 0.06)} 0%, transparent 100%)`,
              animation: 'noor-shimmer 6s ease-in-out infinite',
            }}
          />
          {/* Wave layers (back → front) */}
          <WaveLayer color={rgbCss(sky.bot, 0.35)} duration={32} top={4}  height={36} />
          <WaveLayer color={rgbCss([255, 255, 255], 0.07)} duration={24} top={20} height={32} />
          <WaveLayer color={rgbCss(sky.sea, 0.65)} duration={18} top={42} height={32} />
          <WaveLayer color={rgbCss([255, 255, 255], 0.05)} duration={14} top={70} height={28} />
          {/* Bottom darkening */}
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: 40,
              background: `linear-gradient(to bottom, transparent 0%, ${rgbCss(sky.sea, 0.7)} 100%)`,
            }}
          />
        </div>

        {/* ─── DATE CONTROLS (top) ───────────────────────────── */}
        <div className="absolute top-0 inset-x-0 z-30 px-4 pt-3">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onPrev}
              className="p-1.5 rounded-full transition-colors hover:bg-white/25"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}
              aria-label="اليوم السابق"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <div className="text-center">
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: '"Tajawal", sans-serif', textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}>
                {hijriLabel}
              </p>
              <p className="text-white/75 text-[10px] mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.55)' }}>
                {gregorianLabel}
              </p>
            </div>
            <button
              onClick={onNext}
              className="p-1.5 rounded-full transition-colors hover:bg-white/25"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)' }}
              aria-label="اليوم التالي"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          </div>
          {dateOffset !== 0 && (
            <button
              onClick={onResetDate}
              className="block mx-auto mt-1 text-[10px] text-white/80 underline"
              style={{ fontFamily: '"Tajawal", sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
            >
              {dateOffset > 0 ? `+${dateOffset} أيام` : `${dateOffset} أيام`} — العودة لليوم
            </button>
          )}
        </div>

        {/* ─── COUNTDOWN OVER SEA ────────────────────────────── */}
        {nextPrayerName && nextPrayerTime ? (
          <div
            className="absolute inset-x-0 z-20 flex flex-col items-center justify-center px-4"
            style={{ top: `${SKY_PCT}%`, height: `${100 - SKY_PCT}%`, pointerEvents: 'none' }}
          >
            <p
              className="text-white/85 text-[11px] mb-1 tracking-[0.3em]"
              style={{ fontFamily: '"Tajawal", sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
            >
              الصلاة القادمة
            </p>
            <p
              className="text-2xl font-bold mb-2 text-white"
              style={{
                fontFamily: '"Amiri", serif',
                textShadow: '0 2px 12px rgba(0,0,0,0.7), 0 0 32px rgba(255,220,140,0.35)',
              }}
            >
              {nextPrayerName}
            </p>
            <div className="flex items-center gap-1 mb-1.5" style={{ direction: 'ltr' }}>
              {(countdown || '00:00:00').split(':').map((seg, i, arr) => (
                <div key={i} className="flex items-center gap-1">
                  <div
                    className="rounded-xl px-3 py-1.5 min-w-[52px] text-center border"
                    style={{
                      background: 'rgba(0,0,0,0.32)',
                      backdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255,255,255,0.14)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    <span
                      className="text-2xl font-bold tabular-nums text-white"
                      style={{
                        fontFamily: '"Tajawal", monospace',
                        letterSpacing: '-0.02em',
                        textShadow: '0 0 10px rgba(255,255,255,0.35)',
                      }}
                    >
                      {seg}
                    </span>
                  </div>
                  {i < arr.length - 1 && <span className="text-white/75 text-xl font-bold">:</span>}
                </div>
              ))}
            </div>
            <p
              className="text-[11px] text-white/85 tabular-nums"
              style={{ fontFamily: '"Tajawal", sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
            >
              {fmt12(nextPrayerTime)}
            </p>
          </div>
        ) : (
          <div
            className="absolute inset-x-0 z-20 flex items-center justify-center"
            style={{ top: `${SKY_PCT}%`, height: `${100 - SKY_PCT}%` }}
          >
            <p
              className="text-white/70 text-sm"
              style={{ fontFamily: '"Tajawal", sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.55)' }}
            >
              {dateOffset !== 0
                ? (dateOffset > 0 ? `مواقيت بعد ${dateOffset} ${dateOffset === 1 ? 'يوم' : 'أيام'}` : `مواقيت قبل ${Math.abs(dateOffset)} ${Math.abs(dateOffset) === 1 ? 'يوم' : 'أيام'}`)
                : 'جارِ تحميل المواقيت...'}
            </p>
          </div>
        )}

        {/* ─── STAR DHIKR FLOATING ──────────────────────────── */}
        {starDhikr && <StarDhikrFloat text={starDhikr.text} x={starDhikr.x} y={starDhikr.y} />}
      </div>

      {/* ─── INFO MODAL ──────────────────────────────────── */}
      {info && (
        <InfoSheet
          type={info}
          onClose={() => setInfo(null)}
          timings={timings}
          phase={phase}
          hijriLabel={hijriLabel}
        />
      )}
    </>
  );
}
