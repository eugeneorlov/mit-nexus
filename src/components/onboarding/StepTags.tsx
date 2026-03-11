import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_TAGS = 5;

const SUGGESTED_HELP_TAGS = [
  'AI/ML Strategy',
  'Fundraising',
  'Scaling Engineering',
  'Board Management',
  'Product-Led Growth',
  'M&A',
  'International Expansion',
  'Team Building',
  'CTO→CEO Transition',
  'Data Infrastructure',
];

const SUGGESTED_LEARN_TAGS = [
  'Security/Compliance',
  'Mobile Development',
  'Developer Experience',
  'Go-To-Market',
  'Hiring',
  'Remote Teams',
  'Technical Architecture',
  'DevOps/Platform',
  'Analytics',
  'Legal/IP',
];

export interface StepTagsData {
  helpTags: string[];
  learnTags: string[];
}

interface StepTagsProps {
  data: StepTagsData;
  onChange: (data: StepTagsData) => void;
  errors: Partial<Record<keyof StepTagsData, string>>;
}

interface TagSectionProps {
  label: string;
  description: string;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  suggestions: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  onAdd: (tag: string) => void;
  errorMsg?: string;
}

function TagSection({
  label,
  description,
  accentColor,
  borderColor,
  bgColor,
  textColor,
  suggestions,
  selected,
  onToggle,
  onAdd,
  errorMsg,
}: TagSectionProps) {
  const [customInput, setCustomInput] = useState('');

  function handleAdd() {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (selected.length >= MAX_TAGS) return;
    if (selected.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCustomInput('');
      return;
    }
    onAdd(trimmed);
    setCustomInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  const atMax = selected.length >= MAX_TAGS;

  return (
    <div className="space-y-3">
      <div>
        <Label className={`text-sm font-semibold ${textColor}`}>{label}</Label>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>

      {/* Count indicator */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${atMax ? 'text-red-500' : 'text-gray-400'}`}>
          {selected.length}/{MAX_TAGS} selected
        </span>
        {errorMsg && (
          <span className="text-xs text-red-500">{errorMsg}</span>
        )}
      </div>

      {/* Suggestion badges */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((tag) => {
          const isSelected = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              disabled={!isSelected && atMax}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 rounded-full"
              style={{ ['--ring-color' as string]: accentColor }}
            >
              <Badge
                variant={isSelected ? 'default' : 'outline'}
                className={`cursor-pointer select-none transition-colors text-xs px-3 py-1 ${
                  isSelected
                    ? `${bgColor} ${textColor} ${borderColor} border hover:opacity-80`
                    : `border-gray-300 text-gray-600 hover:${borderColor} hover:${bgColor} hover:${textColor} disabled:opacity-40 disabled:cursor-not-allowed`
                } ${!isSelected && atMax ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {tag}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Custom tags added by user (not in suggestions) */}
      {selected.filter((t) => !suggestions.includes(t)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected
            .filter((t) => !suggestions.includes(t))
            .map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onToggle(tag)}
                className="focus:outline-none rounded-full"
              >
                <Badge
                  variant="default"
                  className={`cursor-pointer select-none transition-colors text-xs px-3 py-1 ${bgColor} ${textColor} ${borderColor} border hover:opacity-80`}
                >
                  {tag} ×
                </Badge>
              </button>
            ))}
        </div>
      )}

      {/* Custom tag input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a custom tag…"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={atMax}
          className="text-sm h-8"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={atMax || !customInput.trim()}
          className={`h-8 border ${borderColor} ${textColor} hover:${bgColor}`}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

export default function StepTags({ data, onChange, errors }: StepTagsProps) {
  function toggleTag(category: 'helpTags' | 'learnTags', tag: string) {
    const current = data[category];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : current.length < MAX_TAGS
      ? [...current, tag]
      : current;
    onChange({ ...data, [category]: next });
  }

  function addCustomTag(category: 'helpTags' | 'learnTags', tag: string) {
    const current = data[category];
    if (current.length >= MAX_TAGS) return;
    if (current.map((t) => t.toLowerCase()).includes(tag.toLowerCase())) return;
    onChange({ ...data, [category]: [...current, tag] });
  }

  return (
    <div className="space-y-8">
      <TagSection
        label="I can help with"
        description="Share your expertise with your cohort."
        accentColor="#10B981"
        borderColor="border-emerald-500"
        bgColor="bg-emerald-50"
        textColor="text-emerald-700"
        suggestions={SUGGESTED_HELP_TAGS}
        selected={data.helpTags}
        onToggle={(tag) => toggleTag('helpTags', tag)}
        onAdd={(tag) => addCustomTag('helpTags', tag)}
        errorMsg={errors.helpTags}
      />

      <div className="border-t border-gray-100" />

      <TagSection
        label="I want to learn"
        description="What are you looking to get from your cohort?"
        accentColor="#3B82F6"
        borderColor="border-blue-500"
        bgColor="bg-blue-50"
        textColor="text-blue-700"
        suggestions={SUGGESTED_LEARN_TAGS}
        selected={data.learnTags}
        onToggle={(tag) => toggleTag('learnTags', tag)}
        onAdd={(tag) => addCustomTag('learnTags', tag)}
        errorMsg={errors.learnTags}
      />
    </div>
  );
}
