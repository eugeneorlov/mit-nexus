export interface GeoResult {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    country?: string;
  };
}

// Respect Nominatim usage policy: max 1 req/sec
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1000;

export async function searchCities(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return [];

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        'User-Agent': 'MIT-Nexus/1.0 (mit-nexus-cohort-app)',
      },
    },
  );

  if (!res.ok) return [];

  const data: NominatimResult[] = await res.json();

  return data.map((item) => {
    const city =
      item.address.city ||
      item.address.town ||
      item.address.village ||
      item.address.municipality ||
      item.address.county ||
      item.display_name.split(',')[0].trim();
    const country = item.address.country ?? '';
    return {
      city,
      country,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: country ? `${city}, ${country}` : city,
    };
  });
}
