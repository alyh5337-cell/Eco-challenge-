import React, { useState } from 'react';
import { RotateCw, Quote, Lightbulb, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ECO_TIPS_DATABASE, EcoTip } from '../data/mockEcoTips';
import { triggerLightImpact } from '../lib/haptics';
import { playBlipSound } from '../lib/arcadeSounds';

export const DailyEcoTipCard: React.FC = () => {
  const { language, t } = useLanguage();

  // Initialize with a saved tip or a random one from the database
  const [currentTip, setCurrentTip] = useState<EcoTip>(() => {
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('eco_current_tip_id') : null;
    const found = ECO_TIPS_DATABASE.find((tip) => tip.id === savedId);
    if (found) return found;
    const randomIndex = Math.floor(Math.random() * ECO_TIPS_DATABASE.length);
    return ECO_TIPS_DATABASE[randomIndex];
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshTip = () => {
    triggerLightImpact();
    playBlipSound();
    setIsRefreshing(true);

    // Pick a different tip from the database
    setTimeout(() => {
      const otherTips = ECO_TIPS_DATABASE.filter((tip) => tip.id !== currentTip.id);
      const nextTip = otherTips[Math.floor(Math.random() * otherTips.length)] || ECO_TIPS_DATABASE[0];
      setCurrentTip(nextTip);
      try {
        localStorage.setItem('eco_current_tip_id', nextTip.id);
      } catch {
        // ignore
      }
      setIsRefreshing(false);
    }, 180);
  };

  const isArabic = language === 'ar';
  const categoryLabel = isArabic ? currentTip.categoryLabel_ar : currentTip.categoryLabel_en;
  const factText = isArabic ? currentTip.fact_ar : currentTip.fact_en;
  const actionText = isArabic ? currentTip.action_ar : currentTip.action_en;

  return (
    <div className="w-full bg-[#103D29] border-3 border-black rounded-2xl p-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white relative overflow-hidden select-none transition-all">
      {/* Top Ambient Highlight */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-[#FFD43F]/5 rounded-full blur-xl pointer-events-none" />

      {/* Header Row: Title, Category, and Refresh Button */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b-2 border-black/40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#062316] border-2 border-black flex items-center justify-center text-lg shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <span>{currentTip.icon}</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-xs text-[#FFD43F] tracking-wide">
                {t('dailyEcoTipTitle')}
              </h3>
              <span className="text-[10px] text-neutral-400 font-bold" aria-hidden="true">
                ·
              </span>
              <span className="text-[10px] font-bold text-[#2BD97F]">
                {categoryLabel}
              </span>
            </div>
            <span className="text-[9px] font-bold text-neutral-300 block">
              {t('dailyEcoTipSubtitle')}
            </span>
          </div>
        </div>

        {/* Retro Refresh Button */}
        <button
          type="button"
          onClick={handleRefreshTip}
          disabled={isRefreshing}
          className="retro-btn bg-[#FFB443] hover:bg-yellow-400 active:scale-95 text-black px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform shrink-0 disabled:opacity-70"
          title={t('refreshTip')}
        >
          <RotateCw
            className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          <span className="text-[11px]">{t('refreshTip')}</span>
        </button>
      </div>

      {/* Retro-Styled Dialogue & Quote Box */}
      <div
        className={`relative bg-[#062316] border-2 border-black rounded-xl p-3 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)] transition-opacity duration-200 ${
          isRefreshing ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      >
        {/* Quote Accent Icon */}
        <div className="flex items-center justify-between text-[#FFD43F] mb-1.5 opacity-90">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#FFD43F]">
            <Sparkles className="w-3 h-3 text-[#FFB443]" />
            <span>{t('didYouKnow')}</span>
          </div>
          <Quote className="w-4 h-4 text-[#FFD43F]/60 rtl:scale-x-[-1]" />
        </div>

        {/* Fact Body */}
        <p className="text-xs font-medium text-neutral-100 leading-relaxed mb-2.5">
          “{factText}”
        </p>

        {/* Actionable Green Tip Box */}
        <div className="bg-[#103D29] border border-black/80 rounded-lg p-2 flex items-start gap-2">
          <div className="w-5 h-5 rounded-md bg-[#2BD97F] text-black flex items-center justify-center shrink-0 mt-0.5 font-black text-xs">
            <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div className="text-[11px] leading-tight">
            <span className="font-black text-[#2BD97F] mr-1 rtl:ml-1 uppercase tracking-tight text-[10px] block mb-0.5">
              {t('takeAction')}
            </span>
            <span className="font-bold text-neutral-200">
              {actionText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
