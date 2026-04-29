/**
 * Full-screen athan popup. Shown when a prayer-time event fires while the app
 * is open (or when the user opens the app from a notification). On Android the
 * native side of Capacitor opens the app on tap, then this component renders.
 *
 * The visual is a stylised Dome of the Rock (قبة الصخرة) with subtle motion.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import { ADHAN_RECITERS } from '@/lib/constants';
import { loadPrefs } from '@/lib/notifications/prefs';
import domeImg from '@assets/qb_lskhr_1774983189616.jpg';

type AthanFireDetail = {
  prayer: string;
  prayerNameAr: string;
  kind: 'athan' | 'text';
};

function DomeOfTheRock() {
  return (
    <svg
      viewBox="0 0 360 280"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md mx-auto"
      style={{ filter: 'drop-shadow(0 0 35px rgba(218,165,32,0.45))' }}
    >
      <defs>
        <radialGradient id="domeGold" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="45%" stopColor="#E5B23A" />
          <stop offset="100%" stopColor="#8C6418" />
        </radialGradient>
        <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2c14" />
          <stop offset="100%" stopColor="#1c150a" />
        </linearGradient>
        <linearGradient id="tileGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f6f9a" />
          <stop offset="100%" stopColor="#0f3a55" />
        </linearGradient>
        <radialGradient id="aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,224,138,0.5)" />
          <stop offset="100%" stopColor="rgba(255,224,138,0)" />
        </radialGradient>
      </defs>

      {/* warm glow halo behind dome */}
      <ellipse cx="180" cy="105" rx="160" ry="100" fill="url(#aura)" />

      {/* tiled octagonal base */}
      <polygon
        points="60,200 105,160 255,160 300,200 300,250 60,250"
        fill="url(#tileGrad)"
        stroke="#C19A6B"
        strokeWidth="1.2"
      />
      {/* tile pattern lines */}
      {[80, 110, 140, 170, 200, 230, 260, 290].map((x, i) => (
        <line
          key={i}
          x1={x}
          y1="160"
          x2={x}
          y2="250"
          stroke="rgba(193,154,107,0.35)"
          strokeWidth="0.6"
        />
      ))}
      {[180, 200, 220].map((y, i) => (
        <line
          key={`h${i}`}
          x1="60"
          y1={y}
          x2="300"
          y2={y}
          stroke="rgba(193,154,107,0.25)"
          strokeWidth="0.6"
        />
      ))}

      {/* arched windows */}
      {[
        [95, 195],
        [135, 195],
        [175, 195],
        [215, 195],
        [255, 195],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <path
            d={`M ${cx - 10} ${cy + 25} L ${cx - 10} ${cy} A 10 12 0 0 1 ${cx + 10} ${cy} L ${cx + 10} ${cy + 25} Z`}
            fill="#1a1306"
            stroke="#C19A6B"
            strokeWidth="0.8"
          />
          <line
            x1={cx}
            y1={cy - 6}
            x2={cx}
            y2={cy + 23}
            stroke="rgba(193,154,107,0.5)"
            strokeWidth="0.6"
          />
        </g>
      ))}

      {/* dome drum (cylindrical band under the dome) */}
      <rect
        x="125"
        y="135"
        width="110"
        height="28"
        fill="url(#wallGrad)"
        stroke="#C19A6B"
        strokeWidth="0.8"
      />
      {/* drum windows */}
      {[140, 160, 180, 200, 220].map((cx, i) => (
        <path
          key={i}
          d={`M ${cx - 4} 158 L ${cx - 4} 144 A 4 5 0 0 1 ${cx + 4} 144 L ${cx + 4} 158 Z`}
          fill="#1a1306"
          stroke="rgba(193,154,107,0.6)"
          strokeWidth="0.5"
        />
      ))}

      {/* the dome itself — wide elliptical golden cap */}
      <path
        d="M 120 135 A 60 78 0 0 1 240 135 Z"
        fill="url(#domeGold)"
        stroke="#7A4F1A"
        strokeWidth="1.2"
      />
      {/* dome ribs */}
      {[140, 155, 170, 180, 190, 205, 220].map((x, i) => (
        <path
          key={i}
          d={`M ${x} 135 Q 180 ${50 + Math.abs(180 - x) * 0.2} 180 60`}
          fill="none"
          stroke="rgba(122,79,26,0.35)"
          strokeWidth="0.5"
        />
      ))}
      {/* dome highlight */}
      <ellipse
        cx="160"
        cy="90"
        rx="22"
        ry="40"
        fill="rgba(255,255,255,0.18)"
      />

      {/* finial (spike) on top with crescent */}
      <line x1="180" y1="60" x2="180" y2="42" stroke="#C19A6B" strokeWidth="2" />
      <circle cx="180" cy="40" r="3" fill="#FFE08A" stroke="#7A4F1A" strokeWidth="0.6" />
      <path
        d="M 180 30 A 7 7 0 1 1 187 25 A 5 5 0 1 0 180 30 Z"
        fill="#FFE08A"
        stroke="#7A4F1A"
        strokeWidth="0.6"
      />

      {/* ground line */}
      <line x1="20" y1="252" x2="340" y2="252" stroke="#C19A6B" strokeWidth="0.8" opacity="0.55" />

      {/* twinkling stars */}
      {[
        [40, 30],
        [70, 18],
        [305, 22],
        [330, 38],
        [22, 80],
        [338, 90],
      ].map(([sx, sy], i) => (
        <circle
          key={`s${i}`}
          cx={sx}
          cy={sy}
          r="1.4"
          fill="#FFE08A"
          opacity={0.55 + (i % 3) * 0.15}
        />
      ))}
    </svg>
  );
}

export function AthanPopup() {
  const [event, setEvent] = useState<AthanFireDetail | null>(null);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AthanFireDetail>).detail;
      if (!detail) return;
      setEvent(detail);
    };
    window.addEventListener('noor:athan-fire', handler as EventListener);
    return () => window.removeEventListener('noor:athan-fire', handler as EventListener);
  }, []);

  // play / stop athan audio when popup opens / closes
  useEffect(() => {
    if (!event) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      return;
    }
    if (event.kind !== 'athan') return;

    const prefs = loadPrefs();
    const reciter =
      ADHAN_RECITERS.find(r => r.id === prefs.athanReciterId) ?? ADHAN_RECITERS[0];

    const a = new Audio(reciter.url);
    a.preload = 'auto';
    a.volume = muted ? 0 : 1;
    a.play().catch(() => {
      // Autoplay may be blocked in browsers — user can tap the unmute button.
    });
    audioRef.current = a;

    return () => {
      a.pause();
      a.src = '';
    };
  }, [event]);

  // react to mute toggle
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : 1;
  }, [muted]);

  const close = () => setEvent(null);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 overflow-hidden"
          style={{ background: '#060810' }}
          dir="rtl"
        >
          {/* Dome of the Rock photo backdrop with slow Ken Burns zoom */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ scale: 1.18 }}
            animate={{ scale: 1.0 }}
            transition={{ duration: 35, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse' }}
          >
            <img
              src={domeImg}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'brightness(0.5) contrast(1.05) saturate(1.1)' }}
            />
          </motion.div>
          {/* warm gold glow + dark vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, rgba(255,210,140,0.22) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(8,10,18,0.45) 0%, rgba(8,10,18,0.85) 100%)',
            }}
          />
          {/* twinkling stars */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[
              { x: 8, y: 12, d: 0 },
              { x: 22, y: 6, d: 0.6 },
              { x: 48, y: 8, d: 1.3 },
              { x: 70, y: 14, d: 0.4 },
              { x: 88, y: 10, d: 1.7 },
              { x: 14, y: 28, d: 1.0 },
              { x: 90, y: 32, d: 0.8 },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: 3,
                  height: 3,
                  background: '#FFE08A',
                  boxShadow: '0 0 8px rgba(255,224,138,0.8)',
                }}
                animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 3, delay: s.d, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Foreground UI wrapper */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
          {/* close button */}
          <button
            onClick={close}
            data-testid="button-close-athan"
            className="absolute top-5 left-5 w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{
              background: 'rgba(255,224,138,0.12)',
              border: '1.5px solid rgba(193,154,107,0.5)',
            }}
            aria-label="إغلاق الأذان"
          >
            <X className="w-6 h-6 text-[#FFE08A]" />
          </button>

          {/* mute / unmute */}
          {event.kind === 'athan' && (
            <button
              onClick={() => setMuted(m => !m)}
              data-testid="button-mute-athan"
              className="absolute top-5 right-5 w-12 h-12 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{
                background: 'rgba(255,224,138,0.12)',
                border: '1.5px solid rgba(193,154,107,0.5)',
              }}
              aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {muted ? (
                <VolumeX className="w-6 h-6 text-[#FFE08A]" />
              ) : (
                <Volume2 className="w-6 h-6 text-[#FFE08A]" />
              )}
            </button>
          )}

          <motion.div
            initial={{ scale: 0.85, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <DomeOfTheRock />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 text-center"
          >
            <div
              className="text-3xl font-bold mb-1"
              style={{
                fontFamily: '"Amiri", serif',
                color: '#FFE08A',
                textShadow: '0 0 18px rgba(255,224,138,0.45)',
              }}
              data-testid="text-prayer-title"
            >
              حان الآن موعد أذان {event.prayerNameAr}
            </div>
            <div
              className="text-sm opacity-80"
              style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}
            >
              اللهم صلِّ وسلِّم على نبينا محمد
            </div>
          </motion.div>

          {/* pulsing ring around the dome */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              width: 380,
              height: 380,
              borderRadius: '50%',
              border: '1px solid rgba(255,224,138,0.25)',
              top: 'calc(50% - 230px)',
            }}
            animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.55, 0.15, 0.55] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
