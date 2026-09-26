import React, { useState } from 'react';
import { ShoppingBag, Coins, Check, Sparkles, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_STORE_ITEMS } from '../data/mockStore';
import { StoreItem } from '../types';
import { triggerQuestCompleteHaptic, triggerMediumImpact, triggerErrorHaptic } from '../lib/haptics';
import { playCoinSound, playBlipSound, playErrorSound } from '../lib/arcadeSounds';

export const StoreTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, userInventory, buyStoreItem, equipStoreItem } = useAuth();

  const [activeTab, setActiveTab] = useState<'avatar' | 'badge'>('avatar');
  const [purchaseMsg, setPurchaseMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const filteredItems = INITIAL_STORE_ITEMS.filter((item) => item.type === activeTab);

  const handleBuy = (item: StoreItem) => {
    const res = buyStoreItem(item);
    if (res.success) {
      triggerQuestCompleteHaptic();
      playCoinSound();
      setPurchaseMsg({ text: res.message || 'Purchased and equipped!' });
    } else {
      triggerErrorHaptic();
      playErrorSound();
      setPurchaseMsg({ text: res.message || t('notEnoughPoints'), error: true });
    }
    setTimeout(() => setPurchaseMsg(null), 3500);
  };

  const handleEquip = (item: StoreItem) => {
    triggerMediumImpact();
    playBlipSound();
    equipStoreItem(item);
    setPurchaseMsg({ text: 'Item equipped!' });
    setTimeout(() => setPurchaseMsg(null), 2500);
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-md mx-auto">
      {/* Banner */}
      <div className="text-center mb-3">
        <h2 className="text-xl font-black text-[#FFD43F] tracking-wide flex items-center justify-center gap-1.5 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <ShoppingBag className="w-5 h-5 text-[#FFB443]" />
          <span>{t('storeTitle')}</span>
        </h2>
        <p className="text-xs text-[#A7F3D0] font-bold">
          {t('storeSubtitle')}
        </p>

        {/* User Balance Header */}
        <div className="mt-2.5 inline-flex items-center gap-2 bg-[#FFB443] border-3 border-black px-4 py-1.5 rounded-full text-black font-black text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <span>{t('yourBalance')}</span>
          <div className="flex items-center gap-1 bg-black text-[#FFD43F] px-2.5 py-0.5 rounded-full text-xs">
            <Coins className="w-3.5 h-3.5 fill-[#FFD43F]" />
            <span>{user?.score ?? 0} {t('pts')}</span>
          </div>
        </div>
      </div>

      {/* Alert toast */}
      {purchaseMsg && (
        <div
          className={`mb-3 p-2.5 rounded-xl border-2 border-black font-black text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            purchaseMsg.error ? 'bg-[#3b1214] text-[#FF5A5F]' : 'bg-[#0c3a25] text-[#2BD97F]'
          }`}
        >
          {purchaseMsg.error ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          <span>{purchaseMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => setActiveTab('avatar')}
          className={`retro-btn py-2 rounded-xl text-xs font-black transition-colors ${
            activeTab === 'avatar' ? 'bg-[#FFB443] text-black' : 'bg-[#103D29] text-white hover:bg-[#164e35]'
          }`}
        >
          {t('filterAvatars')}
        </button>
        <button
          onClick={() => setActiveTab('badge')}
          className={`retro-btn py-2 rounded-xl text-xs font-black transition-colors ${
            activeTab === 'badge' ? 'bg-[#FFB443] text-black' : 'bg-[#103D29] text-white hover:bg-[#164e35]'
          }`}
        >
          {t('filterBadges')}
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const isOwned = userInventory.includes(item.id);
          const isEquipped =
            item.type === 'avatar'
              ? user?.avatar_url === item.image_url
              : user?.equipped_badge === item.image_url;

          const title = language === 'ar' ? item.name_ar : item.name_en;
          const description = language === 'ar' ? item.description_ar : item.description_en;

          return (
            <div
              key={item.id}
              className={`retro-card p-3 flex flex-col justify-between transition-transform ${
                isEquipped ? 'bg-[#0c3a25] border-[#2BD97F]' : 'bg-[#103D29]'
              }`}
            >
              <div>
                {/* Visual Artwork */}
                <div className="bg-black/60 border-2 border-black rounded-xl p-2 mb-2 flex items-center justify-center min-h-[90px]">
                  {item.type === 'avatar' ? (
                    <img
                      src={item.image_url}
                      alt={title}
                      className="w-16 h-16 rounded-xl border border-neutral-700 object-cover"
                    />
                  ) : (
                    <span className="text-4xl">{item.image_url}</span>
                  )}
                </div>

                <h4 className="font-extrabold text-xs text-white leading-tight text-center mb-1">
                  {title}
                </h4>
                <p className="text-[10px] text-neutral-300 font-medium text-center line-clamp-2 mb-2">
                  {description}
                </p>
              </div>

              {/* Action Button */}
              <div>
                {isEquipped ? (
                  <div className="bg-[#2BD97F] text-black border-2 border-black rounded-xl py-1.5 text-center text-[10px] font-black flex items-center justify-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>{t('equippedBadge')}</span>
                  </div>
                ) : isOwned ? (
                  <button
                    onClick={() => handleEquip(item)}
                    className="w-full retro-btn bg-[#FFD43F] text-black font-black py-1.5 rounded-xl text-xs hover:bg-yellow-400"
                  >
                    {t('equipBtn')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    className="w-full retro-btn bg-[#FFB443] text-black font-black py-1.5 rounded-xl text-xs hover:bg-yellow-400 flex items-center justify-center gap-1"
                  >
                    <span>{t('buyBtn')}</span>
                    <Coins className="w-3 h-3 fill-black inline" />
                    <span>{item.cost}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
