import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type TagFilterMode = 'help' | 'learn' | 'any';

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  mode: TagFilterMode;
  onTagToggle: (tag: string) => void;
  onModeChange: (mode: TagFilterMode) => void;
}

export function TagFilter({ tags, selectedTags, mode, onTagToggle, onModeChange }: TagFilterProps) {
  if (tags.length === 0) return null;

  const modes: { value: TagFilterMode; label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'help', label: 'Can help with' },
    { value: 'learn', label: 'Wants to learn' },
  ];

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 font-medium">Filter by:</span>
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-colors',
              mode === m.value
                ? 'bg-brand-navy-light text-white border-[#1E293B]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-[#1E293B]'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Tag chips */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const active = selectedTags.includes(tag);
          return (
            <Badge
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={cn(
                'cursor-pointer text-xs px-2.5 py-1 border transition-colors select-none',
                active
                  ? 'bg-brand-navy-light text-white border-[#1E293B]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[#1E293B] hover:text-brand-navy-light'
              )}
            >
              {tag}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
