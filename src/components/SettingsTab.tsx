import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Save,
  Check,
  Languages,
  Cloud,
  RotateCcw,
  Info,
  ArrowLeft,
  ArrowRight,
  Download,
  Smartphone,
  Sparkles,
  Volume2,
  VolumeX,
  Flame,
  Calendar,
  Gift,
  RotateCw,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { PWAInstallButton } from './PWAInstallButton';
import { getStreakTier } from '../lib/dailyStreak';
import {
  isHapticsEnabled,
  setHapticsEnabled,
  triggerLightImpact,
  triggerQuestCompleteHaptic,
  isHapticsSupported,
} from '../lib/haptics';
import {
  isSoundsEnabled,
  setSoundsEnabled,
  playCoinSound,
  playBlipSound,
} from '../lib/arcadeSounds';
import { fireArcadeConfetti } from '../lib/confetti';

interface SettingsTabProps {
  onBack?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onBack }) => {
  const { t, language, setLanguage, dir } = useLanguage();
  const {
    user,
    updateProfile,
    loginWithGoogle,
    resetAllData,
    streakTheme,
    setStreakTheme,
    setIsCheckInModalOpen,
    simulateNextDayLogin,
  } = useAuth();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(() => isHapticsEnabled());
  const [soundsOn, setSoundsOn] = useState(() => isSoundsEnabled());

  const sampleAvatars = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=EcoHero1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=OakSpirit99&backgroundColor=103d29',
    'https://api.dicebear.com/7.x/bottts/svg?seed=CoralHero7&backgroundColor=0284c7',
    'https://api.dicebear.com/7.x/bottts/svg?seed=SolarFox88&backgroundColor=d97706',
    'https://api.dicebear.com/7.x/bottts/svg?seed=KarinPupil22&backgroundColor=059669',
    'https://api.dicebear.com/7.x/bottts/svg?seed=ForestSage8&backgroundColor=064e3b',
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    updateProfile({
      display_name: displayName.trim(),
      avatar_url: selectedAvatar,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="pb-8 pt-2 px-3 w-full space-y-4">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-black/40 pb-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="retro-btn bg-[#103D29] hover:bg-[#154e35] text-white p-2 rounded-xl text-xs font-black flex items-center gap-1"
            title="Back"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{dir === 'rtl' ? 'عودة' : 'Back'}</span>
          </button>
        ) : <div />}

        <h2 className="text-lg font-black text-[#FFD43F] tracking-wide flex items-center justify-center gap-1.5 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <SettingsIcon className="w-5 h-5 text-[#38BDF8]" />
          <span>{t('settingsTitle')}</span>
        </h2>

        <div className="w-12" />
      </div>

      {/* 1. Profile Customization Form */}
      <div className="retro-card bg-[#103D29] p-4">
        <h3 className="font-black text-sm text-[#FFB443] mb-3 flex items-center gap-1.5">
          <User className="w-4 h-4" />
          <span>{t('profileHeader')}</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-xs font-black text-white mb-1">
              {t('displayNameLabel')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-[#062316] border-2 border-black rounded-xl p-2.5 text-xs text-white font-bold focus:outline-hidden focus:border-[#FFB443]"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-white mb-1.5">
              {t('avatarSelection')}
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {sampleAvatars.map((avUrl, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedAvatar(avUrl)}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${
                    selectedAvatar === avUrl
                      ? 'border-[#FFB443] scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'border-black opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={avUrl} alt={`Avatar ${i}`} className="w-full h-11 object-cover bg-black" />
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full retro-btn bg-[#2BD97F] text-black font-black py-2.5 rounded-xl text-xs hover:bg-[#25c472] flex items-center justify-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{language === 'ar' ? 'تم حفظ التعديلات!' : 'Profile Saved!'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('saveProfileBtn')}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. Language Switcher */}
      <div className="retro-card bg-[#103D29] p-4">
        <h3 className="font-black text-sm text-[#FFD43F] mb-3 flex items-center gap-1.5">
          <Languages className="w-4 h-4" />
          <span>{t('languageSection')}</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setLanguage('ar')}
            className={`retro-btn py-2.5 px-3 rounded-xl text-xs font-black transition-colors ${
              language === 'ar' ? 'bg-[#FFB443] text-black' : 'bg-[#062316] text-white hover:bg-[#0a2f1e]'
            }`}
          >
            {t('switchToArabic')}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`retro-btn py-2.5 px-3 rounded-xl text-xs font-black transition-colors ${
              language === 'en' ? 'bg-[#FFB443] text-black' : 'bg-[#062316] text-white hover:bg-[#0a2f1e]'
            }`}
          >
            {t('switchToEnglish')}
          </button>
        </div>
      </div>

      {/* 3. Account & Cloud Sync */}
      <div className="retro-card bg-[#103D29] p-4">
        <h3 className="font-black text-sm text-[#38BDF8] mb-2 flex items-center gap-1.5">
          <Cloud className="w-4 h-4" />
          <span>{t('accountSection')}</span>
        </h3>

        <div className="bg-[#062316] border-2 border-black rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
            <span>{user?.is_guest ? t('guestStatus') : t('cloudStatus')}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black ${
                user?.is_guest ? 'bg-[#FFD43F] text-black' : 'bg-[#2BD97F] text-black'
              }`}
            >
              {user?.is_guest ? 'GUEST' : 'CLOUD SYNC'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 font-medium">
            Firebase: Google Auth & Firestore Cloud Persistence (Active)
          </p>
        </div>

        {user?.is_guest && (
          <button
            onClick={loginWithGoogle}
            className="w-full retro-btn bg-white hover:bg-neutral-100 text-black font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Cloud className="w-4 h-4 text-[#4285F4]" />
            <span>{t('syncCloudBtn')}</span>
          </button>
        )}
      </div>

      {/* 4. Daily Check-in Reward System & Visual Streak Counter */}
      <div className="retro-card bg-[#103D29] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-sm text-[#FFB443] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#FFD43F]" />
            <span>{t('dailyCheckInTitle')}</span>
          </h3>
          <span className="text-[10px] font-black text-[#2BD97F] bg-[#062316] px-2 py-0.5 rounded-md border border-[#2BD97F]/30">
            {user?.current_streak ?? 0} {t('streakDays')}
          </span>
        </div>
        <p className="text-xs text-neutral-300 font-medium mb-3">
          {t('dailyCheckInSubtitle')}
        </p>

        {/* Counter Visual Preview & Theme Switcher */}
        <div className="bg-[#062316] border-2 border-black rounded-xl p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">
              {streakTheme === 'flame' ? '🔥' : '🌿'}
            </span>
            <div>
              <span className="text-xs font-black text-white block">
                {getStreakTier(user?.current_streak ?? 0).label}
              </span>
              <span className="text-[10px] text-neutral-400 font-bold block">
                {streakTheme === 'flame' ? 'Flame Style Active' : 'Leaf Style Active'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerLightImpact();
              playBlipSound();
              setStreakTheme(streakTheme === 'flame' ? 'leaf' : 'flame');
            }}
            className="retro-btn bg-[#103D29] hover:bg-[#154e35] text-[#FFD43F] border-2 border-black rounded-xl px-2.5 py-1 text-xs font-black"
          >
            {streakTheme === 'flame' ? '🌿 Use Leaf' : '🔥 Use Flame'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              triggerLightImpact();
              playBlipSound();
              setIsCheckInModalOpen(true);
            }}
            className="retro-btn bg-[#2BD97F] hover:bg-[#25c472] text-black py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 border-black"
          >
            <Gift className="w-3.5 h-3.5 fill-black" />
            <span>{language === 'ar' ? 'عرض المكافآت' : 'View Rewards'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerLightImpact();
              playBlipSound();
              simulateNextDayLogin();
            }}
            className="retro-btn bg-[#FFB443] hover:bg-yellow-400 text-black py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 border-black"
            title="Advance +24 hours to test daily check-in streak reward progression"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>{t('simulateNextDay')}</span>
          </button>
        </div>
      </div>

      {/* 4. Global 90s Arcade Sound Effects Toggle */}
      <div className="retro-card bg-[#103D29] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-sm text-[#FFD43F] flex items-center gap-1.5">
            {soundsOn ? (
              <Volume2 className="w-4 h-4 text-[#2BD97F] animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4 text-neutral-400" />
            )}
            <span>{t('arcadeSoundTitle')}</span>
          </h3>
          <button
            type="button"
            onClick={() => {
              const nextState = !soundsOn;
              setSoundsOn(nextState);
              setSoundsEnabled(nextState);
              if (nextState) {
                playBlipSound();
              }
            }}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 border-2 border-black flex items-center ${
              soundsOn ? 'bg-[#2BD97F] justify-end' : 'bg-neutral-800 justify-start'
            }`}
            title={soundsOn ? t('arcadeSoundEnabled') : t('arcadeSoundDisabled')}
          >
            <span className="w-4 h-4 rounded-full bg-black shadow-xs block" />
          </button>
        </div>
        <p className="text-xs text-neutral-300 font-medium mb-3">
          {t('arcadeSoundSubtitle')}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => playBlipSound()}
            className="retro-btn bg-[#062316] hover:bg-[#0a2f1e] text-white py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 border-black"
          >
            <span>⚡</span>
            <span>{t('testBlipSound')}</span>
          </button>
          <button
            type="button"
            onClick={() => playCoinSound()}
            className="retro-btn bg-[#FFB443] hover:bg-[#ffa726] text-black py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 border-black"
          >
            <span>🪙</span>
            <span>{t('testCoinSound')}</span>
          </button>
        </div>
      </div>

      {/* 5. Mobile Arcade Haptic Feedback */}
      <div className="retro-card bg-[#103D29] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-black text-sm text-[#FFB443] flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#FFD43F]" />
            <span>{language === 'ar' ? 'الاهتزاز اللمسي للأركيد (Haptics)' : 'Arcade Mobile Haptics'}</span>
          </h3>
          <button
            type="button"
            onClick={() => {
              const nextState = !hapticsOn;
              setHapticsOn(nextState);
              setHapticsEnabled(nextState);
              if (nextState) {
                triggerLightImpact();
              }
            }}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 border-2 border-black flex items-center ${
              hapticsOn ? 'bg-[#2BD97F] justify-end' : 'bg-neutral-800 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black shadow-xs block" />
          </button>
        </div>
        <p className="text-xs text-neutral-300 font-medium mb-3">
          {language === 'ar'
            ? 'تفعيل الاهتزازات التفاعلية الفورية مع كل نقرة زر واكتمال للمهام بواسطة محرك Capacitor Haptics.'
            : 'Enables tactile vibration feedback for button taps and quest victories using the Capacitor Haptics plugin.'}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => triggerLightImpact()}
            className="retro-btn bg-[#062316] hover:bg-[#0a2f1e] text-white py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 border-black"
          >
            <span>⚡</span>
            <span>{language === 'ar' ? 'اختبار نقرة زر' : 'Test Tap'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerQuestCompleteHaptic();
              fireArcadeConfetti();
            }}
            className="retro-btn bg-[#FFB443] hover:bg-[#ffa726] text-black py-2 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border-2 border-black"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{language === 'ar' ? 'اختبار فوز المهمة' : 'Test Victory'}</span>
          </button>
        </div>
      </div>

      {/* 5. Progressive Web App (PWA) Offline & Install Option */}
      <div className="retro-card bg-[#103D29] p-4">
        <h3 className="font-black text-sm text-[#2BD97F] mb-1.5 flex items-center gap-1.5">
          <Download className="w-4 h-4" />
          <span>{language === 'ar' ? 'تطبيق الهاتف وتثبيت PWA' : 'Mobile App & PWA'}</span>
        </h3>
        <p className="text-xs text-neutral-300 font-medium mb-3">
          {language === 'ar'
            ? 'يمكنك تثبيت تحدي البيئة على شاشتك الرئيسية للوصول الفوري وتجربة أركيد كاملة بدون شريط المتصفح.'
            : 'Install Eco Challenge directly to your mobile home screen for instantaneous access and full native arcade experience.'}
        </p>
        <PWAInstallButton />
      </div>

      {/* 5. About Section (Clean Production UI, Version v1.9.9) */}
      <div className="retro-card bg-[#062316] p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#FFD43F] mb-1">
          <Info className="w-4 h-4" />
          <span>{t('aboutSection')}</span>
        </div>
        <p className="text-xs font-black text-white mb-1">
          {t('appName')} {t('appVersion')}
        </p>
        <p className="text-[11px] text-neutral-300 font-medium leading-relaxed mb-3">
          {t('aboutApp')}
        </p>
        <p className="text-[10px] text-neutral-500 font-bold mb-3">
          {t('credits')}
        </p>

        <button
          onClick={() => {
            if (
              confirm(
                language === 'ar'
                  ? 'هل أنت متأكد من إعادة تعيين البيانات التجريبية والبدء من جديد؟'
                  : 'Are you sure you want to reset all demo data and restart?'
              )
            ) {
              resetAllData();
            }
          }}
          className="retro-btn bg-[#FF5A5F] text-white font-black py-2 px-3 rounded-xl text-xs hover:bg-red-600 flex items-center justify-center gap-1 mx-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('resetDataBtn')}</span>
        </button>
      </div>
    </div>
  );
};
