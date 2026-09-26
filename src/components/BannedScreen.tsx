import React from 'react';
import { ShieldAlert, AlertTriangle, Skull, Lock, RefreshCw, LogOut } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

interface BannedScreenProps {
  reason?: string | null;
  onResetData?: () => void;
}

export const BannedScreen: React.FC<BannedScreenProps> = ({ reason, onResetData }) => {
  const { language, dir } = useLanguage();
  const { user, resetAllData, logout } = useAuth();

  const displayReason = reason || user?.ban_reason || (
    language === 'ar'
      ? 'انتهاك لقواعد الأمان ومحتوى غير لائق أو مسيء.'
      : 'Violation of community safety standards, explicit content, or severe profanity.'
  );

  return (
    <div
      className="w-full h-full flex flex-col justify-between p-5 bg-[#1a0507] text-white overflow-y-auto select-none"
      dir={dir}
    >
      {/* Top Hazard Warning Header */}
      <div className="text-center pt-3">
        {/* Retro Hazard Stripes */}
        <div className="h-3 w-full bg-[repeating-linear-gradient(45deg,#FFD43F,#FFD43F_10px,#000000_10px,#000000_20px)] border-2 border-black rounded-md mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />

        <div className="inline-flex items-center gap-2 bg-[#FF5A5F] border-3 border-black px-4 py-1.5 rounded-full text-black font-black text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-3 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 stroke-[3]" />
          <span>{language === 'ar' ? 'نظام الحظر الأمني الشامل' : 'Global AI Safety Lockout'}</span>
        </div>

        {/* Comic Warning Banner */}
        <h1 className="text-2xl font-black text-[#FF5A5F] leading-tight drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          {language === 'ar'
            ? '🚫 تم حظر حسابك نهائياً بسبب انتهاك قواعد الأمان والمحتوى غير اللائق'
            : '🚫 Your account has been permanently banned due to safety policy violations'}
        </h1>
      </div>

      {/* Skull & Warning Visual Card */}
      <div className="my-4 bg-[#2e0b10] border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
        <div className="w-16 h-16 mx-auto mb-3 bg-[#FF5A5F] border-3 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <Skull className="w-9 h-9 text-black stroke-[2.5]" />
        </div>

        <div className="bg-black/60 border-2 border-black rounded-xl p-3 mb-3 text-left rtl:text-right">
          <div className="text-[11px] font-black text-[#FFD43F] uppercase mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FFD43F]" />
            <span>{language === 'ar' ? 'سبب الحظر المرصود بواسطة الذكاء الاصطناعي:' : 'Violation Reason Recorded by Gemini AI:'}</span>
          </div>
          <p className="text-xs text-neutral-200 font-bold leading-relaxed break-words bg-[#1a0507] p-2 rounded-lg border border-[#FF5A5F]/40">
            {displayReason}
          </p>
        </div>

        <div className="space-y-1 text-[11px] text-neutral-300 font-medium">
          <p className="flex items-center justify-center gap-1.5 text-neutral-400">
            <Lock className="w-3.5 h-3.5 text-[#FF5A5F]" />
            <span>{language === 'ar' ? 'حالة الحساب: مقفل ومحظور نهائياً' : 'Account Status: Permanently Terminated'}</span>
          </p>
          <p className="text-[10px] text-neutral-500">
            {language === 'ar'
              ? 'تم تسجيل هذه المخالفة في سجلات Supabase وفق معايير الأمان 2.0.'
              : 'Security incident logged to Supabase profiles under Security Directive v2.0.'}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-2.5 pb-2">
        <p className="text-[11px] text-center text-neutral-400 font-bold px-2">
          {language === 'ar'
            ? 'لا يمكنك استخدام ميزات التطبيق أو المشاركة في التحديات أو المجموعات.'
            : 'Access to quests, squads, community feed, and Karin AI has been permanently revoked.'}
        </p>

        {/* Reset / Sign-out option for testing or recovery */}
        <button
          onClick={() => {
            if (onResetData) {
              onResetData();
            } else {
              resetAllData();
            }
          }}
          className="w-full retro-btn bg-[#FFB443] hover:bg-yellow-400 text-black font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4 stroke-[2.5]" />
          <span>{language === 'ar' ? 'إعادة ضبط البيانات وبدء جلسة جديدة' : 'Reset Sandbox & Start Clean Session'}</span>
        </button>

        <button
          onClick={logout}
          className="w-full retro-btn bg-neutral-900 hover:bg-black text-neutral-300 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'تسجيل الخروج' : 'Log Out'}</span>
        </button>
      </div>
    </div>
  );
};
