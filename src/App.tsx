import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { triggerLightImpact } from './lib/haptics';
import { playBlipSound } from './lib/arcadeSounds';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { QuestsTab } from './components/QuestsTab';
import { SquadsTab } from './components/SquadsTab';
import { KarinChatTab } from './components/KarinChatTab';
import { MediaFeedTab } from './components/MediaFeedTab';
import { StoreTab } from './components/StoreTab';
import { SettingsTab } from './components/SettingsTab';
import { BannedScreen } from './components/BannedScreen';
import { DailyCheckInModal } from './components/DailyCheckInModal';

const MainAppContent: React.FC = () => {
  const {
    isAuthenticated,
    user,
    isBanned,
    banReason,
    resetAllData,
    isCheckInModalOpen,
    setIsCheckInModalOpen,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('quests');
  const [previousTab, setPreviousTab] = useState<TabType>('quests');

  // Global Arcade Tactile Feedback for Buttons & Interactive Controls
  useEffect(() => {
    const handleGlobalPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const interactive = target.closest(
        'button, [role="button"], input[type="radio"], input[type="checkbox"], .retro-btn, a[href]'
      );
      if (interactive) {
        triggerLightImpact();
      }
    };

    window.addEventListener('pointerdown', handleGlobalPointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointerDown);
    };
  }, []);

  const handleTabChange = (tab: TabType) => {
    playBlipSound();
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  const handleOpenSettings = () => {
    playBlipSound();
    if (activeTab === 'settings') {
      setActiveTab(previousTab === 'settings' ? 'quests' : previousTab);
    } else {
      setPreviousTab(activeTab);
      setActiveTab('settings');
    }
  };

  return (
    // Outer viewport: Full-bleed on mobile, centered mobile phone frame on desktop/tablet
    <div className="w-full min-h-screen h-[100dvh] bg-[#020e08] flex items-center justify-center p-0 md:p-6 overflow-hidden select-none font-['Fredoka',sans-serif]">
      {/* Strict Mobile-First Viewport Frame Container */}
      <div className="w-full h-full md:h-[90vh] md:max-h-[900px] max-w-[430px] mx-auto md:rounded-[40px] md:border-[8px] border-black md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col relative bg-[#062316] transition-all">
        
        {/* Native Mobile Hardware Speaker & Camera Island Accent (Desktop Viewport) */}
        <div className="hidden md:flex justify-center pt-2.5 pb-1 shrink-0 bg-[#062316] z-50">
          <div className="w-28 h-4 bg-black rounded-full border border-black/80 flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#103D29] border border-black/70" />
            <div className="w-12 h-1.5 rounded-full bg-neutral-800" />
          </div>
        </div>

        {/* 1. If user is banned, lock permanently into BannedScreen */}
        {isBanned || user?.is_banned ? (
          <div className="flex-1 overflow-y-auto">
            <BannedScreen
              reason={banReason || user?.ban_reason}
              onResetData={resetAllData}
            />
          </div>
        ) : !isAuthenticated ? (
          /* 2. If not signed in, show AuthLanding view */
          <div className="flex-1 overflow-y-auto">
            <AuthLanding />
          </div>
        ) : (
          <>
            {/* Top Bar Header with User Avatar, Streak, Points & Settings */}
            <Header
              onOpenSettings={handleOpenSettings}
              isSettingsActive={activeTab === 'settings'}
            />

            {/* Main Scrollable Tab View Area */}
            <main className="flex-1 w-full overflow-y-auto overflow-x-hidden relative">
              {activeTab === 'quests' && <QuestsTab />}
              {activeTab === 'squads' && <SquadsTab />}
              {activeTab === 'karin' && <KarinChatTab />}
              {activeTab === 'feed' && <MediaFeedTab />}
              {activeTab === 'store' && <StoreTab />}
              {activeTab === 'settings' && (
                <SettingsTab
                  onBack={() => setActiveTab(previousTab === 'settings' ? 'quests' : previousTab)}
                />
              )}
            </main>

            {/* Touch-Optimized Bottom Navigation Dock [Quests] [Squads] [Karin AI] [Feed] [Store] */}
            <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />

            {/* Daily Check-in Rewards Modal */}
            <DailyCheckInModal
              isOpen={isCheckInModalOpen}
              onClose={() => setIsCheckInModalOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
