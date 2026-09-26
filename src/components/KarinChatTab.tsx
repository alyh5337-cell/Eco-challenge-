import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Sparkles,
  Camera,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { auditContentWithGemini } from '../lib/safetyAudit';
import { triggerLightImpact, triggerMediumImpact } from '../lib/capacitorBridge';

export const KarinChatTab: React.FC = () => {
  const { t, language } = useLanguage();
  const { karinChatHistory, addKarinChatMessage, clearKarinChat, banCurrentUser, user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Web Speech API - Synthesis (Auditory Response)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('karin_auto_speak');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Web Speech API - Recognition (Voice Commands & Speech-to-Text)
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check Web Speech Recognition support in current environment
  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [karinChatHistory.length, isLoading]);

  // Clean up Web Speech on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech Synthesis (Auditory response function)
  const speakText = useCallback(
    (text: string, msgId?: string) => {
      if (!('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      // Clean markdown, symbols, URLs and emojis for crisp speech synthesis
      const cleanText = text
        .replace(/[*#_`~>\[\]\(\)]/g, ' ')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      // Retro energetic cartoon cadence
      utterance.rate = 1.05;
      utterance.pitch = 1.15;

      // Select matching localized voice if available
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
          const targetPrefix = language === 'ar' ? 'ar' : 'en';
          const matchedVoice =
            voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix)) || voices[0];
          if (matchedVoice) {
            utterance.voice = matchedVoice;
          }
        }
      } catch (e) {
        console.warn('Voice picker fallback:', e);
      }

      utterance.onstart = () => {
        setSpeakingMsgId(msgId || 'active_stream');
      };
      utterance.onend = () => {
        setSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setSpeakingMsgId(null);
      };

      setSpeakingMsgId(msgId || 'active_stream');
      window.speechSynthesis.speak(utterance);
    },
    [language]
  );

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
  };

  const handleToggleAutoSpeak = () => {
    triggerLightImpact();
    const nextState = !autoSpeakEnabled;
    setAutoSpeakEnabled(nextState);
    try {
      localStorage.setItem('karin_auto_speak', String(nextState));
    } catch {
      // ignore
    }
    if (!nextState && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerLightImpact();
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSpeakSingleMessage = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      stopSpeaking();
      return;
    }

    triggerLightImpact();
    speakText(text, msgId);
  };

  const handleSendMessage = async (customPrompt?: string, fromVoice: boolean = false) => {
    const promptToSend = customPrompt || inputText.trim();
    if (!promptToSend && !selectedImage) return;

    triggerMediumImpact();
    const userImg = selectedImage;
    setSelectedImage(null);
    setInputText('');
    setInterimTranscript('');
    setIsLoading(true);

    try {
      // 1. AI Safety Audit Guard before sending or appending message
      const audit = await auditContentWithGemini(userImg, promptToSend, language);
      if (!audit.isSafe) {
        setIsLoading(false);
        await banCurrentUser(
          audit.reason ||
            (language === 'ar'
              ? 'تم رصد محتوى غير لائق أو مخالف في محادثة كارين. تم حظر الحساب تلقائياً.'
              : 'Safety violation detected in chat with Karin. Account banned.')
        );
        return;
      }

      // 2. Add user message to history
      addKarinChatMessage(
        'user',
        promptToSend || (language === 'ar' ? '(صورة مرفقة للفحص)' : '(Eco photo attached)'),
        userImg || undefined
      );

      // Contextual memory: pass last 6 conversation turns
      const recentHistory = karinChatHistory.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.message_text,
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptToSend,
          history: recentHistory,
          imageBase64: userImg || undefined,
          mimeType: 'image/jpeg',
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API status: ${response.status}`);
      }

      const data = await response.json();
      const karinReply =
        data.text ||
        (language === 'ar'
          ? 'رائع جداً يا صديقي الأخضر! استمر في زرع بذور الأمل! 🌱'
          : 'Keep planting seeds of hope for our green planet! 🌱');

      addKarinChatMessage('karin', karinReply);

      // Auditory response trigger: speak reply if initiated by voice command or if autoSpeak is ON
      if (fromVoice || autoSpeakEnabled) {
        speakText(karinReply);
      }
    } catch (err: any) {
      console.warn('Karin chat fallback triggered:', err);
      const fallback =
        language === 'ar'
          ? 'رائع جداً يا صديقي الأخضر! كل خطوة صغيرة مثل إطفاء الأنوار أو ترشيد المياه تصنع فارقاً حقيقياً! كيف أساعدك أكثر؟ 🌱'
          : 'Awesome eco curiosity, warrior! Small daily habits shape the future of our forests and oceans! How can I assist your mission next? 🌱';

      addKarinChatMessage('karin', fallback);

      if (fromVoice || autoSpeakEnabled) {
        speakText(fallback);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    triggerLightImpact();
    stopSpeaking();
    clearKarinChat();
  };

  // Process Voice Commands & Spoken Queries via Web Speech API
  const processVoiceCommand = (rawText: string) => {
    setIsListening(false);
    setInterimTranscript('');
    const normalized = rawText.toLowerCase().trim();

    // Voice Command 1: Reset / Clear Chat
    if (
      normalized.includes('clear chat') ||
      normalized.includes('reset chat') ||
      normalized.includes('reset') ||
      normalized.includes('امسح المحادثة') ||
      normalized.includes('مسح المحادثة') ||
      normalized.includes('اعادة ضبط') ||
      normalized.includes('إعادة ضبط')
    ) {
      setSpeechNotice(`${t('karinVoiceCommandRecognized')} ${t('karinClearChat')}`);
      handleResetChat();
      speakText(t('karinResetAuditory'));
      setTimeout(() => setSpeechNotice(null), 3500);
      return;
    }

    // Voice Command 2: Stop Speech / Quiet
    if (
      normalized.includes('stop speaking') ||
      normalized.includes('stop talking') ||
      normalized.includes('quiet') ||
      normalized.includes('silence') ||
      normalized === 'stop' ||
      normalized.includes('توقف') ||
      normalized.includes('اسكت') ||
      normalized.includes('صمت') ||
      normalized.includes('إيقاف الصوت')
    ) {
      stopSpeaking();
      setSpeechNotice(`${t('karinVoiceCommandRecognized')} ${t('karinStopVoice')}`);
      setTimeout(() => setSpeechNotice(null), 2500);
      return;
    }

    // Voice Command 3: Mute / Unmute Voice
    if (
      normalized.includes('mute voice') ||
      normalized.includes('voice off') ||
      normalized.includes('كتم الصوت') ||
      normalized.includes('صامت')
    ) {
      setAutoSpeakEnabled(false);
      localStorage.setItem('karin_auto_speak', 'false');
      stopSpeaking();
      setSpeechNotice(t('karinVoiceAutoSpeakOff'));
      setTimeout(() => setSpeechNotice(null), 2500);
      return;
    }

    if (
      normalized.includes('enable voice') ||
      normalized.includes('voice on') ||
      normalized.includes('تفعيل الصوت') ||
      normalized.includes('شغل الصوت')
    ) {
      setAutoSpeakEnabled(true);
      localStorage.setItem('karin_auto_speak', 'true');
      setSpeechNotice(t('karinVoiceAutoSpeakOn'));
      setTimeout(() => setSpeechNotice(null), 2500);
      return;
    }

    // Voice Command 4: Quick Prompts
    if (normalized.includes('compost') || normalized.includes('سماد')) {
      setSpeechNotice(`${t('karinVoiceCommandRecognized')} ${t('karinQuick1')}`);
      handleSendMessage(t('karinQuick1'), true);
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }
    if (
      normalized.includes('electricity') ||
      normalized.includes('electric') ||
      normalized.includes('energy') ||
      normalized.includes('كهرباء') ||
      normalized.includes('طاقة')
    ) {
      setSpeechNotice(`${t('karinVoiceCommandRecognized')} ${t('karinQuick2')}`);
      handleSendMessage(t('karinQuick2'), true);
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }
    if (
      normalized.includes('plastic') ||
      normalized.includes('bottle') ||
      normalized.includes('recycle') ||
      normalized.includes('upcycle') ||
      normalized.includes('بلاستيك') ||
      normalized.includes('تدوير') ||
      normalized.includes('إعادة تدوير')
    ) {
      setSpeechNotice(`${t('karinVoiceCommandRecognized')} ${t('karinQuick3')}`);
      handleSendMessage(t('karinQuick3'), true);
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }
    if (
      normalized.includes('tree') ||
      normalized.includes('plant') ||
      normalized.includes('شجرة') ||
      normalized.includes('زراعة')
    ) {
      setSpeechNotice(`${t('karinVoiceCommandRecognized')} ${t('karinQuick4')}`);
      handleSendMessage(t('karinQuick4'), true);
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }
    if (
      normalized.includes('water') ||
      normalized.includes('ماء') ||
      normalized.includes('مياه') ||
      normalized.includes('ترشيد')
    ) {
      setSpeechNotice(`${t('karinVoiceCommandRecognized')} ${t('karinQuick5')}`);
      handleSendMessage(t('karinQuick5'), true);
      setTimeout(() => setSpeechNotice(null), 3000);
      return;
    }

    // Standard Freeform Spoken Query: User asked Karin a question with voice
    setSpeechNotice(`${t('karinVoiceCommandRecognized')} "${rawText}"`);
    handleSendMessage(rawText, true);
    setTimeout(() => setSpeechNotice(null), 3500);
  };

  // Toggle Voice Recognition Listening
  const handleToggleVoiceInput = () => {
    if (!isSpeechRecognitionSupported) {
      setSpeechNotice(t('karinVoiceUnsupported'));
      setTimeout(() => setSpeechNotice(null), 3500);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    // Stop ongoing speech synthesis to prevent mic echo
    stopSpeaking();
    triggerLightImpact();

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        setSpeechNotice(null);
      };

      recognition.onresult = (event: any) => {
        let liveTranscript = '';
        let hasFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const segment = event.results[i][0]?.transcript || '';
          liveTranscript += segment;
          if (event.results[i].isFinal) {
            hasFinal = true;
          }
        }

        setInterimTranscript(liveTranscript);

        if (hasFinal && liveTranscript.trim()) {
          processVoiceCommand(liveTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          setSpeechNotice(
            language === 'ar' ? 'تم رفض إذن استخدام الميكروفون' : 'Microphone permission denied'
          );
        } else if (event.error !== 'no-speech') {
          setSpeechNotice(
            language === 'ar' ? 'تعذر الاستماع، يرجى المحاولة ثانية' : 'Could not hear voice command, retry'
          );
        }
        setTimeout(() => setSpeechNotice(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechNotice(t('karinVoiceUnsupported'));
      setTimeout(() => setSpeechNotice(null), 3000);
    }
  };

  const quickPrompts = [
    t('karinQuick1'),
    t('karinQuick2'),
    t('karinQuick3'),
    t('karinQuick4'),
    t('karinQuick5'),
  ];

  return (
    <div className="pb-24 pt-2 px-3 max-w-md mx-auto flex flex-col h-[calc(100vh-130px)]">
      {/* Header Banner */}
      <div className="bg-[#103D29] border-3 border-black rounded-2xl p-2.5 mb-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src="https://api.dicebear.com/7.x/bottts/svg?seed=KarinEcoGuide&backgroundColor=2bd97f"
              alt="Karin AI"
              className="w-11 h-11 rounded-xl border-2 border-black bg-white object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            />
            {speakingMsgId && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD43F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFD43F] border border-black"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <h2 className="font-black text-sm text-[#FFD43F] leading-tight flex items-center gap-1">
              <span>{t('karinTitle')}</span>
              <span className="text-[10px] bg-[#2BD97F] text-black px-1.5 py-0.2 rounded font-black">
                Web Speech
              </span>
            </h2>
            <p className="text-[11px] text-[#A7F3D0] font-bold truncate">
              {t('karinSubtitle')}
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Auditory Voice Toggle */}
          <button
            onClick={handleToggleAutoSpeak}
            className={`retro-btn p-2 rounded-xl border-2 border-black transition-colors flex items-center gap-1 text-[10px] font-black ${
              autoSpeakEnabled
                ? 'bg-[#2BD97F] text-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-[#062316] text-neutral-400 hover:text-white'
            }`}
            title={autoSpeakEnabled ? t('karinVoiceAutoSpeakOn') : t('karinVoiceAutoSpeakOff')}
          >
            {autoSpeakEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-black" />
                <span className="hidden sm:inline">Voice ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </button>

          {/* Reset Chat Action */}
          <button
            onClick={handleResetChat}
            className="retro-btn bg-[#062316] hover:bg-black text-[#A7F3D0] hover:text-[#FFD43F] p-2 rounded-xl border-2 border-black transition-colors flex items-center gap-1 text-[10px] font-black"
            title={t('karinClearChat')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('karinClearChat')}</span>
          </button>
        </div>
      </div>

      {/* Voice Status or Notification Toast */}
      {speechNotice && (
        <div className="bg-[#FFB443] border-2 border-black text-black px-3 py-1.5 rounded-xl text-xs font-black mb-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2 animate-bounce">
          <div className="flex items-center gap-1.5 truncate">
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{speechNotice}</span>
          </div>
          <button onClick={() => setSpeechNotice(null)} className="font-black text-xs hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Voice Commands Cheat Sheet Toggle */}
      <div className="flex items-center justify-between px-1 mb-1 text-[10px] text-[#A7F3D0] font-bold">
        <button
          onClick={() => setShowVoiceHelp((prev) => !prev)}
          className="flex items-center gap-1 hover:text-[#FFD43F] transition-colors"
        >
          <HelpCircle className="w-3 h-3 text-[#2BD97F]" />
          <span>{t('karinVoiceCommands')}</span>
        </button>
        {speakingMsgId && (
          <button
            onClick={stopSpeaking}
            className="flex items-center gap-1 text-[#FF5B5B] hover:text-white font-black bg-[#062316] px-2 py-0.5 rounded-lg border border-black animate-pulse"
          >
            <VolumeX className="w-3 h-3" />
            <span>{t('karinStopVoice')}</span>
          </button>
        )}
      </div>

      {showVoiceHelp && (
        <div className="bg-[#103D29] border-2 border-black rounded-xl p-2.5 mb-2 text-[11px] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-1 text-[#FFD43F] font-black">
            <span className="flex items-center gap-1">
              <Mic className="w-3 h-3 text-[#2BD97F]" />
              {t('karinVoiceCommands')} (Web Speech API)
            </span>
            <button onClick={() => setShowVoiceHelp(false)} className="text-white hover:text-red-400">
              ✕
            </button>
          </div>
          <p className="text-[#A7F3D0] mb-2 font-medium">{t('karinVoiceHint')}</p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="bg-[#062316] p-1.5 rounded-lg border border-black font-mono">
              <span className="text-[#2BD97F] font-black block">"Clear chat" / "امسح"</span>
              <span className="text-neutral-400">{t('karinClearChat')}</span>
            </div>
            <div className="bg-[#062316] p-1.5 rounded-lg border border-black font-mono">
              <span className="text-[#2BD97F] font-black block">"Stop" / "توقف"</span>
              <span className="text-neutral-400">{t('karinStopVoice')}</span>
            </div>
            <div className="bg-[#062316] p-1.5 rounded-lg border border-black font-mono">
              <span className="text-[#2BD97F] font-black block">"Compost" / "سماد"</span>
              <span className="text-neutral-400">{t('karinQuick1')}</span>
            </div>
            <div className="bg-[#062316] p-1.5 rounded-lg border border-black font-mono">
              <span className="text-[#2BD97F] font-black block">"Electricity" / "كهرباء"</span>
              <span className="text-neutral-400">{t('karinQuick2')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-[#062316] border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-2">
        {karinChatHistory.map((msg) => {
          const isKarin = msg.sender === 'karin';
          const isSpeaking = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${isKarin ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {isKarin ? (
                <img
                  src="https://api.dicebear.com/7.x/bottts/svg?seed=KarinEcoGuide&backgroundColor=2bd97f"
                  alt="Karin"
                  className="w-7 h-7 rounded-lg border-2 border-black bg-white shrink-0 object-cover"
                />
              ) : (
                <img
                  src={user?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=EcoHero1'}
                  alt="You"
                  className="w-7 h-7 rounded-lg border-2 border-black bg-[#103D29] shrink-0 object-cover"
                />
              )}

              <div className={`max-w-[84%] flex flex-col ${isKarin ? 'items-start' : 'items-end'}`}>
                <div className="flex items-center gap-1.5 px-1 mb-0.5">
                  <span className="text-[10px] font-black text-neutral-400">
                    {isKarin ? (language === 'ar' ? 'كارين AI' : 'Karin AI') : user?.display_name || 'You'}
                  </span>
                  {isKarin && (
                    <button
                      onClick={() => handleSpeakSingleMessage(msg.id, msg.message_text)}
                      className={`p-0.5 rounded transition-colors ${
                        isSpeaking
                          ? 'text-[#FF5B5B] animate-pulse bg-black/40 rounded px-1'
                          : 'text-neutral-400 hover:text-[#FFD43F]'
                      }`}
                      title={isSpeaking ? t('karinStopVoice') : t('karinListen')}
                    >
                      {isSpeaking ? (
                        <span className="flex items-center gap-1 text-[9px] font-black">
                          <VolumeX className="w-3 h-3" />
                          <span>{t('karinStopVoice')}</span>
                        </span>
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                <div
                  className={`rounded-2xl p-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs leading-relaxed relative ${
                    isKarin
                      ? isSpeaking
                        ? 'bg-[#154d34] border-[#2BD97F] text-white font-medium ring-2 ring-[#2BD97F]/40'
                        : 'bg-[#103D29] text-white font-medium'
                      : 'bg-[#FFB443] text-black font-bold'
                  }`}
                >
                  {msg.image_url && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-black bg-black">
                      <img src={msg.image_url} alt="Attached" className="max-h-48 w-full object-cover" />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.message_text}</p>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-black text-[#FFD43F] bg-[#103D29] p-2.5 rounded-xl border-2 border-black w-fit animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-[#2BD97F]" />
            <span>{t('karinThinking')}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-1 scrollbar-none shrink-0">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="whitespace-nowrap bg-[#103D29] border-2 border-black hover:bg-[#164e35] text-[11px] font-bold text-white px-2.5 py-1 rounded-xl shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Live Voice Recording Wave Banner (Active when listening) */}
      {isListening && (
        <div className="bg-[#103D29] border-3 border-[#2BD97F] rounded-2xl p-2.5 mb-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-pulse shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5B5B] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5B5B] border border-black"></span>
              </span>
              <span className="text-xs font-black text-[#FFD43F] uppercase tracking-wider">
                {t('karinVoiceListening')}
              </span>
            </div>

            {/* Sound Wave Equalizer Simulation */}
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-1 bg-[#2BD97F] rounded-full animate-bounce h-3"></span>
              <span className="w-1 bg-[#FFD43F] rounded-full animate-bounce h-4 delay-75"></span>
              <span className="w-1 bg-[#2BD97F] rounded-full animate-bounce h-2 delay-150"></span>
              <span className="w-1 bg-[#FFB443] rounded-full animate-bounce h-4 delay-100"></span>
              <span className="w-1 bg-[#2BD97F] rounded-full animate-bounce h-3 delay-200"></span>
            </div>
          </div>

          <div className="bg-[#062316] border border-black rounded-xl p-2 text-xs font-bold text-white min-h-[32px] flex items-center justify-between gap-2">
            <p className="italic text-[#A7F3D0] truncate">
              {interimTranscript || (language === 'ar' ? 'تحدث الآن، كارين تستمع...' : 'Speak now, Karin is listening...')}
            </p>
            {interimTranscript.trim() && (
              <button
                onClick={() => processVoiceCommand(interimTranscript.trim())}
                className="retro-btn bg-[#2BD97F] text-black text-[10px] font-black px-2 py-0.5 rounded-lg border border-black shrink-0"
              >
                Send
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Box with Voice & Media Controls */}
      <div className="bg-[#103D29] border-3 border-black p-2 rounded-2xl shrink-0">
        {selectedImage && (
          <div className="relative inline-block mb-1.5 border-2 border-black rounded-lg overflow-hidden bg-black">
            <img src={selectedImage} alt="Upload preview" className="h-14 w-14 object-cover" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-0 right-0 bg-black text-white p-0.5 rounded-bl"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {/* Photo Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="retro-btn bg-black text-[#FFD43F] p-2 rounded-xl hover:bg-neutral-800 shrink-0"
            title={t('karinUploadPhoto')}
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={
              isListening ? (language === 'ar' ? 'جارٍ الاستماع...' : 'Listening...') : t('karinInputPlaceholder')
            }
            className="flex-1 bg-[#062316] border-2 border-black rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden focus:border-[#FFB443]"
          />

          {/* Web Speech API Microphone Button */}
          <button
            onClick={handleToggleVoiceInput}
            className={`retro-btn p-2 rounded-xl border-2 border-black shrink-0 transition-all ${
              isListening
                ? 'bg-[#FF5B5B] text-white animate-bounce shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ring-2 ring-red-400'
                : 'bg-black text-[#2BD97F] hover:bg-neutral-900 hover:text-[#FFD43F]'
            } ${!isSpeechRecognitionSupported ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={
              !isSpeechRecognitionSupported
                ? t('karinVoiceUnsupported')
                : isListening
                ? t('karinVoiceListeningStop')
                : t('karinVoiceCommands')
            }
          >
            {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Message Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className="retro-btn bg-[#2BD97F] disabled:opacity-40 text-black p-2 rounded-xl hover:bg-[#25c472] shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
