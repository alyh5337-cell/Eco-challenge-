import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { language } = useLanguage();

  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop Install Flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`retro-btn bg-[#2BD97F] hover:bg-[#25c472] text-black font-black flex items-center justify-center gap-1.5 ${
          compact ? 'px-2 py-1 rounded-lg text-xs' : 'w-full py-2.5 px-4 rounded-xl text-xs'
        }`}
        title="Install Eco Challenge as Mobile App"
      >
        <Download className="w-3.5 h-3.5 stroke-[3]" />
        <span>{language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`retro-btn bg-[#FFD43F] hover:bg-yellow-400 text-black font-black flex items-center justify-center gap-1.5 ${
            compact ? 'px-2 py-1 rounded-lg text-xs' : 'w-full py-2.5 px-4 rounded-xl text-xs'
          }`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{language === 'ar' ? 'تثبيت على iPhone' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-['Fredoka',sans-serif]">
            <div className="w-full max-w-xs rounded-2xl bg-[#103D29] border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-[#FFD43F] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#2BD97F]" />
                  <span>{language === 'ar' ? 'التثبيت على iPhone / iPad' : 'Install on iPhone / iPad'}</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-neutral-200 font-bold space-y-2 mb-4 leading-relaxed">
                <p>
                  1. {language === 'ar' ? 'اضغط على زر المشاركة (Share) في شريط Safari السفلي.' : 'Tap the Share icon at the bottom of Safari.'}
                </p>
                <p>
                  2. {language === 'ar' ? 'اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).' : 'Select "Add to Home Screen" from the action menu.'}
                </p>
                <p>
                  3. {language === 'ar' ? 'استمتع بتجربة أركيد كاملة بدون شريط المتصفح!' : 'Enjoy full-screen retro arcade experience!'}
                </p>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full retro-btn bg-[#FFB443] text-black font-black py-2 rounded-xl text-xs"
              >
                {language === 'ar' ? 'فهمت ذلك!' : 'Got it!'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
