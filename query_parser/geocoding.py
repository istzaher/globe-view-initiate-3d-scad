import requests
import logging
import time
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

def geocode_location(location_query: str, max_retries: int = 3) -> Optional[Tuple[float, float]]:
    """
    Geocode a location query using OpenStreetMap Nominatim service.
    Returns (latitude, longitude) tuple or None if geocoding fails.
    """
    # Add User-Agent header to avoid 403 errors
    headers = {
        'User-Agent': 'EV-Charging-Station-Finder/1.0 (https://github.com/user/ev-finder)'
    }
    
    # Try multiple search strategies
    search_queries = [
        f"{location_query}, California, USA",  # Original with California
        f"{location_query}, CA, USA",          # With CA abbreviation
        f"{location_query}, United States",    # Just USA
        location_query                         # Raw query as fallback
    ]
    
    url = "https://nominatim.openstreetmap.org/search"
    
    for search_query in search_queries:
        params = {
            'q': search_query,
            'format': 'json',
            'limit': 5,
            'addressdetails': 1
        }
        
        # Add country restriction for first few attempts
        if "USA" in search_query or "United States" in search_query:
            params['countrycodes'] = 'us'
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Geocoding attempt {attempt + 1}/{max_retries} for: '{search_query}'")
                
                # Add delay between requests to respect rate limits
                if attempt > 0:
                    time.sleep(1)
                
                response = requests.get(url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                
                results = response.json()
                
                if results:
                    # Prefer results in California/US
                    for result in results:
                        display_name = result.get('display_name', '').lower()
                        address = result.get('address', {})
                        
                        # Prioritize California results
                        if ('california' in display_name or 
                            'ca' in address.get('state', '').lower() or
                            'united states' in display_name):
                            lat = float(result['lat'])
                            lon = float(result['lon'])
                            logger.info(f"Geocoded '{location_query}' -> ({lat}, {lon}) via '{search_query}'")
                            return (lat, lon)
                    
                    # If no California/US results, use the first result
                    result = results[0]
                    lat = float(result['lat'])
                    lon = float(result['lon'])
                    logger.info(f"Geocoded '{location_query}' -> ({lat}, {lon}) via '{search_query}' (fallback)")
                    return (lat, lon)
                else:
                    logger.info(f"No results for search query: '{search_query}'")
                    
            except requests.exceptions.RequestException as e:
                logger.error(f"Geocoding error for '{search_query}' (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    logger.warning(f"All attempts failed for search query: '{search_query}'")
                    break  # Try next search query
            except (ValueError, KeyError) as e:
                logger.error(f"Error parsing geocoding response for '{search_query}': {e}")
                break  # Try next search query
    
    logger.warning(f"All geocoding strategies failed for '{location_query}'")
    return None

def lat_lon_to_web_mercator(lat: float, lon: float) -> Tuple[float, float]:
    """
    Convert latitude/longitude to Web Mercator coordinates (EPSG:3857).
    """
    import math
    
    # Web Mercator projection
    x = lon * 20037508.34 / 180.0
    y = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) / (math.pi / 180.0)
    y = y * 20037508.34 / 180.0
    
    return (x, y)

 