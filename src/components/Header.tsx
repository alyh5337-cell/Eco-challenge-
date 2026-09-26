import React from 'react';
import { Coins, Languages, Settings as SettingsIcon, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PWAInstallButton } from './PWAInstallButton';
import { DailyStreakCounter } from './DailyStreakCounter';

interface HeaderProps {
  onOpenSettings: () => void;
  isSettingsActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, isSettingsActive }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, dailyStreakNotification, dismissStreakNotification } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const score = user?.score ?? 0;

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#062316] border-b-4 border-black px-3 py-2 shrink-0">
        <div className="w-full flex items-center justify-between gap-1.5">
          {/* User Avatar & App Brand (Click to open Settings) */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 text-left rtl:text-right group focus:outline-hidden"
            title={t('settingsTitle')}
          >
            <div className="relative">
              <img
                src={user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=EcoHero1'}
                alt="Avatar"
                className="w-9 h-9 rounded-xl border-3 border-black bg-[#103D29] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover group-hover:scale-105 transition-transform"
              />
              {user?.equipped_badge && (
                <span
                  className="absolute -bottom-1 -right-1 text-[11px] bg-black rounded-full border border-[#FFD43F] p-0.5 leading-none"
                  title="Equipped Badge"
                >
                  {user.equipped_badge}
                </span>
              )}
            </div>
            <div className="leading-tight">
              <h1 className="font-black text-xs text-[#2BD97F] drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                <span>Eco Challenge</span>
              </h1>
              <span className="text-[10px] font-bold text-neutral-300 truncate max-w-[85px] block">
                {user?.display_name || 'Eco Warrior'}
              </span>
            </div>
          </button>

          {/* Stats & Actions */}
          <div className="flex items-center gap-1.5">
            {/* PWA Install Button (ambient compact) */}
            <PWAInstallButton compact />

            {/* Daily Streak Counter with Flame & Leaf Animation */}
            <DailyStreakCounter />

            {/* Eco Points Pill */}
            <div
              className="flex items-center gap-1 bg-[#FFB443] border-2 border-black rounded-lg px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
              title={`${t('scoreLabel')}: ${score}`}
            >
              <Coins className="w-3.5 h-3.5 fill-black" />
              <span className="font-black text-xs">{score}</span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="retro-btn bg-[#FFD43F] text-black px-2 py-1 rounded-lg text-xs font-black flex items-center gap-0.5 hover:bg-yellow-400"
              title="Switch Language / تبديل اللغة"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'AR' : 'EN'}</span>
            </button>

            {/* Settings Quick Access Button */}
            <button
              onClick={onOpenSettings}
              className={`retro-btn p-1.5 rounded-lg font-black transition-colors ${
                isSettingsActive
                  ? 'bg-[#FFB443] text-black'
                  : 'bg-[#103D29] text-white hover:bg-[#154e35]'
              }`}
              title={t('settingsTitle')}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Daily Streak Check-in Celebration Banner */}
      {dailyStreakNotification && (
        <div className="bg-[#103D29] border-b-2 border-black px-3 py-1.5 flex items-center justify-between text-xs font-black text-[#FFD43F] animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#FFB443] animate-spin" />
            <span>{dailyStreakNotification}</span>
          </div>
          <button
            onClick={dismissStreakNotification}
            className="p-1 hover:bg-black/20 rounded-md text-white/80 hover:text-white"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
