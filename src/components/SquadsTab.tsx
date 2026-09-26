import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  UserPlus,
  PlusCircle,
  Copy,
  Check,
  QrCode,
  Shield,
  VolumeX,
  Volume2,
  UserX,
  Send,
  Mic,
  Square,
  Image as ImageIcon,
  Lock,
  Globe,
  Search,
  Key,
  X,
  Sparkles,
  ArrowRightLeft,
  Trophy,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Squad, SquadMember } from '../types';
import { VoiceRecorder } from '../lib/audioRecorder';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { auditContentWithGemini } from '../lib/safetyAudit';
import { TopSquadsLeaderboard } from './TopSquadsLeaderboard';
import { triggerLightImpact } from '../lib/haptics';

export const SquadsTab: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    user,
    squads,
    userSquadIds,
    activeSquadId,
    setActiveSquadId,
    joinSquad,
    joinSquadByCode,
    createSquad,
    muteMember,
    unmuteMember,
    kickMember,
    sendSquadMessage,
    squadMessages,
    banCurrentUser,
  } = useAuth();

  // Sub-view mode (Active chat vs Top Squads Leaderboard)
  const [currentSubView, setCurrentSubView] = useState<'chat' | 'leaderboard'>('chat');

  // Modals state
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [pendingJoinSquad, setPendingJoinSquad] = useState<Squad | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Code join input
  const [manualCode, setManualCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Directory filters
  const [dirSearch, setDirSearch] = useState('');
  const [dirTab, setDirTab] = useState<'all' | 'public' | 'private' | 'code'>('all');

  // Create squad form
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadDesc, setNewSquadDesc] = useState('');
  const [newSquadIsPrivate, setNewSquadIsPrivate] = useState(false);
  const [newSquadPassword, setNewSquadPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Chat message input
  const [chatText, setChatText] = useState('');
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);

  // Active squad computation
  const activeSquad = squads.find((s) => s.id === activeSquadId) || squads[0];
  const userJoinedSquads = squads.filter((s) => userSquadIds.includes(s.id));
  const currentMessages = activeSquad ? squadMessages[activeSquad.id] || [] : [];

  // Check if current user is leader of active squad
  const isLeader = Boolean(
    user && activeSquad && (activeSquad.leader_id === user.id || activeSquad.members.some((m) => m.user_id === user.id && m.role === 'leader'))
  );

  // Check if current user is muted in active squad
  const isUserMuted = Boolean(
    user && activeSquad?.members.find((m) => m.user_id === user.id)?.is_muted
  );

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages.length]);

  // Voice recording handlers
  const startVoiceRecording = async () => {
    voiceRecorderRef.current = new VoiceRecorder();
    const started = await voiceRecorderRef.current.start();
    if (started) {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopAndSendVoice = async () => {
    clearInterval(timerRef.current);
    if (!voiceRecorderRef.current || !activeSquad) return;
    const res = await voiceRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingSeconds(0);

    if (res && res.audioUrl) {
      sendSquadMessage(activeSquad.id, '🎤 Voice note', res.audioUrl, 'voice_note', res.durationSec);
    }
  };

  const cancelVoiceRecording = () => {
    clearInterval(timerRef.current);
    voiceRecorderRef.current?.cancel();
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Chat message send
  const handleSendMessage = async () => {
    if ((!chatText.trim() && !chatImagePreview) || !activeSquad) return;

    const textToSend = chatText.trim();
    const imageToSend = chatImagePreview;
    setChatText('');
    setChatImagePreview(null);

    // AI Safety Guard
    const audit = await auditContentWithGemini(imageToSend, textToSend, language);
    if (!audit.isSafe) {
      await banCurrentUser(
        audit.reason ||
          (language === 'ar'
            ? 'تم رصد محتوى مخالف لقواعد الأمان في محادثة الفريق. تم حظر الحساب تلقائياً.'
            : 'Safety policy violation in squad chat. Account banned.')
      );
      return;
    }

    if (imageToSend) {
      sendSquadMessage(activeSquad.id, textToSend || '📷 Photo', imageToSend, 'image');
    } else {
      sendSquadMessage(activeSquad.id, textToSend, undefined, 'text');
    }
  };

  // Image attach handler
  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setChatImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Copy join code
  const copyInviteCode = () => {
    if (!activeSquad) return;
    navigator.clipboard.writeText(activeSquad.join_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Join squad from directory
  const handleSelectSquadToJoin = (squad: Squad) => {
    if (userSquadIds.includes(squad.id)) {
      setActiveSquadId(squad.id);
      setIsDiscoveryOpen(false);
      return;
    }

    if (squad.is_private) {
      setPendingJoinSquad(squad);
      setPasswordInput('');
      setPasswordError('');
      setIsPasswordPromptOpen(true);
    } else {
      joinSquad(squad.id);
      setIsDiscoveryOpen(false);
    }
  };

  const submitPasswordJoin = () => {
    if (!pendingJoinSquad) return;
    const res = joinSquad(pendingJoinSquad.id, passwordInput);
    if (res.success) {
      setIsPasswordPromptOpen(false);
      setPendingJoinSquad(null);
      setIsDiscoveryOpen(false);
    } else {
      setPasswordError(res.message || t('incorrectPassword'));
    }
  };

  const handleManualCodeJoin = () => {
    if (!manualCode.trim()) return;
    const res = joinSquadByCode(manualCode);
    if (res.success) {
      setManualCode('');
      setCodeError('');
      setIsDiscoveryOpen(false);
    } else {
      setCodeError(res.message || 'Invalid code');
    }
  };

  const handleCreateSquadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) {
      setCreateError('Squad name is required.');
      return;
    }
    if (newSquadIsPrivate && !newSquadPassword.trim()) {
      setCreateError('Please provide a password for private squad.');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    // AI Safety Guard for Squad Name and Description
    const audit = await auditContentWithGemini(null, `${newSquadName} ${newSquadDesc}`, language);
    if (!audit.isSafe) {
      setIsCreating(false);
      setIsCreateOpen(false);
      await banCurrentUser(
        audit.reason ||
          (language === 'ar'
            ? 'تم رصد اسم أو وصف غير لائق للمجموعة. تم حظر الحساب تلقائياً.'
            : 'Prohibited or unsafe squad name/description. Account has been banned.')
      );
      return;
    }

    const res = await createSquad({
      name: newSquadName,
      description: newSquadDesc,
      is_private: newSquadIsPrivate,
      password: newSquadPassword,
    });

    setIsCreating(false);

    if (res.success) {
      setNewSquadName('');
      setNewSquadDesc('');
      setNewSquadIsPrivate(false);
      setNewSquadPassword('');
      setIsCreateOpen(false);
    } else {
      setCreateError(res.reason || 'Could not create squad.');
    }
  };

  // Filter discovery directory squads
  const filteredDiscoverySquads = squads.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(dirSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(dirSearch.toLowerCase()) ||
      s.join_code.toLowerCase().includes(dirSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (dirTab === 'public') return !s.is_private;
    if (dirTab === 'private') return s.is_private;
    return true;
  });

  return (
    <div className="pb-24 pt-2 px-3 max-w-md mx-auto flex flex-col h-[calc(100vh-130px)]">
      {/* Top View Mode Switcher: [ 💬 Squad Chat ] vs [ 🏆 Top Squads Leaderboard ] */}
      <div className="flex bg-[#062316] p-1 rounded-2xl border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2 shrink-0 gap-1">
        <button
          type="button"
          onClick={() => {
            triggerLightImpact();
            setCurrentSubView('chat');
          }}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            currentSubView === 'chat'
              ? 'bg-[#2BD97F] text-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
              : 'text-neutral-300 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{t('squadChatTabBtn')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerLightImpact();
            setCurrentSubView('leaderboard');
          }}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            currentSubView === 'leaderboard'
              ? 'bg-[#FFB443] text-black border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
              : 'text-neutral-300 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 fill-current" />
          <span>{t('topSquadsTabBtn')}</span>
        </button>
      </div>

      {currentSubView === 'leaderboard' ? (
        <TopSquadsLeaderboard
          onSelectSquadChat={(squadId) => {
            setActiveSquadId(squadId);
            setCurrentSubView('chat');
          }}
          onOpenJoinSquad={(squad) => {
            handleSelectSquadToJoin(squad);
          }}
        />
      ) : (
        <>
          {/* Top Action Bar: Join Group Hub, Create Squad, Switch Groups */}
          <div className="flex items-center gap-1.5 mb-2 shrink-0">
            {/* Dedicated "Join Group" Hub Button */}
            <button
              onClick={() => {
                setIsDiscoveryOpen(true);
                setDirTab('all');
                setDirSearch('');
              }}
              className="flex-1 retro-btn bg-[#FFB443] text-black font-black text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-yellow-400"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('joinGroupBtn')}</span>
            </button>

            {/* Create Squad */}
            <button
              onClick={() => {
                setIsCreateOpen(true);
                setCreateError('');
              }}
              className="flex-1 retro-btn bg-[#2BD97F] text-black font-black text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#25c472]"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{t('createGroupBtn')}</span>
            </button>

            {/* "Show Other Groups" Switcher */}
            <button
              onClick={() => setIsSwitcherOpen(true)}
              className="retro-btn bg-[#38BDF8] text-black font-black text-xs py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 hover:bg-sky-400"
              title={t('showOtherGroupsBtn')}
            >
              <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">{userJoinedSquads.length}</span>
            </button>
          </div>

          {activeSquad ? (
            <div className="flex-1 flex flex-col min-h-0 bg-[#103D29] border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Active Squad Header */}
          <div className="bg-[#0c2f1f] border-b-3 border-black px-3 py-2 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl">{activeSquad.badge_icon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm text-white truncate">{activeSquad.name}</h3>
                  {activeSquad.is_private ? (
                    <span className="text-[10px] bg-[#3b1214] text-[#FF5A5F] border border-[#FF5A5F] px-1 py-0.2 rounded font-black">
                      <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                      PRIV
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#0c3a25] text-[#2BD97F] border border-[#2BD97F] px-1 py-0.2 rounded font-black">
                      <Globe className="w-2.5 h-2.5 inline mr-0.5" />
                      PUB
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-neutral-300 font-bold flex items-center gap-2">
                  <span>{activeSquad.member_count} {t('squadMembersCount')}</span>
                  <span>•</span>
                  <span className="text-[#FFD43F]">{activeSquad.total_score} {t('pts')}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions (QR code & Copy code) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="retro-btn bg-[#FFD43F] text-black p-1.5 rounded-lg hover:bg-yellow-400"
                title={t('viewQR')}
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={copyInviteCode}
                className="retro-btn bg-white text-black px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 hover:bg-neutral-100"
                title="Copy squad join code"
              >
                {copiedCode ? <Check className="w-3 h-3 text-[#2BD97F]" /> : <Copy className="w-3 h-3" />}
                <span>{activeSquad.join_code}</span>
              </button>
            </div>
          </div>

          {/* Leader Moderation Drawer Bar */}
          {isLeader && (
            <div className="bg-[#081f14] border-b-2 border-black px-3 py-1 flex items-center justify-between text-[11px] font-extrabold text-[#A7F3D0]">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#FFB443]" />
                {t('squadRoleLeader')} Mode
              </span>
              <div className="flex items-center gap-2 overflow-x-auto">
                {activeSquad.members
                  .filter((m) => m.user_id !== user?.id)
                  .map((mem) => (
                    <div key={mem.id} className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded border border-neutral-700">
                      <span className="truncate max-w-[60px] text-white">{mem.display_name}</span>
                      {mem.is_muted ? (
                        <button
                          onClick={() => unmuteMember(activeSquad.id, mem.user_id)}
                          className="text-[#2BD97F] hover:underline"
                          title="Unmute"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => muteMember(activeSquad.id, mem.user_id)}
                          className="text-[#FFB443] hover:underline"
                          title="Mute"
                        >
                          <VolumeX className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => kickMember(activeSquad.id, mem.user_id)}
                        className="text-[#FF5A5F] hover:underline ml-0.5"
                        title="Kick"
                      >
                        <UserX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Intra-Squad Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {currentMessages.length === 0 ? (
              <div className="text-center py-10 text-neutral-400 font-bold text-xs">
                🌱 No messages yet. Say hello to your squad!
              </div>
            ) : (
              currentMessages.map((msg) => {
                const isMe = msg.user_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <img
                      src={msg.user_avatar}
                      alt={msg.user_name}
                      className="w-7 h-7 rounded-lg border-2 border-black bg-black shrink-0 object-cover"
                    />
                    <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      <span className="text-[10px] font-black text-neutral-400 px-1 mb-0.5">
                        {msg.user_name}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                          isMe
                            ? 'bg-[#FFB443] text-black font-bold'
                            : 'bg-[#062316] text-white font-medium'
                        }`}
                      >
                        {msg.media_type === 'image' && msg.media_url && (
                          <div className="mb-1.5 rounded-lg overflow-hidden border border-black bg-black">
                            <img src={msg.media_url} alt="Attached" className="max-h-48 w-full object-cover" />
                          </div>
                        )}

                        {msg.media_type === 'voice_note' && msg.media_url && (
                          <VoiceNotePlayer audioUrl={msg.media_url} durationSec={msg.voice_duration_sec} />
                        )}

                        {msg.content && msg.media_type !== 'voice_note' && (
                          <p className="text-xs break-words leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Muted Warning */}
          {isUserMuted && (
            <div className="bg-[#3b1214] text-[#FF5A5F] text-xs font-black p-2 border-t-2 border-black text-center">
              {t('memberMutedNotice')}
            </div>
          )}

          {/* Chat Input Bar */}
          {!isUserMuted && (
            <div className="bg-[#0c2f1f] border-t-3 border-black p-2 shrink-0">
              {/* Photo preview thumbnail */}
              {chatImagePreview && (
                <div className="relative inline-block mb-1.5 border-2 border-black rounded-lg overflow-hidden bg-black">
                  <img src={chatImagePreview} alt="Preview" className="h-14 w-14 object-cover" />
                  <button
                    onClick={() => setChatImagePreview(null)}
                    className="absolute top-0 right-0 bg-black text-white p-0.5 rounded-bl"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {isRecording ? (
                /* Active Voice Recording UI */
                <div className="flex items-center justify-between bg-[#3b1214] border-2 border-black rounded-xl p-2 text-white">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#FF5A5F] animate-ping" />
                    <span className="text-xs font-black">
                      Recording: {recordingSeconds}s
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={cancelVoiceRecording}
                      className="retro-btn bg-neutral-800 text-xs font-bold px-2 py-1 rounded-lg"
                    >
                      {t('cancelRecording')}
                    </button>
                    <button
                      onClick={stopAndSendVoice}
                      className="retro-btn bg-[#2BD97F] text-black text-xs font-black px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Square className="w-3 h-3 fill-black" />
                      {t('stopRecording')}
                    </button>
                  </div>
                </div>
              ) : (
                /* Regular Chat Inputs */
                <div className="flex items-center gap-1.5">
                  {/* Photo upload button */}
                  <button
                    onClick={() => chatFileInputRef.current?.click()}
                    className="retro-btn bg-black text-white p-2 rounded-xl hover:bg-neutral-800 shrink-0"
                    title={t('sendPhoto')}
                  >
                    <ImageIcon className="w-4 h-4 text-[#FFD43F]" />
                  </button>
                  <input
                    ref={chatFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleChatImageSelect}
                  />

                  {/* Voice note trigger */}
                  <button
                    onClick={startVoiceRecording}
                    className="retro-btn bg-black text-white p-2 rounded-xl hover:bg-neutral-800 shrink-0"
                    title={t('sendVoiceNote')}
                  >
                    <Mic className="w-4 h-4 text-[#2BD97F]" />
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t('chatPlaceholder')}
                    className="flex-1 bg-[#062316] border-2 border-black rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden focus:border-[#FFB443]"
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatText.trim() && !chatImagePreview}
                    className="retro-btn bg-[#FFB443] disabled:opacity-40 text-black p-2 rounded-xl hover:bg-yellow-400 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#103D29] border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Users className="w-16 h-16 text-[#FFB443] mb-3 stroke-[2]" />
          <h3 className="font-black text-lg text-white mb-1">{t('noSquadsJoined')}</h3>
          <p className="text-xs text-neutral-300 font-bold mb-4">{t('noSquadsPrompt')}</p>
          <button
            onClick={() => setIsDiscoveryOpen(true)}
            className="retro-btn bg-[#FFB443] text-black font-black py-2.5 px-4 rounded-xl text-sm"
          >
            {t('joinGroupBtn')}
          </button>
        </div>
      )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 1. DEDICATED "JOIN GROUP" DISCOVERY DIRECTORY & SEARCH MODAL */}
      {/* ========================================================================= */}
      {isDiscoveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#103D29] border-4 border-black w-full max-w-md rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-[#FFB443] border-b-4 border-black px-4 py-3 flex items-center justify-between text-black">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 stroke-[2.5]" />
                <div>
                  <h3 className="font-black text-sm leading-tight">{t('directoryTitle')}</h3>
                  <span className="text-[11px] font-bold opacity-80">{t('directorySubtitle')}</span>
                </div>
              </div>
              <button
                onClick={() => setIsDiscoveryOpen(false)}
                className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center retro-btn hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="bg-[#0c2f1f] border-b-2 border-black p-2 flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setDirTab('all')}
                className={`retro-btn px-2.5 py-1 rounded-lg text-xs font-black ${
                  dirTab === 'all' ? 'bg-[#2BD97F] text-black' : 'bg-black text-white'
                }`}
              >
                {t('tabAllGroups')}
              </button>
              <button
                onClick={() => setDirTab('public')}
                className={`retro-btn px-2.5 py-1 rounded-lg text-xs font-black ${
                  dirTab === 'public' ? 'bg-[#2BD97F] text-black' : 'bg-black text-white'
                }`}
              >
                {t('tabPublicGroups')}
              </button>
              <button
                onClick={() => setDirTab('private')}
                className={`retro-btn px-2.5 py-1 rounded-lg text-xs font-black ${
                  dirTab === 'private' ? 'bg-[#2BD97F] text-black' : 'bg-black text-white'
                }`}
              >
                {t('tabPrivateGroups')}
              </button>
              <button
                onClick={() => setDirTab('code')}
                className={`retro-btn px-2.5 py-1 rounded-lg text-xs font-black ${
                  dirTab === 'code' ? 'bg-[#FFD43F] text-black' : 'bg-black text-white'
                }`}
              >
                {t('tabJoinByCode')}
              </button>
            </div>

            {/* Content Area */}
            <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
              {dirTab === 'code' ? (
                /* Join by 8-digit Code Tab */
                <div className="bg-[#062316] border-2 border-black rounded-xl p-4 space-y-3">
                  <label className="block text-xs font-black text-white">
                    {t('enterCodePrompt')}
                  </label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="ECO-GRN-90"
                    className="w-full bg-[#103D29] border-2 border-black rounded-xl p-2.5 text-center text-sm font-black text-[#FFD43F] tracking-widest uppercase focus:outline-hidden"
                  />
                  {codeError && (
                    <p className="text-xs font-bold text-[#FF5A5F]">{codeError}</p>
                  )}
                  <button
                    onClick={handleManualCodeJoin}
                    className="w-full retro-btn bg-[#2BD97F] text-black font-black py-2.5 rounded-xl text-xs hover:bg-[#25c472]"
                  >
                    {t('joinBtn')}
                  </button>
                </div>
              ) : (
                /* Public & Private Directory Listing */
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={dirSearch}
                      onChange={(e) => setDirSearch(e.target.value)}
                      placeholder={t('searchSquadPlaceholder')}
                      className="w-full bg-[#062316] border-2 border-black rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden focus:border-[#FFB443]"
                    />
                  </div>

                  {filteredDiscoverySquads.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 font-bold text-xs">
                      No squads matching search.
                    </div>
                  ) : (
                    filteredDiscoverySquads.map((sq) => {
                      const isAlreadyJoined = userSquadIds.includes(sq.id);
                      return (
                        <div
                          key={sq.id}
                          className="bg-[#062316] border-2 border-black rounded-xl p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl shrink-0">{sq.badge_icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-sm text-white truncate">{sq.name}</h4>
                                {sq.is_private ? (
                                  <span className="text-[9px] bg-[#3b1214] text-[#FF5A5F] border border-[#FF5A5F] px-1 rounded font-black">
                                    <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                                    PRIVATE
                                  </span>
                                ) : (
                                  <span className="text-[9px] bg-[#0c3a25] text-[#2BD97F] border border-[#2BD97F] px-1 rounded font-black">
                                    <Globe className="w-2.5 h-2.5 inline mr-0.5" />
                                    PUBLIC
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-300 font-medium truncate max-w-[200px]">
                                {sq.description}
                              </p>
                              <div className="text-[10px] text-[#A7F3D0] font-bold mt-0.5 flex gap-2">
                                <span>{sq.member_count} {t('squadMembersCount')}</span>
                                <span>•</span>
                                <span className="text-[#FFD43F]">{sq.total_score} {t('pts')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Join or Switch button */}
                          <div className="shrink-0">
                            {isAlreadyJoined ? (
                              <button
                                onClick={() => {
                                  setActiveSquadId(sq.id);
                                  setIsDiscoveryOpen(false);
                                }}
                                className="retro-btn bg-neutral-800 text-[#2BD97F] border-2 border-black px-2.5 py-1.5 rounded-xl text-xs font-black"
                              >
                                {t('alreadyJoinedBadge')}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSelectSquadToJoin(sq)}
                                className={`retro-btn px-3 py-1.5 rounded-xl text-xs font-black text-black ${
                                  sq.is_private ? 'bg-[#FFD43F] hover:bg-yellow-400' : 'bg-[#2BD97F] hover:bg-[#25c472]'
                                }`}
                              >
                                {sq.is_private ? t('unlockBtn') : t('joinBtn')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PRIVATE SQUAD PASSWORD PROMPT MODAL */}
      {/* ========================================================================= */}
      {isPasswordPromptOpen && pendingJoinSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#103D29] border-4 border-black w-full max-w-sm rounded-2xl p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-3 text-[#FFD43F]">
              <Key className="w-5 h-5" />
              <h3 className="font-black text-sm">{t('privateSquadModalTitle')}</h3>
            </div>
            <p className="text-xs text-neutral-300 font-bold mb-3">
              "{pendingJoinSquad.name}" {t('enterPasswordPrompt')}
            </p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full bg-[#062316] border-2 border-black rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 font-bold mb-2 focus:outline-hidden"
            />
            {passwordError && (
              <p className="text-xs font-bold text-[#FF5A5F] mb-2">{passwordError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsPasswordPromptOpen(false);
                  setPendingJoinSquad(null);
                }}
                className="retro-btn bg-neutral-800 text-white font-black py-2 px-3 rounded-xl text-xs"
              >
                {t('closeBtn')}
              </button>
              <button
                onClick={submitPasswordJoin}
                className="flex-1 retro-btn bg-[#2BD97F] text-black font-black py-2 px-3 rounded-xl text-xs hover:bg-[#25c472]"
              >
                {t('joinBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. "SHOW OTHER GROUPS" SWITCHER MODAL */}
      {/* ========================================================================= */}
      {isSwitcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#103D29] border-4 border-black w-full max-w-sm rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-[#38BDF8] border-b-3 border-black px-4 py-2.5 flex items-center justify-between text-black">
              <div className="flex items-center gap-1.5 font-black text-sm">
                <ArrowRightLeft className="w-4 h-4" />
                <span>{t('showOtherGroupsBtn')}</span>
              </div>
              <button
                onClick={() => setIsSwitcherOpen(false)}
                className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center retro-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
              {userJoinedSquads.map((sq) => {
                const isActive = sq.id === activeSquadId;
                return (
                  <button
                    key={sq.id}
                    onClick={() => {
                      setActiveSquadId(sq.id);
                      setIsSwitcherOpen(false);
                    }}
                    className={`w-full text-left retro-btn p-2.5 rounded-xl border-2 border-black flex items-center justify-between transition-colors ${
                      isActive ? 'bg-[#FFB443] text-black' : 'bg-[#062316] text-white hover:bg-[#0a2f1e]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl">{sq.badge_icon}</span>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs truncate">{sq.name}</h4>
                        <span className="text-[10px] opacity-80 font-bold">
                          {sq.member_count} {t('squadMembersCount')} • {sq.total_score} {t('pts')}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-black bg-black text-[#FFD43F] px-2 py-0.5 rounded-md">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CREATE NEW SQUAD MODAL (WITH AI MODERATION) */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#103D29] border-4 border-black w-full max-w-md rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-[#2BD97F] border-b-4 border-black px-4 py-3 flex items-center justify-between text-black">
              <div className="flex items-center gap-2 font-black text-sm">
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                <span>{t('createSquadTitle')}</span>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center retro-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSquadSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-black text-white mb-1">
                  {t('groupNameLabel')}
                </label>
                <input
                  type="text"
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder={t('groupNamePlaceholder')}
                  className="w-full bg-[#062316] border-2 border-black rounded-xl p-2 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-white mb-1">
                  {t('groupDescLabel')}
                </label>
                <textarea
                  rows={2}
                  value={newSquadDesc}
                  onChange={(e) => setNewSquadDesc(e.target.value)}
                  placeholder={t('groupDescPlaceholder')}
                  className="w-full bg-[#062316] border-2 border-black rounded-xl p-2 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden"
                />
              </div>

              {/* Privacy Toggle */}
              <div>
                <label className="block text-xs font-black text-white mb-1">
                  {t('groupPrivacyLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSquadIsPrivate(false)}
                    className={`retro-btn p-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 ${
                      !newSquadIsPrivate ? 'bg-[#2BD97F] text-black' : 'bg-black text-neutral-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSquadIsPrivate(true)}
                    className={`retro-btn p-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 ${
                      newSquadIsPrivate ? 'bg-[#FFD43F] text-black' : 'bg-black text-neutral-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private</span>
                  </button>
                </div>
              </div>

              {newSquadIsPrivate && (
                <div>
                  <label className="block text-xs font-black text-white mb-1">
                    {t('groupPasswordLabel')}
                  </label>
                  <input
                    type="text"
                    value={newSquadPassword}
                    onChange={(e) => setNewSquadPassword(e.target.value)}
                    placeholder={t('groupPasswordPlaceholder')}
                    className="w-full bg-[#062316] border-2 border-black rounded-xl p-2 text-xs text-white placeholder-neutral-500 font-bold focus:outline-hidden"
                  />
                </div>
              )}

              {createError && (
                <div className="p-2 bg-[#3b1214] border border-[#FF5A5F] rounded-xl text-xs font-black text-[#FF5A5F]">
                  {t('groupNameRejected')} {createError}
                </div>
              )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full retro-btn bg-[#2BD97F] disabled:opacity-50 text-black font-black py-2.5 rounded-xl text-xs hover:bg-[#25c472] flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>{t('aiModerating')}</span>
                  </>
                ) : (
                  <span>{t('createSquadSubmit')}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. QR CODE INVITE MODAL */}
      {/* ========================================================================= */}
      {isQrModalOpen && activeSquad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#103D29] border-4 border-black w-full max-w-xs rounded-2xl p-5 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-base text-[#FFD43F] mb-1">{t('qrTitle')}</h3>
            <p className="text-xs text-neutral-300 font-bold mb-4">{activeSquad.name}</p>

            <div className="bg-white p-4 rounded-xl border-3 border-black inline-block mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <QRCodeSVG
                value={`${window.location.origin}/join?code=${activeSquad.join_code}`}
                size={160}
                level="M"
              />
            </div>

            <div className="bg-black text-[#2BD97F] font-mono text-sm font-black py-1.5 px-3 rounded-lg border-2 border-black mb-4">
              {activeSquad.join_code}
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full retro-btn bg-[#FFB443] text-black font-black py-2 rounded-xl text-xs hover:bg-yellow-400"
            >
              {t('closeBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
