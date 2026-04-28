import { useState, useEffect, useRef, type ReactNode, type ComponentType } from 'react';
import { Link } from 'wouter';
import {
  ChevronLeft, Sun, Moon, Share2,
  Star, Copy, X, Check, Mail, MessageSquare, Settings2, Pencil, Clock,
  Lock, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { useUserSetting } from '@/hooks/use-user-setting';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { linkWithCredential, EmailAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import { deleteLeaderboardEntry } from '@/lib/firestore';
import { getProfileCache, updateProfileInRTDB, initUserSync } from '@/lib/rtdb';
import {
  IslamicStarIcon,
  HeadphonesIcon,
  SmartReaderIcon,
  MosqueIcon,
  QuranBookIcon,
  TasbihIcon,
  MoonIcon,
  ScrollIcon,
  DuaHandsIcon,
  RadioIcon,
  HadithIcon,
  QiblaCompassIcon,
  HifzIcon,
} from '@/components/NoorIcons';

function IslamicPattern() {
  return (
    <svg viewBox="0 0 200 40" className="w-full opacity-15" preserveAspectRatio="xMidYMid meet">
      <g fill="#C19A6B">
        {[20, 60, 100, 140, 180].map((cx, i) => (
          <g key={i}>
            <polygon points={`${cx},5 ${cx + 5},17 ${cx + 18},17 ${cx + 7},25 ${cx + 11},38 ${cx},30 ${cx - 11},38 ${cx - 7},25 ${cx - 18},17 ${cx - 5},17`} opacity={0.7} />
          </g>
        ))}
        <line x1="0" y1="20" x2="200" y2="20" stroke="#C19A6B" strokeWidth="0.5" opacity="0.5" strokeDasharray="4 8" />
      </g>
    </svg>
  );
}

/* ── Social media SVG icons ─────────────────────────────── */
const WhatsAppSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FacebookSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TelegramSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const TwitterXSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const SnapchatSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.513-.045.378.119.7.396.84.76.165.404-.018.793-.358.943-.35.124-.53.49-.594 1.04-.012.133.046.373.27.557.465.379 1.383.839 1.383 1.783 0 .6-.406 1.063-1.201 1.378-.36.141-.729.267-1.065.373-.337.107-.658.21-.895.355-.275.168-.353.432-.325.624.05.31.376.611.948.867 1.245.555 2.058 1.437 2.058 2.327 0 .612-.41 1.126-1.037 1.356-.9.337-2.267.441-3.71.441H12c-1.443 0-2.81-.104-3.71-.441-.627-.23-1.037-.744-1.037-1.356 0-.89.813-1.772 2.058-2.327.572-.256.898-.557.948-.867.028-.192-.05-.456-.325-.624-.237-.145-.558-.248-.895-.355a21.37 21.37 0 0 1-1.065-.373c-.795-.315-1.201-.778-1.201-1.378 0-.944.918-1.404 1.383-1.783.224-.184.282-.424.27-.557-.064-.55-.244-.916-.594-1.04-.34-.15-.523-.539-.358-.943.14-.364.462-.641.84-.76.17-.059.348-.043.513.045.374.181.733.285 1.033.301.198 0 .326-.045.401-.09l-.03-.51c-.104-1.628-.23-3.654.299-4.847C7.847 1.069 11.204.793 12.206.793z" />
  </svg>
);

const LinkedInSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const MessengerSvg = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.372 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.628 0 12-4.974 12-11.111C24 4.975 18.628 0 12 0zm1.194 14.963l-3.055-3.26-5.963 3.26L10.349 8.66l3.13 3.26 5.888-3.26-6.173 6.303z" />
  </svg>
);

/* ── Share chooser bottom sheet ─────────────────────────── */
function ShareChooserSheet({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [instaCopied, setInstaCopied] = useState(false);
  const APP_URL = 'https://noor-web-api-server.vercel.app';
  const APP_TITLE = 'تطبيق نُور - رفيقك الإسلامي الشامل';
  const MESSAGE = `تطبيق نـــور - رفيقك الإسلامي الشامل 🌙

النبي ﷺ قال: "الدال على الخير كفاعله". 🌸
حمله من اللينك ده، وشاركه مع حبايبك عشان الأجر يعم ويزيد:
🔗 ${APP_URL}

نسألكم الدعاء بظهر الغيب 🤲`;

  const encodedMsg = encodeURIComponent(MESSAGE);
  const encodedUrl = encodeURIComponent(APP_URL);
  const encodedTitle = encodeURIComponent(APP_TITLE);

  type ShareOption = {
    id: string;
    label: string;
    bg: string;
    color: string;
    icon: ReactNode;
    action: () => void;
    hidden?: boolean;
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      label: 'واتساب',
      bg: '#25D366',
      color: '#fff',
      icon: <WhatsAppSvg />,
      action: () => { window.open(`https://wa.me/?text=${encodedMsg}`, '_blank'); onClose(); },
    },
    {
      id: 'facebook',
      label: 'فيسبوك',
      bg: '#1877F2',
      color: '#fff',
      icon: <FacebookSvg />,
      action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMsg}`, '_blank'); onClose(); },
    },
    {
      id: 'telegram',
      label: 'تيليجرام',
      bg: '#0088cc',
      color: '#fff',
      icon: <TelegramSvg />,
      action: () => { window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`, '_blank'); onClose(); },
    },
    {
      id: 'twitter',
      label: 'X (تويتر)',
      bg: '#000',
      color: '#fff',
      icon: <TwitterXSvg />,
      action: () => { window.open(`https://twitter.com/intent/tweet?text=${encodedMsg}&url=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'messenger',
      label: 'ماسنجر',
      bg: '#0084FF',
      color: '#fff',
      icon: <MessengerSvg />,
      action: () => { window.open(`https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494417864&redirect_uri=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'instagram',
      label: instaCopied ? 'تم النسخ!' : 'إنستجرام',
      bg: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
      color: '#fff',
      icon: <InstagramSvg />,
      action: async () => {
        try {
          await navigator.clipboard.writeText(APP_URL);
          setInstaCopied(true);
          setTimeout(() => { setInstaCopied(false); window.open('https://www.instagram.com/', '_blank'); }, 800);
        } catch { window.open('https://www.instagram.com/', '_blank'); }
      },
    },
    {
      id: 'snapchat',
      label: 'سناب شات',
      bg: '#FFFC00',
      color: '#000',
      icon: <SnapchatSvg />,
      action: () => { window.open(`https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'linkedin',
      label: 'لينكد إن',
      bg: '#0A66C2',
      color: '#fff',
      icon: <LinkedInSvg />,
      action: () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank'); onClose(); },
    },
    {
      id: 'email',
      label: 'البريد',
      bg: '#EA4335',
      color: '#fff',
      icon: <Mail size={22} />,
      action: () => { window.open(`mailto:?subject=${encodedTitle}&body=${encodedMsg}`, '_self'); onClose(); },
    },
    {
      id: 'sms',
      label: 'رسالة SMS',
      bg: '#34C759',
      color: '#fff',
      icon: <MessageSquare size={22} />,
      action: () => { window.open(`sms:?body=${encodedMsg}`, '_self'); onClose(); },
    },
    {
      id: 'native',
      label: 'مشاركة',
      bg: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      icon: <Share2 size={22} />,
      action: async () => {
        if (navigator.share) {
          try {
            const logoUrl = `${window.location.origin}/logo.png`;
            let files: File[] | undefined;
            try {
              const resp = await fetch(logoUrl);
              if (resp.ok) {
                const blob = await resp.blob();
                const file = new File([blob], 'noor-app.png', { type: blob.type || 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                  files = [file];
                }
              }
            } catch { /* image fetch failed, share without image */ }

            if (files) {
              await navigator.share({ title: APP_TITLE, text: MESSAGE, files });
            } else {
              await navigator.share({ title: APP_TITLE, text: MESSAGE, url: APP_URL });
            }
          } catch { /* dismissed */ }
        }
        onClose();
      },
      hidden: typeof navigator === 'undefined' || !navigator.share,
    },
    {
      id: 'copy',
      label: copied ? 'تم النسخ!' : 'نسخ الرابط',
      bg: copied ? '#4ade80' : 'hsl(var(--secondary))',
      color: copied ? '#fff' : 'hsl(var(--foreground))',
      icon: copied ? <Check size={22} /> : <Copy size={22} />,
      action: async () => {
        try {
          await navigator.clipboard.writeText(APP_URL);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch { /* ignore */ }
      },
    },
  ].filter(o => !o.hidden);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl pt-5 pb-safe shadow-2xl"
        style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-2 px-5">
          <h3 className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>
            الدال على الخير كفاعله
          </h3>
          <button onClick={onClose} className="p-1.5 bg-secondary rounded-full">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-4 px-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
          اختر التطبيق وشاركنا الأجر والثواب
        </p>

        {/* Social media grid */}
        <div className="px-4 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          <div className="grid grid-cols-4 gap-3 pb-2">
            {shareOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={opt.action}
                className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: opt.bg, color: opt.color }}
                >
                  {opt.icon}
                </div>
                <span
                  className="text-[10px] font-medium text-foreground/80 text-center leading-tight"
                  style={{ fontFamily: '"Tajawal", sans-serif' }}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const NAME_COOLDOWN_DAYS = 10;
const NAME_LAST_CHANGED_KEY = 'name_last_changed';

function daysUntilCanChange(lastChangedTs: number | null): number {
  if (!lastChangedTs) return 0;
  const msElapsed = Date.now() - lastChangedTs;
  const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
  const remaining = NAME_COOLDOWN_DAYS - daysElapsed;
  return remaining > 0 ? Math.ceil(remaining) : 0;
}

function EditNameDialog({
  currentName,
  onSave,
  onCancel,
}: {
  currentName: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
}) {
  const cachedProfile = getProfileCache();
  const lastChangedTs = cachedProfile?.nameLastChanged ?? null;
  const daysLeft = daysUntilCanChange(lastChangedTs);
  const canEdit = daysLeft === 0;

  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (canEdit) inputRef.current?.focus();
  }, [canEdit]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === currentName) { onCancel(); return; }
    onSave(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-8" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border/50">
          <button onClick={onCancel} className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary/60">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>تعديل الاسم</p>
          <div className="w-8" />
        </div>

        <div className="px-5 py-5">
          {canEdit ? (
            <>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                maxLength={30}
                className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-3 text-base font-bold text-center outline-none focus:ring-2 focus:ring-primary/40 mb-4"
                style={{ fontFamily: '"Tajawal", sans-serif', direction: 'rtl' }}
                placeholder="أدخل اسمك"
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              />
              <div
                className="mb-4 flex items-start gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(193,154,107,0.08)', border: '1px solid rgba(193,154,107,0.2)' }}
              >
                <Clock className="w-4 h-4 text-primary/70 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                  بعد التعديل لن تتمكن من تغيير الاسم مجدداً لمدة <span className="font-bold text-primary">10 أيام</span>
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={!value.trim() || value.trim() === currentName}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  fontFamily: '"Tajawal", sans-serif',
                  background: (!value.trim() || value.trim() === currentName)
                    ? 'rgba(193,154,107,0.2)'
                    : 'linear-gradient(135deg, #C19A6B, #8B5E3C)',
                  color: (!value.trim() || value.trim() === currentName) ? 'rgba(139,94,60,0.5)' : '#fff',
                }}
              >
                حفظ الاسم
              </button>
            </>
          ) : (
            <div className="text-center py-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(193,154,107,0.12)' }}
              >
                <Clock className="w-7 h-7 text-primary" />
              </div>
              <p className="font-bold text-base mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                لا يمكن التعديل الآن
              </p>
              <p className="text-sm text-muted-foreground mb-5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                يمكنك تغيير اسمك بعد{' '}
                <span className="font-bold text-primary">{daysLeft} {daysLeft === 1 ? 'يوم' : 'أيام'}</span>
              </p>
              <button
                onClick={onCancel}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{
                  fontFamily: '"Tajawal", sans-serif',
                  background: 'rgba(193,154,107,0.12)',
                  color: '#8B5E3C',
                }}
              >
                حسناً
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function FeatureChip({ Icon, text }: { Icon: ComponentType<{ className?: string; size?: number }>; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2.5">
      <Icon className="w-4 h-4 flex-shrink-0 text-primary" size={16} />
      <span className="text-xs text-foreground/80 leading-tight" style={{ fontFamily: '"Tajawal", sans-serif' }}>{text}</span>
    </div>
  );
}

/* ── Guest Upgrade Sheet ─────────────────────────────────── */
function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'هذا البريد مستخدم بالفعل، جرّب تسجيل الدخول';
    case 'auth/invalid-email':        return 'البريد الإلكتروني غير صحيح';
    case 'auth/weak-password':        return 'كلمة السر ضعيفة (٦ أحرف على الأقل)';
    case 'auth/network-request-failed': return 'تحقق من الاتصال بالإنترنت';
    default:                          return 'حدث خطأ، حاول مرة أخرى';
  }
}

function GuestUpgradeSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep]         = useState<'email' | 'password'>('email');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async () => {
    if (step === 'email') { if (email.trim()) setStep('password'); return; }
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      const profile = getProfileCache() as (Record<string, unknown> | null);
      const oldLeaderboardId: string | null = (profile?.leaderboardId as string) ?? null;

      let uid: string;

      if (auth.currentUser?.isAnonymous) {
        /* ── الحالة الجديدة: ربط الإيميل بحساب الضيف الأنونيموس
               → نفس الـ UID، مفيش تكرار في الليدربورد */
        const credential = EmailAuthProvider.credential(email.trim(), password);
        try {
          const linked = await linkWithCredential(auth.currentUser, credential);
          uid = linked.user.uid;
        } catch (linkErr: unknown) {
          const code = (linkErr as { code?: string })?.code ?? '';
          if (code === 'auth/email-already-in-use' || code === 'auth/credential-already-in-use') {
            throw linkErr; // أظهر رسالة الخطأ للمستخدم
          }
          throw linkErr;
        }
      } else {
        /* ── حالة قديمة: لا يوجد مستخدم anonymous حالي */
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        uid = cred.user.uid;

        /* احذف الـ entry القديم لو كان UID مختلف */
        if (oldLeaderboardId && oldLeaderboardId !== uid) {
          deleteLeaderboardEntry(oldLeaderboardId).catch(() => {});
        }
      }

      /* الـ profile موجود بالفعل في RTDB cache — لا حاجة لـ localStorage */

      /* ابدأ المزامنة مع RTDB بالـ uid الجديد */
      await initUserSync(uid);

      /* أطلق حدث التحديث */
      window.dispatchEvent(new CustomEvent('noor-profile-updated'));

      onDone();
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      setError(mapAuthError(code));
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--secondary)',
    border: '1.5px solid var(--border)',
    fontFamily: '"Tajawal", sans-serif',
    color: 'var(--foreground)',
    fontSize: '1rem',
    width: '100%',
    borderRadius: '0.75rem',
    padding: '0.875rem 2.75rem 0.875rem 1rem',
    outline: 'none',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-20" dir="rtl" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-lg bg-card rounded-t-3xl shadow-2xl border border-border/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-2 bg-border/60" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="text-center">
            <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              {step === 'email' ? 'ربط البريد الإلكتروني' : 'أنشئ كلمة السر'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              بياناتك وتسبيحاتك لن تُحذف
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(193,154,107,0.12)' }}
          >
            <ShieldCheck className="w-4 h-4 text-[#C19A6B]" />
          </div>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">

          {/* ── مزايا التحويل — تطمين المستخدم ── */}
          {step === 'email' && (
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(135deg, rgba(193,154,107,0.14), rgba(193,154,107,0.06))',
                border: '1.5px solid rgba(193,154,107,0.35)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #C19A6B, #8B6340)' }}
                >
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p
                    className="font-bold text-sm leading-relaxed"
                    style={{ fontFamily: '"Tajawal", sans-serif', color: 'var(--foreground)' }}
                  >
                    التحويل آمن ١٠٠٪ — بياناتك لن تُحذف
                  </p>
                  <p
                    className="text-xs leading-relaxed mt-1.5"
                    style={{ fontFamily: '"Tajawal", sans-serif', color: 'var(--muted-foreground)' }}
                  >
                    تسبيحاتك وأذكارك محفوظة • ستبقى في نفس مكانك في الترتيب
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step: email ── */}
          {step === 'email' && (
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C19A6B]/60" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="البريد الإلكتروني..."
                autoFocus
                style={inputStyle}
                onKeyDown={e => e.key === 'Enter' && email.trim() && setStep('password')}
              />
            </div>
          )}

          {/* ── Step: password ── */}
          {step === 'password' && (
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C19A6B]/60" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="كلمة السر (٦ أحرف على الأقل)..."
                autoFocus
                style={{ ...inputStyle, paddingLeft: '2.75rem' }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={() => setShowPass(p => !p)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground p-1"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-xl px-4 py-2.5 text-sm text-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontFamily: '"Tajawal", sans-serif', color: '#f87171' }}>
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading || (step === 'email' ? !email.trim() : !password)}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{ background: 'linear-gradient(135deg,#C19A6B,#d4a97c)', color: '#000', fontFamily: '"Tajawal", sans-serif', boxShadow: '0 4px 16px rgba(193,154,107,0.3)' }}
          >
            {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {loading ? 'جارٍ إنشاء الحساب...' : step === 'email' ? 'التالي →' : 'إنشاء الحساب →'}
          </button>

          {step === 'password' && (
            <button onClick={() => setStep('email')} className="text-center text-sm text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              ← تغيير البريد الإلكتروني
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function MoreMenu() {
  const [theme, setTheme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showEditNameDialog, setShowEditNameDialog] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  void profileVersion;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleSaveName = async (newName: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await updateProfileInRTDB(uid, { name: newName, nameLastChanged: Date.now() });
    setProfileVersion(v => v + 1);
    setShowEditNameDialog(false);
  };

  const userProfile = getProfileCache();

  const MENU_ITEMS = [
    { Icon: HifzIcon,          label: 'اختبار الحفظ',        path: '/hifz-test',    desc: 'اختبر حفظك لكل آيات القرآن الكريم • 6236 آية', grad: 'linear-gradient(145deg, #1e4d2b, #0d2b16)' },
    { Icon: HadithIcon,        label: 'الأحاديث الشريفة',   path: '/hadith',       desc: 'أحاديث النبي ﷺ من كبار المصادر',                grad: 'linear-gradient(145deg, #2d6a4f, #1b4332)' },
    { Icon: ScrollIcon,        label: 'التاريخ الإسلامي',   path: '/history',      desc: 'من السيرة النبوية حتى الدولة العثمانية',         grad: 'linear-gradient(145deg, #6b3a0f, #3d2008)' },
    { Icon: IslamicStarIcon,   label: 'قصص الأنبياء',       path: '/prophets',     desc: 'قصص الأنبياء لابن كثير • تحقيق د. مصطفى عبد الواحد', grad: 'linear-gradient(145deg, #1b4332, #0d2b1e)' },
    { Icon: DuaHandsIcon,      label: 'سنن النبي ﷺ',        path: '/sunnah',       desc: 'اقتداءً بهدي المصطفى في يومك',                  grad: 'linear-gradient(145deg, #1b4332, #0d2b1e)' },
    { Icon: QuranBookIcon,     label: 'الاختبارات الإسلامية', path: '/quizzes',    desc: '5820 سؤال في 6 تخصصات شرعية',                   grad: 'linear-gradient(145deg, #3a1a5c, #1e0d30)' },
    { Icon: QiblaCompassIcon,  label: 'تحديد القبلة',        path: '/qibla',        desc: 'بوصلة ذكية لاتجاه الكعبة المشرفة',              grad: 'linear-gradient(145deg, #1e4d7b, #0f2d4d)' },
    { Icon: RadioIcon,         label: 'الإذاعات الإسلامية', path: '/radio',        desc: 'إذاعة القرآن الكريم وكبار القراء',               grad: 'linear-gradient(145deg, #5c3a7a, #3a1f52)' },
    { Icon: MoonIcon,          label: 'القنوات الإسلامية',  path: '/tv',           desc: 'بث مباشر لقناة القرآن والسنة وغيرها',            grad: 'linear-gradient(145deg, #0f3d2e, #072218)' },
    { Icon: IslamicStarIcon,   label: 'أسماء الله الحسنى',  path: '/asma',         desc: '99 اسماً مع معانيها وشرحها',                     grad: 'linear-gradient(145deg, #8B6340, #5c3e1e)' },
    { Icon: HeadphonesIcon,    label: 'القراء والاستماع',   path: '/reciters',     desc: '50+ قارئ للقرآن الكريم',                         grad: 'linear-gradient(145deg, #1a5c5c, #0d3b3b)' },
    { Icon: HeadphonesIcon,    label: 'مقارنة الأصوات',     path: '/voice-comparison', desc: 'قارن بين 2 ل 6 قراء في آيات محددة',          grad: 'linear-gradient(145deg, #4a2a7a, #25154a)' },
    { Icon: SmartReaderIcon,   label: 'قارئ التدبر الذكي',  path: '/speed-reader', desc: 'تدبر القرآن كلمةً بكلمة',                        grad: 'linear-gradient(145deg, #7a3a1e, #4d2310)' },
  ];

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto" dir="rtl">
      <AnimatePresence>
        {showShareSheet && (
          <ShareChooserSheet onClose={() => setShowShareSheet(false)} />
        )}
        {showEditNameDialog && userProfile && (
          <EditNameDialog
            currentName={userProfile.name ?? ''}
            onSave={handleSaveName}
            onCancel={() => setShowEditNameDialog(false)}
          />
        )}
      </AnimatePresence>

      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>المزيد</h1>

      {/* User profile card */}
      {userProfile && (
        <div className="mb-3 bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          {userProfile.photo ? (
            <img src={userProfile.photo} alt={userProfile.name} className="w-10 h-10 rounded-full border-2 border-primary/30" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold" style={{ fontFamily: '"Tajawal", sans-serif' }}>
                {(userProfile.name ?? '?')[0]}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-base truncate" style={{ fontFamily: '"Tajawal", sans-serif' }} data-testid="text-username">{userProfile.name}</p>
              <button
                onClick={() => setShowEditNameDialog(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                style={{ background: 'rgba(193,154,107,0.12)' }}
                title="تعديل الاسم"
                data-testid="button-edit-name"
              >
                <Pencil className="w-3 h-3 text-primary/70" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: '"Tajawal", sans-serif' }} data-testid="text-user-governorate">{userProfile.governorateName}</p>
          </div>
        </div>
      )}


      <div className="space-y-2.5">
        {MENU_ITEMS.map((item, idx) => {
          const Icon = item.Icon;
          return (
            <Link
              key={idx}
              href={item.path}
              className="flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border/40 hover-elevate"
            >
              <div className="flex items-center gap-3.5">
                {/* iOS-style gradient icon container */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: item.grad }}
                >
                  <Icon className="text-white" size={24} />
                </div>
                <div>
                  <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.label}</span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{item.desc}</span>
                </div>
              </div>
              <ChevronLeft className="w-4 h-4 text-muted-foreground/50" />
            </Link>
          );
        })}

        {/* Share App Card */}
        <button
          onClick={() => setShowShareSheet(true)}
          className="w-full flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border/40 hover-elevate"
          data-testid="button-share-app"
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(145deg, #10b981, #047857)' }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>الدال على الخير كفاعله</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>أرسل التطبيق لأحبابك لكي نتشارك الأجر</span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
        </button>

        {/* Rate App Card */}
        <a
          href="https://noor-web-api-server.vercel.app/#reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border/40 hover-elevate"
          data-testid="link-rate-app"
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(145deg, #f59e0b, #b45309)' }}
            >
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="text-right">
              <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>قيّمنا وادعمنا</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>رأيك يساعدنا على تطوير "Noor App"</span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
        </a>

        {/* Settings Card */}
        <Link href="/settings">
          <button
            className="w-full flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border/40 hover-elevate"
            data-testid="button-settings"
          >
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(145deg, #5a4a8a, #3a2d6a)' }}
              >
                <Settings2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>الخصائص</span>
                <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>الخلفية وحجم الخط وإعدادات التطبيق</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
          </button>
        </Link>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between bg-card p-3.5 rounded-2xl border border-border/40 hover-elevate"
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: theme === 'dark' ? 'linear-gradient(145deg, #2a2a5c, #181832)' : 'linear-gradient(145deg, #8B6340, #5c3e1e)' }}
            >
              {theme === 'light' ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
            </div>
            <div className="text-right">
              <span className="font-bold text-base block" style={{ fontFamily: '"Tajawal", sans-serif' }}>الوضع الليلي</span>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{theme === 'dark' ? 'مفعّل حالياً' : 'غير مفعّل'}</span>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full relative transition-all duration-300 flex-shrink-0 ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${theme === 'dark' ? 'left-0.5' : 'right-0.5'}`} />
          </div>
        </button>
      </div>

      {/* About App Section */}
      <div className="mt-6 rounded-3xl overflow-hidden border border-primary/20"
        style={{ background: 'var(--color-card)' }}>

        {/* Header with logo + name */}
        <div className="relative overflow-hidden">
          {/* Decorative background ornament */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              {[40, 120, 200, 280, 360].map((cx, i) => (
                <polygon key={i} fill="#C19A6B"
                  points={`${cx},5 ${cx+7},22 ${cx+26},22 ${cx+10},34 ${cx+17},52 ${cx},40 ${cx-17},52 ${cx-10},34 ${cx-26},22 ${cx-7},22`} />
              ))}
            </svg>
          </div>

          <div className="relative z-10 px-6 pt-6 pb-5 text-center">
            {/* Logo ring */}
            <div className="mx-auto mb-3 relative w-20 h-20">
              <div className="absolute inset-0 rounded-[22px] opacity-30"
                style={{ boxShadow: '0 0 30px rgba(193,154,107,0.5)', background: 'rgba(193,154,107,0.1)' }} />
              <img src="/logo.png" alt="نور"
                className="w-full h-full object-contain rounded-[22px]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>

            {/* App name in calligraphic style */}
            <p className="text-primary font-black"
              style={{ fontFamily: '"Amiri", "Scheherazade New", serif', fontSize: '2.6rem', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              نُـور
            </p>
            <p className="text-muted-foreground text-xs mt-1 tracking-widest uppercase"
              style={{ fontFamily: '"Tajawal", sans-serif', letterSpacing: '0.12em' }}>
              Noor App · الإصدار 2.0
            </p>

            {/* Decorative divider */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
              <svg viewBox="0 0 20 20" width={14} height={14} fill="none">
                <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,14 4.5,18 6.5,11 1,7 8,7"
                  fill="rgba(193,154,107,0.6)" />
              </svg>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 space-y-4 border-t border-primary/10">
          {/* About text */}
          <div className="pt-4">
            <p className="text-sm text-foreground/75 leading-loose text-center" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              رفيقك الإسلامي الشامل، صُمِّم لمساعدة المسلمين على تعزيز صلتهم بالله وإحياء سنة النبي ﷺ في حياتهم اليومية.
            </p>
          </div>

          {/* Features grid */}
          <div>
            <p className="font-bold text-xs text-primary/70 mb-2.5 text-center tracking-wide"
              style={{ fontFamily: '"Tajawal", sans-serif', letterSpacing: '0.08em' }}>
              مميزات التطبيق
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { Icon: MosqueIcon,       text: 'مواقيت الصلاة',       grad: 'linear-gradient(145deg,#1e4d7b,#0f2d4d)' },
                { Icon: QuranBookIcon,    text: 'القرآن الكريم',        grad: 'linear-gradient(145deg,#2d6a4f,#1b4332)' },
                { Icon: HeadphonesIcon,   text: '+50 قارئاً',           grad: 'linear-gradient(145deg,#1a5c5c,#0d3b3b)' },
                { Icon: TasbihIcon,       text: 'السبحة الإلكترونية',   grad: 'linear-gradient(145deg,#8B6340,#5c3e1e)' },
                { Icon: SmartReaderIcon,  text: 'قارئ التدبر الذكي',   grad: 'linear-gradient(145deg,#7a3a1e,#4d2310)' },
                { Icon: DuaHandsIcon,     text: 'الأذكار والأدعية',    grad: 'linear-gradient(145deg,#5c3a7a,#3a1f52)' },
                { Icon: ScrollIcon,       text: 'تفسير الجلالين',       grad: 'linear-gradient(145deg,#7a5c1e,#4d3a10)' },
                { Icon: IslamicStarIcon,  text: 'أسماء الله الحسنى',   grad: 'linear-gradient(145deg,#8B6340,#4d3210)' },
                { Icon: RadioIcon,        text: 'الإذاعات الإسلامية',  grad: 'linear-gradient(145deg,#5c3a7a,#2e1a42)' },
                { Icon: QiblaCompassIcon, text: 'تحديد القبلة',         grad: 'linear-gradient(145deg,#1e4d7b,#102840)' },
                { Icon: HadithIcon,       text: 'الأحاديث الشريفة',    grad: 'linear-gradient(145deg,#2d6a4f,#163828)' },
                { Icon: MoonIcon,         text: 'الوضع الليلي',         grad: 'linear-gradient(145deg,#2a2a5c,#181832)' },
              ].map(({ Icon, text, grad }, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary/30 rounded-xl px-2.5 py-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: grad }}>
                    <Icon className="text-white" size={14} />
                  </div>
                  <span className="text-xs text-foreground/80 leading-tight" style={{ fontFamily: '"Tajawal", sans-serif' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div className="rounded-2xl border border-border/30 p-3 space-y-1.5 bg-secondary/20">
            <p className="text-[10px] font-bold text-primary/60 mb-1 uppercase tracking-widest"
              style={{ fontFamily: '"Tajawal", sans-serif' }}>مصادر البيانات</p>
            {[
              { label: 'مواقيت الصلاة', val: 'aladhan.com' },
              { label: 'القرآن الكريم', val: 'alquran.cloud' },
              { label: 'القراء والتلاوات', val: 'mp3quran.net' },
            ].map((src, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground" style={{ fontFamily: '"Tajawal", sans-serif' }}>{src.label}</span>
                <span className="text-primary/70 font-medium text-[11px]" dir="ltr">{src.val}</span>
              </div>
            ))}
          </div>

          {/* Developer credit */}
          <div className="text-center pt-1">
            <p className="text-muted-foreground text-xs" style={{ fontFamily: '"Tajawal", sans-serif' }}>تصميم وتطوير</p>
            <p className="text-primary font-black text-lg mt-0.5" style={{ fontFamily: '"Amiri", serif' }}>سيف كامل</p>
            <p className="text-muted-foreground/60 text-[10px] mt-0.5" style={{ fontFamily: '"Tajawal", sans-serif' }}>مطوّر تطبيق نُور</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px flex-1 max-w-12" style={{ background: 'rgba(193,154,107,0.25)' }} />
              <svg viewBox="0 0 20 20" width={12} height={12} fill="rgba(193,154,107,0.45)">
                <polygon points="10,1 12,7 19,7 13.5,11 15.5,18 10,14 4.5,18 6.5,11 1,7 8,7" />
              </svg>
              <div className="h-px flex-1 max-w-12" style={{ background: 'rgba(193,154,107,0.25)' }} />
            </div>
            <p className="text-muted-foreground/40 text-[10px] mt-2" style={{ fontFamily: '"Tajawal", sans-serif' }}>
              جميع الحقوق محفوظة © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
