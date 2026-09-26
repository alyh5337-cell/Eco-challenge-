import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  Squad,
  SquadMember,
  SquadMessage,
  KarinChatMessage,
  CommunityPost,
  StoreItem,
} from '../types';
import { INITIAL_SQUADS } from '../data/mockSquads';
import { INITIAL_COMMUNITY_POSTS } from '../data/mockFeed';
import { evaluateStreakAndScore, checkCurrentStreakLiveness } from '../lib/streakEngine';
import {
  processDailyLoginStreak,
  performDailyCheckIn,
  isDailyCheckInAvailable,
  getTodayCalendarString,
  getStreakTier,
} from '../lib/dailyStreak';
import { supabase } from '../lib/supabaseClient';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isBanned: boolean;
  banReason: string | null;
  authError: string | null;
  clearAuthError: () => void;
  banCurrentUser: (reason: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  recordChallengeCompletion: (points: number) => { newStreak: number; newScore: number; streakIncremented: boolean };

  // Daily Streak Tracking & Theme
  streakTheme: 'flame' | 'leaf';
  setStreakTheme: (theme: 'flame' | 'leaf') => void;
  dailyStreakNotification: string | null;
  dismissStreakNotification: () => void;
  isCheckInModalOpen: boolean;
  setIsCheckInModalOpen: (open: boolean) => void;
  isCheckInAvailable: boolean;
  claimDailyStreakBonus: () => { success: boolean; message: string; points: number };
  simulateNextDayLogin: () => void;

  // Squads & Multi-group system
  squads: Squad[];
  userSquadIds: string[];
  activeSquadId: string | null;
  setActiveSquadId: (id: string) => void;
  joinSquad: (squadId: string, passwordAttempt?: string) => { success: boolean; message?: string };
  joinSquadByCode: (code: string) => { success: boolean; message?: string };
  createSquad: (data: { name: string; description: string; is_private: boolean; password?: string }) => Promise<{ success: boolean; squad?: Squad; reason?: string }>;
  muteMember: (squadId: string, memberUserId: string) => void;
  unmuteMember: (squadId: string, memberUserId: string) => void;
  kickMember: (squadId: string, memberUserId: string) => void;
  sendSquadMessage: (squadId: string, content: string, mediaUrl?: string, mediaType?: 'text' | 'image' | 'voice_note', voiceDuration?: number) => void;
  squadMessages: Record<string, SquadMessage[]>;

  // Karin AI Chat
  karinChatHistory: KarinChatMessage[];
  addKarinChatMessage: (sender: 'user' | 'karin', text: string, imageUrl?: string) => void;
  clearKarinChat: () => void;

  // Media Feed
  communityPosts: CommunityPost[];
  addCommunityPost: (caption: string, mediaUrl: string, mediaType?: 'image' | 'video') => void;
  toggleLikePost: (postId: string) => void;

  // Store & Inventory
  userInventory: string[];
  buyStoreItem: (item: StoreItem) => { success: boolean; message?: string };
  equipStoreItem: (item: StoreItem) => void;

  // Utilities
  resetAllData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USER = 'eco_v200_user';
const LOCAL_STORAGE_KEY_SQUADS = 'eco_v200_squads';
const LOCAL_STORAGE_KEY_USER_SQUADS = 'eco_v200_user_squad_ids';
const LOCAL_STORAGE_KEY_MESSAGES = 'eco_v200_squad_messages';
const LOCAL_STORAGE_KEY_KARIN = 'eco_v200_karin_chat';
const LOCAL_STORAGE_KEY_POSTS = 'eco_v200_posts';
const LOCAL_STORAGE_KEY_INVENTORY = 'eco_v200_inventory';
const LOCAL_STORAGE_KEY_BAN = 'eco_v200_device_ban';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Device & Account Ban State
  const [isBanned, setIsBanned] = useState<boolean>(() => {
    const banRecord = localStorage.getItem(LOCAL_STORAGE_KEY_BAN);
    if (banRecord) {
      try {
        return JSON.parse(banRecord).isBanned === true;
      } catch {
        // continue
      }
    }
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER) || localStorage.getItem('eco_v199_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser).is_banned === true;
      } catch {
        // continue
      }
    }
    return false;
  });

  const [banReason, setBanReason] = useState<string | null>(() => {
    const banRecord = localStorage.getItem(LOCAL_STORAGE_KEY_BAN);
    if (banRecord) {
      try {
        return JSON.parse(banRecord).reason || null;
      } catch {
        // continue
      }
    }
    const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_USER) || localStorage.getItem('eco_v199_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser).ban_reason || null;
      } catch {
        // continue
      }
    }
    return null;
  });

  const [authError, setAuthError] = useState<string | null>(null);

  // Daily Streak Theme & Notifications
  const [streakTheme, setStreakThemeState] = useState<'flame' | 'leaf'>(() => {
    return (localStorage.getItem('eco_streak_theme') as 'flame' | 'leaf') || 'flame';
  });

  const setStreakTheme = (theme: 'flame' | 'leaf') => {
    setStreakThemeState(theme);
    localStorage.setItem('eco_streak_theme', theme);
    if (user) {
      setUser({ ...user, streak_theme: theme });
    }
  };

  const [dailyStreakNotification, setDailyStreakNotification] = useState<string | null>(null);
  const dismissStreakNotification = () => setDailyStreakNotification(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);

  // 1. User State (strictly starts score at 0, streak at 0)
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USER) || localStorage.getItem('eco_v199_user') || localStorage.getItem('eco_v198_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check streak expiration over 48h
        parsed.current_streak = checkCurrentStreakLiveness(parsed.current_streak, parsed.last_action_date);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Automatically evaluate consecutive daily login when app is opened
  useEffect(() => {
    if (user) {
      const today = getTodayCalendarString();
      if (user.last_login_date !== today) {
        const res = processDailyLoginStreak(user);
        if (res.streakIncreased) {
          setUser(res.updatedUser);
          if (res.notificationMessage) {
            setDailyStreakNotification(res.notificationMessage);
          }
        }
      }
    }
  }, []);

  // Firebase Auth State Listener & Firestore Initializer
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data();
            const profile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || data?.email || '',
              display_name: data?.displayName || fbUser.displayName || 'Eco Warrior',
              avatar_url: data?.avatarUrl || fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
              score: typeof data?.score === 'number' ? data.score : 0,
              current_streak: typeof data?.currentStreak === 'number' ? data.currentStreak : 0,
              last_action_date: data?.lastActionDate || null,
              last_login_date: data?.lastLoginDate || getTodayCalendarString(),
              last_checkin_date: data?.lastCheckinDate || data?.lastLoginDate || null,
              last_checkin_timestamp: typeof data?.lastCheckinTimestamp === 'number' ? data.lastCheckinTimestamp : null,
              total_checkins: typeof data?.totalCheckins === 'number' ? data.totalCheckins : 0,
              streak_theme: data?.streakTheme || streakTheme || 'flame',
              equipped_badge: data?.equippedBadge || undefined,
              is_banned: data?.isBanned || false,
              ban_reason: data?.banReason || undefined,
              is_guest: false,
            };
            profile.current_streak = checkCurrentStreakLiveness(profile.current_streak, profile.last_action_date);
            const processed = processDailyLoginStreak(profile);
            setUser(processed.updatedUser);
            if (processed.notificationMessage) {
              setDailyStreakNotification(processed.notificationMessage);
            }
          } else {
            const initialProfile: UserProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              display_name: fbUser.displayName || 'Eco Warrior',
              avatar_url: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
              score: 0,
              current_streak: 0,
              last_action_date: null,
              last_login_date: getTodayCalendarString(),
              streak_theme: streakTheme,
              is_banned: false,
              is_guest: false,
            };
            await setDoc(userDocRef, {
              id: initialProfile.id,
              displayName: initialProfile.display_name,
              email: initialProfile.email,
              avatarUrl: initialProfile.avatar_url,
              score: 0,
              currentStreak: 0,
              lastActionDate: '',
              lastLoginDate: initialProfile.last_login_date,
              lastCheckinDate: null,
              lastCheckinTimestamp: null,
              totalCheckins: 0,
              streakTheme: initialProfile.streak_theme,
              isBanned: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setUser(initialProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore snapshot for authenticated Firebase user
  useEffect(() => {
    if (!user || user.is_guest || !auth.currentUser) return;
    const userDocRef = doc(db, 'users', user.id);
    const unsubscribeSnapshot = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              display_name: data.displayName || prev.display_name,
              avatar_url: data.avatarUrl || prev.avatar_url,
              score: typeof data.score === 'number' ? data.score : prev.score,
              current_streak: typeof data.currentStreak === 'number' ? data.currentStreak : prev.current_streak,
              last_action_date: data.lastActionDate || prev.last_action_date,
              last_login_date: data.lastLoginDate || prev.last_login_date,
              last_checkin_date: data.lastCheckinDate || prev.last_checkin_date,
              last_checkin_timestamp: typeof data.lastCheckinTimestamp === 'number' ? data.lastCheckinTimestamp : prev.last_checkin_timestamp,
              total_checkins: typeof data.totalCheckins === 'number' ? data.totalCheckins : prev.total_checkins,
              equipped_badge: data.equippedBadge || prev.equipped_badge,
              is_banned: data.isBanned ?? prev.is_banned,
              ban_reason: data.banReason || prev.ban_reason,
            };
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.id}`);
      }
    );

    return () => unsubscribeSnapshot();
  }, [user?.id, user?.is_guest]);

  // 2. Squads state
  const [squads, setSquads] = useState<Squad[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_SQUADS) || localStorage.getItem('eco_v198_squads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SQUADS;
      }
    }
    return INITIAL_SQUADS;
  });

  // 3. User Squad Memberships (Multi-group support)
  const [userSquadIds, setUserSquadIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USER_SQUADS) || localStorage.getItem('eco_v198_user_squad_ids');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['squad-green-guardians'];
      }
    }
    return ['squad-green-guardians'];
  });

  const [activeSquadId, setActiveSquadId] = useState<string | null>(() => {
    return userSquadIds[0] || (squads[0] ? squads[0].id : null);
  });

  // 4. Squad Messages
  const [squadMessages, setSquadMessages] = useState<Record<string, SquadMessage[]>>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MESSAGES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {
      'squad-green-guardians': [
        {
          id: 'msg-1',
          squad_id: 'squad-green-guardians',
          user_id: 'leader-1',
          user_name: 'Captain Fern',
          user_avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CaptainFern',
          content: 'Welcome warriors! Remember to submit your sorted plastics to Karin AI today! 🌿',
          media_type: 'text',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
      ],
    };
  });

  // 5. Karin Chat History
  const [karinChatHistory, setKarinChatHistory] = useState<KarinChatMessage[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_KARIN);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'karin-msg-init',
        user_id: 'system',
        sender: 'karin',
        message_text: 'Greetings, Eco Warrior! I am Karin, your official 90s eco-cartoon guide! Ready to level up your green habits? Ask me any question or upload a photo of your eco action! 🌱⚡',
        created_at: new Date().toISOString(),
      },
    ];
  });

  // 6. Community Posts
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_POSTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_COMMUNITY_POSTS;
      }
    }
    return INITIAL_COMMUNITY_POSTS;
  });

  // 7. Inventory
  const [userInventory, setUserInventory] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_INVENTORY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sync to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_SQUADS, JSON.stringify(squads));
  }, [squads]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_SQUADS, JSON.stringify(userSquadIds));
  }, [userSquadIds]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MESSAGES, JSON.stringify(squadMessages));
  }, [squadMessages]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_KARIN, JSON.stringify(karinChatHistory));
  }, [karinChatHistory]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(communityPosts));
  }, [communityPosts]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_INVENTORY, JSON.stringify(userInventory));
  }, [userInventory]);

  // Auth actions
  const banCurrentUser = async (reason: string) => {
    const banTimestamp = new Date().toISOString();
    setIsBanned(true);
    setBanReason(reason);
    setAuthError(reason);

    localStorage.setItem(
      LOCAL_STORAGE_KEY_BAN,
      JSON.stringify({ isBanned: true, reason, banned_at: banTimestamp })
    );

    if (user) {
      const bannedUser: UserProfile = {
        ...user,
        is_banned: true,
        ban_reason: reason,
        banned_at: banTimestamp,
      };
      setUser(bannedUser);
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(bannedUser));

      if (!user.is_guest && auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', user.id), {
            isBanned: true,
            banReason: reason,
            updatedAt: banTimestamp,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
        }
      }

      if (supabase && !user.is_guest) {
        try {
          await supabase
            .from('profiles')
            .update({
              is_banned: true,
              ban_reason: reason,
              banned_at: banTimestamp,
            })
            .eq('id', user.id);
        } catch (err) {
          console.warn('Supabase ban update warning:', err);
        }
      }
    }
  };

  const loginWithGoogle = async () => {
    if (isBanned) {
      setAuthError(
        banReason ||
          'Your account has been permanently banned due to safety policy violations.'
      );
      return;
    }
    setAuthError(null);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      console.error('Firebase Google Sign-In Error:', errorObj);
      if (
        errorObj.code !== 'auth/popup-closed-by-user' &&
        errorObj.code !== 'auth/cancelled-popup-request'
      ) {
        setAuthError(errorObj.message || 'Failed to sign in with Google');
      }
    }
  };

  const loginAsGuest = () => {
    if (isBanned) {
      setAuthError(
        banReason ||
          'Your account has been permanently banned due to safety policy violations.'
      );
      return;
    }
    setAuthError(null);

    const guestUser: UserProfile = {
      id: 'usr_guest_' + Math.random().toString(36).substring(2, 9),
      display_name: 'Guest Warrior',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=GuestHero12',
      score: 0, // Strictly starts at 0
      current_streak: 0,
      last_action_date: null,
      is_banned: false,
      is_guest: true,
      streak_theme: streakTheme,
    };
    const processed = processDailyLoginStreak(guestUser);
    setUser(processed.updatedUser);
    if (processed.notificationMessage) {
      setDailyStreakNotification(processed.notificationMessage);
    }
  };

  const claimDailyStreakBonus = (): { success: boolean; message: string; points: number } => {
    if (!user) return { success: false, message: 'Please log in first.', points: 0 };
    if (!isDailyCheckInAvailable(user)) {
      return { success: false, message: 'Already checked in for today! Next reward unlocks in 24 hours.', points: 0 };
    }
    const res = performDailyCheckIn(user);
    setUser(res.updatedUser);
    if (res.notificationMessage) {
      setDailyStreakNotification(res.notificationMessage);
    }

    if (!user.is_guest && auth.currentUser) {
      updateDoc(doc(db, 'users', user.id), {
        score: res.updatedUser.score,
        currentStreak: res.updatedUser.current_streak,
        lastLoginDate: res.updatedUser.last_login_date,
        lastCheckinDate: res.updatedUser.last_checkin_date,
        lastCheckinTimestamp: res.updatedUser.last_checkin_timestamp,
        totalCheckins: res.updatedUser.total_checkins,
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      });
    }

    return {
      success: true,
      message: res.notificationMessage || 'Daily Streak Active!',
      points: res.bonusPoints,
    };
  };

  const simulateNextDayLogin = () => {
    if (!user) return;
    // Set last_checkin_date to yesterday and last_checkin_timestamp to 25h ago so today evaluates as consecutive
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const mockTimestamp = Date.now() - 25 * 60 * 60 * 1000;

    const userMock: UserProfile = {
      ...user,
      last_login_date: yStr,
      last_checkin_date: yStr,
      last_checkin_timestamp: mockTimestamp,
    };
    setUser(userMock);
    setDailyStreakNotification('Simulated +24 hours! Daily check-in is now ready to claim.');
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    if (!user.is_guest && auth.currentUser) {
      const userDocRef = doc(db, 'users', user.id);
      updateDoc(userDocRef, {
        ...(updates.display_name ? { displayName: updates.display_name } : {}),
        ...(updates.avatar_url ? { avatarUrl: updates.avatar_url } : {}),
        ...(updates.equipped_badge ? { equippedBadge: updates.equipped_badge } : {}),
        ...(updates.streak_theme ? { streakTheme: updates.streak_theme } : {}),
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      });
    }
  };

  // Streak & Scoring Engine Trigger
  const recordChallengeCompletion = (points: number) => {
    if (!user) return { newStreak: 0, newScore: 0, streakIncremented: false };

    const result = evaluateStreakAndScore(
      user.score,
      user.current_streak,
      user.last_action_date,
      points,
      new Date()
    );

    const updatedUser: UserProfile = {
      ...user,
      score: result.newScore,
      current_streak: result.newStreak,
      last_action_date: result.newLastActionDate,
    };

    setUser(updatedUser);

    // Sync score & streak to Firestore
    if (!user.is_guest && auth.currentUser) {
      const userDocRef = doc(db, 'users', user.id);
      updateDoc(userDocRef, {
        score: result.newScore,
        currentStreak: result.newStreak,
        lastActionDate: result.newLastActionDate || '',
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      });
    }

    // Also update current active squad's total score
    if (activeSquadId) {
      setSquads((prev) =>
        prev.map((s) => (s.id === activeSquadId ? { ...s, total_score: s.total_score + points } : s))
      );
    }

    return {
      newStreak: result.newStreak,
      newScore: result.newScore,
      streakIncremented: result.streakIncremented,
    };
  };

  // Squad Actions
  const joinSquad = (squadId: string, passwordAttempt?: string): { success: boolean; message?: string } => {
    if (!user) return { success: false, message: 'Please sign in first.' };

    const targetSquad = squads.find((s) => s.id === squadId);
    if (!targetSquad) return { success: false, message: 'Squad not found.' };

    if (userSquadIds.includes(squadId)) {
      setActiveSquadId(squadId);
      return { success: true, message: 'Switched to squad!' };
    }

    // Check private password
    if (targetSquad.is_private) {
      if (!passwordAttempt || passwordAttempt.trim() !== (targetSquad.password || '')) {
        return { success: false, message: 'Incorrect password for this private squad.' };
      }
    }

    // Add user as member
    const newMember: SquadMember = {
      id: 'mem_' + Date.now(),
      user_id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: 'member',
      is_muted: false,
      joined_at: new Date().toISOString(),
    };

    setSquads((prev) =>
      prev.map((s) =>
        s.id === squadId
          ? {
              ...s,
              member_count: s.member_count + 1,
              members: [...s.members, newMember],
            }
          : s
      )
    );

    setUserSquadIds((prev) => [...prev, squadId]);
    setActiveSquadId(squadId);

    // System welcome message
    sendSquadMessage(
      squadId,
      `🎉 ${user.display_name} just joined the squad! Welcome to the green team!`,
      undefined,
      'text'
    );

    return { success: true };
  };

  const joinSquadByCode = (code: string): { success: boolean; message?: string } => {
    const formatted = code.trim().toUpperCase();
    const targetSquad = squads.find((s) => s.join_code.toUpperCase() === formatted);
    if (!targetSquad) {
      return { success: false, message: 'No squad found with this invite code.' };
    }
    return joinSquad(targetSquad.id, targetSquad.password);
  };

  const createSquad = async (data: {
    name: string;
    description: string;
    is_private: boolean;
    password?: string;
  }): Promise<{ success: boolean; squad?: Squad; reason?: string }> => {
    if (!user) return { success: false, reason: 'Not signed in.' };

    // AI Group Name Moderation check
    try {
      const response = await fetch('/api/gemini/moderate-group-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name }),
      });
      const modResult = await response.json();
      if (!modResult.allowed) {
        return { success: false, reason: modResult.reason || 'Group name rejected by AI moderator.' };
      }
    } catch (e) {
      console.warn('AI moderation offline fallback:', e);
    }

    const squadCode = 'ECO-' + Math.random().toString(36).substring(2, 5).toUpperCase() + '-' + Math.floor(10 + Math.random() * 89);
    const newSquadId = 'squad_' + Date.now();

    const leaderMember: SquadMember = {
      id: 'mem_lead_' + Date.now(),
      user_id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: 'leader',
      is_muted: false,
      joined_at: new Date().toISOString(),
    };

    const newSquad: Squad = {
      id: newSquadId,
      name: data.name.trim(),
      description: data.description.trim() || 'A proactive 90s eco squad!',
      join_code: squadCode,
      is_private: data.is_private,
      password: data.password?.trim() || undefined,
      leader_id: user.id,
      leader_name: user.display_name,
      total_score: 0,
      badge_icon: '🌿',
      member_count: 1,
      members: [leaderMember],
      created_at: new Date().toISOString(),
    };

    setSquads((prev) => [newSquad, ...prev]);
    setUserSquadIds((prev) => [...prev, newSquadId]);
    setActiveSquadId(newSquadId);

    // Initial leader message
    setSquadMessages((prev) => ({
      ...prev,
      [newSquadId]: [
        {
          id: 'msg_init_' + Date.now(),
          squad_id: newSquadId,
          user_id: user.id,
          user_name: user.display_name,
          user_avatar: user.avatar_url,
          content: `🚀 Squad "${newSquad.name}" has been established! Share code ${newSquad.join_code} with friends!`,
          media_type: 'text',
          created_at: new Date().toISOString(),
        },
      ],
    }));

    return { success: true, squad: newSquad };
  };

  const muteMember = (squadId: string, memberUserId: string) => {
    setSquads((prev) =>
      prev.map((s) => {
        if (s.id !== squadId) return s;
        return {
          ...s,
          members: s.members.map((m) => (m.user_id === memberUserId ? { ...m, is_muted: true } : m)),
        };
      })
    );
  };

  const unmuteMember = (squadId: string, memberUserId: string) => {
    setSquads((prev) =>
      prev.map((s) => {
        if (s.id !== squadId) return s;
        return {
          ...s,
          members: s.members.map((m) => (m.user_id === memberUserId ? { ...m, is_muted: false } : m)),
        };
      })
    );
  };

  const kickMember = (squadId: string, memberUserId: string) => {
    setSquads((prev) =>
      prev.map((s) => {
        if (s.id !== squadId) return s;
        return {
          ...s,
          member_count: Math.max(1, s.member_count - 1),
          members: s.members.filter((m) => m.user_id !== memberUserId),
        };
      })
    );

    // If kicking self
    if (user?.id === memberUserId) {
      setUserSquadIds((prev) => prev.filter((id) => id !== squadId));
      if (activeSquadId === squadId) {
        const remaining = userSquadIds.filter((id) => id !== squadId);
        setActiveSquadId(remaining[0] || null);
      }
    }
  };

  const sendSquadMessage = (
    squadId: string,
    content: string,
    mediaUrl?: string,
    mediaType: 'text' | 'image' | 'voice_note' = 'text',
    voiceDuration?: number
  ) => {
    if (!user) return;

    // Check if muted
    const targetSquad = squads.find((s) => s.id === squadId);
    const memberRecord = targetSquad?.members.find((m) => m.user_id === user.id);
    if (memberRecord?.is_muted) {
      return;
    }

    const newMessage: SquadMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      squad_id: squadId,
      user_id: user.id,
      user_name: user.display_name,
      user_avatar: user.avatar_url,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      voice_duration_sec: voiceDuration,
      created_at: new Date().toISOString(),
    };

    setSquadMessages((prev) => ({
      ...prev,
      [squadId]: [...(prev[squadId] || []), newMessage],
    }));
  };

  // Karin Chat
  const addKarinChatMessage = (sender: 'user' | 'karin', text: string, imageUrl?: string) => {
    const newMsg: KarinChatMessage = {
      id: 'kmsg_' + Date.now(),
      user_id: user?.id || 'guest',
      sender,
      message_text: text,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    };
    setKarinChatHistory((prev) => [...prev, newMsg]);
  };

  const clearKarinChat = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_KARIN);
    const initialWelcome: KarinChatMessage = {
      id: 'karin-msg-init-' + Date.now(),
      user_id: 'system',
      sender: 'karin',
      message_text: 'Greetings, Eco Warrior! I am Karin, your official 90s eco-cartoon guide! Ready to level up your green habits? Ask me any question or upload a photo of your eco action! 🌱⚡',
      created_at: new Date().toISOString(),
    };
    setKarinChatHistory([initialWelcome]);
  };

  // Community Feed
  const addCommunityPost = (caption: string, mediaUrl: string, mediaType: 'image' | 'video' = 'image') => {
    if (!user) return;
    const newPost: CommunityPost = {
      id: 'post_' + Date.now(),
      user_id: user.id,
      author_name: user.display_name,
      author_avatar: user.avatar_url,
      caption,
      media_url: mediaUrl,
      media_type: mediaType,
      likes_count: 0,
      is_liked: false,
      is_flagged: false,
      created_at: new Date().toISOString(),
    };
    setCommunityPosts((prev) => [newPost, ...prev]);
  };

  const toggleLikePost = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nowLiked = !p.is_liked;
        return {
          ...p,
          is_liked: nowLiked,
          likes_count: nowLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
        };
      })
    );
  };

  // Store & Inventory
  const buyStoreItem = (item: StoreItem): { success: boolean; message?: string } => {
    if (!user) return { success: false, message: 'Please sign in first.' };
    if (user.score < item.cost) {
      return { success: false, message: 'Not enough Eco Points!' };
    }
    if (userInventory.includes(item.id)) {
      return { success: true, message: 'Already purchased!' };
    }

    const newScore = user.score - item.cost;
    const newInventory = [...userInventory, item.id];
    setUserInventory(newInventory);

    let updatedUser = { ...user, score: newScore };
    if (item.type === 'avatar') {
      updatedUser.avatar_url = item.image_url;
    } else if (item.type === 'badge') {
      updatedUser.equipped_badge = item.image_url;
    }
    setUser(updatedUser);

    if (!user.is_guest && auth.currentUser) {
      const userRef = doc(db, 'users', user.id);
      updateDoc(userRef, {
        score: newScore,
        avatarUrl: updatedUser.avatar_url,
        ...(updatedUser.equipped_badge ? { equippedBadge: updatedUser.equipped_badge } : {}),
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      });
    }

    return { success: true, message: 'Purchase successful!' };
  };

  const equipStoreItem = (item: StoreItem) => {
    if (!user) return;
    let newAvatar = user.avatar_url;
    let newBadge = user.equipped_badge;

    if (item.type === 'avatar') {
      newAvatar = item.image_url;
      setUser({ ...user, avatar_url: newAvatar });
    } else if (item.type === 'badge') {
      newBadge = item.image_url;
      setUser({ ...user, equipped_badge: newBadge });
    }

    if (!user.is_guest && auth.currentUser) {
      const userRef = doc(db, 'users', user.id);
      updateDoc(userRef, {
        avatarUrl: newAvatar,
        ...(newBadge ? { equippedBadge: newBadge } : {}),
        updatedAt: new Date().toISOString(),
      }).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.id}`);
      });
    }
  };

  const resetAllData = () => {
    localStorage.clear();
    setIsBanned(false);
    setBanReason(null);
    setAuthError(null);
    setUser({
      id: 'usr_guest_default',
      display_name: 'Eco Warrior',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=EcoHero1',
      score: 0,
      current_streak: 0,
      last_action_date: null,
      is_banned: false,
      is_guest: true,
    });
    setSquads(INITIAL_SQUADS);
    setUserSquadIds(['squad-green-guardians']);
    setActiveSquadId('squad-green-guardians');
    setSquadMessages({});
    setKarinChatHistory([]);
    setCommunityPosts(INITIAL_COMMUNITY_POSTS);
    setUserInventory([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isGuest: Boolean(user?.is_guest),
        isBanned,
        banReason,
        authError,
        clearAuthError,
        banCurrentUser,
        loginWithGoogle,
        loginAsGuest,
        logout,
        updateProfile,
        recordChallengeCompletion,
        streakTheme,
        setStreakTheme,
        dailyStreakNotification,
        dismissStreakNotification,
        isCheckInModalOpen,
        setIsCheckInModalOpen,
        isCheckInAvailable: isDailyCheckInAvailable(user),
        claimDailyStreakBonus,
        simulateNextDayLogin,
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
        karinChatHistory,
        addKarinChatMessage,
        clearKarinChat,
        communityPosts,
        addCommunityPost,
        toggleLikePost,
        userInventory,
        buyStoreItem,
        equipStoreItem,
        resetAllData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
