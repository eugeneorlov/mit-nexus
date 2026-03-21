import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ProfileWithTags, Tag } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { ProfileCard } from '@/components/directory/ProfileCard';
import { TagFilter, type TagFilterMode } from '@/components/directory/TagFilter';
// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProfileWithTags(raw: { tags: Tag[] } & Record<string, unknown>): ProfileWithTags {
  const tags: Tag[] = raw.tags ?? [];
  return {
    ...(raw as unknown as ProfileWithTags),
    tags,
    helpTags: tags.filter((t) => t.category === 'help').map((t) => t.label),
    learnTags: tags.filter((t) => t.category === 'learn').map((t) => t.label),
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Directory() {
  const [profiles, setProfiles] = useState<ProfileWithTags[]>([]);
  const [loading, setLoading] = useState(true);

  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<TagFilterMode>('any');

  // Fetch profiles
  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, tags(*)')
        .eq('onboarded', true)
        .order('last_active', { ascending: false });

      if (!error && data) {
        setProfiles(
          (data as Array<{ tags: Tag[] } & Record<string, unknown>>).map(buildProfileWithTags)
        );
      }
      setLoading(false);
    }
    fetchProfiles();
  }, []);

  // Debounce search input (200ms)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 200);
  }, []);

  // Collect all unique tags across all profiles
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of profiles) {
      p.helpTags.forEach((t) => set.add(t));
      p.learnTags.forEach((t) => set.add(t));
    }
    return Array.from(set).sort();
  }, [profiles]);

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  // Combined filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return profiles.filter((p) => {
      // Text search
      if (q) {
        const haystack = [p.name, p.company, p.role, p.bio]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const matches = (tags: string[]) =>
          selectedTags.every((sel) => tags.includes(sel));

        if (filterMode === 'help') return matches(p.helpTags);
        if (filterMode === 'learn') return matches(p.learnTags);
        // 'any' — tag appears in either list
        return matches([...p.helpTags, ...p.learnTags]);
      }

      return true;
    });
  }, [profiles, search, selectedTags, filterMode]);

  const total = profiles.length;
  const shown = filtered.length;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-navy-light">Member Directory</h1>
        <p className="text-gray-500 mt-1 text-sm">Browse and connect with your cohort.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <Input
          placeholder="Search by name, company, role, or bio…"
          value={rawSearch}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>

      {/* Tag filter */}
      {!loading && allTags.length > 0 && (
        <TagFilter
          tags={allTags}
          selectedTags={selectedTags}
          mode={filterMode}
          onTagToggle={handleTagToggle}
          onModeChange={setFilterMode}
        />
      )}

      {/* Result count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-brand-navy-light">{shown}</span> of{' '}
          <span className="font-semibold text-brand-navy-light">{total}</span> member
          {total !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-navy-light" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <p className="text-base font-medium">No members match your search</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
