/**
 * Eco Challenge v2.1 - Top Squads Competitive Leaderboard Engine
 * Computes live and mock rankings, weekly momentum, and retro arcade badges.
 */

import { Squad } from '../types';

export interface RetroBadge {
  id: string;
  label: string;
  labelAr: string;
  icon: string;
  style: 'gold' | 'silver' | 'bronze' | 'emerald' | 'amber' | 'cyan' | 'ruby' | 'purple';
  description: string;
}

export interface SquadRankEntry {
  rank: number;
  squadId: string;
  name: string;
  description: string;
  badgeIcon: string;
  leaderName: string;
  leaderAvatar: string;
  memberCount: number;
  totalScore: number;
  weeklyGain: number;
  trend: 'up' | 'down' | 'same' | 'fire';
  trendDelta?: number;
  isPrivate: boolean;
  retroBadges: RetroBadge[];
  isUserMember: boolean;
  isLeader: boolean;
}

export type LeaderboardTimeframe = 'all-time' | 'weekly' | 'sprint';

const EXTRA_GLOBAL_SQUADS = [
  {
    id: 'squad-mangrove-reclaimers',
    name: 'Mangrove Reclaimers',
    description: 'Restoring tidal mudflats and planting Avicennia marina seedlings.',
    join_code: 'ECO-MAN-33',
    is_private: false,
    leader_id: 'leader-mng',
    leader_name: 'Salma Coastal',
    total_score: 380,
    badge_icon: '🦀',
    member_count: 14,
    created_at: '2026-09-02T10:00:00Z',
  },
  {
    id: 'squad-balcony-permaculture',
    name: 'Balcony Permaculture Club',
    description: 'Turning high-rise apartments into lush zero-waste mini forests.',
    join_code: 'ECO-BAL-55',
    is_private: false,
    leader_id: 'leader-blc',
    leader_name: 'Dr. Zaid',
    total_score: 295,
    badge_icon: '🌺',
    member_count: 11,
    created_at: '2026-09-07T10:00:00Z',
  },
];

/**
 * Fetches rankings asynchronously with simulated network delay
 */
export async function fetchTopSquadsRankings(
  activeSquads: Squad[],
  userSquadIds: string[],
  currentUserId?: string,
  timeframe: LeaderboardTimeframe = 'all-time'
): Promise<SquadRankEntry[]> {
  // Simulate network latency (250ms)
  await new Promise((resolve) => setTimeout(resolve, 250));

  // Merge active squads with extra global mock squads if not duplicate
  const combinedMap = new Map<string, any>();

  for (const s of activeSquads) {
    combinedMap.set(s.id, {
      ...s,
      isUserMember: userSquadIds.includes(s.id),
      isLeader: currentUserId ? s.leader_id === currentUserId : false,
    });
  }

  for (const extra of EXTRA_GLOBAL_SQUADS) {
    if (!combinedMap.has(extra.id)) {
      combinedMap.set(extra.id, {
        ...extra,
        isUserMember: userSquadIds.includes(extra.id),
        isLeader: false,
      });
    }
  }

  const list = Array.from(combinedMap.values());

  // Calculate scores per timeframe
  const scoredList = list.map((s) => {
    let score = s.total_score || 200;
    let weeklyGain = Math.floor((score % 150) + 40);

    if (timeframe === 'weekly') {
      score = weeklyGain;
    } else if (timeframe === 'sprint') {
      score = Math.floor(weeklyGain * 0.65) + 25;
    }

    return {
      ...s,
      effectiveScore: score,
      weeklyGain,
    };
  });

  // Sort descending
  scoredList.sort((a, b) => b.effectiveScore - a.effectiveScore);

  // Map to SquadRankEntry with rank numbers and retro badges
  return scoredList.map((item, index) => {
    const rank = index + 1;
    const retroBadges: RetroBadge[] = [];

    // Rank 1: Gold Champion Badges
    if (rank === 1) {
      retroBadges.push({
        id: 'gold-crown',
        label: '👑 GOLD CHAMPION',
        labelAr: '👑 بطل الذهب',
        icon: '👑',
        style: 'gold',
        description: 'Current #1 ranked team on the global leaderboard',
      });
      retroBadges.push({
        id: 'apex-squad',
        label: '⚡ APEX GUILD',
        labelAr: '⚡ قمة الدوري',
        icon: '⚡',
        style: 'amber',
        description: 'Over 600 points amassed',
      });
    }
    // Rank 2: Silver Titan Badges
    else if (rank === 2) {
      retroBadges.push({
        id: 'silver-titan',
        label: '🥈 SILVER TITAN',
        labelAr: '🥈 عملاق الفضة',
        icon: '🥈',
        style: 'silver',
        description: 'Elite 2nd place contender',
      });
      retroBadges.push({
        id: 'hot-streak',
        label: '🔥 HOT STREAK',
        labelAr: '🔥 موجة انتصارات',
        icon: '🔥',
        style: 'ruby',
        description: 'Surged up 3 positions this week',
      });
    }
    // Rank 3: Bronze Guardian Badges
    else if (rank === 3) {
      retroBadges.push({
        id: 'bronze-guardian',
        label: '🥉 BRONZE GUARDIAN',
        labelAr: '🥉 حارس البرونز',
        icon: '🥉',
        style: 'bronze',
        description: 'Podium finisher with consistent completions',
      });
      retroBadges.push({
        id: 'podium-star',
        label: '⭐ PODIUM STAR',
        labelAr: '⭐ نجم المنصة',
        icon: '⭐',
        style: 'amber',
        description: 'Maintained top 3 status',
      });
    }
    // Rank 4+ Specialization Badges
    else {
      if (item.name.toLowerCase().includes('solar') || item.badge_icon === '⚡') {
        retroBadges.push({
          id: 'solar-hero',
          label: '⚡ SOLAR HERO',
          labelAr: '⚡ بطل الطاقة',
          icon: '⚡',
          style: 'amber',
          description: 'High clean-energy verification count',
        });
      } else if (item.name.toLowerCase().includes('waste') || item.badge_icon === '🎒') {
        retroBadges.push({
          id: 'zero-waste',
          label: '♻️ ZERO WASTE NINJA',
          labelAr: '♻️ نينجا تدوير',
          icon: '♻️',
          style: 'cyan',
          description: 'Top single-use elimination squad',
        });
      } else if (item.name.toLowerCase().includes('mangrove') || item.badge_icon === '🦀') {
        retroBadges.push({
          id: 'blue-carbon',
          label: '🌊 BLUE CARBON',
          labelAr: '🌊 حامي السواحل',
          icon: '🌊',
          style: 'cyan',
          description: 'Restoring tidal coastal buffers',
        });
      } else {
        retroBadges.push({
          id: 'veteran-squad',
          label: '🌿 ECO DEFENDER',
          labelAr: '🌿 حامي البيئة',
          icon: '🌿',
          style: 'emerald',
          description: 'Active community eco guardian',
        });
      }

      if (item.member_count >= 10) {
        retroBadges.push({
          id: 'mega-squad',
          label: '👥 MEGA SQUAD',
          labelAr: '👥 كتيبة ضخمة',
          icon: '👥',
          style: 'purple',
          description: 'Over 10 active eco warriors',
        });
      }
    }

    let trend: 'up' | 'down' | 'same' | 'fire' = 'same';
    let trendDelta = 0;
    if (rank === 1 || rank === 2) {
      trend = 'fire';
      trendDelta = 2;
    } else if (rank % 2 === 0) {
      trend = 'up';
      trendDelta = 1;
    }

    return {
      rank,
      squadId: item.id,
      name: item.name,
      description: item.description,
      badgeIcon: item.badge_icon || '🌿',
      leaderName: item.leader_name || 'Leader',
      leaderAvatar: item.leader_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.id}`,
      memberCount: item.member_count || (item.members ? item.members.length : 1),
      totalScore: item.effectiveScore,
      weeklyGain: item.weeklyGain,
      trend,
      trendDelta,
      isPrivate: Boolean(item.is_private),
      retroBadges,
      isUserMember: Boolean(item.isUserMember),
      isLeader: Boolean(item.isLeader),
    };
  });
}
