import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getStreakTier, isDailyCheckInAvailable } from '../lib/dailyStreak';
import { triggerLightImpact } from '../lib/haptics';
import { playBlipSound } from '../lib/arcadeSounds';

export const DailyStreakCounter: React.FC = () => {
  const { language, t } = useLanguage();
  const { user, streakTheme, isCheckInAvailable, setIsCheckInModalOpen } = useAuth();
  const [pressedAnim, setPressedAnim] = useState(false);

  const streak = user?.current_streak ?? 0;
  const tierInfo = getStreakTier(streak);
  const isFlame = streakTheme === 'flame';

  const handleClick = () => {
    triggerLightImpact();
    playBlipSound();
    setPressedAnim(true);
    setTimeout(() => setPressedAnim(false), 200);
    setIsCheckInModalOpen(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-black transition-all select-none cursor-pointer retro-btn ${
        isFlame
          ? 'bg-gradient-to-r from-[#2a1308] via-[#3a1a0b] to-[#103D29] text-[#FFB443]'
          : 'bg-gradient-to-r from-[#072718] via-[#0d3b25] to-[#103D29] text-[#2BD97F]'
      } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 active:scale-95 ${
        isCheckInAvailable ? 'ring-2 ring-[#FFD43F] animate-pulse' : ''
      } ${pressedAnim ? 'scale-95' : ''}`}
      title={`${t('streakLabel')}: ${streak} ${t('streakDays')} - ${
        isCheckInAvailable ? t('claimDailyBtn') : t('alreadyClaimedToday')
      }`}
    >
      {/* Animated Counter Icon (Flame vs Leaf) */}
      <div className="relative flex items-center justify-center">
        {isFlame ? (
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-full bg-orange-500/30 blur-xs animate-pulse" />
            <span
              className={`text-base leading-none inline-block transform transition-transform duration-300 ${
                streak >= 7
                  ? 'animate-bounce drop-shadow-[0_0_8px_#FF5A5F]'
                  : streak >= 3
                  ? 'animate-pulse drop-shadow-[0_0_6px_#FFB443]'
                  : 'drop-shadow-[0_0_4px_#FFD43F]'
              }`}
            >
              {tierInfo.flameEmoji}
            </span>
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-full bg-emerald-500/30 blur-xs animate-pulse" />
            <span
              className={`text-base leading-none inline-block transform transition-transform duration-300 ${
                streak >= 7
                  ? 'animate-bounce drop-shadow-[0_0_8px_#2BD97F]'
                  : 'animate-pulse drop-shadow-[0_0_5px_#A7F3D0]'
              }`}
            >
              {tierInfo.leafEmoji}
            </span>
          </div>
        )}
      </div>

      {/* Counter Number Display */}
      <div className="flex flex-col items-start leading-none">
        <div className="flex items-center gap-0.5">
          <span
            className={`font-black text-xs tracking-tight tabular-nums ${
              isFlame ? 'text-[#FFD43F]' : 'text-[#2BD97F]'
            }`}
          >
            {streak}
          </span>
          <span className="text-[9px] font-black text-white/80 uppercase">
            {language === 'ar' ? 'يوم' : 'd'}
          </span>
        </div>
      </div>

      {/* Daily Check-in Status Pip or Gift Icon */}
      {isCheckInAvailable ? (
        <span
          className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#FFD43F] text-black text-[9px] font-black border border-black shadow-[0_0_6px_#FFD43F] animate-bounce"
          title="Daily Check-in Ready!"
        >
          <Gift className="w-2.5 h-2.5 fill-black" />
        </span>
      ) : (
        <span
          className="w-2 h-2 rounded-full border border-black bg-[#2BD97F] shadow-[0_0_6px_#2BD97F]"
          title="Active Today"
        />
      )}
    </button>
  );
};
