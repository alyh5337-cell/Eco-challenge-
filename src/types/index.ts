export type Language = 'en' | 'ar';

export interface UserProfile {
  id: string;
  email?: string;
  display_name: string;
  avatar_url: string;
  score: number;
  current_streak: number;
  last_action_date: string | null;
  last_login_date?: string | null;
  last_checkin_date?: string | null;
  last_checkin_timestamp?: number | null;
  total_checkins?: number;
  streak_theme?: 'flame' | 'leaf';
  is_banned: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
  is_guest: boolean;
  equipped_badge?: string;
}

export interface Squad {
  id: string;
  name: string;
  description: string;
  join_code: string;
  is_private: boolean;
  password?: string;
  leader_id: string;
  leader_name: string;
  total_score: number;
  badge_icon: string;
  member_count: number;
  members: SquadMember[];
  created_at: string;
}

export interface SquadMember {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  role: 'leader' | 'co-leader' | 'member';
  is_muted: boolean;
  joined_at: string;
}

export interface SquadMessage {
  id: string;
  squad_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  media_url?: string;
  media_type: 'text' | 'image' | 'voice_note';
  voice_duration_sec?: number;
  created_at: string;
}

export interface Quest {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  category: 'waste' | 'water' | 'energy' | 'nature' | 'community';
  points: number;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  verification_tips_en: string;
  verification_tips_ar: string;
  completed?: boolean;
}

export interface KarinChatMessage {
  id: string;
  user_id: string;
  sender: 'user' | 'karin';
  message_text: string;
  image_url?: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string;
  caption: string;
  media_url: string;
  media_type: 'image' | 'video';
  likes_count: number;
  is_liked?: boolean;
  is_flagged: boolean;
  created_at: string;
}

export interface StoreItem {
  id: string;
  name_en: string;
  name_ar: string;
  type: 'avatar' | 'badge';
  cost: number;
  image_url: string;
  description_en: string;
  description_ar: string;
}

export interface QATestResult {
  testId: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}
