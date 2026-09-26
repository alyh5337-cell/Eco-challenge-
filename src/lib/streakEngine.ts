/**
 * Eco Challenge v1.9.8 - Streak & Scoring Engine
 * Adheres strictly to the specification:
 * 1. Score starts strictly at 0
 * 2. Adds quest points to profiles.score on Karin approval
 * 3. Compares current calendar date with last_action_date:
 *    - If yesterday: increment current_streak by 1
 *    - If today: keep current_streak as is (no duplicate streak increment in the same day)
 *    - If more than 48 hours passed without action: reset streak to 0 (then set to 1 for this new action)
 */

export interface StreakEvaluationResult {
  newScore: number;
  newStreak: number;
  newLastActionDate: string;
  streakIncremented: boolean;
  streakReset: boolean;
}

export function evaluateStreakAndScore(
  currentScore: number,
  currentStreak: number,
  lastActionDateStr: string | null,
  pointsAwarded: number,
  nowDate: Date = new Date()
): StreakEvaluationResult {
  const newScore = Math.max(0, currentScore + pointsAwarded);

  // If this is the user's first ever action
  if (!lastActionDateStr) {
    return {
      newScore,
      newStreak: 1,
      newLastActionDate: nowDate.toISOString(),
      streakIncremented: true,
      streakReset: false,
    };
  }

  const lastDate = new Date(lastActionDateStr);

  // Normalize to UTC midnight to compare calendar days accurately
  const lastMidnight = Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate());
  const nowMidnight = Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate());

  const oneDayMs = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor((nowMidnight - lastMidnight) / oneDayMs);

  let newStreak = currentStreak;
  let streakIncremented = false;
  let streakReset = false;

  if (daysDiff === 0) {
    // Action occurred today: keep streak as is
    newStreak = Math.max(1, currentStreak);
  } else if (daysDiff === 1) {
    // Action occurred yesterday: streak incremented!
    newStreak = currentStreak + 1;
    streakIncremented = true;
  } else {
    // More than 1 calendar day gap (>= 48 hours): streak broke and restarts at 1!
    newStreak = 1;
    streakReset = true;
    streakIncremented = true;
  }

  return {
    newScore,
    newStreak,
    newLastActionDate: nowDate.toISOString(),
    streakIncremented,
    streakReset,
  };
}

/**
 * Check if the streak should currently show as 0 due to 48h inactivity
 */
export function checkCurrentStreakLiveness(currentStreak: number, lastActionDateStr: string | null, nowDate: Date = new Date()): number {
  if (!lastActionDateStr || currentStreak <= 0) return 0;
  const lastDate = new Date(lastActionDateStr);
  const diffHours = (nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

  // If more than 48 hours passed without an action, the displayed streak has lapsed
  if (diffHours >= 48) {
    return 0;
  }
  return currentStreak;
}
