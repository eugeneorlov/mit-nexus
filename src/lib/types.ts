// ─── Core DB Types ────────────────────────────────────────────────────────────

export type TagType = 'help' | 'learn';

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  created_at: string;
}

export interface Profile {
  id: string;                   // UUID, references auth.users
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  user_a: string;               // UUID ref to profiles
  user_b: string;               // UUID ref to profiles
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  match_id: string;             // UUID ref to matches
  sender_id: string;            // UUID ref to profiles
  content: string;
  created_at: string;
}

export interface Trip {
  id: string;
  user_id: string;              // UUID ref to profiles
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  start_date: string;           // ISO date string
  end_date: string;             // ISO date string
  created_at: string;
}

export interface Invite {
  id: string;
  inviter_id: string;           // UUID ref to profiles
  email: string;
  token: string;
  used: boolean;
  created_at: string;
}

// ─── Joined / Derived Types ───────────────────────────────────────────────────

export interface ProfileWithTags extends Profile {
  tags: Tag[];
}

export interface MatchWithProfiles extends Match {
  profile_a: Profile;
  profile_b: Profile;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}
