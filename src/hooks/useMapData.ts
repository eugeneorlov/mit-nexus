import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ProfileWithTags, Tag, Trip } from '@/lib/types';

export interface TripWithProfile extends Trip {
  profile: ProfileWithTags;
}

interface UseMapDataReturn {
  homeProfiles: ProfileWithTags[];
  activeTrips: TripWithProfile[];
  loading: boolean;
  refetch: () => void;
}

export function useMapData(): UseMapDataReturn {
  const [homeProfiles, setHomeProfiles] = useState<ProfileWithTags[]>([]);
  const [activeTrips, setActiveTrips] = useState<TripWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch onboarded profiles that have coordinates
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('onboarded', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!profiles || profiles.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch tags for all those profiles
      const profileIds = profiles.map((p) => p.id);
      const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .in('user_id', profileIds);

      const tagsByProfile: Record<string, Tag[]> = {};
      for (const tag of tags ?? []) {
        if (!tagsByProfile[tag.user_id]) tagsByProfile[tag.user_id] = [];
        tagsByProfile[tag.user_id].push(tag);
      }

      const profilesWithTags: ProfileWithTags[] = profiles.map((p) => {
        const pts = tagsByProfile[p.id] ?? [];
        return {
          ...p,
          tags: pts,
          helpTags: pts.filter((t) => t.category === 'help').map((t) => t.label),
          learnTags: pts.filter((t) => t.category === 'learn').map((t) => t.label),
        };
      });

      setHomeProfiles(profilesWithTags);

      // Fetch active trips (date_to >= today) with coordinates
      const today = new Date().toISOString().split('T')[0];
      const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .gte('date_to', today)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (trips && trips.length > 0) {
        const profileMap = Object.fromEntries(profilesWithTags.map((p) => [p.id, p]));
        const tripsWithProfile: TripWithProfile[] = trips
          .filter((t) => profileMap[t.user_id])
          .map((t) => ({ ...t, profile: profileMap[t.user_id] }));
        setActiveTrips(tripsWithProfile);
      } else {
        setActiveTrips([]);
      }

      setLoading(false);
    }

    fetchData();
  }, [tick]);

  return { homeProfiles, activeTrips, loading, refetch };
}
