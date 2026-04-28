import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  collection,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

/* ─── Types ─────────────────────────────────────────────── */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  governorate?: string | null;
  isPublic: boolean;
  tasbeehCount: number;
  quranCompletions: number;
  currentSurah: number;
  azkarStreak: number;
  tadabburStreak: number;
  noorScore: number;
  earnedBadges: string[];
}

export interface SohbaUserData {
  userId: string;
  displayName: string;
  governorate?: string | null;
  isPublic: boolean;
  tasbeehCount: number;
  quranCompletions: number;
  currentSurah: number;
  azkarStreak: number;
  tadabburStreak: number;
  earnedBadges: string[];
}

/* ─── Global Counter & Active Sessions (API server, not Firebase) ─────
 *
 * تم نقل العداد العالمي وحساب "الذاكرين الآن" من Firebase إلى السيرفر
 * المحلي (PostgreSQL + Server-Sent Events) لتقليل استهلاك Firebase
 * بشكل كبير وزيادة طاقة الاستيعاب على الخطة المجانية.
 *
 *   POST /api/counter/increment  →  زيادة العداد (مجمّعة على client + server)
 *   GET  /api/counter/stream     →  بث مباشر بـ SSE للعداد + عدد الذاكرين الآن
 *
 * الذاكرون الآن = عدد التابات المفتوحة على SSE في هذه اللحظة (مُعرَّف بـ sid فريد).
 * التطبيق بيفتح SSE تلقائيًا أول مرة يتم فيها استخدام أي function من دول.
 * ──────────────────────────────────────────────────────────── */

let _eventSource: EventSource | null = null;
const _counterCallbacks = new Set<(d: { count: number }) => void>();
const _sessionCallbacks = new Set<(n: number) => void>();
let _lastCount = 0;
let _lastActive = 0;
let _sid: string | null = null;
let _streamRefs = 0;

function getOrCreateSessionId(): string {
  if (_sid) return _sid;
  let sid = sessionStorage.getItem('noor_sid');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('noor_sid', sid);
  }
  _sid = sid;
  return sid;
}

function ensureStream(): void {
  if (_eventSource) return;
  if (typeof window === 'undefined') return;
  const sid = getOrCreateSessionId();
  try {
    _eventSource = new EventSource(`/api/counter/stream?sid=${encodeURIComponent(sid)}`);
    _eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { count?: number; activeUsers?: number };
        if (typeof data.count === 'number') {
          _lastCount = data.count;
          _counterCallbacks.forEach((cb) => cb({ count: _lastCount }));
        }
        if (typeof data.activeUsers === 'number') {
          _lastActive = data.activeUsers;
          _sessionCallbacks.forEach((cb) => cb(_lastActive));
        }
      } catch { /* ignore malformed payloads */ }
    };
    _eventSource.onerror = () => {
      // EventSource auto-reconnects on transient errors
    };
  } catch {
    _eventSource = null;
  }
}

function maybeCloseStream(): void {
  if (_streamRefs > 0) return;
  if (_counterCallbacks.size === 0 && _sessionCallbacks.size === 0) {
    _eventSource?.close();
    _eventSource = null;
  }
}

export async function initCounter(): Promise<number> {
  try {
    const res = await fetch('/api/counter');
    const data = await res.json() as { count?: number };
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

/* ─── Increment (offline-safe batching) ──────────────────────
 * - يجمّع الزيادات في الذاكرة + localStorage حتى لا تضيع عند الإغلاق/الـ refresh
 * - يحاول الإرسال كل 2 ثانية، ولو فشل يرجّع الأرقام للقائمة
 * - يعيد المحاولة تلقائيًا عند عودة الإنترنت (online event)
 * ──────────────────────────────────────────────────────────── */
const PENDING_KEY = 'noor_pending_increments';
const FLUSH_INTERVAL_MS = 2000;
const RETRY_INTERVAL_MS = 5000;

let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _retryTimer: ReturnType<typeof setTimeout> | null = null;
let _isFlushing = false;

function readPending(): number {
  if (typeof localStorage === 'undefined') return 0;
  const raw = localStorage.getItem(PENDING_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function writePending(n: number): void {
  if (typeof localStorage === 'undefined') return;
  if (n <= 0) localStorage.removeItem(PENDING_KEY);
  else localStorage.setItem(PENDING_KEY, String(n));
}

function addPending(amount: number): void {
  writePending(readPending() + amount);
}

function scheduleRetry(): void {
  if (_retryTimer !== null) return;
  _retryTimer = setTimeout(() => {
    _retryTimer = null;
    void flushIncrements();
  }, RETRY_INTERVAL_MS);
}

async function flushIncrements(): Promise<void> {
  if (_flushTimer !== null) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  if (_isFlushing) return;
  const amount = readPending();
  if (amount === 0) return;
  _isFlushing = true;
  // تصفير محلي مع نية الاسترجاع لو فشل الإرسال
  writePending(0);
  try {
    const res = await fetch('/api/counter/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    // فشل الإرسال — نرجّع الأرقام للقائمة ونعيد المحاولة بعد 5 ثوانٍ
    addPending(amount);
    scheduleRetry();
  } finally {
    _isFlushing = false;
  }
}

export async function incrementGlobalCounter(amount = 1): Promise<void> {
  // فتح SSE أيضًا حتى يُحسب المستخدم ضمن "الذاكرين الآن"
  if (!_eventSource) {
    _streamRefs++;
    ensureStream();
  }
  addPending(amount);
  if (_flushTimer === null) {
    _flushTimer = setTimeout(flushIncrements, FLUSH_INTERVAL_MS);
  }
}

export function subscribeToGlobalCounter(
  callback: (data: { count: number }) => void,
): Unsubscribe {
  ensureStream();
  _counterCallbacks.add(callback);
  if (_lastCount > 0) callback({ count: _lastCount });
  return () => {
    _counterCallbacks.delete(callback);
    maybeCloseStream();
  };
}

export function subscribeToActiveSessions(
  callback: (count: number) => void,
): Unsubscribe {
  ensureStream();
  _sessionCallbacks.add(callback);
  if (_lastActive > 0) callback(_lastActive);
  return () => {
    _sessionCallbacks.delete(callback);
    maybeCloseStream();
  };
}

/* لم يعد يقوم بأي شيء — السيرفر يحسب الذاكرين الآن من اتصالات SSE المفتوحة.
 * الإبقاء عليه كـ no-op للحفاظ على توافق الـ API مع المستدعين الحاليين. */
export async function recordTasbeehPress(): Promise<void> {
  // no-op
}

/* مزامنة الزيادات المعلقة مع المتصفح/الشبكة */
if (typeof window !== 'undefined') {
  // 1) عند إخفاء/إغلاق الصفحة: حاول إرسال المتبقي فورًا
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void flushIncrements();
    }
  });

  // 2) عند الإغلاق النهائي: استخدم sendBeacon لضمان الإرسال حتى لو الصفحة بتقفل
  window.addEventListener('beforeunload', () => {
    const amount = readPending();
    if (amount > 0 && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        '/api/counter/increment',
        new Blob([JSON.stringify({ amount })], { type: 'application/json' }),
      );
      if (sent) writePending(0);
    } else {
      void flushIncrements();
    }
  });

  // 3) عند عودة الإنترنت: ابعت المتبقي فورًا
  window.addEventListener('online', () => {
    void flushIncrements();
  });

  // 4) عند فتح الصفحة (تحميل أو refresh): لو فيه أرقام متبقية من جلسة سابقة، ابعتها
  if (readPending() > 0) {
    setTimeout(() => { void flushIncrements(); }, 1000);
  }
}

/* ─── Sohba / Leaderboard ───────────────────────────────── */
export async function syncUserLeaderboard(data: SohbaUserData): Promise<number> {
  const noorScore =
    Math.floor(data.tasbeehCount * 0.5) +
    data.quranCompletions * 1000 +
    data.azkarStreak * 50 +
    data.tadabburStreak * 20;

  await setDoc(
    doc(db, 'sohbaLeaderboard', data.userId),
    { ...data, noorScore, updatedAt: serverTimestamp() },
    { merge: true },
  );
  return noorScore;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // نجيب كل الـ docs بدون composite index
  // ونفلتر ونرتب على جانب الـ client
  const snap = await getDocs(collection(db, 'sohbaLeaderboard'));
  const all = snap.docs.map((d) => d.data() as LeaderboardEntry);
  return all
    .filter((e) => e.isPublic === true)
    .sort((a, b) => (b.tasbeehCount ?? 0) - (a.tasbeehCount ?? 0))
    .slice(0, 50);
}

export async function fetchUserEntry(userId: string): Promise<LeaderboardEntry | null> {
  const snap = await getDoc(doc(db, 'sohbaLeaderboard', userId));
  return snap.exists() ? (snap.data() as LeaderboardEntry) : null;
}

export async function hideLeaderboardEntry(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'sohbaLeaderboard', userId), { isPublic: false });
  } catch { /* entry might not exist yet — safe to ignore */ }
}

export async function deleteLeaderboardEntry(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'sohbaLeaderboard', userId));
  } catch { /* ignore */ }
}
