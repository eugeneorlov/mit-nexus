import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchCities, type GeoResult } from '@/lib/geocoding';

// Fix Leaflet default marker icons in bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl'];
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface StepLocationData {
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  isTraveling: boolean;
  tripCity: string;
  tripCountry: string;
  tripLatitude: number | null;
  tripLongitude: number | null;
  tripStartDate: string;
  tripEndDate: string;
  tripNote: string;
}

interface StepLocationProps {
  data: StepLocationData;
  onChange: (data: StepLocationData) => void;
  errors: Partial<Record<keyof StepLocationData, string>>;
}

// Helper component to fly the map to a new position
function MapFlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 11, { animate: true, duration: 0.8 });
  }, [map, lat, lon]);
  return null;
}

interface CitySearchProps {
  id: string;
  label: string;
  placeholder?: string;
  selected: GeoResult | null;
  onSelect: (result: GeoResult) => void;
  error?: string;
}

function CitySearch({ id, label, placeholder, selected, onSelect, error }: CitySearchProps) {
  const [query, setQuery] = useState(selected?.displayName ?? '');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external selection with input value
  useEffect(() => {
    if (selected) setQuery(selected.displayName);
  }, [selected]);

  // Close dropdown on outside click
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

    if (!value.trim()) {
      setResults([]);
      return;
    }

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

  function handleSelect(result: GeoResult) {
    setQuery(result.displayName);
    setOpen(false);
    setResults([]);
    onSelect(result);
  }

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <Label htmlFor={id} className="text-[#1E293B] font-medium">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder ?? 'Search city…'}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className={error ? 'border-red-400' : ''}
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
                  className="w-full px-3 py-2 text-left text-sm hover:bg-[#F9FAFB] focus:bg-[#F9FAFB] focus:outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(r);
                  }}
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

export default function StepLocation({ data, onChange, errors }: StepLocationProps) {
  const hasLocation = data.latitude !== null && data.longitude !== null;

  const homeSelected: GeoResult | null = hasLocation
    ? {
        city: data.city,
        country: data.country,
        latitude: data.latitude!,
        longitude: data.longitude!,
        displayName: data.country ? `${data.city}, ${data.country}` : data.city,
      }
    : null;

  const tripSelected: GeoResult | null =
    data.tripLatitude !== null && data.tripLongitude !== null
      ? {
          city: data.tripCity,
          country: data.tripCountry,
          latitude: data.tripLatitude!,
          longitude: data.tripLongitude!,
          displayName: data.tripCountry
            ? `${data.tripCity}, ${data.tripCountry}`
            : data.tripCity,
        }
      : null;

  function handleHomeSelect(r: GeoResult) {
    onChange({
      ...data,
      city: r.city,
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
    });
  }

  function handleTripSelect(r: GeoResult) {
    onChange({
      ...data,
      tripCity: r.city,
      tripCountry: r.country,
      tripLatitude: r.latitude,
      tripLongitude: r.longitude,
    });
  }

  function toggleTraveling() {
    onChange({ ...data, isTraveling: !data.isTraveling });
  }

  return (
    <div className="space-y-6">
      {/* Home city */}
      <CitySearch
        id="loc-city"
        label="Where are you based?"
        placeholder="Search your city…"
        selected={homeSelected}
        onSelect={handleHomeSelect}
        error={errors.city}
      />

      {/* Mini map */}
      {hasLocation && (
        <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: 200 }}>
          <MapContainer
            center={[data.latitude!, data.longitude!]}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[data.latitude!, data.longitude!]} />
            <MapFlyTo lat={data.latitude!} lon={data.longitude!} />
          </MapContainer>
        </div>
      )}

      {/* Traveling soon toggle */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={data.isTraveling}
            onClick={toggleTraveling}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] ${
              data.isTraveling ? 'bg-[#F59E0B]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                data.isTraveling ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <Label
            className="text-sm font-medium text-[#1E293B] cursor-pointer"
            onClick={toggleTraveling}
          >
            Are you traveling somewhere soon?
          </Label>
        </div>

        {data.isTraveling && (
          <div className="mt-4 space-y-4 pl-1">
            <CitySearch
              id="trip-city"
              label="Destination city"
              placeholder="Search destination…"
              selected={tripSelected}
              onSelect={handleTripSelect}
              error={errors.tripCity}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="trip-start" className="text-[#1E293B] font-medium text-sm">
                  From
                </Label>
                <Input
                  id="trip-start"
                  type="date"
                  value={data.tripStartDate}
                  onChange={(e) => onChange({ ...data, tripStartDate: e.target.value })}
                  className={`text-sm ${errors.tripStartDate ? 'border-red-400' : ''}`}
                />
                {errors.tripStartDate && (
                  <p className="text-xs text-red-500">{errors.tripStartDate}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip-end" className="text-[#1E293B] font-medium text-sm">
                  To
                </Label>
                <Input
                  id="trip-end"
                  type="date"
                  value={data.tripEndDate}
                  onChange={(e) => onChange({ ...data, tripEndDate: e.target.value })}
                  className={`text-sm ${errors.tripEndDate ? 'border-red-400' : ''}`}
                />
                {errors.tripEndDate && (
                  <p className="text-xs text-red-500">{errors.tripEndDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="trip-note" className="text-[#1E293B] font-medium text-sm">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="trip-note"
                placeholder="e.g. Attending SaaStr in San Francisco"
                value={data.tripNote}
                onChange={(e) => onChange({ ...data, tripNote: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Skip hint */}
      {!hasLocation && (
        <p className="text-xs text-gray-400 text-center">
          Search for your city above to see a map preview.
        </p>
      )}
    </div>
  );
}

