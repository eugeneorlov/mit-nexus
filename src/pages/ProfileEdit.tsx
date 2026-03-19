import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useCurrentProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { searchCities, type GeoResult } from '@/lib/geocoding';
import type { Trip } from '@/lib/types';

const BIO_MAX = 280;
const MAX_TAGS = 5;

const SUGGESTED_HELP_TAGS = [
  'AI/ML Strategy', 'Fundraising', 'Scaling Engineering', 'Board Management',
  'Product-Led Growth', 'M&A', 'International Expansion', 'Team Building',
  'CTO→CEO Transition', 'Data Infrastructure',
];

const SUGGESTED_LEARN_TAGS = [
  'Security/Compliance', 'Mobile Development', 'Developer Experience', 'Go-To-Market',
  'Hiring', 'Remote Teams', 'Technical Architecture', 'DevOps/Platform',
  'Analytics', 'Legal/IP',
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

// ─── City search ─────────────────────────────────────────────────────────────

interface CitySearchProps {
  id: string;
  label: string;
  placeholder?: string;
  selected: GeoResult | null;
  onSelect: (r: GeoResult) => void;
  error?: string;
}

function CitySearch({ id, label, placeholder, selected, onSelect, error }: CitySearchProps) {
  const [query, setQuery] = useState(selected?.displayName ?? '');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setQuery(selected.displayName);
  }, [selected]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCities(value);
        setResults(data);
        setOpen(data.length > 0);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(r: GeoResult) {
    setQuery(r.displayName);
    setOpen(false);
    setResults([]);
    onSelect(r);
  }

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <Label htmlFor={id} className="text-brand-navy-light font-medium text-sm">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder ?? 'Search city…'}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className={`text-sm ${error ? 'border-red-400' : ''}`}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Searching…
          </span>
        )}
        {open && results.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[#F9FAFB]"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
                >
                  {r.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Tag section ──────────────────────────────────────────────────────────────

interface TagSectionProps {
  label: string;
  suggestions: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onAdd: (tag: string) => void;
  colorClasses: { border: string; bg: string; text: string };
}

function TagSection({ label, suggestions, selected, onToggle, onAdd, colorClasses }: TagSectionProps) {
  const [customInput, setCustomInput] = useState('');
  const atMax = selected.length >= MAX_TAGS;

  function handleAdd() {
    const trimmed = customInput.trim();
    if (!trimmed || atMax) return;
    if (selected.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCustomInput('');
      return;
    }
    onAdd(trimmed);
    setCustomInput('');
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className={`text-sm font-semibold ${colorClasses.text}`}>{label}</Label>
        <span className={`text-xs font-medium ${atMax ? 'text-red-500' : 'text-gray-400'}`}>
          {selected.length}/{MAX_TAGS}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              disabled={!isSelected && atMax}
              className="focus:outline-none rounded-full"
            >
              <Badge
                className={`cursor-pointer select-none transition-colors text-xs px-3 py-1 ${
                  isSelected
                    ? `${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border hover:opacity-80`
                    : `border-gray-300 text-gray-600 ${!isSelected && atMax ? 'opacity-40 cursor-not-allowed' : ''}`
                }`}
              >
                {tag}
              </Badge>
            </button>
          );
        })}
      </div>

      {selected.filter((t) => !suggestions.includes(t)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.filter((t) => !suggestions.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className="focus:outline-none rounded-full"
            >
              <Badge
                className={`cursor-pointer select-none text-xs px-3 py-1 ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} border hover:opacity-80`}
              >
                {tag} ×
              </Badge>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add a custom tag…"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          disabled={atMax}
          className="text-sm h-8"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={atMax || !customInput.trim()}
          className={`h-8 border ${colorClasses.border} ${colorClasses.text}`}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Trip row ──────────────────────────────────────────────────────────────────

interface TripRowProps {
  trip: Trip;
  onDelete: (id: string) => void;
}

function TripRow({ trip, onDelete }: TripRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-navy-light truncate">
          {[trip.city, trip.country].filter(Boolean).join(', ')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {trip.date_from} → {trip.date_to}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(trip.id)}
        className="ml-3 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        aria-label="Delete trip"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Add trip form ─────────────────────────────────────────────────────────────

interface AddTripFormProps {
  userId: string;
  onAdded: (trip: Trip) => void;
  onCancel: () => void;
}

function AddTripForm({ userId, onAdded, onCancel }: AddTripFormProps) {
  const [destination, setDestination] = useState<GeoResult | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!destination) errs.city = 'Select a destination city.';
    if (!startDate) errs.startDate = 'Start date is required.';
    if (!endDate) errs.endDate = 'End date is required.';
    if (startDate && endDate && endDate < startDate) errs.endDate = 'End must be after start.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .insert({
          user_id: userId,
          city: destination!.city,
          country: destination!.country,
          latitude: destination!.latitude,
          longitude: destination!.longitude,
          date_from: startDate,
          date_to: endDate,
        })
        .select()
        .single();

      if (error) throw error;
      onAdded(data as Trip);
    } catch {
      setErrors({ global: 'Failed to save trip.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-brand-gold rounded-lg p-4 space-y-3 bg-brand-gold-subtle">
      <CitySearch
        id="new-trip-city"
        label="Destination"
        placeholder="Search destination…"
        selected={destination}
        onSelect={setDestination}
        error={errors.city}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="new-trip-start" className="text-brand-navy-light font-medium text-sm">From</Label>
          <Input
            id="new-trip-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`text-sm ${errors.startDate ? 'border-red-400' : ''}`}
          />
          {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-trip-end" className="text-brand-navy-light font-medium text-sm">To</Label>
          <Input
            id="new-trip-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={`text-sm ${errors.endDate ? 'border-red-400' : ''}`}
          />
          {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
        </div>
      </div>
      {errors.global && <p className="text-xs text-red-500">{errors.global}</p>}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={handleSave}
          className="bg-brand-gold hover:bg-brand-gold-hover text-white"
        >
          {saving ? 'Saving…' : 'Add Trip'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, updateProfile, updateTags } = useCurrentProfile();

  // Basic info state
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Location state
  const [locationSelected, setLocationSelected] = useState<GeoResult | null>(null);

  // Tag state
  const [helpTags, setHelpTags] = useState<string[]>([]);
  const [learnTags, setLearnTags] = useState<string[]>([]);

  // Trips state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [showAddTrip, setShowAddTrip] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setCompany(profile.company ?? '');
    setRole(profile.role ?? '');
    setBio(profile.bio ?? '');
    setLinkedinUrl(profile.linkedin_url ?? '');
    setAvatarPreview(profile.avatar_url);
    setHelpTags(profile.helpTags);
    setLearnTags(profile.learnTags);

    if (profile.latitude !== null && profile.longitude !== null) {
      setLocationSelected({
        city: profile.city ?? '',
        country: profile.country ?? '',
        latitude: profile.latitude,
        longitude: profile.longitude,
        displayName: [profile.city, profile.country].filter(Boolean).join(', '),
      });
    }
  }, [profile]);

  // Fetch trips
  useEffect(() => {
    if (!user) return;
    setTripsLoading(true);
    supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
      .gte('date_to', new Date().toISOString().slice(0, 10))
      .order('date_from', { ascending: true })
      .then(({ data }) => {
        setTrips((data as Trip[]) ?? []);
        setTripsLoading(false);
      });
  }, [user]);

  function handleAvatarFile(file: File) {
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleDeleteTrip(tripId: string) {
    await supabase.from('trips').delete().eq('id', tripId);
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
  }

  function toggleTag(category: 'help' | 'learn', tag: string) {
    if (category === 'help') {
      setHelpTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < MAX_TAGS ? [...prev, tag] : prev
      );
    } else {
      setLearnTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < MAX_TAGS ? [...prev, tag] : prev
      );
    }
  }

  function addCustomTag(category: 'help' | 'learn', tag: string) {
    if (category === 'help') {
      setHelpTags((prev) =>
        prev.length < MAX_TAGS && !prev.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
          ? [...prev, tag]
          : prev
      );
    } else {
      setLearnTags((prev) =>
        prev.length < MAX_TAGS && !prev.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
          ? [...prev, tag]
          : prev
      );
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required.';
    if (!company.trim()) errs.company = 'Company is required.';
    if (!role.trim()) errs.role = 'Role is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);

    try {
      // Upload avatar if changed
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarFile && user) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = publicData.publicUrl;
      }

      await updateProfile({
        name: name.trim(),
        company: company.trim(),
        role: role.trim(),
        bio: bio.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        avatar_url: avatarUrl,
        city: locationSelected?.city ?? null,
        country: locationSelected?.country ?? null,
        latitude: locationSelected?.latitude ?? null,
        longitude: locationSelected?.longitude ?? null,
      });

      await updateTags(helpTags, learnTags);

      navigate(`/profile/${user?.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  const initials = getInitials(name || profile?.name || '');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-navy-light">Edit Profile</h1>
      </div>

      {/* Basics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-navy-light">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20 ring-2 ring-brand-gold ring-offset-2">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt="Avatar" />
              ) : null}
              <AvatarFallback className="bg-brand-navy-light text-white text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-navy-light transition-colors border border-dashed border-gray-300 hover:border-brand-gold rounded-lg px-4 py-2"
            >
              <Upload className="h-4 w-4" />
              {avatarFile ? avatarFile.name : 'Change photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); }}
            />
          </div>

          <Separator />

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-name" className="text-brand-navy-light font-medium">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ep-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'border-red-400' : ''}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-company" className="text-brand-navy-light font-medium">
              Company <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ep-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={errors.company ? 'border-red-400' : ''}
            />
            {errors.company && <p className="text-xs text-red-500">{errors.company}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-role" className="text-brand-navy-light font-medium">
              Role / Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ep-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={errors.role ? 'border-red-400' : ''}
            />
            {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-bio" className="text-brand-navy-light font-medium">Bio</Label>
            <Textarea
              id="ep-bio"
              value={bio}
              maxLength={BIO_MAX}
              rows={4}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className={`text-right text-xs ${bio.length >= BIO_MAX ? 'text-red-500' : 'text-gray-400'}`}>
              {bio.length}/{BIO_MAX}
            </p>
          </div>

          {/* LinkedIn */}
          <div className="space-y-1.5">
            <Label htmlFor="ep-linkedin" className="text-brand-navy-light font-medium">
              LinkedIn URL <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="ep-linkedin"
              type="url"
              placeholder="https://linkedin.com/in/yourname"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>

          {/* Location */}
          <CitySearch
            id="ep-city"
            label="Home City"
            placeholder="Search your city…"
            selected={locationSelected}
            onSelect={setLocationSelected}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-navy-light">Expertise & Interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TagSection
            label="I can help with"
            suggestions={SUGGESTED_HELP_TAGS}
            selected={helpTags}
            onToggle={(tag) => toggleTag('help', tag)}
            onAdd={(tag) => addCustomTag('help', tag)}
            colorClasses={{ border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' }}
          />
          <Separator />
          <TagSection
            label="I want to learn"
            suggestions={SUGGESTED_LEARN_TAGS}
            selected={learnTags}
            onToggle={(tag) => toggleTag('learn', tag)}
            onAdd={(tag) => addCustomTag('learn', tag)}
            colorClasses={{ border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' }}
          />
        </CardContent>
      </Card>

      {/* Trips */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-brand-navy-light">Upcoming Trips</CardTitle>
            {!showAddTrip && (
              <button
                type="button"
                onClick={() => setShowAddTrip(true)}
                className="flex items-center gap-1 text-sm text-brand-gold hover:text-brand-gold-hover font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add trip
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tripsLoading ? (
            <p className="text-sm text-gray-400">Loading trips…</p>
          ) : trips.length === 0 && !showAddTrip ? (
            <p className="text-sm text-gray-400 text-center py-2">No upcoming trips.</p>
          ) : (
            trips.map((trip) => (
              <TripRow key={trip.id} trip={trip} onDelete={handleDeleteTrip} />
            ))
          )}

          {showAddTrip && user && (
            <AddTripForm
              userId={user.id}
              onAdded={(trip) => {
                setTrips((prev) => [...prev, trip]);
                setShowAddTrip(false);
              }}
              onCancel={() => setShowAddTrip(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Save */}
      {saveError && (
        <p className="text-sm text-red-500 text-center">{saveError}</p>
      )}

      <div className="flex gap-3 justify-end pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/profile/${user?.id}`)}
          className="text-gray-500"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-gold hover:bg-brand-gold-hover text-white min-w-[120px]"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
