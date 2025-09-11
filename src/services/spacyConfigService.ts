interface EntityPattern {
  keywords: string[];
  type: 'infrastructure' | 'status' | 'service_type' | 'access' | 'network' | 'verification';
  confidence: number;
}

interface SemanticMapping {
  pattern: string[];
  category: string;
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * spaCy-based Configuration Service
 * Replaces if/else conditions with semantic pattern matching and NLP-based configuration
 */
export class SpacyConfigService {
  private semanticMappings: Map<string, SemanticMapping[]> = new Map();

  constructor() {
    this.initializeSemanticMappings();
  }

  /**
   * Initialize semantic mappings using NLP-based pattern recognition
   */
  private initializeSemanticMappings(): void {
    // Infrastructure type mappings
    this.addSemanticMapping('infrastructure', [
      { pattern: ['electric', 'electrical', 'meter'], category: 'electrical_meter', confidence: 0.95 },
      { pattern: ['gas', 'meter'], category: 'gas_meter', confidence: 0.95 },
      { pattern: ['ev', 'charging', 'station'], category: 'ev_charging', confidence: 0.98 },
      { pattern: ['service', 'panel', 'cabinet'], category: 'service_panel', confidence: 0.90 },
      { pattern: ['tree', 'well', 'outlet'], category: 'tree_well', confidence: 0.88 },
      { pattern: ['acorn', 'light', 'lighting'], category: 'acorn_light', confidence: 0.92 },
      // Water Infrastructure Mappings
      { pattern: ['water', 'device'], category: 'water_device', confidence: 0.95 },
      { pattern: ['water', 'assembly'], category: 'water_assembly', confidence: 0.95 },
      { pattern: ['water', 'junction'], category: 'water_junction', confidence: 0.95 },
      { pattern: ['water', 'line'], category: 'water_line', confidence: 0.95 },
      { pattern: ['water', 'network'], category: 'water_network', confidence: 0.95 },
      { pattern: ['structure', 'junction'], category: 'structure_junction', confidence: 0.90 },
      { pattern: ['structure', 'line'], category: 'structure_line', confidence: 0.90 },
      { pattern: ['structure', 'boundary'], category: 'structure_boundary', confidence: 0.90 },
      { pattern: ['water', 'utility', 'network'], category: 'water_utility_network', confidence: 0.98 },
      { pattern: ['dirty', 'areas'], category: 'dirty_areas', confidence: 0.95 },
    ]);

    // Status mappings
    this.addSemanticMapping('status', [
      { pattern: ['active', 'operational', 'working', 'enabled'], category: 'active', confidence: 0.95 },
      { pattern: ['inactive', 'disabled', 'out_of_service'], category: 'inactive', confidence: 0.95 },
      { pattern: ['available', 'open', 'ready'], category: 'available', confidence: 0.90 },
      { pattern: ['maintenance', 'repair', 'broken'], category: 'maintenance', confidence: 0.85 },
      { pattern: ['verified', 'confirmed', 'validated'], category: 'verified', confidence: 0.92 },
    ]);

    // Service type mappings
    this.addSemanticMapping('service_type', [
      { pattern: ['residential', 'home', 'house'], category: 'residential', confidence: 0.98 },
      { pattern: ['commercial', 'business', 'office'], category: 'commercial', confidence: 0.95 },
      { pattern: ['industrial', 'factory', 'manufacturing'], category: 'industrial', confidence: 0.93 },
    ]);

    // Access type mappings
    this.addSemanticMapping('access', [
      { pattern: ['public', 'open', 'community'], category: 'public', confidence: 0.95 },
      { pattern: ['private', 'restricted', 'limited'], category: 'private', confidence: 0.95 },
    ]);
  }

  /**
   * Add semantic mapping using spaCy-style pattern matching
   */
  private addSemanticMapping(domain: string, mappings: SemanticMapping[]): void {
    if (!this.semanticMappings.has(domain)) {
      this.semanticMappings.set(domain, []);
    }
    this.semanticMappings.get(domain)!.push(...mappings);
  }

  /**
   * Semantic analysis of dataset ID using NLP-based pattern matching
   */
  public analyzeDatasetSemantics(datasetId: string): {
    category: string;
    confidence: number;
    tags: string[];
  } {
    const normalizedId = datasetId.toLowerCase();
    
    // First check for explicit water dataset mappings
    const waterDatasetMappings: Record<string, string> = {
      'water_un_0': 'water_device',
      'water_un_1': 'water_assembly', 
      'water_un_2': 'water_junction',
      'water_un_4': 'water_network',
      'water_un_5': 'structure_junction',
      'water_un_6': 'structure_line',
      'water_un_7': 'structure_boundary',
      'water_un_8': 'water_utility_network',
      'water_un_9': 'dirty_areas'
    };
    
    if (waterDatasetMappings[normalizedId]) {
      return {
        category: waterDatasetMappings[normalizedId],
        confidence: 1.0,
        tags: [normalizedId, waterDatasetMappings[normalizedId]]
      };
    }
    
    // Tokenize dataset ID (split by underscores, numbers, etc.)
    const tokens = normalizedId.split(/[_\d]+/).filter(token => token.length > 1);
    
    let bestMatch = { category: 'unknown', confidence: 0, tags: [] };
    
    // Analyze against semantic mappings
    for (const [domain, mappings] of this.semanticMappings.entries()) {
      for (const mapping of mappings) {
        const matchCount = mapping.pattern.filter(pattern => 
          tokens.some(token => token.includes(pattern) || pattern.includes(token))
        ).length;
        
        const confidence = (matchCount / mapping.pattern.length) * mapping.confidence;
        
        if (confidence > bestMatch.confidence) {
          bestMatch = {
            category: mapping.category,
            confidence: confidence,
            tags: [...mapping.pattern, ...tokens]
          };
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Get feature display name using semantic analysis instead of if/else
   */
  public getFeatureDisplayName(attributes: any, datasetId: string): string {
    const semantics = this.analyzeDatasetSemantics(datasetId);
    
    // Use semantic category to determine naming strategy
    switch (semantics.category) {
      case 'ev_charging':
        return this.extractEVStationName(attributes);
      case 'electrical_meter':
        return this.extractElectricalMeterName(attributes);
      case 'gas_meter':
        return this.extractGasMeterName(attributes);
      case 'service_panel':
        return this.extractServicePanelName(attributes);
      case 'tree_well':
        return this.extractTreeWellName(attributes);
      case 'acorn_light':
        return this.extractAcornLightName(attributes);
      case 'water_device':
      case 'water_assembly':
      case 'water_junction':
      case 'water_line':
      case 'water_network':
      case 'structure_junction':
      case 'structure_line':
      case 'structure_boundary':
      case 'water_utility_network':
      case 'dirty_areas':
        return this.extractWaterInfrastructureName(attributes, semantics.category);
      default:
        return this.extractGenericName(attributes, semantics.tags);
    }
  }

  /**
   * Get feature address using semantic analysis
   */
  public getFeatureAddress(attributes: any, datasetId: string): string {
    // Common address extraction patterns
    const addressFields = ['Street_Add', 'Street_Address', 'AddrNo', 'Address', 'ADDR'];
    const cityFields = ['City', 'CITY'];
    const stateFields = ['State', 'STATE'];
    
    const addressParts = [];
    
    // Extract address using semantic field matching
    for (const field of addressFields) {
      if (attributes[field]) {
        addressParts.push(attributes[field]);
        break;
      }
    }
    
    for (const field of cityFields) {
      if (attributes[field]) {
        addressParts.push(attributes[field]);
        break;
      }
    }
    
    for (const field of stateFields) {
      if (attributes[field]) {
        addressParts.push(attributes[field]);
        break;
      }
    }
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
  }

  /**
   * Get feature type using semantic analysis
   */
  public getFeatureType(datasetId: string): string {
    const semantics = this.analyzeDatasetSemantics(datasetId);
    
    // Map semantic categories to display types
    const typeMapping: Record<string, string> = {
      'ev_charging': 'EV Charging Station',
      'electrical_meter': 'Electrical Meter',
      'gas_meter': 'Gas Meter',
      'service_panel': 'Service Panel',
      'tree_well': 'Tree Well with Outlet',
      'acorn_light': 'Acorn Light with Outlet',
      'water_device': 'Water Device',
      'water_assembly': 'Water Assembly',
      'water_junction': 'Water Junction',
      'water_line': 'Water Line',
      'water_network': 'Water Network',
      'structure_junction': 'Structure Junction',
      'structure_line': 'Structure Line',
      'structure_boundary': 'Structure Boundary',
      'water_utility_network': 'Water Utility Network',
      'dirty_areas': 'Dirty Areas'
    };
    
    return typeMapping[semantics.category] || 'Infrastructure';
  }

  // Semantic extraction methods (replace if/else with pattern matching)
  private extractEVStationName(attributes: any): string {
    const nameFields = ['Station_Na', 'Station_Name', 'Name', 'STATION_NAME'];
    for (const field of nameFields) {
      if (attributes[field]) return attributes[field];
    }
    return 'Unnamed Station';
  }

  private extractElectricalMeterName(attributes: any): string {
    if (attributes.SDGE_Meter) return `Electrical Meter #${attributes.SDGE_Meter}`;
    if (attributes.AddrNo) return `Electrical Meter at ${attributes.AddrNo}`;
    return 'Electrical Meter';
  }

  private extractGasMeterName(attributes: any): string {
    if (attributes.AddrNo) return `Gas Meter at ${attributes.AddrNo}`;
    return 'Gas Meter';
  }

  private extractServicePanelName(attributes: any): string {
    // Use real database fields from schema analysis
    if (attributes.Service_De && attributes.AddrNo) {
      return `Service Panel ${attributes.Service_De} at ${attributes.AddrNo} ${attributes.Route || ''}`.trim();
    }
    if (attributes.Service_De) return `Service Panel ${attributes.Service_De}`;
    if (attributes.AddrNo) return `Service Panel at ${attributes.AddrNo} ${attributes.Route || ''}`.trim();
    return 'Service Panel';
  }

  private extractTreeWellName(attributes: any): string {
    // Use real database fields from schema analysis
    if (attributes.Service_De) {
      const outletInfo = attributes.Outlet === 'Yes' ? 'with Outlet' : 'without Outlet';
      return `Tree Well ${attributes.Service_De} (${outletInfo})`;
    }
    if (attributes.Outlet) {
      const outletInfo = attributes.Outlet === 'Yes' ? 'with Outlet' : 'without Outlet';
      return `Tree Well ${outletInfo}`;
    }
    return 'Tree Well';
  }

  private extractAcornLightName(attributes: any): string {
    // Use real database fields from schema analysis
    if (attributes.ID && attributes.LOCATION) {
      const outletInfo = attributes.OutletPosition ? ` (${attributes.OutletPosition} Outlet)` : '';
      return `${attributes.ID} at ${attributes.LOCATION}${outletInfo}`;
    }
    if (attributes.ID) return `Acorn Light ${attributes.ID}`;
    if (attributes.LOCATION) {
      const outletInfo = attributes.OutletPosition ? ` (${attributes.OutletPosition} Outlet)` : '';
      return `Acorn Light at ${attributes.LOCATION}${outletInfo}`;
    }
    return 'Acorn Light';
  }

  private extractWaterInfrastructureName(attributes: any, category: string): string {
    // Map categories to display names
    const categoryNames: Record<string, string> = {
      'water_device': 'Water Device',
      'water_assembly': 'Water Assembly',
      'water_junction': 'Water Junction',
      'water_line': 'Water Line',
      'water_network': 'Water Network',
      'structure_junction': 'Structure Junction',
      'structure_line': 'Structure Line',
      'structure_boundary': 'Structure Boundary',
      'water_utility_network': 'Water Utility Network',
      'dirty_areas': 'Dirty Area'
    };

    const baseName = categoryNames[category] || 'Water Infrastructure';

    // Try to find identifier fields in order of preference
    if (attributes.OBJECTID) {
      return `${baseName} #${attributes.OBJECTID}`;
    }
    if (attributes.ID) {
      return `${baseName} ${attributes.ID}`;
    }
    if (attributes.Name || attributes.NAME) {
      return `${baseName}: ${attributes.Name || attributes.NAME}`;
    }
    if (attributes.Description || attributes.DESCRIPTION) {
      return `${baseName}: ${attributes.Description || attributes.DESCRIPTION}`;
    }
    if (attributes.Type || attributes.TYPE) {
      return `${baseName} (${attributes.Type || attributes.TYPE})`;
    }

    return baseName;
  }

  private extractGenericName(attributes: any, tags: string[]): string {
    // Use semantic tags to guide generic name extraction
    const idField = attributes.OBJECTID ? `Feature #${attributes.OBJECTID}` : 'Unknown Feature';
    const typeHint = tags.length > 0 ? ` (${tags[0]})` : '';
    return idField + typeHint;
  }
}

// Export both class and singleton instance
export const spacyConfigService = new SpacyConfigService(); 