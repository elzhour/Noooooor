import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Eye, EyeOff, RefreshCw, MapPin } from 'lucide-react';
import { TasbihIcon } from '@/components/NoorIcons';
import {
  syncUserLeaderboard,
  fetchLeaderboard,
  fetchGovernorateLeaderboard,
  type LeaderboardEntry,
  type GovernorateRanking,
} from '@/lib/firestore';
import { getCacheValue, getProfileCache, getSettingCache, queueSettingSync, getCurrentUid } from '@/lib/rtdb';
import { auth } from '@/lib/firebase';
import { EGYPT_GOVERNORATES } from '@/lib/constants';

const VISIBILITY_KEY = 'noor_leaderboard_visible';

function ensureUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function getLocalTasbeehCount(): number {
  try {
    const totals = getCacheValue<Record<string, number>>('tasbih_totals', {});
    return Object.values(totals).reduce((a, b) => a + b, 0);
  } catch { return 0; }
}

function OrnamentDivider({ flip = false, isDark }: { flip?: boolean; isDark: boolean }) {
  return (
    <svg
      viewBox="0 0 200 30"
      className="w-48"
      style={{ opacity: isDark ? 0.4 : 0.55, transform: flip ? 'scaleY(-1)' : undefined }}
      fill="#C19A6B"
    >
      <polygon points="100,2 104,10 113,10 106,15 109,24 100,19 91,24 94,15 87,10 96,10" />
      <line x1="0" y1="15" x2="75" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6" />
      <line x1="125" y1="15" x2="200" y2="15" stroke="#C19A6B" strokeWidth="0.5" opacity="0.6" />
      <circle cx="77" cy="15" r="2" fill="#C19A6B" opacity="0.5" />
      <circle cx="123" cy="15" r="2" fill="#C19A6B" opacity="0.5" />
    </svg>
  );
}

function medalColor(rank: number, fallback: string): string {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return fallback;
}

/* ── Tab 1: ترتيب الذاكرين ───────────────────────────────── */
function UsersLeaderboardTab({ isDark }: { isDark: boolean }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const gold = isDark ? '#E8C98A' : '#7A4F1E';
  const cardBg = isDark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)';
  const cardBorder = `rgba(193,154,107,${isDark ? '0.2' : '0.3'})`;

  const userProfile = getProfileCache();
  const stableUid = userProfile?.uid ?? ensureUid();

  const [userVisible, setUserVisibleState] = useState<boolean>(() =>
    getSettingCache<boolean>(VISIBILITY_KEY, false)
  );

  const setUserVisible = (v: boolean) => {
    const uid = auth.currentUser?.uid ?? getCurrentUid();
    if (uid) queueSettingSync(uid, VISIBILITY_KEY, v);
    setUserVisibleState(v);
  };

  const buildSyncPayload = (isPublic: boolean) => ({
    userId: stableUid as string,
    displayName: userProfile?.name || 'ذاكر',
    governorate: userProfile?.governorateName || null,
    isPublic,
    tasbeehCount: getLocalTasbeehCount(),
    quranCompletions: getCacheValue<number>('quran_completions', 0),
    currentSurah: getCacheValue<number>('last_surah', 1),
    azkarStreak: getCacheValue<number>('azkar_streak', 0),
    tadabburStreak: getCacheValue<number>('tadabbur_streak', 0),
    earnedBadges: [] as string[],
  });

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await fetchLeaderboard();
      setEntries(list);
      setFetchError(null);
      if (stableUid) {
        const idx = list.findIndex((e) => e.userId === stableUid);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setFetchError(code === 'permission-denied' ? 'permission-denied' : 'network');
    } finally {
      setLoading(false);
    }
  }, [stableUid]);

  useEffect(() => {
    const autoSync = async () => {
      setSyncError(null);
      if (stableUid && userProfile) {
        try {
          await syncUserLeaderboard(buildSyncPayload(userVisible));
        } catch (err: unknown) {
          const code = (err as { code?: string })?.code ?? '';
          if (code === 'permission-denied') setSyncError('permission-denied');
        }
      }
      await loadLeaderboard();
    };
    autoSync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleVisibility = async () => {
    if (!userProfile || !stableUid) return;
    const newVisible = !userVisible;
    setUserVisible(newVisible);
    setSyncing(true);
    setSyncError(null);
    try {
      await syncUserLeaderboard(buildSyncPayload(newVisible));
      await loadLeaderboard();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'permission-denied') setSyncError('permission-denied');
      setUserVisible(!newVisible);
    }
    setSyncing(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {userProfile && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>
              {userProfile.name || 'أنت'}
            </p>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {userVisible ? (
                <>
                  <Eye size={11} style={{ color: '#4ade80' }} />
                  <span style={{ color: '#4ade80' }}>
                    ظاهر في الترتيب
                    {myRank ? ` — المرتبة #${myRank.toLocaleString('ar-EG')}` : ''}
                  </span>
                </>
              ) : (
                <>
                  <EyeOff size={11} style={{ color: '#C19A6B', opacity: 0.55 }} />
                  <span style={{ color: '#C19A6B', opacity: 0.55 }}>مخفي — تسبيحاتك تُحسب دائماً</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLeaderboard}
              className="p-2 rounded-full"
              style={{ background: 'rgba(193,154,107,0.12)', color: '#C19A6B' }}
              data-testid="button-refresh-users"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={toggleVisibility}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={{
                background: userVisible
                  ? 'rgba(239,68,68,0.1)'
                  : 'rgba(74,222,128,0.12)',
                border: userVisible
                  ? '1px solid rgba(239,68,68,0.3)'
                  : '1px solid rgba(74,222,128,0.35)',
                color: userVisible ? '#ef4444' : '#4ade80',
                fontFamily: '"Tajawal", sans-serif',
                opacity: syncing ? 0.6 : 1,
              }}
              data-testid="button-toggle-visibility"
            >
              {syncing ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : userVisible ? (
                <EyeOff size={12} />
              ) : (
                <Eye size={12} />
              )}
              {userVisible ? 'إخفاء' : 'إظهار'}
            </button>
          </div>
        </div>
      )}

      {(syncError === 'permission-denied' || fetchError === 'permission-denied') && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <p className="text-xs font-bold mb-1" style={{ color: '#ef4444', fontFamily: '"Tajawal", sans-serif' }}>
            خطأ في الصلاحيات — Firestore rules
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: '#ef4444', fontFamily: '"Tajawal", sans-serif', opacity: 0.8 }}>
            افتح Firebase Console → Firestore → Rules وتأكد من السماح للمستخدمين المسجلين
          </p>
        </div>
      )}
      {fetchError === 'network' && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <p className="text-xs" style={{ color: '#ef4444', fontFamily: '"Tajawal", sans-serif' }}>
            تعذّر الاتصال بالخادم — تأكد من الإنترنت واضغط ↻
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw size={24} className="animate-spin" style={{ color: '#C19A6B', opacity: 0.5 }} />
        </div>
      ) : entries.length === 0 && !fetchError ? (
        <div className="text-center py-10">
          <Trophy size={32} style={{ color: '#C19A6B', opacity: 0.3, margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.5 }}>
            لا يوجد مستخدمون في الترتيب بعد
          </p>
          <p className="text-xs mt-1" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.35 }}>
            اضغط "إظهار" لتظهر اسمك في الترتيب
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isMe = !!(userProfile && entry.userId === (userProfile.uid || stableUid));
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: isMe
                    ? `rgba(193,154,107,${isDark ? '0.15' : '0.18'})`
                    : cardBg,
                  border: `1px solid rgba(193,154,107,${isMe ? '0.45' : isDark ? '0.15' : '0.2'})`,
                }}
                data-testid={`row-user-${entry.userId}`}
              >
                <div className="w-7 flex items-center justify-center flex-shrink-0">
                  {rank <= 3 ? (
                    <Trophy size={18} style={{ color: medalColor(rank, gold) }} />
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.5 }}
                    >
                      {rank.toLocaleString('ar-EG')}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {entry.displayName}
                    {isMe && <span className="mr-1 text-[10px] opacity-60">(أنت)</span>}
                  </p>
                  {entry.governorate && (
                    <p
                      className="text-[10px] truncate"
                      style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.55 }}
                    >
                      {entry.governorate}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <TasbihIcon size={14} style={{ color: '#C19A6B' }} />
                  <span
                    className="text-sm font-black"
                    style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {entry.tasbeehCount.toLocaleString('ar-EG')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Tab 2: ترتيب المحافظات ──────────────────────────────── */
function GovernoratesLeaderboardTab({ isDark }: { isDark: boolean }) {
  const [entries, setEntries] = useState<GovernorateRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const gold = isDark ? '#E8C98A' : '#7A4F1E';
  const cardBg = isDark ? 'rgba(193,154,107,0.06)' : 'rgba(193,154,107,0.08)';
  const cardBorder = `rgba(193,154,107,${isDark ? '0.2' : '0.3'})`;

  const userProfile = getProfileCache();
  const myGovernorateId = userProfile?.governorateId ?? null;

  const loadGovernorates = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const list = await fetchGovernorateLeaderboard();
      setEntries(list);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      setFetchError(code === 'permission-denied' ? 'permission-denied' : 'network');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGovernorates(); }, [loadGovernorates]);

  // ابحث عن مرتبة محافظة المستخدم لو موجود
  const myRank = myGovernorateId
    ? entries.findIndex((e) => e.id === myGovernorateId) + 1 || null
    : null;

  const flagFor = (id: string): string | undefined =>
    EGYPT_GOVERNORATES.find((g) => g.id === id)?.flag;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {userProfile?.governorateName && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} style={{ color: '#C19A6B' }} />
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}>
                محافظتك: {userProfile.governorateName}
              </p>
              <p className="text-[11px]" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.7 }}>
                {myRank
                  ? `المرتبة #${myRank.toLocaleString('ar-EG')} — ساعدها تطلع للأول`
                  : 'سبّح عشان محافظتك تظهر في الترتيب'}
              </p>
            </div>
          </div>
          <button
            onClick={loadGovernorates}
            className="p-2 rounded-full flex-shrink-0"
            style={{ background: 'rgba(193,154,107,0.12)', color: '#C19A6B' }}
            data-testid="button-refresh-governorates"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {fetchError === 'permission-denied' && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <p className="text-xs" style={{ color: '#ef4444', fontFamily: '"Tajawal", sans-serif' }}>
            خطأ في الصلاحيات — تحقق من قواعد Firestore لمجموعة governorateLeaderboard
          </p>
        </div>
      )}
      {fetchError === 'network' && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <p className="text-xs" style={{ color: '#ef4444', fontFamily: '"Tajawal", sans-serif' }}>
            تعذّر الاتصال بالخادم — تأكد من الإنترنت واضغط ↻
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <RefreshCw size={24} className="animate-spin" style={{ color: '#C19A6B', opacity: 0.5 }} />
        </div>
      ) : entries.length === 0 && !fetchError ? (
        <div className="text-center py-10">
          <Trophy size={32} style={{ color: '#C19A6B', opacity: 0.3, margin: '0 auto 8px' }} />
          <p className="text-sm" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.5 }}>
            لسه مفيش تسبيح من أي محافظة
          </p>
          <p className="text-xs mt-1" style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.35 }}>
            ابدأ سبّح عشان محافظتك تظهر هنا
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const isMine = entry.id === myGovernorateId;
            const flag = flagFor(entry.id);
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: isMine
                    ? `rgba(193,154,107,${isDark ? '0.15' : '0.18'})`
                    : cardBg,
                  border: `1px solid rgba(193,154,107,${isMine ? '0.45' : isDark ? '0.15' : '0.2'})`,
                }}
                data-testid={`row-governorate-${entry.id}`}
              >
                <div className="w-7 flex items-center justify-center flex-shrink-0">
                  {rank <= 3 ? (
                    <Trophy size={18} style={{ color: medalColor(rank, gold) }} />
                  ) : (
                    <span
                      className="text-xs font-bold"
                      style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: 0.5 }}
                    >
                      {rank.toLocaleString('ar-EG')}
                    </span>
                  )}
                </div>

                {flag ? (
                  <img
                    src={flag}
                    alt={entry.name}
                    className="w-8 h-6 object-cover rounded flex-shrink-0"
                    style={{ border: `1px solid rgba(193,154,107,0.3)` }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-6 rounded flex-shrink-0" style={{ background: 'rgba(193,154,107,0.15)' }} />
                )}

                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {entry.name}
                    {isMine && <span className="mr-1 text-[10px] opacity-60">(محافظتك)</span>}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <TasbihIcon size={14} style={{ color: '#C19A6B' }} />
                  <span
                    className="text-sm font-black"
                    style={{ color: gold, fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {entry.totalCount.toLocaleString('ar-EG')}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function Rankings() {
  const [tab, setTab] = useState<'users' | 'governorates'>('users');
  const isDark = useDarkMode();

  const bg = isDark
    ? 'radial-gradient(ellipse at center, #1a1208 0%, #0d0a05 60%, #080603 100%)'
    : 'radial-gradient(ellipse at center, #FAF4EA 0%, #F0E4CF 55%, #E6D5B5 100%)';

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: bg }}
      dir="rtl"
    >
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: isDark ? 0.05 : 0.07 }}
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="grid-rankings" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C19A6B" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-rankings)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
        <OrnamentDivider isDark={isDark} />
        <h1
          className="text-2xl font-bold tracking-widest mt-4"
          style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B', letterSpacing: '0.2em' }}
        >
          الترتيب
        </h1>
        <p
          className="text-xs mt-1"
          style={{ color: '#C19A6B', fontFamily: '"Tajawal", sans-serif', opacity: isDark ? 0.5 : 0.65 }}
        >
          ترتيب الذاكرين والمحافظات
        </p>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-6 mb-4">
        {([
          { key: 'users', label: 'ترتيب الذاكرين' },
          { key: 'governorates', label: 'ترتيب المحافظات' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              fontFamily: '"Tajawal", sans-serif',
              background: tab === t.key
                ? `rgba(193,154,107,${isDark ? '0.25' : '0.2'})`
                : 'transparent',
              border: `1px solid rgba(193,154,107,${tab === t.key ? '0.6' : '0.2'})`,
              color: tab === t.key ? (isDark ? '#E8C98A' : '#7A4F1E') : '#C19A6B',
            }}
            data-testid={`button-tab-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4">
        <AnimatePresence mode="wait">
          {tab === 'users' ? (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <UsersLeaderboardTab isDark={isDark} />
            </motion.div>
          ) : (
            <motion.div key="governorates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GovernoratesLeaderboardTab isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
