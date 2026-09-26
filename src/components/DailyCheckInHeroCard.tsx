import React, { useState, useEffect } from 'react';
import {
  Gift,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  getStreakTier,
  getCycleDayForStreak,
  getPointsForStreak,
  isDailyCheckInAvailable,
  getTimeUntilNextCheckIn,
} from '../lib/dailyStreak';
import { triggerLightImpact, triggerQuestCompleteHaptic } from '../lib/haptics';
import { playCoinSound, playBlipSound } from '../lib/arcadeSounds';
import { fireArcadeConfetti } from '../lib/confetti';

interface DailyCheckInHeroCardProps {
  onOpenModal: () => void;
}

export const DailyCheckInHeroCard: React.FC<DailyCheckInHeroCardProps> = ({ onOpenModal }) => {
  const { language, t } = useLanguage();
  const {
    user,
    streakTheme,
    claimDailyStreakBonus,
  } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(() => getTimeUntilNextCheckIn(user));
  const [claimCelebration, setClaimCelebration] = useState<number | null>(null);

  const streak = user?.current_streak ?? 0;
  const isAvailable = isDailyCheckInAvailable(user);
  const cycleDay = getCycleDayForStreak(streak);
  const tierInfo = getStreakTier(streak);
  const isFlame = streakTheme === 'flame';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilNextCheckIn(user));
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.last_checkin_timestamp, user?.last_checkin_date]);

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = claimDailyStreakBonus();
    if (res.success) {
      triggerQuestCompleteHaptic();
      playCoinSound();
      fireArcadeConfetti();
      setClaimCelebration(res.points);
      setTimeout(() => setClaimCelebration(null), 3000);
    } else {
      triggerLightImpact();
    }
  };

  const handleCardClick = () => {
    playBlipSound();
    triggerLightImpact();
    onOpenModal();
  };

  const currentPoints = getPointsForStreak(streak === 0 ? 1 : isAvailable ? streak + 1 : streak);

  return (
    <div
      onClick={handleCardClick}
      className={`relative w-full rounded-2xl border-3 border-black p-3 select-none cursor-pointer transition-all duration-200 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.01] active:scale-[0.99] ${
        isFlame
          ? 'bg-gradient-to-r from-[#200e04] via-[#14291c] to-[#072418]'
          : 'bg-gradient-to-r from-[#072718] via-[#0d3b25] to-[#103D29]'
      }`}
    >
      {/* Background Decorative Ambient Shimmer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB443]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-2.5">
        {/* Left Section: Visual Streak Counter Badge & Tier Info */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 ${
              isFlame ? 'bg-[#3b1706]' : 'bg-[#062316]'
            }`}
          >
            <span
              className={`transform transition-transform ${
                isAvailable ? 'animate-bounce' : 'animate-pulse'
              }`}
            >
              {isFlame ? tierInfo.flameEmoji : tierInfo.leafEmoji}
            </span>
          </div>

          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-black text-base tabular-nums ${
                  isFlame ? 'text-[#FFD43F]' : 'text-[#2BD97F]'
                }`}
              >
                {streak} {t('streakDays')}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">
                • {tierInfo.label}
              </span>
            </div>

            <div className="flex items-center gap-1 mt-0.5 text-[11px] font-bold text-neutral-300">
              <Calendar className="w-3 h-3 text-[#FFB443]" />
              <span>
                {language === 'ar' ? 'يوم الدورة:' : '7-Day Cycle:'} {cycleDay}/7
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Action Button or Countdown */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isAvailable ? (
            <button
              type="button"
              onClick={handleClaim}
              className="retro-btn bg-[#FFB443] hover:bg-yellow-400 text-black px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-pulse"
            >
              <Gift className="w-3.5 h-3.5 fill-black" />
              <span>+{currentPoints} PTS</span>
              <Sparkles className="w-3 h-3" />
            </button>
          ) : (
            <div className="text-right rtl:text-left">
              <div className="flex items-center gap-1 text-[10px] font-black text-[#2BD97F] bg-[#103D29] border border-[#2BD97F]/40 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                <span>{language === 'ar' ? 'نشط اليوم' : 'Active Today'}</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-neutral-300 font-mono mt-0.5 tabular-nums">
                <Clock className="w-2.5 h-2.5 text-[#FFB443]" />
                <span>{timeRemaining.formatted}</span>
              </div>
            </div>
          )}

          <ChevronRight className="w-4 h-4 text-neutral-400 rtl:rotate-180" />
        </div>
      </div>

      {/* Claim Celebration Banner */}
      {claimCelebration !== null && (
        <div className="mt-2 bg-[#2BD97F] text-black rounded-lg py-1 px-2 text-center font-black text-[11px] border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] animate-bounce">
          🎉 +{claimCelebration} Eco Points Claimed! Streak Active!
        </div>
      )}
    </div>
  );
};
