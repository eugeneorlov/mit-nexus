import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import StepBasics from '@/components/onboarding/StepBasics';
import type { StepBasicsData } from '@/components/onboarding/StepBasics';
import StepTags from '@/components/onboarding/StepTags';
import type { StepTagsData } from '@/components/onboarding/StepTags';

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

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [basics, setBasics] = useState<StepBasicsData>(defaultBasics);
  const [basicsErrors, setBasicsErrors] = useState<Partial<Record<keyof StepBasicsData, string>>>({});
  const [tags, setTags] = useState<StepTagsData>(defaultTags);
  const [tagsErrors, setTagsErrors] = useState<Partial<Record<keyof StepTagsData, string>>>({});
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

  function handleNext() {
    if (step === 1 && !validateBasics()) return;
    if (step === 2 && !validateTags()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    if (step === 1 && !validateBasics()) return;
    if (step === 2 && !validateTags()) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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

      navigate('/dashboard');
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
            {step === 3 && 'Where are you based, and when are you available?'}
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
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <span className="text-4xl">📍</span>
              <p className="text-sm">Location & availability — coming soon</p>
            </div>
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
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white min-w-[100px]"
            >
              {submitting ? 'Saving…' : 'Finish'}
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
