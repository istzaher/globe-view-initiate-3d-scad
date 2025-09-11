
export interface ArcGISFeature {
  attributes: { [key: string]: any };
  geometry: {
    x: number;
    y: number;
  };
}

export interface ArcGISQueryResponse {
  features: ArcGISFeature[];
  exceededTransferLimit?: boolean;
  error?: {
    code: number;
    message: string;
    details: string[];
  };
}

const QUERY_URL = 'https://services.sacog.org/hosting/rest/services/Transportation/EV_Charging_Station/MapServer/0/query';

export interface SpatialQueryParams {
  longitude: number;
  latitude: number;
  distance: number;
  units?: string;
}

export async function queryArcGISService(whereClause: string, spatialParams?: SpatialQueryParams): Promise<ArcGISQueryResponse> {
  console.log('=== ARCGIS QUERY SERVICE START ===');
  console.log('WHERE clause:', whereClause);
  console.log('Spatial params:', spatialParams);
  // Validate the where clause
  if (!whereClause || whereClause.trim() === '') {
    throw new Error('Invalid WHERE clause: cannot be empty');
  }

  console.log('ArcGIS Query Service: Starting query with WHERE clause:', whereClause);

  try {
    // Use ArcGIS JavaScript API's built-in Query capabilities
    const result = await new Promise<ArcGISQueryResponse>((resolve, reject) => {
      // @ts-expect-error - ArcGIS API dynamic module loading
      require(["esri/rest/query", "esri/rest/support/Query"], (query, Query) => {
        const queryParams = new Query({
          where: whereClause,
          outFields: ["*"],
          returnGeometry: true,
          returnCountOnly: false,
          returnIdsOnly: false
        });

        // Add spatial parameters if provided
        if (spatialParams) {
          console.log('Adding spatial parameters:', spatialParams);
          queryParams.geometry = {
            type: "point",
            longitude: spatialParams.longitude,
            latitude: spatialParams.latitude,
            spatialReference: { wkid: 4326 }
          };
          queryParams.spatialRelationship = "intersects";
          queryParams.distance = spatialParams.distance;
          queryParams.units = spatialParams.units || "kilometers";
        }

        console.log('ArcGIS Query Service: Executing query with ArcGIS API:', {
          url: QUERY_URL,
          where: whereClause,
          outFields: queryParams.outFields
        });

        query.executeQueryJSON(QUERY_URL, queryParams)
          .then((result: any) => {
            console.log('ArcGIS Query Service: Raw query result:', result);
            
            if (result.error) {
              console.error('ArcGIS Query Service: Service returned error:', result.error);
              reject(new Error(`ArcGIS service error: ${result.error.message} (Code: ${result.error.code})`));
              return;
            }

            // Transform the result to match our interface
            const transformedResult: ArcGISQueryResponse = {
              features: result.features ? result.features.map((feature: any) => ({
                attributes: feature.attributes,
                geometry: {
                  x: feature.geometry?.x || 0,
                  y: feature.geometry?.y || 0
                }
              })) : [],
              exceededTransferLimit: result.exceededTransferLimit
            };

            console.log(`ArcGIS Query Service: Successfully fetched ${transformedResult.features.length} features`);
            resolve(transformedResult);
          })
          .catch((error: any) => {
            console.error('ArcGIS Query Service: ArcGIS API query failed:', error);
            reject(error);
          });
      });
    });

    return result;
  } catch (arcgisError) {
    console.warn('ArcGIS Query Service: ArcGIS API failed, trying fallback fetch:', arcgisError);
    
    // Fallback to fetch if ArcGIS API fails
    const encodedWhere = encodeURIComponent(whereClause);
    let jsonpUrl = `${QUERY_URL}?where=${encodedWhere}&outFields=*&returnGeometry=true&f=pjson`;
    
    // Add spatial parameters to URL if provided
    if (spatialParams) {
      const geometry = `${spatialParams.longitude},${spatialParams.latitude}`;
      const encodedGeometry = encodeURIComponent(geometry);
      jsonpUrl += `&geometry=${encodedGeometry}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=${spatialParams.distance}&units=${spatialParams.units || 'esriSRUnit_Kilometer'}`;
    }
    
    console.log('ArcGIS Query Service: Fallback to fetch:', jsonpUrl);

    const response = await fetch(jsonpUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('ArcGIS Query Service: Fetch error response:', responseText);
      throw new Error(`ArcGIS service HTTP error: ${response.status} - ${response.statusText}`);
    }

    const data: ArcGISQueryResponse = await response.json();
    
    // Check for ArcGIS service errors
    if (data.error) {
      console.error('ArcGIS Query Service: Service returned error:', data.error);
      throw new Error(`ArcGIS service error: ${data.error.message} (Code: ${data.error.code})`);
    }

    // Validate response structure
    if (!Array.isArray(data.features)) {
      console.warn('ArcGIS Query Service: Unexpected response format, features is not an array:', data);
      return { features: [] };
    }

    // Log successful response
    console.log(`ArcGIS Query Service: Successfully fetched ${data.features.length} features`);
    
    if (data.exceededTransferLimit) {
      console.warn('ArcGIS Query Service: Transfer limit exceeded, results may be incomplete');
    }

    // Validate feature structure
    const validFeatures = data.features.filter(feature => {
      const hasGeometry = feature.geometry && 
                         typeof feature.geometry.x === 'number' && 
                         typeof feature.geometry.y === 'number';
      const hasAttributes = feature.attributes && typeof feature.attributes === 'object';
      
      if (!hasGeometry || !hasAttributes) {
        console.warn('ArcGIS Query Service: Invalid feature structure:', feature);
        return false;
      }
      return true;
    });

    console.log(`ArcGIS Query Service: ${validFeatures.length} valid features out of ${data.features.length} total`);

    console.log('=== ARCGIS QUERY SERVICE SUCCESS ===');
    return {
      features: validFeatures,
      exceededTransferLimit: data.exceededTransferLimit
    };
  }
}

// Utility function to validate WHERE clause syntax
export function validateWhereClause(whereClause: string): { isValid: boolean; error?: string } {
  try {
    // Basic validation - check for common SQL injection patterns and syntax
    const dangerous = ['DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', '--', ';'];
    const upperClause = whereClause.toUpperCase();
    
    for (const pattern of dangerous) {
      if (upperClause.includes(pattern)) {
        return { isValid: false, error: `Potentially dangerous SQL pattern detected: ${pattern}` };
      }
    }

    // Check for balanced quotes
    const singleQuotes = (whereClause.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      return { isValid: false, error: 'Unbalanced single quotes in WHERE clause' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
