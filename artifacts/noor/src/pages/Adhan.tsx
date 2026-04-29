import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Square, Volume2 } from 'lucide-react';
import { Link } from 'wouter';
import { useUserSetting } from '@/hooks/use-user-setting';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { ADHAN_RECITERS } from '@/lib/constants';
import { setAthanReciter } from '@/lib/notifications/prefs';
import domeImg from '@assets/qb_lskhr_1774983189616.jpg';

/**
 * Circular Noor app logo — gold gradient ring with the Arabic "نُور" wordmark
 * at the centre. Replaces the old detailed mosque illustration.
 */
function NoorCircleLogo() {
  return (
    <div className="relative mx-auto" style={{ width: 156, height: 156 }}>
      {/* outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(193,154,107,0.55) 0%, rgba(193,154,107,0) 65%)',
          filter: 'blur(8px)',
        }}
        animate={{ opacity: [0.55, 0.95, 0.55] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* gradient ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 220deg, #d4b483, #C19A6B, #8a6a3a, #d4b483, #C19A6B)',
          padding: 3,
        }}
      >
        {/* inner dark fill */}
        <div
          className="w-full h-full rounded-full flex flex-col items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, #1a1408 0%, #060810 80%)',
            border: '1px solid rgba(245,230,200,0.2)',
            boxShadow:
              'inset 0 0 30px rgba(193,154,107,0.25), 0 0 24px rgba(193,154,107,0.4)',
          }}
        >
          {/* tiny crescent above the wordmark */}
          <svg width={26} height={20} viewBox="0 0 26 20" className="mb-1">
            <path
              d="M 13 2 A 8 8 0 1 0 21 14 A 6 6 0 1 1 13 2 Z"
              fill="#d4b483"
              opacity={0.9}
            />
          </svg>
          {/* نُور wordmark */}
          <span
            style={{
              fontFamily: '"Amiri", "Scheherazade New", serif',
              fontSize: '2.6rem',
              lineHeight: 1,
              color: '#F5E6C8',
              textShadow:
                '0 0 18px rgba(193,154,107,0.75), 0 0 36px rgba(193,154,107,0.35)',
              letterSpacing: '0.02em',
            }}
          >
            نُور
          </span>
          <span
            style={{
              fontFamily: '"Tajawal", sans-serif',
              fontSize: '0.6rem',
              letterSpacing: '0.32em',
              color: 'rgba(193,154,107,0.7)',
              marginTop: '0.35rem',
            }}
          >
            NOOR
          </span>
        </div>
      </div>
    </div>
  );
}

export function Adhan() {
  const [reciterId, setReciterId] = useUserSetting<string>('adhan_reciter', 'azan1');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Record<string, HTMLAudioElement>>({});

  const selectedReciter = ADHAN_RECITERS.find(r => r.id === reciterId) ?? ADHAN_RECITERS[0];

  // Preload selected reciter + neighbors for instant playback
  useEffect(() => {
    const preload = (id: string, url: string, mode: 'auto' | 'metadata') => {
      if (cacheRef.current[id]) return;
      const a = new Audio();
      a.preload = mode;
      a.src = url;
      a.load();
      cacheRef.current[id] = a;
    };

    const idx = ADHAN_RECITERS.findIndex(r => r.id === selectedReciter.id);
    preload(selectedReciter.id, selectedReciter.url, 'auto');
    for (let i = 1; i <= 3; i++) {
      const next = ADHAN_RECITERS[idx + i];
      if (next) preload(next.id, next.url, 'metadata');
      const prev = ADHAN_RECITERS[idx - i];
      if (prev) preload(prev.id, prev.url, 'metadata');
    }
  }, [selectedReciter]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playAdhan = (id: string, url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (playingId === id) {
      setPlayingId(null);
      audioRef.current = null;
      return;
    }
    let a = cacheRef.current[id];
    if (!a) {
      a = new Audio();
      a.preload = 'auto';
      a.src = url;
      a.load();
      cacheRef.current[id] = a;
    }
    a.currentTime = 0;
    audioRef.current = a;
    const p = a.play();
    if (p) p.catch(() => {});
    setPlayingId(id);
    a.onended = () => setPlayingId(null);
    a.onerror = () => setPlayingId(null);
  };

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = null;
    setPlayingId(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col max-w-lg mx-auto relative overflow-hidden"
      dir="rtl"
      style={{ background: '#060810' }}
    >
      {/* ── Dome of the Rock background with slow Ken Burns zoom ── */}
      <motion.div
        className="absolute inset-0 w-full h-full pointer-events-none"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1.0 }}
        transition={{ duration: 30, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse' }}
      >
        <img
          src={domeImg}
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.55) contrast(1.05) saturate(1.05)' }}
        />
      </motion.div>
      {/* warm gold overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 25%, rgba(255,210,140,0.18) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, rgba(8,10,18,0.35) 0%, rgba(8,10,18,0.85) 75%, rgba(8,10,18,0.95) 100%)',
        }}
      />
      {/* gentle twinkling stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { x: 10, y: 8, d: 0 },
          { x: 30, y: 14, d: 0.7 },
          { x: 55, y: 6, d: 1.4 },
          { x: 78, y: 12, d: 0.3 },
          { x: 90, y: 22, d: 1.1 },
          { x: 18, y: 30, d: 1.8 },
          { x: 70, y: 36, d: 0.9 },
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
              boxShadow: '0 0 6px rgba(255,224,138,0.7)',
            }}
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 2.8, delay: s.d, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* ── Foreground content ── */}
      <div className="relative z-10 flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Link href="/">
          <button
            className="p-2 rounded-full"
            style={{ background: 'rgba(193,154,107,0.15)', border: '1px solid rgba(193,154,107,0.3)' }}
            onClick={stopAll}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#C19A6B' }} />
          </button>
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}>
          اختيار صوت الأذان
        </h1>
      </div>

      {/* Circular Noor logo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="px-6 pt-2 pb-4"
      >
        <NoorCircleLogo />

        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to right, transparent, rgba(193,154,107,0.5))' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.7 }} />
          <div className="w-2 h-2 rounded-full" style={{ background: '#C19A6B' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#C19A6B', opacity: 0.7 }} />
          <div className="h-px flex-1 max-w-[60px]" style={{ background: 'linear-gradient(to left, transparent, rgba(193,154,107,0.5))' }} />
        </div>

        <p
          className="text-center mt-3 text-lg tracking-wider"
          style={{ fontFamily: '"Amiri", serif', color: '#d4b483', textShadow: '0 0 16px rgba(193,154,107,0.3)' }}
        >
          حَيَّ عَلَى الصَّلَاةِ
        </p>
        <p className="text-center text-xs mt-1" style={{ color: 'rgba(193,154,107,0.5)', fontFamily: '"Tajawal", sans-serif' }}>
          اختر المؤذن المفضل لديك
        </p>
      </motion.div>

      {/* Selected reciter play button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mx-4 mb-4 rounded-2xl p-4 flex items-center justify-between"
        style={{ background: 'rgba(193,154,107,0.12)', border: '1px solid rgba(193,154,107,0.3)' }}
      >
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'rgba(193,154,107,0.6)', fontFamily: '"Tajawal", sans-serif' }}>المختار حاليًا</p>
          <p className="font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#d4b483' }}>{selectedReciter.name}</p>
        </div>
        <button
          onClick={() => playAdhan(selectedReciter.id, selectedReciter.url)}
          className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
          style={{
            background: playingId === selectedReciter.id
              ? 'rgba(193,154,107,0.4)'
              : 'linear-gradient(135deg, #C19A6B, #8a6a3a)',
            boxShadow: '0 0 20px rgba(193,154,107,0.3)',
          }}
        >
          {playingId === selectedReciter.id ? (
            <Square className="w-6 h-6 fill-current" style={{ color: '#fff' }} />
          ) : (
            <Play className="w-6 h-6 fill-current translate-x-0.5" style={{ color: '#fff' }} />
          )}
        </button>
      </motion.div>

      {/* Reciters list */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <p className="text-xs mb-3 pr-1" style={{ color: 'rgba(193,154,107,0.5)', fontFamily: '"Tajawal", sans-serif' }}>
          جميع الأصوات المتاحة
        </p>
        <div className="space-y-2">
          {ADHAN_RECITERS.map((r, i) => {
            const isSelected = reciterId === r.id;
            const isPlaying = playingId === r.id;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.4 }}
                className="flex items-center justify-between rounded-2xl px-4 py-3 transition-all cursor-pointer"
                style={{
                  background: isSelected ? 'rgba(193,154,107,0.18)' : 'rgba(255,255,255,0.04)',
                  border: isSelected ? '1px solid rgba(193,154,107,0.5)' : '1px solid rgba(255,255,255,0.07)',
                }}
                onClick={() => { setReciterId(r.id); setAthanReciter(r.id); stopAll(); }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor: isSelected ? '#C19A6B' : 'rgba(193,154,107,0.3)',
                      background: isSelected ? '#C19A6B' : 'transparent',
                    }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: isSelected ? '#d4b483' : 'rgba(255,255,255,0.85)' }}>
                      {r.name}
                    </p>
                    {isPlaying && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1,2,3,4].map(b => (
                          <div
                            key={b}
                            className="w-0.5 rounded-full animate-bounce"
                            style={{ height: `${6+b*3}px`, background: '#C19A6B', animationDelay: `${b*0.1}s` }}
                          />
                        ))}
                        <p className="text-xs mr-1.5" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif' }}>يُشغَّل...</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={e => { e.stopPropagation(); playAdhan(r.id, r.url); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    background: isPlaying ? 'rgba(193,154,107,0.35)' : 'rgba(193,154,107,0.12)',
                    border: '1px solid rgba(193,154,107,0.35)',
                  }}
                >
                  {isPlaying ? (
                    <Square className="w-4 h-4" style={{ color: '#C19A6B' }} />
                  ) : (
                    <Volume2 className="w-4 h-4" style={{ color: '#C19A6B' }} />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
