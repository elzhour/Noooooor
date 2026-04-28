import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  increment,
  serverTimestamp,
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

export interface GovernorateRanking {
  id: string;
  name: string;
  totalCount: number;
}

/* ─── Sohba / User Leaderboard ──────────────────────────── */
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

/* ─── Governorate Leaderboard ───────────────────────────── */
export async function incrementGovernorateCounter(
  governorateId: string,
  governorateName: string,
  amount: number,
): Promise<void> {
  if (!governorateId || amount <= 0) return;
  await setDoc(
    doc(db, 'governorateLeaderboard', governorateId),
    {
      id: governorateId,
      name: governorateName,
      totalCount: increment(amount),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function fetchGovernorateLeaderboard(): Promise<GovernorateRanking[]> {
  const snap = await getDocs(collection(db, 'governorateLeaderboard'));
  return snap.docs
    .map((d) => d.data() as GovernorateRanking)
    .filter((g) => (g.totalCount ?? 0) > 0)
    .sort((a, b) => (b.totalCount ?? 0) - (a.totalCount ?? 0));
}

/* ─── Session-batched governorate counter (localStorage) ── */
// كل ضغطة تسبيح بتزود الرقم ده محلياً، ولما الجلسة تنتهي
// (كل 5 دقائق أو إغلاق الصفحة) بنبعت رقم واحد لـ Firestore
const PENDING_GOV_KEY = 'noor_pending_gov_count';

export function getPendingGovernorateCount(): number {
  try {
    return parseInt(localStorage.getItem(PENDING_GOV_KEY) || '0', 10) || 0;
  } catch { return 0; }
}

export function addPendingGovernorateCount(n: number): void {
  try {
    const current = getPendingGovernorateCount();
    localStorage.setItem(PENDING_GOV_KEY, String(current + n));
  } catch { /* ignore */ }
}

export function clearPendingGovernorateCount(): void {
  try { localStorage.removeItem(PENDING_GOV_KEY); } catch { /* ignore */ }
}
