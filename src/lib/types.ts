// ─── Core DB Types ────────────────────────────────────────────────────────────

export type TagCategory = 'help' | 'learn';

export interface Tag {
  id: string;
  user_id: string;
  category: TagCategory;
  label: string;
}

export interface Profile {
  id: string;                   // UUID, references auth.users
  name: string | null;
  email: string;
  company: string | null;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  program: string | null;
  cohort_year: number | null;
  onboarded: boolean;
  roulette_opt_in: boolean;
  created_at: string;
  last_active: string;
}

export interface MatchQueueEntry {
  id: string;
  user_id: string;
  entered_at: string;
  matched: boolean;
}

export interface Match {
  id: string;
  user_a_id: string;            // UUID ref to profiles
  user_b_id: string;            // UUID ref to profiles
  week_number?: number | null;  // legacy, nullable for on-demand matches
  year?: number | null;         // legacy, nullable for on-demand matches
  status: 'pending' | 'active' | 'completed' | 'skipped';
  shared_tags: string[] | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;            // UUID ref to profiles
  receiver_id: string;          // UUID ref to profiles
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface Conversation {
  partnerId: string;
  partnerProfile: Profile;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface Trip {
  id: string;
  user_id: string;              // UUID ref to profiles
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  date_from: string;            // ISO date string
  date_to: string;              // ISO date string
  note: string | null;
  created_at: string;
}

export interface Invite {
  id: string;
  inviter_id: string | null;    // UUID ref to profiles
  token: string;
  used_by: string | null;       // UUID ref to profiles, null if unused
  created_at: string;
}

// ─── Joined / Derived Types ───────────────────────────────────────────────────

export interface ProfileWithTags extends Profile {
  tags: Tag[];
  helpTags: string[];   // derived: tags where category === 'help'
  learnTags: string[];  // derived: tags where category === 'learn'
}

export interface MatchWithProfile extends Match {
  partner: Profile;
}

export interface MatchWithProfiles extends Match {
  profile_a: Profile;
  profile_b: Profile;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}
