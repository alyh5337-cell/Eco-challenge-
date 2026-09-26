/**
 * Eco Challenge v2.1 - Daily Login & Check-in Streak Engine
 * Tracks 24-hour daily app check-ins with calendar & 24h interval math.
 * Provides a 7-day reward ladder, bonus milestones, countdown timers, and animated counter tiers.
 */

import { UserProfile } from '../types';

export interface DailyCheckInDayReward {
  dayNumber: number;
  points: number;
  title_en: string;
  title_ar: string;
  icon: string;
  description_en: string;
  description_ar: string;
  isSpecialMilestone?: boolean;
}

export const BASE_DAILY_REWARDS: DailyCheckInDayReward[] = [
  {
    dayNumber: 1,
    points: 10,
    title_en: 'Sprout Spark',
    title_ar: 'شرارة البذرة',
    icon: '🌱',
    description_en: 'First step into your daily green habit!',
    description_ar: 'خطوتك الأولى في عادتك البيئية اليومية!',
  },
  {
    dayNumber: 2,
    points: 15,
    title_en: 'Leaf Growth',
    title_ar: 'نمو الورقة',
    icon: '🍃',
    description_en: 'Consistency builds real impact.',
    description_ar: 'الاستمرارية تبني أثراً حقيقياً.',
  },
  {
    dayNumber: 3,
    points: 25,
    title_en: 'Ember Blaze',
    title_ar: 'وهج الجمر',
    icon: '🔥',
    description_en: '3 days straight! Flame bonus unlocked.',
    description_ar: '3 أيام متتالية! مكافأة اللهب مفتوحة.',
    isSpecialMilestone: true,
  },
  {
    dayNumber: 4,
    points: 35,
    title_en: 'Thunder Charge',
    title_ar: 'شحنة الرعد',
    icon: '⚡',
    description_en: 'Your eco-dedication is electrifying!',
    description_ar: 'إخلاصك البيئي يشع طاقة!',
  },
  {
    dayNumber: 5,
    points: 50,
    title_en: 'Super Nova',
    title_ar: 'النجم الساطع',
    icon: '🌟',
    description_en: 'High momentum! Golden points burst.',
    description_ar: 'زخم عالٍ! نقاط ذهبية استثنائية.',
  },
  {
    dayNumber: 6,
    points: 65,
    title_en: 'Emerald Flame',
    title_ar: 'اللهب الزمردي',
    icon: '💎',
    description_en: 'One day away from the Weekly Trophy!',
    description_ar: 'يوم واحد يفصلك عن كأس الأسبوع!',
  },
  {
    dayNumber: 7,
    points: 100,
    title_en: 'Apex Eco Champion',
    title_ar: 'بطل البيئة الأسطوري',
    icon: '🏆',
    description_en: '7-Day Ultra Streak mastered! Maximum rewards.',
    description_ar: 'أتممت أسبوعاً كاملاً متواصلاً! أعلى مكافأة.',
    isSpecialMilestone: true,
  },
];

export interface DailyStreakResult {
  updatedUser: UserProfile;
  streakIncreased: boolean;
  streakReset: boolean;
  isFirstLoginEver: boolean;
  daysDiff: number;
  bonusPoints: number;
  notificationMessage?: string;
  milestoneTitle?: string;
  checkInCycleDay: number;
}

export function getTodayCalendarString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  try {
    const [fromY, fromM, fromD] = fromDateStr.split('-').map(Number);
    const [toY, toM, toD] = toDateStr.split('-').map(Number);

    const fromUtc = Date.UTC(fromY, fromM - 1, fromD);
    const toUtc = Date.UTC(toY, toM - 1, toD);

    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.round((toUtc - fromUtc) / msPerDay);
  } catch {
    return 1;
  }
}

/**
 * Returns the current cycle day (1 to 7) based on streak
 */
export function getCycleDayForStreak(streak: number): number {
  if (streak <= 0) return 1;
  const mod = streak % 7;
  return mod === 0 ? 7 : mod;
}

/**
 * Calculates points for a given day in the streak with cycle escalation
 */
export function getPointsForStreak(streak: number): number {
  const cycleDay = getCycleDayForStreak(streak);
  const baseReward = BASE_DAILY_REWARDS.find((r) => r.dayNumber === cycleDay) || BASE_DAILY_REWARDS[0];
  const cycleMultiplier = Math.floor((Math.max(1, streak) - 1) / 7);
  // Each subsequent 7-day cycle adds +10 bonus points per day
  return baseReward.points + cycleMultiplier * 10;
}

/**
 * Checks if the user is eligible to claim a Daily Check-in right now (once every 24h / calendar day)
 */
export function isDailyCheckInAvailable(user: UserProfile | null, nowDate: Date = new Date()): boolean {
  if (!user) return false;
  const todayStr = getTodayCalendarString(nowDate);
  const lastCheckin = user.last_checkin_date || user.last_login_date;

  if (!lastCheckin) return true;

  // If last checkin was on a previous calendar day, it is ready!
  if (lastCheckin !== todayStr) {
    return true;
  }

  // Also check 24-hour timestamp difference if available
  if (user.last_checkin_timestamp) {
    const elapsedMs = nowDate.getTime() - user.last_checkin_timestamp;
    if (elapsedMs >= 24 * 60 * 60 * 1000) {
      return true;
    }
  }

  return false;
}

/**
 * Computes remaining time until the next 24-hour check-in unlocks (resets at midnight local or after 24h)
 */
export function getTimeUntilNextCheckIn(
  user: UserProfile | null,
  nowDate: Date = new Date()
): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
} {
  // Midnight of next day
  const tomorrowMidnight = new Date(nowDate);
  tomorrowMidnight.setHours(24, 0, 0, 0);

  let targetTime = tomorrowMidnight.getTime();

  if (user?.last_checkin_timestamp) {
    const twentyFourHoursAfter = user.last_checkin_timestamp + 24 * 60 * 60 * 1000;
    // Whichever occurs sooner: midnight or 24h elapsed
    targetTime = Math.min(targetTime, twentyFourHoursAfter);
    if (targetTime < nowDate.getTime()) {
      targetTime = tomorrowMidnight.getTime();
    }
  }

  const diffMs = Math.max(0, targetTime - nowDate.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { hours, minutes, seconds, totalSeconds, formatted };
}

/**
 * Processes daily check-in, awarding points and updating streak
 */
export function performDailyCheckIn(user: UserProfile, nowDate: Date = new Date()): DailyStreakResult {
  const todayStr = getTodayCalendarString(nowDate);
  const lastCheckinDate = user.last_checkin_date || user.last_login_date;
  const nowMs = nowDate.getTime();

  // Case 1: First check-in ever
  if (!lastCheckinDate) {
    const bonus = getPointsForStreak(1);
    const updatedUser: UserProfile = {
      ...user,
      current_streak: 1,
      last_login_date: todayStr,
      last_checkin_date: todayStr,
      last_checkin_timestamp: nowMs,
      total_checkins: (user.total_checkins || 0) + 1,
      score: user.score + bonus,
    };

    return {
      updatedUser,
      streakIncreased: true,
      streakReset: false,
      isFirstLoginEver: true,
      daysDiff: 0,
      bonusPoints: bonus,
      checkInCycleDay: 1,
      milestoneTitle: 'First Spark! 🌱',
      notificationMessage: `Day 1 Check-in complete! +${bonus} Eco Points earned!`,
    };
  }

  const diff = getDaysDifference(lastCheckinDate, todayStr);

  // Case 2: Consecutive check-in (1 calendar day gap or 24h elapsed)
  if (diff === 1 || diff === 0) {
    const newStreak = (user.current_streak || 0) + 1;
    const bonus = getPointsForStreak(newStreak);
    const cycleDay = getCycleDayForStreak(newStreak);

    let milestoneTitle: string | undefined;
    if (cycleDay === 7) {
      milestoneTitle = '7-Day Eco Champion! 🏆';
    } else if (cycleDay === 3) {
      milestoneTitle = '3-Day Blaze! 🔥';
    } else if (newStreak % 30 === 0) {
      milestoneTitle = `${newStreak}-Day Legend! 🌟`;
    }

    const updatedUser: UserProfile = {
      ...user,
      current_streak: newStreak,
      last_login_date: todayStr,
      last_checkin_date: todayStr,
      last_checkin_timestamp: nowMs,
      total_checkins: (user.total_checkins || 0) + 1,
      score: user.score + bonus,
    };

    return {
      updatedUser,
      streakIncreased: true,
      streakReset: false,
      isFirstLoginEver: false,
      daysDiff: Math.max(1, diff),
      bonusPoints: bonus,
      checkInCycleDay: cycleDay,
      milestoneTitle,
      notificationMessage: milestoneTitle
        ? `${milestoneTitle} +${bonus} points awarded!`
        : `Day ${newStreak} Streak! +${bonus} Eco Points claimed!`,
    };
  }

  // Case 3: Missed 2 or more days (diff >= 2). Reset streak to 1
  const bonus = getPointsForStreak(1);
  const updatedUser: UserProfile = {
    ...user,
    current_streak: 1,
    last_login_date: todayStr,
    last_checkin_date: todayStr,
    last_checkin_timestamp: nowMs,
    total_checkins: (user.total_checkins || 0) + 1,
    score: user.score + bonus,
  };

  return {
    updatedUser,
    streakIncreased: true,
    streakReset: true,
    isFirstLoginEver: false,
    daysDiff: diff,
    bonusPoints: bonus,
    checkInCycleDay: 1,
    milestoneTitle: 'Fresh Start! 🌱',
    notificationMessage: `Streak restarted! +${bonus} points claimed for Day 1!`,
  };
}

/**
 * Evaluates daily login streak when app boots
 */
export function processDailyLoginStreak(user: UserProfile, nowDate: Date = new Date()): DailyStreakResult {
  const todayStr = getTodayCalendarString(nowDate);
  const lastLogin = user.last_login_date;

  if (!lastLogin) {
    return performDailyCheckIn(user, nowDate);
  }

  const diff = getDaysDifference(lastLogin, todayStr);

  if (diff === 0) {
    return {
      updatedUser: user,
      streakIncreased: false,
      streakReset: false,
      isFirstLoginEver: false,
      daysDiff: 0,
      bonusPoints: 0,
      checkInCycleDay: getCycleDayForStreak(user.current_streak),
    };
  }

  return performDailyCheckIn(user, nowDate);
}

/**
 * Returns streak visual tier for styling and animations
 */
export function getStreakTier(streak: number): {
  tier: number;
  label: string;
  flameEmoji: string;
  leafEmoji: string;
  colorHex: string;
  glowClass: string;
  badgeName: string;
} {
  if (streak >= 14) {
    return {
      tier: 4,
      label: 'Supernova Forest',
      flameEmoji: '⚡🔥',
      leafEmoji: '🌳✨',
      colorHex: '#FF5A5F',
      glowClass: 'shadow-[0_0_12px_rgba(255,90,95,0.7)]',
      badgeName: 'Apex Phoenix',
    };
  }
  if (streak >= 7) {
    return {
      tier: 3,
      label: 'Wildfire Grove',
      flameEmoji: '🔥✨',
      leafEmoji: '🌿⭐',
      colorHex: '#FFB443',
      glowClass: 'shadow-[0_0_10px_rgba(255,180,67,0.7)]',
      badgeName: 'Inferno Keeper',
    };
  }
  if (streak >= 3) {
    return {
      tier: 2,
      label: 'Blazing Sapling',
      flameEmoji: '🔥',
      leafEmoji: '🌱',
      colorHex: '#FFD43F',
      glowClass: 'shadow-[0_0_8px_rgba(255,212,63,0.6)]',
      badgeName: 'Sprout Igniter',
    };
  }
  return {
    tier: 1,
    label: 'Ember Sprout',
    flameEmoji: '🕯️',
    leafEmoji: '🍃',
    colorHex: '#2BD97F',
    glowClass: 'shadow-[0_0_6px_rgba(43,217,127,0.5)]',
    badgeName: 'Newborn Spark',
  };
}
