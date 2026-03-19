import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import StepBasics from '@/components/onboarding/StepBasics';
import type { StepBasicsData } from '@/components/onboarding/StepBasics';
import StepTags from '@/components/onboarding/StepTags';
import type { StepTagsData } from '@/components/onboarding/StepTags';
import StepLocation from '@/components/onboarding/StepLocation';
import type { StepLocationData } from '@/components/onboarding/StepLocation';

const TOTAL_STEPS = 3;

const defaultBasics: StepBasicsData = {
  name: '',
  company: '',
  role: '',
  bio: '',
  linkedinUrl: '',
  avatarFile: null,
  avatarPreviewUrl: null,
};

const defaultTags: StepTagsData = {
  helpTags: [],
  learnTags: [],
};

const defaultLocation: StepLocationData = {
  city: '',
  country: '',
  latitude: null,
  longitude: null,
  isTraveling: false,
  tripCity: '',
  tripCountry: '',
  tripLatitude: null,
  tripLongitude: null,
  tripStartDate: '',
  tripEndDate: '',
  tripNote: '',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [basics, setBasics] = useState<StepBasicsData>(defaultBasics);
  const [basicsErrors, setBasicsErrors] = useState<Partial<Record<keyof StepBasicsData, string>>>({});
  const [tags, setTags] = useState<StepTagsData>(defaultTags);
  const [tagsErrors, setTagsErrors] = useState<Partial<Record<keyof StepTagsData, string>>>({});
  const [location, setLocation] = useState<StepLocationData>(defaultLocation);
  const [locationErrors, setLocationErrors] = useState<Partial<Record<keyof StepLocationData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validateBasics(): boolean {
    const errs: typeof basicsErrors = {};
    if (!basics.name.trim()) errs.name = 'Name is required.';
    if (!basics.company.trim()) errs.company = 'Company is required.';
    if (!basics.role.trim()) errs.role = 'Role is required.';
    setBasicsErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateTags(): boolean {
    const errs: typeof tagsErrors = {};
    if (tags.helpTags.length === 0) errs.helpTags = 'Select at least 1 tag.';
    if (tags.learnTags.length === 0) errs.learnTags = 'Select at least 1 tag.';
    setTagsErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateLocation(): boolean {
    const errs: typeof locationErrors = {};
    if (location.isTraveling) {
      if (!location.tripCity) errs.tripCity = 'Select a destination city.';
      if (!location.tripStartDate) errs.tripStartDate = 'Start date is required.';
      if (!location.tripEndDate) errs.tripEndDate = 'End date is required.';
      if (
        location.tripStartDate &&
        location.tripEndDate &&
        location.tripEndDate < location.tripStartDate
      ) {
        errs.tripEndDate = 'End date must be after start date.';
      }
    }
    setLocationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 1 && !validateBasics()) return;
    if (step === 2 && !validateTags()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    if (!validateLocation()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (basics.avatarFile) {
        const ext = basics.avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, basics.avatarFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);
        avatarUrl = publicData.publicUrl;
      }

      // Auto-detect timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Upsert profile with all data from all 3 steps
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: basics.name.trim(),
          company: basics.company.trim(),
          role: basics.role.trim(),
          bio: basics.bio.trim() || null,
          linkedin_url: basics.linkedinUrl.trim() || null,
          avatar_url: avatarUrl,
          city: location.city || null,
          country: location.country || null,
          latitude: location.latitude,
          longitude: location.longitude,
          timezone,
          onboarded: true,
        });

      if (upsertError) throw upsertError;

      // Delete existing tags then insert new ones
      await supabase.from('tags').delete().eq('user_id', user.id);

      const tagRows = [
        ...tags.helpTags.map((label) => ({ user_id: user.id, category: 'help' as const, label })),
        ...tags.learnTags.map((label) => ({ user_id: user.id, category: 'learn' as const, label })),
      ];

      if (tagRows.length > 0) {
        const { error: tagsError } = await supabase.from('tags').insert(tagRows);
        if (tagsError) throw tagsError;
      }

      // Insert trip if user is traveling
      if (
        location.isTraveling &&
        location.tripCity &&
        location.tripStartDate &&
        location.tripEndDate
      ) {
        const { error: tripError } = await supabase.from('trips').insert({
          user_id: user.id,
          city: location.tripCity,
          country: location.tripCountry,
          latitude: location.tripLatitude,
          longitude: location.tripLongitude,
          start_date: location.tripStartDate,
          end_date: location.tripEndDate,
        });
        if (tripError) throw tripError;
      }

      navigate('/welcome');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  const isLastStep = step === TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-md">
        <CardHeader className="pb-2">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-[#F59E0B]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <CardTitle className="text-[#1E293B] text-xl">
              {step === 1 && 'Your Profile'}
              {step === 2 && 'Expertise & Interests'}
              {step === 3 && 'Location & Availability'}
            </CardTitle>
            <span className="text-sm font-medium text-gray-400">
              {step}/{TOTAL_STEPS}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            {step === 1 && 'Tell us about yourself so your cohort can find you.'}
            {step === 2 && 'What can you help with, and what do you want to learn?'}
            {step === 3 && 'Where are you based? Let your cohort know when you\'re nearby.'}
          </p>
        </CardHeader>

        <CardContent className="py-4">
          {step === 1 && (
            <StepBasics data={basics} onChange={setBasics} errors={basicsErrors} />
          )}

          {step === 2 && (
            <StepTags data={tags} onChange={setTags} errors={tagsErrors} />
          )}

          {step === 3 && (
            <StepLocation data={location} onChange={setLocation} errors={locationErrors} />
          )}

          {submitError && (
            <p className="mt-4 text-sm text-red-500 text-center">{submitError}</p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between pt-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="text-[#1E293B]"
          >
            Back
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white min-w-[140px]"
            >
              {submitting ? 'Saving…' : 'Complete Profile'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white min-w-[100px]"
            >
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
