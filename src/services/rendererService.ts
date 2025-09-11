import { spacyConfigService } from './spacyConfigService';

export interface ArcGISSymbol {
  type: "simple-marker" | "picture-marker" | "simple-line";
  color?: string;
  size?: number; // Optional - required for simple-marker, not used for picture-marker
  outline?: {
    color: string;
    width: number;
  };
  url?: string;
  width?: number;
  height?: number;
  style?: "circle" | "square" | "cross" | "x" | "diamond" | "triangle" | "path" | "solid" | "dash" | "dot" | "dash-dot";
  path?: string;
}

export interface UniqueValueInfo {
  value: string;
  symbol: ArcGISSymbol;
}

export interface Renderer {
  type: "uniqueValue" | "simple";
  field?: string;
  uniqueValueInfos?: UniqueValueInfo[];
  defaultSymbol?: ArcGISSymbol;
  symbol?: ArcGISSymbol;
}

interface SemanticAnalysis {
  category: string;
  confidence: number;
  tags: string[];
}

/**
 * Enhanced Renderer Service using spaCy-based semantic analysis
 * Replaces if/else conditions with NLP-based pattern matching
 */
export class RendererService {
  private rendererCache: Map<string, Renderer> = new Map();
  private semanticSymbolCache: Map<string, ArcGISSymbol> = new Map();

  constructor() {
    console.log('🧠 RendererService initialized with spaCy-based configuration');
  }

  /**
   * Gets the symbol for a feature using spaCy-based semantic analysis
   * @param featureAttributes The attributes of the feature
   * @param dataset The dataset identifier
   * @returns The symbol to be used for the feature
   */
  getSymbol(featureAttributes: { [key: string]: unknown }, dataset: string = "ev_charging"): ArcGISSymbol {
    console.log(`🎨 Getting symbol for dataset: ${dataset}`);
    console.log(`🔍 Feature attributes:`, featureAttributes);

    // Use spaCy-based semantic analysis to determine symbol
    const semantics = spacyConfigService.analyzeDatasetSemantics(dataset);
    
    console.log(`🧠 Semantic analysis: category=${semantics.category}, confidence=${semantics.confidence}`);

    // Get renderer based on semantic analysis
    const renderer = this.getSemanticRenderer(dataset, semantics);
    
    console.log(`🎯 Renderer type: ${renderer.type}, field: ${renderer.field}`);
    
    if (renderer.type === "simple") {
      const symbol = renderer.symbol || renderer.defaultSymbol!;
      console.log(`✅ Simple renderer - ${this.getSemanticDisplayName(dataset)}`);
      console.log(`   📐 Shape: ${symbol.style || 'circle'}, Color: ${symbol.color}, Size: ${symbol.size || symbol.width}`);
      return symbol;
    }

    if (renderer.type === "uniqueValue" && renderer.field) {
      console.log(`🔍 UniqueValue renderer for ${dataset} using field: ${renderer.field}`);
      
      // Try different field names for categorization
      let fieldValue: unknown;
      const possibleFields = ['LINETYPE', 'Type', 'LINE_TYPE', 'CATEGORY', 'Status', 'Material', 'LINE_MATERIAL', 'ASSETGROUP', 'AssetGroup', 'assetgroup'];
      
      for (const fieldName of possibleFields) {
        if (featureAttributes[fieldName] !== undefined && featureAttributes[fieldName] !== null) {
          fieldValue = featureAttributes[fieldName];
          console.log(`💧 Using field ${fieldName} with value: "${fieldValue}" (type: ${typeof fieldValue}) for water line categorization`);
          break;
        }
      }

      if (!fieldValue) {
        console.log(`⚠️ No categorization field found for ${dataset}, using default symbol. Available fields:`, Object.keys(featureAttributes));
        
        // Debug: Log all available attributes for EV charging stations
        if (dataset.includes('ev_charging')) {
          console.log(`🔋 EV charging attributes available:`, Object.keys(featureAttributes));
          console.log(`🔋 Sample attribute values:`, featureAttributes);
          console.log(`🔋 Groups_Wit value: "${featureAttributes.Groups_Wit}" (type: ${typeof featureAttributes.Groups_Wit})`);
          console.log(`🔋 Status_Cod value: "${featureAttributes.Status_Cod}" (type: ${typeof featureAttributes.Status_Cod})`);
          console.log(`🔋 Access_Cod value: "${featureAttributes.Access_Cod}" (type: ${typeof featureAttributes.Access_Cod})`);
        }
        
        console.log(`⚠️ Default symbol:`, renderer.defaultSymbol);
        return renderer.defaultSymbol!;
      }

      // Use semantic analysis to match field values
      const symbolMatch = this.findSemanticSymbolMatch(
        String(fieldValue), 
        renderer.uniqueValueInfos || [], 
        semantics
      );
      
      if (symbolMatch) {
        console.log(`🎯 Using semantic symbol match: "${symbolMatch.value}" for field value "${fieldValue}" in ${dataset}`);
        console.log(`🎯 Matched symbol:`, symbolMatch.symbol);
        return symbolMatch.symbol;
      } else {
        console.log(`⚠️ No symbol match found for field value "${fieldValue}" in ${dataset}, using default symbol`);
        console.log(`⚠️ Available unique values:`, renderer.uniqueValueInfos?.map(u => u.value));
        console.log(`⚠️ Default symbol:`, renderer.defaultSymbol);
      }
    }
    
    console.log(`⚡ Using default symbol for ${dataset}`);
    const defaultSymbol = renderer.defaultSymbol!;
    if (defaultSymbol.type === "simple-marker") {
      console.log(`   📐 Default Shape: ${defaultSymbol.style || 'circle'}, Color: ${defaultSymbol.color}, Size: ${defaultSymbol.size}`);
    } else if (defaultSymbol.type === "simple-line") {
      console.log(`   📐 Default Line: Color: ${defaultSymbol.color}, Width: ${defaultSymbol.width}, Style: ${defaultSymbol.style}`);
    }
    return defaultSymbol;
  }

  /**
   * Get renderer based on specific dataset ID mapping
   */
  private getSemanticRenderer(dataset: string, semantics: SemanticAnalysis): Renderer {
    console.log(`🎯 Getting semantic renderer for dataset: ${dataset}`);
    
    const cacheKey = dataset;
    
    if (this.rendererCache.has(cacheKey)) {
      console.log(`📋 Using cached renderer for ${dataset}`);
      return this.rendererCache.get(cacheKey)!;
    }

    let renderer: Renderer;

    // First try explicit dataset ID mapping to ensure each dataset gets its correct icon
    if (dataset.includes('ev_charging')) {
      console.log(`🔋 Using EV charging renderer for dataset: ${dataset}`);
      renderer = this.createEVChargingRenderer();
    } else if (dataset === 'la_mesa_electrical_0') {
      // Electrical Meters
      console.log(`⚡ Using electrical meter renderer for dataset: ${dataset}`);
      renderer = this.createElectricalMeterRenderer();
    } else if (dataset === 'la_mesa_electrical_2') {
      // Service Panels
      console.log(`🔧 Using service panel renderer for dataset: ${dataset}`);
      renderer = this.createServicePanelRenderer();
    } else if (dataset === 'la_mesa_electrical_3') {
      // Tree Wells with Outlets
      console.log(`🌳 Using tree well renderer for dataset: ${dataset}`);
      renderer = this.createTreeWellRenderer();
    } else if (dataset === 'la_mesa_electrical_4' || dataset === 'la_mesa_electrical_5') {
      // Acorn Lights (both base+top and top only)
      console.log(`💡 Using acorn light renderer for dataset: ${dataset}`);
      renderer = this.createAcornLightRenderer(dataset);
    } else if (dataset === 'la_mesa_gas_0') {
      // Gas Meters
      console.log(`🔥 Using gas meter renderer for dataset: ${dataset}`);
      renderer = this.createGasMeterRenderer();
    } else if (dataset.startsWith('water_un_')) {
      // Water infrastructure layers
      console.log(`💧 Using water infrastructure renderer for dataset: ${dataset}`);
      renderer = this.createWaterRenderer(dataset);
    } else {
      // Fallback to semantic analysis for unknown datasets
      console.log(`🤔 Using semantic fallback for dataset: ${dataset} (category: ${semantics.category})`);
      switch (semantics.category) {
        case 'ev_charging':
          renderer = this.createEVChargingRenderer();
          break;
        case 'electrical_meter':
          renderer = this.createElectricalMeterRenderer();
          break;
        case 'gas_meter':
          renderer = this.createGasMeterRenderer();
          break;
        case 'service_panel':
          renderer = this.createServicePanelRenderer();
          break;
        case 'tree_well':
          renderer = this.createTreeWellRenderer();
          break;
        case 'acorn_light':
          renderer = this.createAcornLightRenderer(dataset);
          break;
        default:
          renderer = this.createGenericRenderer(semantics);
      }
    }

    console.log(`✅ Caching renderer for ${dataset}`);
    this.rendererCache.set(cacheKey, renderer);
    return renderer;
  }

  /**
   * Find semantic symbol match for a given field value
   */
  private findSemanticSymbolMatch(
    fieldValue: string,
    uniqueValueInfos: Array<{ value: unknown; symbol: ArcGISSymbol }>,
    semantics: Record<string, unknown>
  ): { value: unknown; symbol: ArcGISSymbol } | null {
    console.log(`🔍 Finding symbol match for field value: "${fieldValue}" (type: ${typeof fieldValue})`);
    console.log(`🔍 Available unique values:`, uniqueValueInfos.map(info => ({ value: info.value, type: typeof info.value })));
    
    // First try exact match (both string and number)
    for (const info of uniqueValueInfos) {
      if (info.value === fieldValue || String(info.value) === fieldValue) {
        console.log(`✅ Exact match found: ${info.value}`);
        return info;
      }
    }

    // For numeric values, try converting field value to number
    const numericValue = Number(fieldValue);
    if (!isNaN(numericValue)) {
      console.log(`🔢 Trying numeric conversion: ${fieldValue} → ${numericValue}`);
      for (const info of uniqueValueInfos) {
        const infoNumeric = Number(info.value);
        if (!isNaN(infoNumeric) && infoNumeric === numericValue) {
          console.log(`✅ Numeric match found: ${info.value} (${infoNumeric}) matches ${numericValue}`);
          return info;
        }
      }
    }

    // Try string-based numeric match (for cases like "1" vs 1)
    const fieldValueStr = String(fieldValue);
    for (const info of uniqueValueInfos) {
      const infoStr = String(info.value);
      if (infoStr === fieldValueStr) {
        console.log(`✅ String match found: "${infoStr}" matches "${fieldValueStr}"`);
        return info;
      }
    }

    console.log(`❌ No match found for field value: "${fieldValue}"`);
    return null;
  }

  /**
   * Create EV charging station renderer with proper status-based symbols
   */
  private createEVChargingRenderer(): Renderer {
    console.log(`🔋 Creating EV charging renderer with Groups_Wit field`);
    
    const renderer = {
      type: "uniqueValue" as const,
      field: "Groups_Wit", // Field that indicates availability status
      uniqueValueInfos: [
        {
          value: "Public",
          symbol: {
            type: "picture-marker" as const,
            url: "/icons/ev-marker-green.png", // Available stations - green
            width: "24px",
            height: "24px"
          }
        },
        {
          value: "Private",
          symbol: {
            type: "picture-marker" as const,
            url: "/icons/ev-marker-red.png", // Private/occupied stations - red  
            width: "24px",
            height: "24px"
          }
        },
        {
          value: "Government",
          symbol: {
            type: "picture-marker" as const,
            url: "/icons/ev-marker-green.png", // Government stations - green
            width: "24px",
            height: "24px"
          }
        }
      ],
      defaultSymbol: {
        type: "picture-marker" as const,
        url: "/icons/ev-marker-green.png", // Default to green since gray doesn't exist
        width: "24px", 
        height: "24px"
      }
    };
    
    console.log(`🔋 EV charging renderer created:`, renderer);
    return renderer;
  }

  /**
   * Create electrical meter renderer
   */
  private createElectricalMeterRenderer(): Renderer {
    return {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "/icons/electric-meter.png",
        width: 20,
        height: 20
      }
    };
  }

  /**
   * Create gas meter renderer
   */
  private createGasMeterRenderer(): Renderer {
    return {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "/icons/gas-meter.png",
        width: 20,
        height: 20
      }
    };
  }

  /**
   * Create service panel renderer using your service-panels.png icon
   */
  private createServicePanelRenderer(): Renderer {
    return {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "/icons/service-panels.png",
        width: 20,
        height: 20
      }
    };
  }

  /**
   * Create tree well renderer using your nature icon
   */
  private createTreeWellRenderer(): Renderer {
    return {
      type: "uniqueValue",
      field: "Outlet",
      uniqueValueInfos: [
        {
          value: "Yes",
          symbol: {
            type: "picture-marker",
            url: "/icons/nature.png",
            width: 20,
            height: 20
          }
        },
        {
          value: "No",
          symbol: {
            type: "simple-marker",
            color: "#8B4513",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "circle"
          }
        }
      ],
      defaultSymbol: {
        type: "picture-marker",
        url: "/icons/nature.png",
        width: 18,
        height: 18
      }
    };
  }

  /**
   * Create acorn light renderer using your street-lamp.png icon
   */
  private createAcornLightRenderer(dataset: string): Renderer {
    return {
      type: "simple",
      symbol: {
        type: "picture-marker",
        url: "/icons/street-lamp.png",
        width: 20,
        height: 20
      }
    };
  }

  /**
   * Create water infrastructure renderer with proper line/point symbols for each layer
   */
  private createWaterRenderer(dataset: string): Renderer {
    console.log(`🌊 Creating water renderer for dataset: ${dataset}`);
    

    
    // Structure Line (water_un_6) also needs line rendering
    if (dataset === 'water_un_6') {
      console.log(`🏗️ Creating structure line renderer for ${dataset}`);
      return this.createStructureLineRenderer();
    }
    
    console.log(`🔵 Creating point-based water renderer for ${dataset}`);
    
    // Point-based water infrastructure with new picture markers
    const waterConfigs = {
      'water_un_0': { 
        icon: '/icons/water_device.png',
        name: 'Water Device'
      },
      'water_un_1': { 
        icon: '/icons/water_assembly.png',
        name: 'Water Assembly'
      },
      'water_un_2': { 
        icon: '/icons/water_junction.png',
        name: 'Water Junction'
      },
      'water_un_4': { 
        icon: '/icons/water_network.png',
        name: 'Water Network'
      },
      'water_un_5': { 
        icon: '/icons/structure_junction.png',
        name: 'Structure Junction'
      },
      'water_un_7': { 
        icon: '/icons/structure_junction.png',
        name: 'Structure Boundary'
      },
      'water_un_9': { 
        color: '#B30000', 
        symbol: 'x', 
        name: 'Dirty Areas' // Keep as red X marker
      }
    };

    const config = waterConfigs[dataset];
    if (config) {
      if ('icon' in config) {
        // Picture marker symbol
        return {
          type: "uniqueValue" as const,
          field: "Status",
          defaultSymbol: {
            type: "picture-marker" as const,
            url: config.icon,
            width: 24,
            height: 24
          },
          uniqueValueInfos: []
        };
      } else {
        // Simple marker symbol  
        return {
          type: "uniqueValue" as const,
          field: "Status",
          defaultSymbol: {
            type: "simple-marker" as const,
            color: config.color,
            size: 8,
            style: config.symbol as "circle" | "square" | "cross" | "x" | "diamond" | "triangle"
          },
          uniqueValueInfos: []
        };
      }
    }
    
    console.log(`⚡ Using default symbol for ${dataset}`);
    const defaultSymbol = {
      type: "simple-marker",
      color: "#888888",
      size: 12,
      outline: {
        color: "#FFFFFF",
        width: 2
      },
      style: "circle"
    };
    console.log(`   📐 Default Shape: ${defaultSymbol.style || 'circle'}, Color: ${defaultSymbol.color}, Size: ${defaultSymbol.size}`);
    return {
      type: "simple",
      symbol: defaultSymbol
    };
  }

  /**
   * Create water line renderer with proper line symbols based on ASSETGROUP field
   */
  private createWaterLineRenderer(): Renderer {
    console.log(`🌊 Creating water line renderer with ASSETGROUP field`);
    
    const renderer = {
      type: "uniqueValue" as const,
      field: "ASSETGROUP", // Use ASSETGROUP field as specified in drawing info
      uniqueValueInfos: [
        {
          value: "0",
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [239, 207, 252, 255] - Light purple
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: "1",
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [184, 252, 179, 255] - Light green
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: "2",
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [252, 211, 182, 255] - Light orange
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: "50",
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [189, 249, 252, 255] - Light cyan
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: "51",
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [248, 252, 197, 255] - Light yellow
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: "52",
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [252, 184, 195, 255] - Light pink
            width: 1,
            style: "solid" as const
          }
        },
        // Add numeric variations as well
        {
          value: 0,
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [239, 207, 252, 255] - Light purple
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: 1,
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [184, 252, 179, 255] - Light green
            width: 3,
            style: "solid" as const
          }
        },
        {
          value: 2,
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [252, 21
            width: 2,
            style: "solid" as const
          }
        },
        {
          value: 50,
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [189, 249, 252, 255] - Light cyan
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: 51,
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [248, 252, 197, 255] - Light yellow
            width: 1,
            style: "solid" as const
          }
        },
        {
          value: 52,
          symbol: {
            type: "simple-line" as const,
            color: "#000", // [252, 184, 195, 255] - Light pink
            width: 1,
            style: "solid" as const
          }
        }
      ],
      defaultSymbol: {
        type: "simple-line" as const,
        color: "#828282", // [130, 130, 130, 255] - Gray default
        width: 1,
        style: "solid" as const
      }
    };

    console.log(`💧 Water line renderer configuration:`, {
      type: renderer.type,
      field: renderer.field,
      uniqueValueCount: renderer.uniqueValueInfos.length,
      defaultSymbol: renderer.defaultSymbol
    });
    
    return renderer;
  }

  /**
   * Create structure line renderer 
   */
  private createStructureLineRenderer(): Renderer {
    return {
      type: "simple",
      symbol: {
        type: "simple-line",
        color: "#85B3FF",
        width: 2,
        style: "solid"
      }
    };
  }

  /**
   * Create generic renderer based on semantic analysis
   */
  private createGenericRenderer(semantics: SemanticAnalysis): Renderer {
    const color = this.getSemanticColor(semantics);
    
    return {
      type: "simple",
      symbol: {
        type: "simple-marker",
        color: color,
        size: 10,
        outline: {
          color: "#FFFFFF",
          width: 1
        },
        style: "circle"
      }
    };
  }

  /**
   * Get semantic display name for dataset
   */
  private getSemanticDisplayName(dataset: string): string {
    const semantics = spacyConfigService.analyzeDatasetSemantics(dataset);
    return spacyConfigService.getFeatureType(dataset);
  }

  /**
   * Get popup template for a dataset
   */
  getPopupTemplate(dataset: string) {
    const semantics = spacyConfigService.analyzeDatasetSemantics(dataset);
    
    return {
      title: this.getSemanticPopupTitle(dataset, semantics),
      content: this.getSemanticPopupContent(dataset, semantics),
      fieldInfos: this.getSemanticFieldInfos(dataset, semantics)
    };
  }

  /**
   * Get semantic popup title
   */
  private getSemanticPopupTitle(dataset: string, semantics: SemanticAnalysis): string {
    const categoryTitles: Record<string, string> = {
      'ev_charging': '{Station_Na}',
      'electrical_meter': 'Electrical Meter',
      'gas_meter': 'Gas Meter',
      'service_panel': 'Service Panel',
      'tree_well': 'Tree Well with Outlet',
      'acorn_light': 'Acorn Light with Outlet'
    };
    
    return categoryTitles[semantics.category] || 'Infrastructure Feature';
  }

  /**
   * Get semantic popup content
   */
  private getSemanticPopupContent(dataset: string, semantics: SemanticAnalysis): string {
    const contentTemplates: Record<string, string> = {
      'ev_charging': `
        <div style="padding: 10px;">
          <p><strong>Network:</strong> {EV_Network}</p>
          <p><strong>Status:</strong> {Status_Cod}</p>
          <p><strong>Access:</strong> {Groups_Wit}</p>
          <p><strong>Level 1 Ports:</strong> {EV_Level1_}</p>
          <p><strong>Level 2 Ports:</strong> {EV_Level2_}</p>
          <p><strong>DC Fast Charging:</strong> {EV_DC_Fast}</p>
          <p><strong>Address:</strong> {Street_Add}</p>
          <p><strong>City:</strong> {City}</p>
          <p><strong>State:</strong> {State}</p>
          <p><strong>ZIP:</strong> {ZIP}</p>
        </div>
      `,
      'electrical_meter': `
        <div style="padding: 10px;">
          <p><strong>Service Type:</strong> {ServiceType1}</p>
          <p><strong>Status:</strong> {Status}</p>
          <p><strong>Field Verified:</strong> {FieldVerified}</p>
          <p><strong>Address:</strong> {AddrNo}</p>
        </div>
      `,
      'gas_meter': `
        <div style="padding: 10px;">
          <p><strong>Service Type:</strong> {ServiceType1}</p>
          <p><strong>Status:</strong> {Status}</p>
          <p><strong>Field Verified:</strong> {FieldVerified}</p>
          <p><strong>Owner:</strong> {Owner}</p>
        </div>
      `,
      // ===== 5⭐ OPTIMIZED POPUP TEMPLATES =====
      'service_panel': `
        <div style="padding: 10px;">
          <p><strong>Service Description:</strong> {Service_De}</p>
          <p><strong>Type:</strong> {Type}</p>
          <p><strong>Complete:</strong> {Complete}</p>
          <p><strong>Owner:</strong> {Owner}</p>
          <p><strong>Field Verified:</strong> {FieldVerified}</p>
          <p><strong>Service Type 1:</strong> {ServiceType1}</p>
          <p><strong>Service Type 2:</strong> {ServiceType2}</p>
          <p><strong>Address:</strong> {AddrNo} {Route}</p>
          <p><strong>Comments:</strong> {Comments}</p>
        </div>
      `,
      'tree_well': `
        <div style="padding: 10px;">
          <p><strong>Outlet:</strong> {Outlet}</p>
          <p><strong>Service Description:</strong> {Service_De}</p>
          <p><strong>Notes:</strong> {Notes}</p>
          <p><strong>Last Edited:</strong> {last_edited_user}</p>
        </div>
      `,
      'acorn_light': `
        <div style="padding: 10px;">
          <p><strong>Light ID:</strong> {ID}</p>
          <p><strong>Location:</strong> {LOCATION}</p>
          <p><strong>Street:</strong> {STREET}</p>
          <p><strong>Outlet Position:</strong> {OutletPosition}</p>
          <p><strong>Service Description:</strong> {Service_De}</p>
          <p><strong>Light Type:</strong> {LightType}</p>
          <p><strong>Pole Type:</strong> {POLE_TYPE}</p>
          <p><strong>Lamp Heads:</strong> {LAMP_HEADS}</p>
          <p><strong>Zone:</strong> {Zone}</p>
          <p><strong>Cross Street:</strong> {Cross_Street}</p>
          <p><strong>Life Cycle Status:</strong> {LifeCycleStatus}</p>
        </div>
      `
    };
    
    return contentTemplates[semantics.category] || `
      <div style="padding: 10px;">
        <p><strong>Feature Type:</strong> ${semantics.category}</p>
        <p><strong>Dataset:</strong> ${dataset}</p>
      </div>
    `;
  }

  /**
   * Get semantic field information
   */
  private getSemanticFieldInfos(dataset: string, semantics: SemanticAnalysis): unknown[] {
    // Return empty array for now - can be enhanced with field-specific formatting
    return [];
  }

  /**
   * Get semantic color based on analysis
   */
  private getSemanticColor(semantics: SemanticAnalysis): string {
    const colors: Record<string, string> = {
      'electrical': '#FF6B35',
      'gas': '#4ECDC4',
      'service_equipment': '#45B7D1',
      'lighting': '#FFD700',
      'outlet_infrastructure': '#96CEB4'
    };
    
    return colors[semantics.category] || '#888888';
  }

  /**
   * Get legend information
   */
  getLegendInfo() {
    return {
      title: "Infrastructure Features",
      elements: [
        {
          label: "EV Charging - Public",
          symbol: {
            type: "picture-marker",
            url: "/icons/ev-marker-green.png",
            width: 20,
            height: 20
          }
        },
        {
          label: "EV Charging - Private",
          symbol: {
            type: "picture-marker",
            url: "/icons/ev-marker-red.png",
            width: 20,
            height: 20
          }
        },
        {
          label: "Electrical Meter",
          symbol: {
            type: "picture-marker",
            url: "/icons/electric-meter.png",
            width: 20,
            height: 20
          }
        },
        {
          label: "Gas Meter",
          symbol: {
            type: "picture-marker",
            url: "/icons/gas-meter.png",
            width: 20,
            height: 20
          }
        },
        {
          label: "Service Panel",
          symbol: {
            type: "picture-marker",
            url: "/icons/service-panels.png",
            width: 20,
            height: 20
          }
        },
        {
          label: "Acorn Light",
          symbol: {
            type: "picture-marker",
            url: "/icons/street-lamp.png",
            width: 20,
            height: 20
          }
        },
        {
          label: "Tree Well with Outlet",
          symbol: {
            type: "picture-marker",
            url: "/icons/nature.png",
            width: 20,
            height: 20
          }
        },
        // Water Infrastructure Section
        {
          label: "Water Device",
          symbol: {
            type: "simple-marker",
            color: "#0066CC",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "circle"
          }
        },
        {
          label: "Water Assembly",
          symbol: {
            type: "simple-marker",
            color: "#0080FF",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "square"
          }
        },
        {
          label: "Water Junction",
          symbol: {
            type: "simple-marker",
            color: "#4D94FF",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "diamond"
          }
        },
        // Water Line Legend - Updated to match ASSETGROUP specification
        {
          label: "Unknown",
          symbol: {
            type: "simple-line",
            color: "#efcffc", // [239, 207, 252, 255] - Light purple
            width: 1,
            style: "solid"
          }
        },
        {
          label: "Water Main",
          symbol: {
            type: "simple-line",
            color: "#b8fcb3", // [184, 252, 179, 255] - Light green
            width: 1,
            style: "solid"
          }
        },
        {
          label: "Service",
          symbol: {
            type: "simple-line",
            color: "#fcd3b6", // [252, 211, 182, 255] - Light orange
            width: 1,
            style: "solid"
          }
        },
        {
          label: "Bonding Line",
          symbol: {
            type: "simple-line",
            color: "#bdf9fc", // [189, 249, 252, 255] - Light cyan
            width: 1,
            style: "solid"
          }
        },
        {
          label: "Test Lead Wire",
          symbol: {
            type: "simple-line",
            color: "#f8fcc5", // [248, 252, 197, 255] - Light yellow
            width: 1,
            style: "solid"
          }
        },
        {
          label: "Rectifier Cable",
          symbol: {
            type: "simple-line",
            color: "#fcb8c3", // [252, 184, 195, 255] - Light pink
            width: 1,
            style: "solid"
          }
        },
        {
          label: "Water Network",
          symbol: {
            type: "simple-marker",
            color: "#3385FF",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "circle"
          }
        },
        {
          label: "Structure Junction",
          symbol: {
            type: "simple-marker",
            color: "#6B9EFF",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "square"
          }
        },
        {
          label: "Structure Line",
          symbol: {
            type: "simple-line",
            color: "#85B3FF",
            width: 2,
            style: "solid"
          }
        },
        {
          label: "Structure Boundary",
          symbol: {
            type: "simple-marker",
            color: "#A3C7FF",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "triangle"
          }
        },
        {
          label: "Water Utility Network",
          symbol: {
            type: "simple-marker",
            color: "#C2DBFF",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "circle"
          }
        },
        {
          label: "Dirty Areas",
          symbol: {
            type: "simple-marker",
            color: "#B30000",
            size: 12,
            outline: { color: "#FFFFFF", width: 2 },
            style: "x"
          }
        }
      ]
    };
  }
} 