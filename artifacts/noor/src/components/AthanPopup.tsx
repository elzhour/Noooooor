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

/**
 * Large circular Noor app logo with luminous gold ring + animated halo.
 * Replaces the previous mosque/dome SVG so the dome-of-the-rock photo backdrop
 * stays the visual focus.
 */
function NoorBigCircleLogo() {
  return (
    <div
      className="relative mx-auto"
      style={{ width: 220, height: 220 }}
    >
      {/* outer halo */}
      <motion.div
        className="absolute inset-[-30px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(255,224,138,0.55) 0%, rgba(255,224,138,0) 70%)',
          filter: 'blur(14px)',
        }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* gold gradient ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 220deg, #FFE08A, #C19A6B, #7A4F1A, #FFE08A, #C19A6B)',
          padding: 4,
          boxShadow: '0 0 50px rgba(255,224,138,0.45)',
        }}
      >
        {/* inner dark core */}
        <div
          className="w-full h-full rounded-full flex flex-col items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, #1a1408 0%, #060810 80%)',
            border: '1.5px solid rgba(245,230,200,0.25)',
            boxShadow:
              'inset 0 0 50px rgba(193,154,107,0.3)',
          }}
        >
          {/* crescent above */}
          <svg width={36} height={28} viewBox="0 0 36 28" className="mb-2">
            <path
              d="M 18 3 A 11 11 0 1 0 28 19 A 8 8 0 1 1 18 3 Z"
              fill="#FFE08A"
              opacity={0.95}
            />
          </svg>
          {/* نُور */}
          <span
            style={{
              fontFamily: '"Amiri", "Scheherazade New", serif',
              fontSize: '3.6rem',
              lineHeight: 1,
              color: '#F5E6C8',
              textShadow:
                '0 0 22px rgba(255,224,138,0.85), 0 0 50px rgba(255,224,138,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            نُور
          </span>
          <span
            style={{
              fontFamily: '"Tajawal", sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.36em',
              color: 'rgba(255,224,138,0.75)',
              marginTop: '0.5rem',
            }}
          >
            NOOR
          </span>
        </div>
      </div>
    </div>
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
              <NoorBigCircleLogo />
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
