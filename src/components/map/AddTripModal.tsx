import { useState, useRef, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { searchCities } from '@/lib/geocoding';
import type { GeoResult } from '@/lib/geocoding';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface AddTripModalProps {
  onTripAdded: () => void;
}

export function AddTripModal({ onTripAdded }: AddTripModalProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // City autocomplete state
  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<GeoResult[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cityContainerRef = useRef<HTMLDivElement>(null);

  // Form state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  // Close city dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cityContainerRef.current && !cityContainerRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleCityChange(value: string) {
    setCityQuery(value);
    setSelectedCity(null);
    setCityOpen(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setCityResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const data = await searchCities(value);
        setCityResults(data);
        setCityOpen(data.length > 0);
      } finally {
        setCityLoading(false);
      }
    }, 300);
  }

  function handleCitySelect(result: GeoResult) {
    setCityQuery(result.displayName);
    setSelectedCity(result);
    setCityOpen(false);
    setCityResults([]);
  }

  function resetForm() {
    setCityQuery('');
    setCityResults([]);
    setCityOpen(false);
    setSelectedCity(null);
    setDateFrom('');
    setDateTo('');
    setNote('');
    setErrors({});
  }

  async function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!selectedCity) errs.city = 'Select a destination city.';
    if (!dateFrom) errs.dateFrom = 'Start date is required.';
    if (!dateTo) errs.dateTo = 'End date is required.';
    if (dateFrom && dateTo && dateTo < dateFrom) errs.dateTo = 'End must be after start.';
    if (dateTo && dateTo < today) errs.dateTo = 'End date must be today or in the future.';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('trips').insert({
        user_id: user.id,
        city: selectedCity!.city,
        country: selectedCity!.country,
        latitude: selectedCity!.latitude,
        longitude: selectedCity!.longitude,
        date_from: dateFrom,
        date_to: dateTo,
        note: note.trim() || null,
      });
      if (error) throw error;
      setOpen(false);
      resetForm();
      onTripAdded();
    } catch {
      setErrors({ global: 'Failed to save trip. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) resetForm();
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-lg gap-2"
        size="sm"
      >
        <PlusCircle className="h-4 w-4" />
        Add a Trip
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add a Trip</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* City autocomplete */}
            <div className="space-y-1.5" ref={cityContainerRef}>
              <Label htmlFor="trip-city" className="text-[#1E293B] font-medium text-sm">
                Destination
              </Label>
              <div className="relative">
                <Input
                  id="trip-city"
                  placeholder="Search city…"
                  value={cityQuery}
                  onChange={(e) => handleCityChange(e.target.value)}
                  onFocus={() => cityResults.length > 0 && setCityOpen(true)}
                  autoComplete="off"
                  className={errors.city ? 'border-red-400' : ''}
                />
                {cityLoading && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Searching…
                  </span>
                )}
                {cityOpen && cityResults.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                    {cityResults.map((r, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                          onMouseDown={(e) => { e.preventDefault(); handleCitySelect(r); }}
                        >
                          {r.displayName}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trip-date-from" className="text-[#1E293B] font-medium text-sm">From</Label>
                <Input
                  id="trip-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`text-sm ${errors.dateFrom ? 'border-red-400' : ''}`}
                />
                {errors.dateFrom && <p className="text-xs text-red-500">{errors.dateFrom}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-date-to" className="text-[#1E293B] font-medium text-sm">To</Label>
                <Input
                  id="trip-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={today}
                  className={`text-sm ${errors.dateTo ? 'border-red-400' : ''}`}
                />
                {errors.dateTo && <p className="text-xs text-red-500">{errors.dateTo}</p>}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="trip-note" className="text-[#1E293B] font-medium text-sm">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="trip-note"
                placeholder="Happy to grab coffee!"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            {errors.global && <p className="text-xs text-red-500">{errors.global}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Add Trip'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
