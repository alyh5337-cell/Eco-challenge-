import React from 'react';
import { ShieldCheck, User, Sparkles, AlertOctagon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export const AuthLanding: React.FC = () => {
  const { t, language } = useLanguage();
  const { loginWithGoogle, loginAsGuest, authError, clearAuthError } = useAuth();

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 overflow-y-auto">
      {/* Top Banner */}
      <div className="pt-2 text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#FFB443] border-3 border-black px-3 py-1 rounded-full text-black font-extrabold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-3">
          <Sparkles className="w-4 h-4 fill-black" />
          <span>ECO CHALLENGE v2.0</span>
        </div>

        <h1 className="text-3xl font-black text-white leading-tight tracking-wide drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          {t('welcomeTitle')}
        </h1>
        <p className="text-sm font-bold text-[#A7F3D0] mt-2 px-2 leading-relaxed">
          {t('welcomeSubtitle')}
        </p>

        {authError && (
          <div className="mt-3 p-3 bg-[#3b1214] border-3 border-black rounded-xl text-xs font-black text-[#FF5A5F] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-left rtl:text-right">
            <div className="flex items-center gap-1.5 text-white mb-1">
              <AlertOctagon className="w-4 h-4 text-[#FF5A5F]" />
              <span>{language === 'ar' ? 'فشل تسجيل الدخول - حساب محظور' : 'Login Blocked - Banned Account'}</span>
            </div>
            <p>{authError}</p>
          </div>
        )}
      </div>

      {/* Hero Cartoon Arcade Artwork */}
      <div className="my-6 flex justify-center">
        <div className="relative w-64 h-64 bg-[#103D29] border-4 border-black rounded-3xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#FFD43F] border-3 border-black rounded-full opacity-80" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-[#2BD97F] border-3 border-black rounded-full opacity-80" />

          {/* Karin 90s Avatar Cartoon */}
          <div className="relative z-10 text-center">
            <img
              src="https://api.dicebear.com/7.x/bottts/svg?seed=KarinEcoGuide&backgroundColor=2bd97f"
              alt="Karin AI"
              className="w-28 h-28 mx-auto rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover bg-white"
            />
            <div className="mt-3 inline-block bg-black text-[#FFD43F] text-xs font-black px-3 py-1 rounded-lg border-2 border-[#FFD43F]">
              {language === 'ar' ? 'كارين - مرشدة البيئة' : 'KARIN - ECO GUIDE'}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Login Buttons */}
      <div className="space-y-3 pb-6">
        <button
          onClick={loginWithGoogle}
          className="w-full retro-btn bg-white hover:bg-neutral-100 text-black font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 text-base"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{t('signInGoogle')}</span>
        </button>

        <button
          onClick={loginAsGuest}
          className="w-full retro-btn bg-[#FFB443] hover:bg-[#ffa928] text-black font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-3 text-base"
        >
          <User className="w-5 h-5 stroke-[2.5]" />
          <span>{t('continueGuest')}</span>
        </button>

        <p className="text-[11px] font-bold text-center text-neutral-400 px-4 leading-normal">
          {t('guestNotice')}
        </p>
      </div>
    </div>
  );
};
