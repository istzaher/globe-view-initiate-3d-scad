// src/services/pythonApiService.ts

import { ArcGISFeature } from './arcgisQueryService';
import { GeocodingResult } from './geocodingService';

// Use relative URL in development to leverage Vite proxy, absolute URL in production
const API_BASE_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

export interface Dataset {
  id: string;
  name: string;
  description: string;
  layer_id?: number;
  service_name?: string;
  geometry_type?: string;
  requires_auth?: boolean;
  auth_server?: string;
}

interface QueryMetadata {
  where_clause: string;
  location_lat: number | null;
  location_lon: number | null;
  distance_km: number;
  feature_count: number;
  dataset: string;
  dataset_name: string;
  spatial_reference: number;
  requires_auth?: boolean;
  authenticated?: boolean;
}

export interface ParseResult {
  features: ArcGISFeature[];
  queryMetadata: QueryMetadata;
}

export interface DatasetResponse {
  datasets: Dataset[];
}

export interface ServiceInfo {
  name: string;
  url: string;
  description: string;
  discovered_layers: string[];
  requires_auth?: boolean;
  auth_server?: string;
}

export interface ServicesResponse {
  services: ServiceInfo[];
  total_datasets: number;
}

export interface ArcGISQuery {
  where: string;
  geometry?: string;
  geometryType?: string;
  inSR?: string;
  spatialRel?: string;
  outFields: string;
  returnGeometry?: boolean;
  f: string;
  distance?: number; // Distance in kilometers
}

export interface QueryParseResult {
  arcgis_query: ArcGISQuery;
  extracted_location?: GeocodingResult;
  service_url: string;
}

export interface SpacyConfigResponse {
  status: string;
  total_categories: number;
  total_patterns: number;
  dataset_categories: Record<string, string>;
  pattern_examples: Record<string, string[]>;
}

export interface FieldDiscoveryResponse {
  layer_name: string;
  total_fields: number;
  field_categories: Record<string, string>;
  semantic_mappings: Record<string, string>;
  sample_queries: string[];
}

class PythonApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async parseQuery(query: string, dataset: string = 'ev_charging_0', authToken?: string): Promise<ParseResult> {
    try {
      console.log(`🔍 Sending query to backend: "${query}" for dataset: ${dataset}`);
      if (authToken) {
        console.log('🔐 Including authentication token in request');
      }

      const requestBody = {
        query,
        dataset,
        ...(authToken && { token: authToken })
      };

      const response = await fetch(`${this.baseUrl}/api/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({ detail: 'Authentication required' }));
          throw new Error(`Authentication required: ${errorData.detail || 'Please provide valid credentials'}`);
        }
        
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }

      const result: ParseResult = await response.json();
      
      console.log(`✅ Query successful: Found ${result.queryMetadata.feature_count} features`);
      if (result.queryMetadata.requires_auth) {
        console.log(`🔐 Dataset requires authentication: ${result.queryMetadata.authenticated ? 'Authenticated' : 'Not authenticated'}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing query:', error);
      throw error;
    }
  }

  async getAvailableDatasets(): Promise<DatasetResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/datasets`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Available datasets:', result.datasets.length);
      
      // Log authentication requirements
      const authRequired = result.datasets.filter((d: Dataset) => d.requires_auth);
      if (authRequired.length > 0) {
        console.log(`🔐 Datasets requiring authentication: ${authRequired.map((d: Dataset) => d.name).join(', ')}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching datasets:', error);
      throw error;
    }
  }

  async getServicesInfo(): Promise<ServicesResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/services`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching services info:', error);
      throw error;
    }
  }

  async getSpacyConfig(): Promise<SpacyConfigResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/spacy/config`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch spaCy config: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching spaCy config:', error);
      throw error;
    }
  }

  async discoverFields(dataset: string): Promise<FieldDiscoveryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/spacy/discover-fields?dataset=${encodeURIComponent(dataset)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to discover fields: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error discovering fields:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  /**
   * Check if a dataset requires authentication
   */
  async checkDatasetAuthRequirement(datasetId: string): Promise<boolean> {
    try {
      const datasetsResponse = await this.getAvailableDatasets();
      const dataset = datasetsResponse.datasets.find(d => d.id === datasetId);
      return dataset?.requires_auth || false;
    } catch (error) {
      console.error('Error checking dataset auth requirement:', error);
      return false;
    }
  }

  /**
   * Get authentication server URL for a dataset
   */
  async getDatasetAuthServer(datasetId: string): Promise<string | null> {
    try {
      const datasetsResponse = await this.getAvailableDatasets();
      const dataset = datasetsResponse.datasets.find(d => d.id === datasetId);
      return dataset?.auth_server || null;
    } catch (error) {
      console.error('Error getting dataset auth server:', error);
      return null;
    }
  }
}

export const pythonApiService = new PythonApiService(); 