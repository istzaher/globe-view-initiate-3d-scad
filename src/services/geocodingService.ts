/**
 * Forward Geocoding Service
 * Converts addresses/place names to coordinates for routing
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  address: string;
  displayName?: string;
}

export interface GeocodingResponse {
  success: boolean;
  results: GeocodingResult[];
  error?: string;
}

/**
 * Forward geocoding using OpenStreetMap Nominatim (free, no API key required)
 * Converts address/place name to coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodingResponse> {
  try {
    if (!address || address.trim().length === 0) {
      return {
        success: false,
        results: [],
        error: 'Address is required'
      };
    }

    const baseUrl = 'https://nominatim.openstreetmap.org/search';
    
    const params = new URLSearchParams({
      q: address.trim(),
      format: 'json',
      addressdetails: '1',
      limit: '5', // Return up to 5 results
      countrycodes: 'us', // Focus on US results
      bounded: '0'
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GlobeRouting/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        results: [],
        error: `No results found for "${address}"`
      };
    }

    // Convert results to our format
    const results: GeocodingResult[] = data.map((item: any) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: item.display_name,
      displayName: item.display_name
    }));

    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('Geocoding failed:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown geocoding error'
    };
  }
}

/**
 * Enhanced geocoding with multiple strategies for better results
 */
export async function geocodeAddressEnhanced(address: string): Promise<GeocodingResponse> {
  if (!address || address.trim().length === 0) {
    return {
      success: false,
      results: [],
      error: 'Address is required'
    };
  }

  // Try multiple search strategies for better results
  const searchQueries = [
    address.trim(),
    `${address.trim()}, California, USA`,
    `${address.trim()}, CA, USA`,
    `${address.trim()}, United States`
  ];

  for (const query of searchQueries) {
    const result = await geocodeAddress(query);
    if (result.success && result.results.length > 0) {
      return result;
    }
  }

  return {
    success: false,
    results: [],
    error: `No results found for "${address}" with any search strategy`
  };
}

/**
 * Geocode using ESRI World Geocoding Service (alternative/backup)
 */
export async function geocodeAddressESRI(address: string): Promise<GeocodingResponse> {
  try {
    if (!address || address.trim().length === 0) {
      return {
        success: false,
        results: [],
        error: 'Address is required'
      };
    }

    const baseUrl = 'https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';
    
    const params = new URLSearchParams({
      SingleLine: address.trim(),
      f: 'json',
      outSR: '4326',
      maxLocations: '5',
      countryCode: 'USA'
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'ESRI API error');
    }

    if (!data.candidates || data.candidates.length === 0) {
      return {
        success: false,
        results: [],
        error: `No results found for "${address}"`
      };
    }

    // Convert results to our format
    const results: GeocodingResult[] = data.candidates
      .filter((candidate: any) => candidate.score >= 80) // Only high-confidence results
      .map((candidate: any) => ({
        latitude: candidate.location.y,
        longitude: candidate.location.x,
        address: candidate.address,
        displayName: candidate.address
      }));

    return {
      success: true,
      results
    };

  } catch (error) {
    console.error('ESRI geocoding failed:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown ESRI geocoding error'
    };
  }
}

/**
 * Main geocoding function that tries OSM first, then falls back to ESRI
 */
export async function geocode(address: string): Promise<GeocodingResponse> {
  // Try OSM first (free, no API key required)
  const osmResult = await geocodeAddressEnhanced(address);
  if (osmResult.success && osmResult.results.length > 0) {
    return osmResult;
  }

  // Fallback to ESRI
  console.log('Falling back to ESRI geocoding...');
  const esriResult = await geocodeAddressESRI(address);
  if (esriResult.success && esriResult.results.length > 0) {
    return esriResult;
  }

  // Both failed
  return {
    success: false,
    results: [],
    error: `No results found for "${address}" using any geocoding service`
  };
} 