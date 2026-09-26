import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  TrendingUp,
  RotateCw,
  Search,
  Users,
  Lock,
  Globe,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Squad } from '../types';
import {
  fetchTopSquadsRankings,
  SquadRankEntry,
  LeaderboardTimeframe,
  RetroBadge,
} from '../lib/squadRankings';
import { triggerLightImpact, triggerMediumImpact } from '../lib/haptics';

interface TopSquadsLeaderboardProps {
  onSelectSquadChat: (squadId: string) => void;
  onOpenJoinSquad: (squad: Squad) => void;
}

export const TopSquadsLeaderboard: React.FC<TopSquadsLeaderboardProps> = ({
  onSelectSquadChat,
  onOpenJoinSquad,
}) => {
  const { language, t } = useLanguage();
  const { user, squads, userSquadIds } = useAuth();

  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all-time');
  const [rankings, setRankings] = useState<SquadRankEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRankings = async (tf: LeaderboardTimeframe = timeframe) => {
    setIsLoading(true);
    try {
      const data = await fetchTopSquadsRankings(squads, userSquadIds, user?.id, tf);
      setRankings(data);
    } catch (err) {
      console.warn('Failed to load rankings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRankings(timeframe);
  }, [timeframe, squads, userSquadIds]);

  const handleRefresh = () => {
    triggerLightImpact();
    setIsRefreshing(true);
    loadRankings(timeframe);
  };

  const handleTimeframeChange = (tf: LeaderboardTimeframe) => {
    triggerLightImpact();
    setTimeframe(tf);
  };

  // Filtered list based on search
  const filteredRankings = rankings.filter((entry) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.leaderName.toLowerCase().includes(q) ||
      entry.retroBadges.some((b) => b.label.toLowerCase().includes(q))
    );
  });

  const top3 = rankings.slice(0, 3);
  const firstPlace = top3[0];
  const secondPlace = top3[1];
  const thirdPlace = top3[2];

  const renderBadgeStyle = (badge: RetroBadge) => {
    switch (badge.style) {
      case 'gold':
        return 'bg-gradient-to-r from-[#FFE259] to-[#FFA751] text-black border-black';
      case 'silver':
        return 'bg-gradient-to-r from-[#E2E8F0] to-[#CBD5E1] text-black border-black';
      case 'bronze':
        return 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-black border-black';
      case 'ruby':
        return 'bg-[#3d0f12] text-[#FF5A5F] border-[#FF5A5F]';
      case 'amber':
        return 'bg-[#3b1e06] text-[#FFB443] border-[#FFB443]';
      case 'cyan':
        return 'bg-[#082f49] text-[#38BDF8] border-[#38BDF8]';
      case 'purple':
        return 'bg-[#2e1065] text-[#C084FC] border-[#C084FC]';
      default:
        return 'bg-[#062316] text-[#2BD97F] border-[#2BD97F]';
    }
  };

  const handleSquadAction = (entry: SquadRankEntry) => {
    triggerMediumImpact();
    if (entry.isUserMember) {
      onSelectSquadChat(entry.squadId);
    } else {
      // Find squad object or build minimal one to join
      const found = squads.find((s) => s.id === entry.squadId) || {
        id: entry.squadId,
        name: entry.name,
        description: entry.description,
        join_code: 'ECO-CODE-01',
        is_private: entry.isPrivate,
        leader_id: 'leader',
        leader_name: entry.leaderName,
        total_score: entry.totalScore,
        badge_icon: entry.badgeIcon,
        member_count: entry.memberCount,
        members: [],
        created_at: new Date().toISOString(),
      };
      onOpenJoinSquad(found);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#103D29] border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Header Banner */}
      <div className="bg-[#0c2f1f] border-b-3 border-black px-3.5 py-2.5 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FFB443] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <Trophy className="w-4 h-4 fill-black" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-xs sm:text-sm text-[#FFB443] tracking-wide truncate flex items-center gap-1.5">
              <span>{t('topSquadsTitle')}</span>
            </h3>
            <p className="text-[10px] text-neutral-300 font-bold truncate">
              {t('topSquadsSubtitle')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="retro-btn bg-[#FFD43F] hover:bg-yellow-400 text-black px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 shrink-0 border-2 border-black"
          title={t('refreshLeaderboard')}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* Timeframe & Search Bar */}
      <div className="bg-[#081f14] border-b-2 border-black px-3 py-2 shrink-0 space-y-2">
        {/* Timeframe Selector */}
        <div className="flex bg-black/40 p-1 rounded-xl border border-black gap-1">
          <button
            type="button"
            onClick={() => handleTimeframeChange('all-time')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-black transition-colors ${
              timeframe === 'all-time'
                ? 'bg-[#2BD97F] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {t('timeframeAllTime')}
          </button>
          <button
            type="button"
            onClick={() => handleTimeframeChange('weekly')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-black transition-colors ${
              timeframe === 'weekly'
                ? 'bg-[#FFB443] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {t('timeframeWeekly')}
          </button>
          <button
            type="button"
            onClick={() => handleTimeframeChange('sprint')}
            className={`flex-1 py-1 px-2 rounded-lg text-xs font-black transition-colors ${
              timeframe === 'sprint'
                ? 'bg-[#38BDF8] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            {t('timeframeSprint')}
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute ltr:left-2.5 rtl:right-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'ar' ? 'بحث عن فريق بالاسم أو الشارة...' : 'Search squad or retro badge...'}
            className="w-full bg-[#062316] border-2 border-black rounded-xl py-1.5 ltr:pl-8 ltr:pr-3 rtl:pr-8 rtl:pl-3 text-xs font-bold text-white placeholder-neutral-500 focus:outline-none focus:border-[#2BD97F]"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
            <Sparkles className="w-8 h-8 text-[#FFD43F] animate-spin" />
            <span className="text-xs font-black text-neutral-300">{t('loadingRankings')}</span>
          </div>
        ) : (
          <>
            {/* Top 3 Retro Podium Stage (Rendered when not searching) */}
            {!searchQuery && top3.length >= 3 && (
              <div className="bg-[#081f14] border-3 border-black rounded-2xl p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FFD43F] bg-black/60 px-2.5 py-0.5 rounded-full border border-black inline-block">
                    ⚡ {language === 'ar' ? 'منصة التتويج الذهبية' : 'Arcade Champions Podium'} ⚡
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 items-end pt-2">
                  {/* 2nd Place Podium */}
                  {secondPlace && (
                    <div
                      onClick={() => handleSquadAction(secondPlace)}
                      className="cursor-pointer flex flex-col items-center group text-center"
                    >
                      <div className="relative mb-1">
                        <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                          {secondPlace.badgeIcon}
                        </span>
                        <span className="absolute -top-1 -right-1 text-xs">🥈</span>
                      </div>
                      <span className="text-[11px] font-black text-white truncate max-w-[80px] block">
                        {secondPlace.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#FFD43F]">
                        {secondPlace.totalScore} {t('pts')}
                      </span>

                      {/* Silver Block */}
                      <div className="w-full bg-gradient-to-t from-[#64748B] to-[#CBD5E1] border-3 border-black rounded-t-xl mt-1.5 h-16 flex flex-col items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-base leading-none">2</span>
                        <span className="text-[9px] font-black uppercase">SILVER</span>
                      </div>
                    </div>
                  )}

                  {/* 1st Place Podium (Champion) */}
                  {firstPlace && (
                    <div
                      onClick={() => handleSquadAction(firstPlace)}
                      className="cursor-pointer flex flex-col items-center group text-center z-10 -mt-2"
                    >
                      <Crown className="w-5 h-5 text-[#FFD43F] fill-[#FFB443] animate-bounce mb-0.5" />
                      <div className="relative mb-1">
                        <span className="text-3xl group-hover:scale-110 transition-transform inline-block">
                          {firstPlace.badgeIcon}
                        </span>
                        <span className="absolute -top-1 -right-1 text-xs">👑</span>
                      </div>
                      <span className="text-xs font-black text-[#FFD43F] truncate max-w-[95px] block">
                        {firstPlace.name}
                      </span>
                      <span className="text-[11px] font-black text-white">
                        {firstPlace.totalScore} {t('pts')}
                      </span>

                      {/* Gold Block */}
                      <div className="w-full bg-gradient-to-t from-[#D97706] via-[#FFB443] to-[#FDE047] border-4 border-black rounded-t-xl mt-1.5 h-22 flex flex-col items-center justify-center text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-xl leading-none">1</span>
                        <span className="text-[10px] font-black uppercase tracking-wider">CHAMP</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place Podium */}
                  {thirdPlace && (
                    <div
                      onClick={() => handleSquadAction(thirdPlace)}
                      className="cursor-pointer flex flex-col items-center group text-center"
                    >
                      <div className="relative mb-1">
                        <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                          {thirdPlace.badgeIcon}
                        </span>
                        <span className="absolute -top-1 -right-1 text-xs">🥉</span>
                      </div>
                      <span className="text-[11px] font-black text-white truncate max-w-[80px] block">
                        {thirdPlace.name}
                      </span>
                      <span className="text-[10px] font-bold text-[#FFD43F]">
                        {thirdPlace.totalScore} {t('pts')}
                      </span>

                      {/* Bronze Block */}
                      <div className="w-full bg-gradient-to-t from-[#78350F] to-[#D97706] border-3 border-black rounded-t-xl mt-1.5 h-12 flex flex-col items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-sm leading-none">3</span>
                        <span className="text-[8px] font-black uppercase">BRONZE</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ranked Squads Table List */}
            <div className="space-y-2">
              {filteredRankings.map((squad) => {
                const isTop1 = squad.rank === 1;
                const isTop2 = squad.rank === 2;
                const isTop3 = squad.rank === 3;

                return (
                  <div
                    key={squad.squadId}
                    className={`border-3 border-black rounded-2xl p-2.5 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                      squad.isUserMember
                        ? 'bg-[#154e35] ring-2 ring-[#2BD97F]'
                        : isTop1
                        ? 'bg-gradient-to-r from-[#211707] via-[#103D29] to-[#0d2f1e]'
                        : 'bg-[#0d2d1e]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Chunky Retro Rank Pill */}
                      <div
                        className={`w-9 h-9 rounded-xl border-2 border-black flex flex-col items-center justify-center font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0 ${
                          isTop1
                            ? 'bg-gradient-to-r from-[#FFE259] to-[#FFA751] text-black'
                            : isTop2
                            ? 'bg-[#CBD5E1] text-black'
                            : isTop3
                            ? 'bg-[#D97706] text-white'
                            : 'bg-[#062316] text-[#2BD97F]'
                        }`}
                      >
                        <span className="text-xs leading-none">#{squad.rank}</span>
                        {squad.trend === 'fire' && (
                          <span className="text-[8px] leading-none">🔥</span>
                        )}
                      </div>

                      {/* Squad Emblem */}
                      <div className="text-2xl shrink-0 select-none">
                        {squad.badgeIcon}
                      </div>

                      {/* Squad Info & Badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-black text-xs sm:text-sm text-white truncate">
                            {squad.name}
                          </h4>
                          {squad.isUserMember && (
                            <span className="text-[9px] font-black bg-[#2BD97F] text-black px-1.5 py-0.2 rounded-md border border-black">
                              {t('yourSquadTag')}
                            </span>
                          )}
                          {squad.isPrivate ? (
                            <span className="text-[9px] bg-[#3b1214] text-[#FF5A5F] border border-[#FF5A5F] px-1 rounded font-black flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" />
                              PRIV
                            </span>
                          ) : (
                            <span className="text-[9px] bg-[#0c3a25] text-[#2BD97F] border border-[#2BD97F] px-1 rounded font-black flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5" />
                              PUB
                            </span>
                          )}
                        </div>

                        {/* Leader & Member Count */}
                        <div className="flex items-center gap-2 text-[10px] text-neutral-300 font-bold mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-[#A7F3D0]" />
                            {squad.memberCount} {t('squadMembersCount')}
                          </span>
                          <span>•</span>
                          <span className="truncate">
                            {squad.leaderName}
                          </span>
                        </div>

                        {/* Retro Badges Row */}
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {squad.retroBadges.map((badge) => (
                            <span
                              key={badge.id}
                              title={badge.description}
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-0.5 ${renderBadgeStyle(
                                badge
                              )}`}
                            >
                              <span>{badge.icon}</span>
                              <span>{language === 'ar' ? badge.labelAr : badge.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Action & Points */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="bg-[#FFB443] text-black border-2 border-black px-2 py-0.5 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          {squad.totalScore} {t('pts')}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSquadAction(squad)}
                          className={`retro-btn text-[10px] font-black px-2 py-1 rounded-lg border-2 border-black flex items-center gap-1 ${
                            squad.isUserMember
                              ? 'bg-[#2BD97F] text-black hover:bg-[#25c472]'
                              : 'bg-neutral-800 text-white hover:bg-neutral-700'
                          }`}
                        >
                          <span>{squad.isUserMember ? t('switchToSquad') : t('joinFromLeaderboard')}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredRankings.length === 0 && (
                <div className="bg-[#062316] border-2 border-black rounded-xl p-6 text-center">
                  <p className="text-xs text-neutral-300 font-bold">
                    {language === 'ar'
                      ? 'لم يتم العثور على فرق تطابق البحث.'
                      : 'No squads found matching your search.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
