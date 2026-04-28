import { TASBIH_TYPES } from '@/lib/constants';
import {
  syncUserLeaderboard,
  incrementGovernorateCounter,
  getRebuildIncludedUsers,
  addPendingGovernorateCount,
  getPendingGovernorateCount,
  clearPendingGovernorateCount,
} from '@/lib/firestore';
import {
  queueTasbihSync,
  flushRTDB,
  getCacheValue,
  getCurrentUid,
  getProfileCache,
  getSettingCache,
  getGovSyncedCount,
  queueGovSyncedCountUpdate,
  todayKey,
} from '@/lib/rtdb';
import { auth } from '@/lib/firebase';
import { BarChart2 } from 'lucide-react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useUserSetting } from '@/hooks/use-user-setting';

const SESSION_FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 دقائق

/* جمع كل التسبيح في الذاكرة وبعتها مرة واحدة لـ Firestore:
   - مرة لتحديث ترتيب المستخدم (sohbaLeaderboard) بالإجمالي الكلي
   - مرة لزيادة عداد المحافظة بالفرق فقط (الجديد منذ آخر مزامنة)
   = يشمل التسبيح القديم تلقائياً في أول مزامنة */
async function flushSessionToFirestore(
  totalsRef: { current: Record<string, number> },
): Promise<void> {
  const profile = getProfileCache();
  const uid = auth.currentUser?.uid;
  if (!uid || !profile) return;

  const totalTasbeeh = Object.values(totalsRef.current).reduce((a, b) => a + b, 0);

  // لو مفيش تسبيح خالص ما نبعتش
  const govSyncedCount = getGovSyncedCount();
  const hasPending = getPendingGovernorateCount() > 0;
  if (totalTasbeeh <= 0 && !hasPending) return;

  // الفرق بين الإجمالي الكلي وإيه اللي بُعت للمحافظة من قبل
  const delta = totalTasbeeh - govSyncedCount;

  // امسح الـ pending فوراً عشان لو المستخدم ضغط في النص ما يضيعش
  clearPendingGovernorateCount();

  try {
    const isPublic = getSettingCache<boolean>('noor_leaderboard_visible', false);

    await syncUserLeaderboard({
      userId: uid,
      displayName: profile.name || 'ذاكر',
      governorate: profile.governorateName || null,
      isPublic,
      tasbeehCount: totalTasbeeh,
      quranCompletions: getCacheValue<number>('quran_completions', 0),
      currentSurah: getCacheValue<number>('last_surah', 1),
      azkarStreak: getCacheValue<number>('azkar_streak', 0),
      tadabburStreak: getCacheValue<number>('tadabbur_streak', 0),
      earnedBadges: [],
    });

    if (delta > 0 && profile.governorateId && profile.governorateName) {
      // لو المستخدم عنده gov_synced_count = 0، ممكن بياناته اتحسبت بالفعل في آخر rebuild
      // نتحقق عشان نمنع الازدواجية
      let shouldIncrement = true;
      if (govSyncedCount === 0) {
        const includedUsers = await getRebuildIncludedUsers();
        if (includedUsers.includes(uid)) {
          // بياناته اتحسبت في الـ rebuild — نحدّث الرقم بس من غير إضافة
          shouldIncrement = false;
        }
      }
      if (shouldIncrement) {
        await incrementGovernorateCounter(
          profile.governorateId,
          profile.governorateName,
          delta,
        );
      }
      // في كل الأحوال احفظ الرقم الجديد عشان نحسب الفرق صح المرة الجاية
      queueGovSyncedCountUpdate(uid, totalTasbeeh);
    }
  } catch {
    // لو فشلت، رجّع الـ pending عشان نحاول تاني المرة الجاية
    addPendingGovernorateCount(delta > 0 ? delta : 1);
  }
}

const BEAD_COUNT = 33;

function BeadsSVG({ count, limit }: { count: number; limit: number }) {
  const beadsToShow = Math.min(BEAD_COUNT, limit);
  const filled = count % beadsToShow;
  const rounds = Math.floor(count / beadsToShow);
  const cx = 130, cy = 140, rx = 110, ry = 110;

  const beads = Array.from({ length: beadsToShow }, (_, i) => {
    const angle = (i / beadsToShow) * 2 * Math.PI - Math.PI / 2;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    const isFilled = i < filled || (filled === 0 && count > 0 && rounds > 0);
    return { x, y, filled: isFilled };
  });

  return (
    <svg viewBox="0 0 260 280" className="w-64 h-64">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
      {beads.map((b, i) => (
        <g key={i}>
          <circle
            cx={b.x}
            cy={b.y}
            r={i % 10 === 0 ? 8 : 6}
            fill={b.filled ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
            stroke={b.filled ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
            strokeWidth="1.5"
          />
          {i % 10 === 0 && (
            <circle cx={b.x} cy={b.y} r={3} fill={b.filled ? 'white' : 'hsl(var(--muted-foreground))'} opacity={0.5} />
          )}
        </g>
      ))}
      <rect x={cx - 2} y={10} width={4} height={18} rx={2} fill="hsl(var(--primary))" />
      <circle cx={cx} cy={9} r={5} fill="hsl(var(--primary))" />
      {rounds > 0 && (
        <g>
          <circle cx={cx} cy={cy} r={22} fill="hsl(var(--primary))" opacity={0.15} />
          <text x={cx} y={cy + 6} textAnchor="middle" fontSize="14" fontWeight="bold"
            fill="hsl(var(--primary))" fontFamily="serif">
            ×{rounds}
          </text>
        </g>
      )}
    </svg>
  );
}

function ResetConfirmDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center"
      >
        <svg width="32" height="32" viewBox="0 0 40 40" className="mx-auto mb-3 text-primary opacity-60">
          <polygon points="20,2 24,14 37,14 27,22 31,35 20,27 9,35 13,22 3,14 16,14" fill="currentColor"/>
        </svg>
        <h3 className="font-bold text-lg mb-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>تصفير العداد</h3>
        <p className="text-muted-foreground text-sm mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>هل تريد تصفير عداد هذا التسبيح؟</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors"
            style={{ fontFamily: '"Tajawal", sans-serif' }}
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-bold text-sm transition-colors"
            style={{
              background: 'linear-gradient(135deg, #C19A6B, #a07a4a)',
              color: '#000',
              fontFamily: '"Tajawal", sans-serif',
            }}
          >
            تصفير
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function Tasbih() {
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const border = dark ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.2)';

  // Initialize from RTDB cache
  const [typeIndex, setTypeIndex] = useState<number>(() =>
    getCacheValue<number>('tasbih_type_idx', 0)
  );
  const [totals, setTotals] = useState<Record<string, number>>(() =>
    getCacheValue<Record<string, number>>('tasbih_totals', {})
  );
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    getCacheValue<Record<string, number>>('tasbih_counts', {})
  );
  const [dailyCount, setDailyCount] = useState<number>(() =>
    getCacheValue<number>(`tasbih_daily/${todayKey()}`, 0)
  );
  const [showStats, setShowStats] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const controls = useAnimation();
  const [isPressing, setIsPressing] = useState(false);

  const totalsRef  = useRef(totals);
  const countsRef  = useRef(counts);
  const dailyRef   = useRef(dailyCount);
  useEffect(() => { totalsRef.current  = totals;     }, [totals]);
  useEffect(() => { countsRef.current  = counts;     }, [counts]);
  useEffect(() => { dailyRef.current   = dailyCount; }, [dailyCount]);

  const currentType = TASBIH_TYPES[typeIndex];
  const count = counts[currentType.id] ?? 0;
  const total = totals[currentType.id] ?? 0;

  // Flush RTDB on unmount
  useEffect(() => {
    return () => {
      if (getCurrentUid()) flushRTDB();
    };
  }, []);

  // إرسال الجلسة لـ Firestore: كل 5 دقائق + إخفاء الصفحة + إغلاقها
  useEffect(() => {
    const flush = () => { flushSessionToFirestore(totalsRef).catch(() => {}); };

    const interval = setInterval(flush, SESSION_FLUSH_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', flush);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, []);

  const handleTypeChange = (idx: number) => {
    setTypeIndex(idx);
    const uid = auth.currentUser?.uid;
    if (uid) {
      queueTasbihSync(uid, totalsRef.current, countsRef.current, dailyRef.current);
    }
  };

  const handleTap = () => {
    if ('vibrate' in navigator) navigator.vibrate(15);
    controls.start({ scale: [1, 0.94, 1], transition: { duration: 0.18 } });

    const newCounts = { ...countsRef.current, [currentType.id]: (countsRef.current[currentType.id] ?? 0) + 1 };
    const newTotals = { ...totalsRef.current, [currentType.id]: (totalsRef.current[currentType.id] ?? 0) + 1 };
    const newDaily  = dailyRef.current + 1;

    setCounts(newCounts);
    setTotals(newTotals);
    setDailyCount(newDaily);

    // debounced write to RTDB (10s) — البيانات الشخصية
    const uid = auth.currentUser?.uid;
    if (uid) queueTasbihSync(uid, newTotals, newCounts, newDaily);

    // عداد الجلسة المحلي — يُرسل لـ Firestore كل 5 دقائق أو نهاية الجلسة
    addPendingGovernorateCount(1);
  };

  const handleResetConfirm = () => {
    const newCounts = { ...countsRef.current, [currentType.id]: 0 };
    setCounts(newCounts);
    setShowResetDialog(false);
    if ('vibrate' in navigator) navigator.vibrate([30, 20, 30]);
    const uid = auth.currentUser?.uid;
    if (uid) queueTasbihSync(uid, totalsRef.current, newCounts, dailyRef.current);
  };

  return (
    <div className="pb-24 pt-4 px-4 h-[100dvh] flex flex-col max-w-lg mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>السبحة الإلكترونية</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowStats(!showStats)} className="p-2 bg-secondary text-primary rounded-full">
            <BarChart2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowResetDialog(true)}
            className="p-2 rounded-full transition-colors"
            style={{ background: 'rgba(193,154,107,0.12)', color: '#C19A6B' }}
            title="تصفير"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="bg-card border border-border rounded-2xl p-4 mb-3 animate-in slide-in-from-top-2">
          <h3 className="font-bold mb-3 text-sm text-primary" style={{ fontFamily: '"Tajawal", sans-serif' }}>المجموع الكلي لكل تسبيح</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {TASBIH_TYPES.filter(t => (totals[t.id] ?? 0) > 0).map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground/80 text-xs truncate flex-1 ml-2" style={{ fontFamily: '"Amiri", serif' }}>{t.text}</span>
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  {totals[t.id]?.toLocaleString('ar-EG')}
                </span>
              </div>
            ))}
            {Object.keys(totals).length === 0 && (
              <p className="text-muted-foreground text-sm text-center" style={{ fontFamily: '"Tajawal", sans-serif' }}>لا يوجد إحصائيات بعد</p>
            )}
          </div>
        </div>
      )}

      {/* Dhikr type selector */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          flexShrink: 0,
          gap: '8px',
          overflowX: 'scroll',
          overflowY: 'visible',
          paddingTop: '6px',
          paddingBottom: '6px',
          marginBottom: '4px',
        }}
      >
        {TASBIH_TYPES.map((t, idx) => {
          const isActive = typeIndex === idx;
          return (
            <button
              key={t.id}
              onClick={() => handleTypeChange(idx)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: '"Tajawal", sans-serif',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background 0.2s, color 0.2s',
                background: isActive
                  ? 'linear-gradient(135deg, #C19A6B, #a07a4a)'
                  : (dark ? 'rgba(193,154,107,0.12)' : 'rgba(193,154,107,0.13)'),
                color: isActive ? '#fff' : (dark ? '#C19A6B' : '#7a4f1e'),
                border: isActive
                  ? '1.5px solid #C19A6B'
                  : `1.5px solid ${dark ? 'rgba(193,154,107,0.3)' : 'rgba(193,154,107,0.35)'}`,
                boxShadow: isActive ? '0 2px 8px rgba(193,154,107,0.25)' : 'none',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Current dhikr text */}
      <div className="text-center mb-2">
        <p className="text-xl text-primary leading-loose" style={{ fontFamily: '"Amiri Quran", "Amiri", serif' }}>{currentType.text}</p>
        <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          المجموع الكلي: <span className="font-bold text-primary">{total.toLocaleString('ar-EG')}</span>
        </p>
      </div>

      {/* Beads + Counter */}
      <div className="flex-1 flex items-center justify-center relative">
        <BeadsSVG count={count} limit={currentType.limit} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="mt-12">
            <p className="text-6xl font-bold text-foreground text-center" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {count % currentType.limit || (count > 0 ? currentType.limit : 0)}
            </p>
            <p className="text-xs text-center text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{currentType.limit} في الجولة</p>
          </div>
        </div>
      </div>

      {/* Tap button */}
      <div className="flex flex-col items-center gap-3 mb-4">
        <motion.button
          animate={controls}
          onPointerDown={() => setIsPressing(true)}
          onPointerUp={() => { setIsPressing(false); handleTap(); }}
          onPointerLeave={() => setIsPressing(false)}
          className="w-28 h-28 rounded-full flex items-center justify-center select-none touch-none outline-none"
          style={{
            background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary)/0.7))',
            boxShadow: isPressing
              ? 'inset 6px 6px 12px rgba(0,0,0,0.2)'
              : '6px 6px 16px hsl(var(--primary)/0.3), -4px -4px 12px hsl(var(--card))',
          }}
        >
          <span className="text-primary-foreground font-bold text-lg" style={{ fontFamily: '"Tajawal", sans-serif' }}>سبّح</span>
        </motion.button>
      </div>

      {/* Reset Confirm Dialog */}
      <AnimatePresence>
        {showResetDialog && (
          <ResetConfirmDialog
            onConfirm={handleResetConfirm}
            onCancel={() => setShowResetDialog(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
