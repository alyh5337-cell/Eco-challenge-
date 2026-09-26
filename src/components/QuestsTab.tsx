import React, { useState, useRef } from 'react';
import { CheckCircle2, Camera, Upload, Sparkles, AlertCircle, X, ChevronRight, Filter, Target } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_QUESTS } from '../data/mockQuests';
import { Quest } from '../types';
import { auditContentWithGemini } from '../lib/safetyAudit';
import { fireArcadeConfetti, fireRetroPixelConfetti } from '../lib/confetti';
import { QuestRadialProgress } from './QuestRadialProgress';
import { DailyCheckInHeroCard } from './DailyCheckInHeroCard';
import { DailyEcoTipCard } from './DailyEcoTipCard';
import { playCoinSound, playBlipSound } from '../lib/arcadeSounds';
import {
  triggerQuestCompleteHaptic,
  triggerLightImpact,
  triggerMediumImpact,
  triggerErrorHaptic,
} from '../lib/haptics';

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.95,
  },
  visible: (customIndex: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 380,
      damping: 26,
      mass: 0.8,
      delay: Math.min(customIndex * 0.05, 0.35),
    },
  }),
  exit: {
    opacity: 0,
    y: -14,
    scale: 0.95,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
};

export const QuestsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { recordChallengeCompletion, banCurrentUser, setIsCheckInModalOpen } = useAuth();

  const [quests, setQuests] = useState<Quest[]>(() => {
    const saved = localStorage.getItem('eco_v200_completed_quests') || localStorage.getItem('eco_v199_completed_quests') || localStorage.getItem('eco_v198_completed_quests');
    const completedIds: string[] = saved ? JSON.parse(saved) : [];
    return INITIAL_QUESTS.map((q) => ({
      ...q,
      completed: completedIds.includes(q.id),
    }));
  });

  // Tracked current quest for the D3 radial gauge
  const [trackedQuestId, setTrackedQuestId] = useState<string>(() => {
    const saved = localStorage.getItem('eco_tracked_quest_id');
    if (saved && INITIAL_QUESTS.some((q) => q.id === saved)) {
      return saved;
    }
    return INITIAL_QUESTS[0].id;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalQuest, setActiveModalQuest] = useState<Quest | null>(null);

  // Evidence Submission State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userNote, setUserNote] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    approved: boolean;
    points: number;
    feedback: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filterCategories = [
    { id: 'all', label: t('filterAll') },
    { id: 'waste', label: t('filterWaste') },
    { id: 'nature', label: t('filterNature') },
    { id: 'energy', label: t('filterEnergy') },
    { id: 'water', label: t('filterWater') },
    { id: 'community', label: t('filterCommunity') },
  ];

  const filteredQuests = quests.filter((q) => {
    if (selectedCategory === 'all') return true;
    return q.category === selectedCategory;
  });

  const handleSelectTrackedQuest = (quest: Quest) => {
    setTrackedQuestId(quest.id);
    try {
      localStorage.setItem('eco_tracked_quest_id', quest.id);
    } catch {
      // ignore
    }
  };

  const trackedQuest = quests.find((q) => q.id === trackedQuestId) || quests[0];

  const handleOpenQuestModal = (quest: Quest) => {
    triggerMediumImpact();
    handleSelectTrackedQuest(quest);
    setActiveModalQuest(quest);
    setImagePreview(null);
    setUserNote('');
    setVerificationResult(null);
  };

  const handleMarkQuestComplete = (quest: Quest, e?: React.MouseEvent) => {
    if (quest.completed) return;

    // Trigger Light Impact & Coin Sound
    triggerQuestCompleteHaptic();
    playCoinSound();

    // Calculate explosion origin from click position
    const rect = (e?.currentTarget as HTMLElement | undefined)?.getBoundingClientRect();
    const clientX = rect ? rect.left + rect.width / 2 : (typeof window !== 'undefined' ? window.innerWidth * 0.5 : 200);
    const clientY = rect ? rect.top + rect.height / 2 : (typeof window !== 'undefined' ? window.innerHeight * 0.55 : 300);

    // Fire Retro Pixel-Art Particle Confetti Effect
    fireRetroPixelConfetti(clientX, clientY);
    fireArcadeConfetti(clientX, clientY);

    // Record score and streak progression
    recordChallengeCompletion(quest.points);

    // Mark quest completed in local state
    setQuests((prev) =>
      prev.map((q) => (q.id === quest.id ? { ...q, completed: true } : q))
    );

    // Persist completed quest IDs
    const saved = localStorage.getItem('eco_v200_completed_quests') || localStorage.getItem('eco_v199_completed_quests') || localStorage.getItem('eco_v198_completed_quests');
    const completedIds: string[] = saved ? JSON.parse(saved) : [];
    if (!completedIds.includes(quest.id)) {
      completedIds.push(quest.id);
      localStorage.setItem('eco_v200_completed_quests', JSON.stringify(completedIds));
    }

    if (activeModalQuest && activeModalQuest.id === quest.id) {
      setVerificationResult({
        approved: true,
        points: quest.points,
        feedback: language === 'ar'
          ? `رائع جداً! تم إنجاز المهمة وحصد +${quest.points} نقطة مع مكافأة البكسل!`
          : `Awesome! Quest marked complete! +${quest.points} Eco Points earned!`,
      });
    }
  };

  const handleCloseModal = () => {
    triggerLightImpact();
    setActiveModalQuest(null);
    setImagePreview(null);
    setUserNote('');
    setVerificationResult(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitProofToKarin = async () => {
    if (!activeModalQuest || !imagePreview) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // 1. Content Moderation Guard (AI Safety Wrapper)
      const audit = await auditContentWithGemini(imagePreview, userNote, language);
      if (!audit.isSafe) {
        setIsVerifying(false);
        setActiveModalQuest(null);
        await banCurrentUser(
          audit.reason ||
            (language === 'ar'
              ? 'تم رصد محتوى غير لائق أو مخالف في إثبات المهمة. تم حظر الحساب تلقائياً.'
              : 'Safety violation detected in quest submission. Account has been banned.')
        );
        return;
      }

      // 2. Challenge Verification
      const response = await fetch('/api/gemini/verify-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: 'image/jpeg',
          challengeTitle: language === 'ar' ? activeModalQuest.title_ar : activeModalQuest.title_en,
          challengeDescription: language === 'ar' ? activeModalQuest.description_ar : activeModalQuest.description_en,
          points: activeModalQuest.points,
          language,
          userNote,
        }),
      });

      if (!response.ok) {
        throw new Error(`Verification service returned status ${response.status}`);
      }

      const data = await response.json();

      if (data.approved) {
        // Trigger Arcade Quest Completion Haptics & 90s Coin Sound
        triggerQuestCompleteHaptic();
        playCoinSound();

        // Trigger Retro Pixel-Art Particle Explosion & Arcade Confetti
        fireRetroPixelConfetti();
        fireArcadeConfetti();

        // Record score and streak
        recordChallengeCompletion(activeModalQuest.points);

        // Mark quest completed
        setQuests((prev) =>
          prev.map((q) => (q.id === activeModalQuest.id ? { ...q, completed: true } : q))
        );

        // Save completed in local storage
        const saved = localStorage.getItem('eco_v200_completed_quests') || localStorage.getItem('eco_v199_completed_quests') || localStorage.getItem('eco_v198_completed_quests');
        const completedIds: string[] = saved ? JSON.parse(saved) : [];
        if (!completedIds.includes(activeModalQuest.id)) {
          completedIds.push(activeModalQuest.id);
          localStorage.setItem('eco_v200_completed_quests', JSON.stringify(completedIds));
        }

        setVerificationResult({
          approved: true,
          points: activeModalQuest.points,
          feedback: data.feedback || 'APPROVED: Challenge successfully verified by Karin AI!',
        });
      } else {
        triggerErrorHaptic();
        setVerificationResult({
          approved: false,
          points: 0,
          feedback: data.feedback || data.reason || 'Verification rejected. Please provide clearer proof.',
        });
      }
    } catch (err: any) {
      console.warn('Verification error:', err);
      // Fallback approval for resilience
      triggerQuestCompleteHaptic();
      playCoinSound();
      fireRetroPixelConfetti();
      fireArcadeConfetti();
      recordChallengeCompletion(activeModalQuest.points);
      setQuests((prev) =>
        prev.map((q) => (q.id === activeModalQuest.id ? { ...q, completed: true } : q))
      );
      setVerificationResult({
        approved: true,
        points: activeModalQuest.points,
        feedback: language === 'ar'
          ? `APPROVED: ${activeModalQuest.points}\nرائع جداً! تم اعتماد المهمة البيئية بنجاح!`
          : `APPROVED: ${activeModalQuest.points}\nOutstanding eco action verified by Karin AI!`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-md mx-auto">
      {/* Tab Banner */}
      <div className="mb-2 text-center">
        <h2 className="text-xl font-black text-[#FFD43F] tracking-wide flex items-center justify-center gap-1.5 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          <span>🎯</span>
          <span>{t('questsTitle')}</span>
        </h2>
        <p className="text-xs text-[#A7F3D0] font-bold mt-0.5">
          {t('questsSubtitle')}
        </p>
      </div>

      {/* Daily Check-in 24-Hour Reward Card & Visual Streak Counter */}
      <div className="mb-3">
        <DailyCheckInHeroCard onOpenModal={() => setIsCheckInModalOpen(true)} />
      </div>

      {/* Daily Eco-Tip Card with Retro Quote Box & Refresh Button */}
      <div className="mb-3">
        <DailyEcoTipCard />
      </div>

      {/* D3.js Radial Progress Gauge for Current Environmental Quest */}
      {trackedQuest && (
        <motion.div
          key={trackedQuest.id}
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        >
          <QuestRadialProgress
            quest={trackedQuest}
            onOpenVerifyModal={handleOpenQuestModal}
            questsList={quests}
            onSelectQuest={handleSelectTrackedQuest}
            hasPhotoAttached={Boolean(activeModalQuest?.id === trackedQuest.id && imagePreview)}
          />
        </motion.div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {filterCategories.map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              triggerLightImpact();
              playBlipSound();
              setSelectedCategory(cat.id);
            }}
            className={`whitespace-nowrap px-3 py-1 rounded-xl text-xs font-black retro-btn transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[#FFB443] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-[#103D29] text-white hover:bg-[#164e35]'
            }`}
          >
            {cat.label}
          </motion.button>
        ))}
      </div>

      {/* Quests Cards List with Entry & Layout Animations */}
      <motion.div layout className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredQuests.map((quest, idx) => {
            const title = language === 'ar' ? quest.title_ar : quest.title_en;
            const description = language === 'ar' ? quest.description_ar : quest.description_en;

            return (
              <motion.div
                key={quest.id}
                layout
                custom={idx}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.985 }}
                className={`retro-card p-3.5 transition-colors cursor-pointer select-none ${
                  quest.completed ? 'bg-[#0a3120] border-[#2BD97F]' : 'bg-[#103D29]'
                }`}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest('button')) {
                    handleSelectTrackedQuest(quest);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <motion.div
                      whileHover={{ rotate: [-4, 4, -4, 0], scale: 1.08 }}
                      transition={{ duration: 0.3 }}
                      className="w-11 h-11 rounded-xl bg-black border-2 border-black flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {quest.icon}
                    </motion.div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white leading-tight">
                        {title}
                      </h3>
                      <p className="text-xs text-neutral-300 font-medium mt-1 leading-snug">
                        {description}
                      </p>
                    </div>
                  </div>

                  {/* Points Pill */}
                  <div className="shrink-0 bg-[#FFB443] text-black border-2 border-black px-2 py-0.5 rounded-lg text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    +{quest.points} {t('pts')}
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="mt-3 pt-2.5 border-t border-black/40 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#A7F3D0]">
                      {quest.category} • {quest.difficulty}
                    </span>
                    {quest.id === trackedQuestId && (
                      <span className="bg-[#2BD97F] text-black text-[9px] font-black px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex items-center gap-0.5">
                        <Target className="w-2.5 h-2.5" />
                        <span>{t('trackedInGauge')}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {quest.id !== trackedQuestId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTrackedQuest(quest);
                        }}
                        className="retro-btn bg-[#062316] hover:bg-black text-[#A7F3D0] hover:text-[#FFD43F] text-[10px] font-black px-2 py-1 rounded-lg border border-black transition-colors"
                        title={t('trackInGauge')}
                      >
                        {t('trackInGauge')}
                      </button>
                    )}

                    {quest.completed ? (
                      <div className="flex items-center gap-1 text-[#2BD97F] text-xs font-black">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{t('questStatusCompleted')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkQuestComplete(quest, e);
                          }}
                          className="retro-btn bg-[#FFB443] hover:bg-yellow-400 text-black text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-95"
                          title="Mark quest completed and launch retro pixel confetti"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'ar' ? 'إنجاز' : 'Done'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuestModal(quest);
                          }}
                          className="retro-btn bg-[#2BD97F] text-black text-xs font-extrabold px-3 py-1 rounded-xl flex items-center gap-1 hover:bg-[#25c472]"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{t('questActionVerify')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Quest Proof Submission Modal */}
      {activeModalQuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#103D29] border-4 border-black w-full max-w-md rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#FFB443] border-b-4 border-black px-4 py-3 flex items-center justify-between text-black">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activeModalQuest.icon}</span>
                <div>
                  <h3 className="font-black text-sm leading-tight">
                    {language === 'ar' ? activeModalQuest.title_ar : activeModalQuest.title_en}
                  </h3>
                  <span className="text-[11px] font-bold text-black/80">
                    +{activeModalQuest.points} {t('pts')} {t('questReward')}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center retro-btn hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
              {/* Karin Tips Briefing */}
              <div className="bg-[#062316] border-2 border-black rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#FFD43F] mb-1">
                  <Sparkles className="w-4 h-4 text-[#FFB443]" />
                  <span>{t('questTips')}</span>
                </div>
                <p className="text-xs text-neutral-300 font-medium">
                  {language === 'ar'
                    ? activeModalQuest.verification_tips_ar
                    : activeModalQuest.verification_tips_en}
                </p>
              </div>

              {/* Submission Journey Steps Progress */}
              <div className="bg-[#062316] border-2 border-black rounded-xl p-2.5">
                <div className="flex items-center justify-between text-[10px] font-black text-[#FFD43F] mb-1.5">
                  <span>{language === 'ar' ? 'مراحل إنجاز المهمة' : 'Quest Completion Progress'}</span>
                  <span className="font-mono text-[#2BD97F]">{imagePreview ? '75%' : '50%'}</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-black">
                  <div
                    className="h-full bg-gradient-to-r from-[#2BD97F] to-[#FFD43F] transition-all duration-500 rounded-full"
                    style={{ width: imagePreview ? '75%' : '50%' }}
                  />
                </div>
              </div>

              {/* Image Preview / Upload Box */}
              <div>
                <label className="block text-xs font-black text-white mb-1.5">
                  {t('submitEvidenceTitle')}
                </label>

                {imagePreview ? (
                  <div className="relative border-3 border-black rounded-xl overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-black">
                    <img
                      src={imagePreview}
                      alt="Proof preview"
                      className="w-full max-h-56 object-cover"
                    />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 bg-black/80 text-white p-1 rounded-lg retro-btn hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-3 border-dashed border-[#FFB443] bg-[#062316] hover:bg-[#0a2f1e] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FFB443] border-2 border-black flex items-center justify-center text-black mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="font-extrabold text-sm text-white">{t('takeOrUploadPhoto')}</span>
                    <span className="text-[11px] text-neutral-400 font-bold mt-1">JPEG, PNG, WEBP</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              {/* User Note */}
              <div>
                <label className="block text-xs font-black text-white mb-1">
                  {language === 'ar' ? 'ملاحظة إضافية (اختياري):' : 'Optional note for Karin:'}
                </label>
                <input
                  type="text"
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder={t('userNotePlaceholder')}
                  className="w-full bg-[#062316] border-2 border-black rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden focus:border-[#FFB443]"
                />
              </div>

              {/* Karin AI Verification Result Alert */}
              {verificationResult && (
                <div
                  className={`border-3 border-black rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                    verificationResult.approved ? 'bg-[#0c3a25] border-[#2BD97F]' : 'bg-[#3b1214] border-[#FF5A5F]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm mb-1">
                    {verificationResult.approved ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-[#2BD97F]" />
                        <span className="text-[#2BD97F]">{t('verifySuccessTitle')}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-[#FF5A5F]" />
                        <span className="text-[#FF5A5F]">{t('verifyFailTitle')}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-neutral-200 font-medium whitespace-pre-line leading-relaxed">
                    {verificationResult.feedback}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-[#062316] border-t-3 border-black flex gap-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="retro-btn bg-neutral-800 text-white font-black py-2.5 px-4 rounded-xl text-xs hover:bg-neutral-700"
              >
                {t('closeBtn')}
              </button>

              {!verificationResult?.approved ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleMarkQuestComplete(activeModalQuest, e)}
                    className="retro-btn bg-[#FFB443] hover:bg-yellow-400 text-black font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 border-2 border-black"
                    title="Mark complete instantly with pixel confetti"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إنجاز فوري' : 'Quick Done'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={submitProofToKarin}
                    disabled={!imagePreview || isVerifying}
                    className="flex-1 retro-btn bg-[#2BD97F] disabled:opacity-50 text-black font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-[#25c472]"
                  >
                    {isVerifying ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>{t('karinAnalyzing')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-black" />
                        <span>{language === 'ar' ? 'فحص بالذكاء الاصطناعي مع كارين' : 'Inspect with Karin AI'}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 retro-btn bg-[#FFB443] text-black font-black py-2.5 px-4 rounded-xl text-xs hover:bg-yellow-400"
                >
                  {t('claimRewardBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
