import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  X,
  CheckCircle2,
  Lock,
  RotateCw,
  Gift,
  Clock,
  Flame,
  Award,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  BASE_DAILY_REWARDS,
  getStreakTier,
  getCycleDayForStreak,
  getPointsForStreak,
  isDailyCheckInAvailable,
  getTimeUntilNextCheckIn,
} from '../lib/dailyStreak';
import { triggerLightImpact, triggerQuestCompleteHaptic } from '../lib/haptics';
import { playCoinSound, playBlipSound } from '../lib/arcadeSounds';
import { fireArcadeConfetti } from '../lib/confetti';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const {
    user,
    streakTheme,
    setStreakTheme,
    claimDailyStreakBonus,
    simulateNextDayLogin,
  } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(() => getTimeUntilNextCheckIn(user));
  const [justClaimedPoints, setJustClaimedPoints] = useState<number | null>(null);

  const streak = user?.current_streak ?? 0;
  const isAvailable = isDailyCheckInAvailable(user);
  const cycleDay = getCycleDayForStreak(streak);
  const tierInfo = getStreakTier(streak);
  const isFlame = streakTheme === 'flame';

  // Live countdown timer for the next 24-hour cycle
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilNextCheckIn(user));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, user?.last_checkin_timestamp, user?.last_checkin_date]);

  if (!isOpen) return null;

  const handleClaim = () => {
    const res = claimDailyStreakBonus();
    if (res.success) {
      triggerQuestCompleteHaptic();
      playCoinSound();
      fireArcadeConfetti();
      setJustClaimedPoints(res.points);
      setTimeout(() => setJustClaimedPoints(null), 3000);
    } else {
      triggerLightImpact();
    }
  };

  const handleSimulateNextDay = () => {
    playBlipSound();
    triggerLightImpact();
    simulateNextDayLogin();
  };

  const handleToggleTheme = () => {
    triggerLightImpact();
    playBlipSound();
    setStreakTheme(isFlame ? 'leaf' : 'flame');
  };

  const currentDayPoints = getPointsForStreak(streak === 0 ? 1 : isAvailable ? streak + 1 : streak);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-[#062316] border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col text-white max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#103D29] border-b-3 border-black p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">
              {isFlame ? '🔥' : '🌿'}
            </span>
            <div>
              <h3 className="font-black text-sm text-[#FFD43F] leading-tight">
                {t('dailyCheckInTitle')}
              </h3>
              <span className="text-[10px] text-neutral-300 font-bold block">
                {tierInfo.label} • Tier {tierInfo.tier}/4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="retro-btn bg-[#062316] hover:bg-[#0d3b25] text-[#FFD43F] border-2 border-black rounded-xl px-2 py-1 text-[11px] font-black flex items-center gap-1"
              title="Toggle Flame / Leaf Visual Theme"
            >
              <span>{isFlame ? '🌿 Leaf' : '🔥 Flame'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                triggerLightImpact();
                onClose();
              }}
              className="p-1.5 bg-black/40 hover:bg-black/70 rounded-xl text-white/80 hover:text-white transition-colors"
              title={t('closeBtn')}
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Main Visual Streak Counter Hero Card */}
          <div
            className={`p-3.5 rounded-2xl border-3 border-black relative overflow-hidden text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
              isFlame
                ? 'bg-gradient-to-b from-[#2a1308] via-[#1a0a03] to-[#072418]'
                : 'bg-gradient-to-b from-[#072718] via-[#0d3b25] to-[#041c10]'
            }`}
          >
            {/* Ambient Background Particle Accent */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#FFB443]/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-[#2BD97F]/10 blur-xl pointer-events-none" />

            {/* Streak Counter Icon & Badge */}
            <div className="relative inline-flex items-center justify-center mb-1">
              <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,180,67,0.8)] animate-pulse">
                {isFlame ? tierInfo.flameEmoji : tierInfo.leafEmoji}
              </span>
            </div>

            <div className="flex items-baseline justify-center gap-1.5 leading-none mb-1">
              <span
                className={`text-4xl font-black tracking-tight tabular-nums ${
                  isFlame ? 'text-[#FFD43F]' : 'text-[#2BD97F]'
                }`}
              >
                {streak}
              </span>
              <span className="text-sm font-black text-neutral-300 uppercase">
                {t('streakDays')} {language === 'ar' ? 'متتالية' : 'Streak'}
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 font-bold max-w-[260px] mx-auto leading-tight">
              {isAvailable
                ? language === 'ar'
                  ? 'مكافأتك اليومية جاهزة للاستلام الآن! اضغط بالأسفل للمتابعة.'
                  : 'Your daily 24h bonus is ready to claim! Collect it now below.'
                : language === 'ar'
                ? 'أنت في المسار الصحيح! سجلت حضورك بنجاح لليوم.'
                : 'You are on track! Logged in and active for today.'}
            </p>
          </div>

          {/* 7-Day Cyclical Reward Ladder Roadmap */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FFB443]" />
                <h4 className="font-black text-xs text-[#FFB443]">
                  {t('streakTrackTitle')}
                </h4>
              </div>
              <span className="text-[10px] font-black text-[#2BD97F] bg-[#103D29] px-2 py-0.5 rounded-md border border-[#2BD97F]/30">
                Cycle Day {cycleDay}/7
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {BASE_DAILY_REWARDS.map((reward) => {
                // Determine day status
                const isClaimedDay = !isAvailable && reward.dayNumber <= cycleDay;
                const isCurrentActiveDay =
                  (isAvailable && reward.dayNumber === (streak === 0 ? 1 : cycleDay === 7 ? 1 : cycleDay + 1)) ||
                  (!isAvailable && reward.dayNumber === cycleDay);
                const isUpcoming = !isClaimedDay && !isCurrentActiveDay;

                return (
                  <div
                    key={reward.dayNumber}
                    className={`relative p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-between text-center ${
                      reward.dayNumber === 7 ? 'col-span-2' : 'col-span-1'
                    } ${
                      isClaimedDay
                        ? 'bg-[#103D29] border-[#2BD97F] text-white opacity-85'
                        : isCurrentActiveDay && isAvailable
                        ? 'bg-[#FFB443] border-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-2 ring-[#FFD43F] animate-pulse'
                        : isCurrentActiveDay
                        ? 'bg-[#103D29] border-[#FFB443] text-white'
                        : 'bg-[#041a10] border-black/80 text-neutral-400 opacity-60'
                    }`}
                  >
                    {/* Day Label */}
                    <span className="text-[10px] font-black uppercase tracking-tight block">
                      {t('dayX')} {reward.dayNumber}
                    </span>

                    {/* Reward Icon */}
                    <div className="my-1 text-lg leading-none">
                      {isClaimedDay ? (
                        <CheckCircle2 className="w-5 h-5 text-[#2BD97F]" />
                      ) : (
                        <span>{reward.icon}</span>
                      )}
                    </div>

                    {/* Points Value */}
                    <div className="flex items-center gap-0.5">
                      <span className="text-xs font-black tabular-nums">
                        +{reward.points}
                      </span>
                      <span className="text-[8px] font-bold">PTS</span>
                    </div>

                    {/* Special Trophy tag for Day 7 */}
                    {reward.isSpecialMilestone && (
                      <span className="text-[8px] font-black uppercase text-amber-300 mt-0.5 block leading-tight">
                        {reward.dayNumber === 7 ? 'Champion' : 'Blaze'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button & Status Display */}
          <div className="pt-1">
            {isAvailable ? (
              <button
                type="button"
                onClick={handleClaim}
                className="w-full retro-btn bg-gradient-to-r from-[#FFB443] via-[#FFD43F] to-[#2BD97F] hover:scale-[1.02] active:scale-[0.98] text-black font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              >
                <Gift className="w-4 h-4 fill-black" />
                <span>
                  {t('claimDailyBtn')} (+{currentDayPoints} PTS)
                </span>
                <Sparkles className="w-4 h-4" />
              </button>
            ) : (
              <div className="bg-[#103D29] border-2 border-black rounded-2xl p-3 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-black text-[#2BD97F]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('alreadyClaimedToday')}</span>
                </div>

                {/* Countdown Timer */}
                <div className="bg-[#062316] border border-black rounded-xl p-2 flex items-center justify-between px-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#FFB443]" />
                    <span>{t('nextCheckInIn')}:</span>
                  </div>
                  <span className="font-mono text-sm font-black text-[#FFD43F] tabular-nums tracking-wider">
                    {timeRemaining.formatted}
                  </span>
                </div>
              </div>
            )}

            {/* Just Claimed Floating Banner */}
            {justClaimedPoints !== null && (
              <div className="mt-2 bg-[#2BD97F] text-black rounded-xl p-2 text-center font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                🎉 +{justClaimedPoints} Eco Points Added to Your Balance!
              </div>
            )}
          </div>

          {/* QA & Testing Simulator Box */}
          <div className="pt-2 border-t-2 border-black/40 flex items-center justify-between">
            <div className="text-[10px] text-neutral-400 font-bold">
              <span>{language === 'ar' ? 'أداة اختبار التقدم:' : 'QA Fast-Forward:'}</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateNextDay}
              className="retro-btn bg-[#FFB443] hover:bg-yellow-400 text-black px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 border-2 border-black"
              title="Advance time by 24h to test Day 2, Day 3... Day 7 streak transitions"
            >
              <RotateCw className="w-3 h-3" />
              <span>{t('simulateNextDay')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
