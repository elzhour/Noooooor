import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback } from "react";
import NotFound from "@/pages/not-found";

import { BottomNav } from "@/components/layout/BottomNav";
import { MiniPlayer } from "@/components/MiniPlayer";
import { AudioProvider } from "@/contexts/AudioContext";
import { AppSettingsProvider, useAppSettings } from "@/contexts/AppSettingsContext";
import { SplashScreen } from "@/components/SplashScreen";

import { Login } from "@/pages/Login";
import { Home } from "@/pages/Home";
import { Quran } from "@/pages/Quran";
import { Azkar } from "@/pages/Azkar";
import { Tasbih } from "@/pages/Tasbih";
import { Rankings } from "@/pages/Rankings";
import { MoreMenu } from "@/pages/MoreMenu";
import { Settings } from "@/pages/Settings";
import { Asma } from "@/pages/Asma";
import { Reciters } from "@/pages/Reciters";
import { SpeedReader } from "@/pages/SpeedReader";
import { Adhan } from "@/pages/Adhan";
import { EgyptianRadio } from "@/pages/EgyptianRadio";
import { Qibla } from "@/pages/Qibla";
import { MosquesFinder } from "@/pages/MosquesFinder";
import { Hadith } from "@/pages/Hadith";
import { IslamicHistory } from "@/pages/IslamicHistory";
import { ProphetStories } from "@/pages/ProphetStories";
import { IslamicQuizzes } from "@/pages/IslamicQuizzes";
import { Sunnah } from "@/pages/Sunnah";
import { IslamicTV } from "@/pages/IslamicTV";
import { VoiceComparison } from "@/pages/VoiceComparison";
import { HifzTest } from "@/pages/HifzTest";
import { NotificationSettings } from "@/pages/NotificationSettings";

import { onAuthStateChanged } from "firebase/auth";
import { get, ref } from "firebase/database";
import { auth, rtdb } from "@/lib/firebase";
import { initUserSync, clearSyncState, getSettingCache, getCacheValue } from "@/lib/rtdb";
import type { UserProfile } from "@/lib/rtdb";
import { AthanPopup } from "@/components/AthanPopup";
import {
  scheduleMonthOfPrayers,
  startForegroundWatcher,
  attachNativeNotificationListeners,
} from "@/lib/notifications/scheduler";
import { requestNotificationsPermission } from "@/lib/notifications/permissions";
import { App as CapApp } from "@capacitor/app";

const queryClient = new QueryClient();

function GlobalBackground() {
  const { activeBgSrc } = useAppSettings();
  if (!activeBgSrc) return null;
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `url(${activeBgSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.28)' }}
      />
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}>
      <div className="relative z-10">
        {children}
      </div>
      <MiniPlayer />
      <BottomNav />
    </div>
  );
}

function FullScreenShell({ children }: { children: React.ReactNode }) {
  const { hasBg } = useAppSettings();
  return (
    <div className={`min-h-[100dvh] ${hasBg ? 'bg-transparent' : 'bg-background'} text-foreground selection:bg-primary/30 relative`}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <AppShell><Home /></AppShell>
      </Route>
      <Route path="/quran">
        <AppShell><Quran /></AppShell>
      </Route>
      <Route path="/azkar">
        <AppShell><Azkar /></AppShell>
      </Route>
      <Route path="/tasbih">
        <AppShell><Tasbih /></AppShell>
      </Route>
      <Route path="/ranking">
        <AppShell><Rankings /></AppShell>
      </Route>
      <Route path="/more">
        <AppShell><MoreMenu /></AppShell>
      </Route>
      <Route path="/settings">
        <AppShell><Settings /></AppShell>
      </Route>
      <Route path="/asma">
        <FullScreenShell><Asma /></FullScreenShell>
      </Route>
      <Route path="/reciters">
        <FullScreenShell><Reciters /></FullScreenShell>
      </Route>
      <Route path="/speed-reader">
        <FullScreenShell><SpeedReader /></FullScreenShell>
      </Route>
      <Route path="/adhan">
        <FullScreenShell><Adhan /></FullScreenShell>
      </Route>
      <Route path="/radio">
        <FullScreenShell><EgyptianRadio /></FullScreenShell>
      </Route>
      <Route path="/qibla">
        <FullScreenShell><Qibla /></FullScreenShell>
      </Route>
      <Route path="/mosques">
        <FullScreenShell><MosquesFinder /></FullScreenShell>
      </Route>
      <Route path="/hadith">
        <FullScreenShell><Hadith /></FullScreenShell>
      </Route>
      <Route path="/history">
        <FullScreenShell><IslamicHistory /></FullScreenShell>
      </Route>
      <Route path="/prophets">
        <FullScreenShell><ProphetStories /></FullScreenShell>
      </Route>
      <Route path="/quizzes">
        <FullScreenShell><IslamicQuizzes /></FullScreenShell>
      </Route>
      <Route path="/sunnah">
        <FullScreenShell><Sunnah /></FullScreenShell>
      </Route>
      <Route path="/tv">
        <FullScreenShell><IslamicTV /></FullScreenShell>
      </Route>
      <Route path="/voice-comparison">
        <FullScreenShell><VoiceComparison /></FullScreenShell>
      </Route>
      <Route path="/hifz-test">
        <FullScreenShell><HifzTest /></FullScreenShell>
      </Route>
      <Route path="/notifications">
        <FullScreenShell><NotificationSettings /></FullScreenShell>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function PrayerNotificationsBootstrap() {
  // After login, request notification permission immediately, kick off
  // scheduling for the next 30 days, and start the in-app foreground watcher
  // (so the popup fires while the app is open even on the web).
  // Also re-schedule whenever the app comes back to the foreground so newly
  // granted permissions are picked up without needing a fresh login.
  useEffect(() => {
    let cancelled = false;

    const reschedule = async () => {
      try {
        await requestNotificationsPermission();
        const profile = getCacheValue<UserProfile | null>("profile", null);
        if (cancelled) return;
        if (profile?.lat != null && profile?.lng != null) {
          await scheduleMonthOfPrayers({
            lat: profile.lat,
            lng: profile.lng,
            days: 30,
          });
        }
      } catch (e) {
        console.warn("[notif] bootstrap failed", e);
      }
    };

    startForegroundWatcher();
    attachNativeNotificationListeners();
    reschedule();

    let removeListener: (() => void) | null = null;
    CapApp.addListener("appStateChange", (state) => {
      if (state.isActive) reschedule();
    })
      .then((handle) => {
        removeListener = () => handle.remove();
      })
      .catch(() => {
        /* not on a Capacitor platform — ignore */
      });

    return () => {
      cancelled = true;
      if (removeListener) removeListener();
    };
  }, []);
  return null;
}

function AppContent() {
  return (
    <>
      <GlobalBackground />
      <Router />
      <PrayerNotificationsBootstrap />
      <AthanPopup />
    </>
  );
}

function App() {
  // The animated dome splash is the very first thing the user sees on launch.
  // The native Android cream-coloured splash has been disabled (see
  // `android/app/src/main/res/values/styles.xml`) so this is the only splash.
  const [splashDone, setSplashDone] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const handleSplashDone = useCallback(() => setSplashDone(true), []);
  const handleLoginComplete = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    document.documentElement.dir = 'rtl';
  }, []);

  // Firebase Auth state observer — source of truth for login state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileSnap = await get(ref(rtdb, `users/${user.uid}/profile`));
          if (profileSnap.exists()) {
            await initUserSync(user.uid);
            // تطبيق الثيم من RTDB بعد تحميل بيانات المستخدم
            const theme = getSettingCache<'light' | 'dark'>('theme', 'light');
            document.documentElement.classList.toggle('dark', theme === 'dark');
            setIsLoggedIn(true);
          } else {
            // authenticated but no profile yet (incomplete registration)
            setIsLoggedIn(false);
          }
        } catch {
          setIsLoggedIn(false);
        }
      } else {
        clearSyncState();
        setIsLoggedIn(false);
      }
    });
    return () => unsub();
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}

      {splashDone && isLoggedIn === null && (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#C19A6B]/30 border-t-[#C19A6B] rounded-full animate-spin mx-auto mb-4" />
            <span className="text-[#C19A6B] text-3xl" style={{ fontFamily: '"Amiri", serif' }}>نُور</span>
          </div>
        </div>
      )}

      {isLoggedIn === false && (
        <QueryClientProvider client={queryClient}>
          <Login onComplete={handleLoginComplete} />
        </QueryClientProvider>
      )}

      {isLoggedIn === true && (
        <QueryClientProvider client={queryClient}>
          <AppSettingsProvider>
            <AudioProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <AppContent />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </AudioProvider>
          </AppSettingsProvider>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;
