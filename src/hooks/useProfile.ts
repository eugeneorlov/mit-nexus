import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Tag, ProfileWithTags } from '../lib/types';

interface UseProfileReturn {
  profile: ProfileWithTags | null;
  tags: Tag[];
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateTags: (helpTags: string[], learnTags: string[]) => Promise<void>;
}

export function useProfile(userId?: string): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileWithTags | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);

    const [profileResult, tagsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('tags').select('*').eq('user_id', uid),
    ]);

    if (profileResult.error) {
      setError(profileResult.error.message);
      setLoading(false);
      return;
    }

    if (tagsResult.error) {
      setError(tagsResult.error.message);
      setLoading(false);
      return;
    }

    const fetchedTags: Tag[] = tagsResult.data ?? [];
    const helpTags = fetchedTags
      .filter((t) => t.category === 'help')
      .map((t) => t.label);
    const learnTags = fetchedTags
      .filter((t) => t.category === 'learn')
      .map((t) => t.label);

    setTags(fetchedTags);
    setProfile({ ...profileResult.data, tags: fetchedTags, helpTags, learnTags });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setTags([]);
      setLoading(false);
      return;
    }
    fetchProfile(userId);
  }, [userId, fetchProfile]);

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!userId) return;
      const { error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId);
      if (updateError) throw new Error(updateError.message);
      await fetchProfile(userId);
    },
    [userId, fetchProfile],
  );

  const updateTags = useCallback(
    async (helpTags: string[], learnTags: string[]) => {
      if (!userId) return;

      const { error: deleteError } = await supabase
        .from('tags')
        .delete()
        .eq('user_id', userId);
      if (deleteError) throw new Error(deleteError.message);

      const newTags = [
        ...helpTags.map((label) => ({ user_id: userId, category: 'help' as const, label })),
        ...learnTags.map((label) => ({ user_id: userId, category: 'learn' as const, label })),
      ];

      if (newTags.length > 0) {
        const { error: insertError } = await supabase.from('tags').insert(newTags);
        if (insertError) throw new Error(insertError.message);
      }

      await fetchProfile(userId);
    },
    [userId, fetchProfile],
  );

  return { profile, tags, loading, error, updateProfile, updateTags };
}

export function useCurrentProfile(): UseProfileReturn {
  const [userId, setUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return useProfile(userId);
}
