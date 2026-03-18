import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TagFilterMode } from '@/components/directory/TagFilter';

export interface MapFilters {
  selectedTags: string[];
  tagMode: TagFilterMode;
  showHome: boolean;
  showTravelers: boolean;
}

interface MapFilterOverlayProps {
  allTags: string[];
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
}

export function MapFilterOverlay({ allTags, filters, onChange }: MapFilterOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  function toggleTag(tag: string) {
    const next = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];
    onChange({ ...filters, selectedTags: next });
  }

  function setMode(mode: TagFilterMode) {
    onChange({ ...filters, tagMode: mode });
  }

  const activeFilterCount =
    filters.selectedTags.length +
    (!filters.showHome ? 1 : 0) +
    (!filters.showTravelers ? 1 : 0);

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-md transition-colors',
          expanded
            ? 'bg-[#1E293B] text-white'
            : 'bg-white text-[#1E293B] border border-gray-200 hover:border-[#1E293B]'
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-0.5 bg-[#F59E0B] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {expanded && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 p-4 w-72 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#1E293B]">Map Filters</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Visibility toggles */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Show on map</p>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ ...filters, showHome: !filters.showHome })}
                className={cn(
                  'flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  filters.showHome
                    ? 'bg-[#1E293B] text-white border-[#1E293B]'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-[#1E293B]'
                )}
              >
                Home bases
              </button>
              <button
                onClick={() => onChange({ ...filters, showTravelers: !filters.showTravelers })}
                className={cn(
                  'flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  filters.showTravelers
                    ? 'bg-[#F59E0B] text-white border-[#F59E0B]'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-[#F59E0B]'
                )}
              >
                Travelers
              </button>
            </div>
          </div>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Filter by tag</p>

              {/* Mode selector */}
              <div className="flex gap-1.5 flex-wrap">
                {(['any', 'help', 'learn'] as TagFilterMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      filters.tagMode === m
                        ? 'bg-[#1E293B] text-white border-[#1E293B]'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#1E293B]'
                    )}
                  >
                    {m === 'any' ? 'Any' : m === 'help' ? 'Can help' : 'Wants to learn'}
                  </button>
                ))}
              </div>

              {/* Tag chips */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {allTags.map((tag) => {
                  const active = filters.selectedTags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'cursor-pointer text-xs px-2.5 py-1 border transition-colors select-none',
                        active
                          ? 'bg-[#1E293B] text-white border-[#1E293B]'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[#1E293B] hover:text-[#1E293B]'
                      )}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>

              {filters.selectedTags.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, selectedTags: [] })}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Clear tag filters
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
