import React from 'react';
import { Target, Users, Bot, Camera, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { triggerLightImpact } from '../lib/haptics';

export type TabType = 'quests' | 'squads' | 'karin' | 'feed' | 'store' | 'settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();

  const navItems: { id: TabType; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'quests', labelKey: 'navQuests', icon: <Target className="w-5 h-5 stroke-[2.5]" /> },
    { id: 'squads', labelKey: 'navSquads', icon: <Users className="w-5 h-5 stroke-[2.5]" /> },
    { id: 'karin', labelKey: 'navKarin', icon: <Bot className="w-5 h-5 stroke-[2.5]" /> },
    { id: 'feed', labelKey: 'navFeed', icon: <Camera className="w-5 h-5 stroke-[2.5]" /> },
    { id: 'store', labelKey: 'navStore', icon: <ShoppingBag className="w-5 h-5 stroke-[2.5]" /> },
  ];

  return (
    <nav className="shrink-0 bg-[#062316] border-t-4 border-black z-30 pb-safe select-none">
      <div className="w-full px-2 py-2 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                triggerLightImpact();
                setActiveTab(item.id);
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-100 ${
                isActive
                  ? 'bg-[#FFB443] text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]'
                  : 'text-neutral-400 hover:text-white active:scale-95'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.id === 'karin' && !isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#2BD97F] animate-ping" />
                )}
              </div>
              <span
                className={`text-[10px] font-black mt-0.5 truncate max-w-[62px] ${
                  isActive ? 'text-black' : 'text-neutral-300'
                }`}
              >
                {t(item.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
