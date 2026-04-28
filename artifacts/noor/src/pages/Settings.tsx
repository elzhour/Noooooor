import { useRef } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, Image, Upload, X, Type, Layers, Bell, ChevronLeft as ChevronLeftSmall } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppSettings, PRESET_BACKGROUNDS } from '@/contexts/AppSettingsContext';
import { useUserSetting } from '@/hooks/use-user-setting';

export function Settings() {
  const [theme] = useUserSetting<'light' | 'dark'>('theme', 'light');
  const dark = theme === 'dark';

  const {
    bgType, bgPreset, bgCustom,
    appFontScale, hasBg, cardOpacity,
    setBgType, setBgPreset, setBgCustom,
    setAppFontScale, setCardOpacity,
  } = useAppSettings();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setBgCustom(result);
      setBgType('custom');
    };
    reader.readAsDataURL(file);
  };

  const sectionBg = hasBg
    ? (dark ? 'rgba(10,8,4,0.88)' : 'rgba(253,251,245,0.92)')
    : (dark ? 'rgba(255,255,255,0.04)' : 'rgba(193,154,107,0.06)');
  const borderColor = dark ? 'rgba(193,154,107,0.2)' : 'rgba(193,154,107,0.3)';
  const textColor = dark ? '#e8d9b8' : '#2C1E16';
  const subText = dark ? 'rgba(232,217,184,0.55)' : '#8B5E3C';
  const pageBg = hasBg ? 'transparent' : (dark ? '#0f0c07' : '#FDFBF5');

  const fontLabels = ['صغير', 'عادي', 'كبير', 'أكبر'];
  const fontValues = [0.85, 1, 1.15, 1.3];

  return (
    <div className="min-h-screen pb-28" dir="rtl" style={{ background: pageBg }}>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-4 py-4 flex items-center gap-3"
        style={{
          background: dark ? 'rgba(15,12,7,0.95)' : 'rgba(253,251,245,0.95)',
          borderBottom: `1px solid ${borderColor}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <Link href="/more">
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(193,154,107,0.12)', border: `1px solid ${borderColor}` }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: '#C19A6B' }} />
          </button>
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: '#C19A6B' }}>
          الخصائص
        </h1>
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto">

        {/* ── Notifications Section ── */}
        <Link href="/notifications">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.99]"
            style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
            data-testid="link-notification-settings"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#C19A6B,#8B6340)' }}
            >
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-right">
              <div className="text-base font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>
                إشعارات الصلاة
              </div>
              <div className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
                صامت / نص / أذان لكل صلاة، يُجدول لشهر كامل
              </div>
            </div>
            <ChevronLeftSmall className="w-5 h-5" style={{ color: subText }} />
          </motion.div>
        </Link>

        {/* ── Font Size Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-4"
          style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, #C19A6B, #8B5E3C)' }}
            >
              <Type className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>حجم الخط</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>اضبط حجم النصوص في التطبيق</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>أ</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={fontValues.indexOf(appFontScale) === -1 ? 1 : fontValues.indexOf(appFontScale)}
                onChange={e => setAppFontScale(fontValues[Number(e.target.value)])}
                className="w-full accent-[#C19A6B]"
                style={{ height: 4 }}
              />
            </div>
            <span className="text-lg font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>أ</span>
          </div>

          <div className="flex justify-between px-1">
            {fontLabels.map((label, i) => (
              <button
                key={i}
                onClick={() => setAppFontScale(fontValues[i])}
                className="text-xs px-2 py-1 rounded-lg transition-all"
                style={{
                  fontFamily: '"Tajawal", sans-serif',
                  background: appFontScale === fontValues[i] ? '#C19A6B' : 'rgba(193,154,107,0.1)',
                  color: appFontScale === fontValues[i] ? '#0f0c07' : subText,
                  fontWeight: appFontScale === fontValues[i] ? 700 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className="mt-4 p-3 rounded-xl text-center"
            style={{ background: 'rgba(193,154,107,0.08)', border: `1px solid ${borderColor}` }}
          >
            <p
              style={{
                fontFamily: '"Tajawal", sans-serif',
                color: textColor,
                fontSize: `${14 * appFontScale}px`,
                lineHeight: 1.8,
              }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-xs mt-1" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>معاينة الحجم</p>
          </div>
        </motion.div>

        {/* ── Card Opacity Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4"
          style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, #7B5EA7, #5B3E8A)' }}
            >
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>شفافية الخانات</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>اضبط مستوى شفافية خانات التطبيق</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>شفاف</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(cardOpacity * 100)}
                onChange={e => setCardOpacity(Number(e.target.value) / 100)}
                className="w-full accent-[#7B5EA7]"
                style={{ height: 4 }}
              />
            </div>
            <span className="text-xs font-bold w-8 text-center" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>صلب</span>
          </div>

          <div
            className="mt-3 p-3 rounded-xl text-center"
            style={{ background: 'rgba(123,94,167,0.08)', border: `1px solid ${borderColor}` }}
          >
            <div
              className="rounded-xl p-3 border mb-2"
              style={{
                background: dark
                  ? `hsl(20 18% 12% / ${cardOpacity})`
                  : `hsl(0 0% 100% / ${cardOpacity})`,
                border: `1px solid ${borderColor}`,
              }}
            >
              <p className="text-sm font-bold" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>معاينة الخانة</p>
              <p className="text-xs mt-1" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>هكذا ستبدو خانات التطبيق</p>
            </div>
            <p className="text-xs" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>
              الشفافية: {Math.round(cardOpacity * 100)}%
            </p>
          </div>
        </motion.div>

        {/* ── Background Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4"
          style={{ background: sectionBg, border: `1px solid ${borderColor}` }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(145deg, #4a6fa5, #2d4a7a)' }}
            >
              <Image className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-base" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>خلفية التطبيق</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>اختر خلفية تملأ شاشة التطبيق</p>
            </div>
          </div>

          {/* Option: Default */}
          <button
            onClick={() => setBgType('none')}
            className="w-full flex items-center gap-3 p-3 rounded-xl mb-3 transition-all"
            style={{
              background: bgType === 'none' ? 'rgba(193,154,107,0.15)' : 'rgba(193,154,107,0.05)',
              border: `1.5px solid ${bgType === 'none' ? '#C19A6B' : borderColor}`,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
              style={{ background: dark ? '#1c1408' : '#F7EDD6', border: `1px solid ${borderColor}` }}
            >
              <X className="w-5 h-5" style={{ color: '#C19A6B' }} />
            </div>
            <div className="text-right">
              <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>بدون خلفية</p>
              <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>الوضع الافتراضي للتطبيق</p>
            </div>
            {bgType === 'none' && (
              <div className="mr-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>

          {/* Preset images grid */}
          <p className="text-xs font-bold mb-2" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>صور إسلامية مقترحة</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_BACKGROUNDS.map((bg) => {
              const isSelected = bgType === 'preset' && bgPreset === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => { setBgPreset(bg.id); setBgType('preset'); }}
                  className="relative rounded-xl overflow-hidden transition-all"
                  style={{
                    aspectRatio: '9/14',
                    border: `2.5px solid ${isSelected ? '#C19A6B' : 'transparent'}`,
                    boxShadow: isSelected ? '0 0 0 1px #C19A6B' : 'none',
                  }}
                >
                  <img
                    src={bg.src}
                    alt={bg.label}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)' }}
                  />
                  <p
                    className="absolute bottom-1 right-0 left-0 text-center text-[10px] text-white font-bold leading-tight px-0.5"
                    style={{ fontFamily: '"Tajawal", sans-serif' }}
                  >
                    {bg.label}
                  </p>
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#C19A6B' }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom from gallery */}
          <p className="text-xs font-bold mb-2" style={{ color: subText, fontFamily: '"Tajawal", sans-serif' }}>أو اختر من معرض صورك</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {bgCustom && bgType === 'custom' ? (
            <div className="relative rounded-xl overflow-hidden mb-2" style={{ height: 120 }}>
              <img src={bgCustom} alt="خلفية مخصصة" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <button
                  onClick={() => { fileInputRef.current?.click(); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: 'rgba(193,154,107,0.8)', fontFamily: '"Tajawal", sans-serif' }}
                >
                  تغيير الصورة
                </button>
              </div>
              <button
                onClick={() => { setBgType('none'); setBgCustom(''); }}
                className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)' }}
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#C19A6B' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{
                background: 'rgba(193,154,107,0.05)',
                border: `1.5px dashed ${borderColor}`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(193,154,107,0.1)' }}
              >
                <Upload className="w-5 h-5" style={{ color: '#C19A6B' }} />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm" style={{ fontFamily: '"Tajawal", sans-serif', color: textColor }}>اختر صورة من معرضك</p>
                <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>JPG, PNG, WEBP مدعومة</p>
              </div>
            </button>
          )}
        </motion.div>

        {/* Preview note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-3 text-center"
          style={{ background: 'rgba(193,154,107,0.06)', border: `1px solid ${borderColor}` }}
        >
          <p className="text-xs" style={{ fontFamily: '"Tajawal", sans-serif', color: subText }}>
            تُطبَّق التغييرات فوراً على التطبيق كله
          </p>
        </motion.div>
      </div>
    </div>
  );
}
