export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  layer_id?: number;
  service_name?: string;
  geometry_type?: string;
}

export interface DatasetExamples {
  [key: string]: string[];
}

export class DatasetExampleService {
  private static generateExamplesForLayer(dataset: DatasetInfo): string[] {
    const datasetId = dataset.id;
    const examples: string[] = [];
    
    // Dataset-specific examples with guaranteed different results
    switch (datasetId) {
      case 'ev_charging_0':
        examples.push(
          `Show all EV charging stations`,
          `Find Tesla Supercharger stations`,
          `Show ChargePoint network locations`,
          `Find Level 2 charging stations`,
          `Locate DC fast chargers`
        );
        break;
        
      case 'la_mesa_electrical_0':
        examples.push(
          `Show all electrical meters`,
          `Find residential electrical meters`,
          `Show SDGE electrical connections`,
          `Find verified electrical installations`,
          `Locate active electrical meters`
        );
        break;
        
      case 'la_mesa_electrical_2':
        examples.push(
          `Show all service panels`,
          `Find outdoor service panels`,
          `Show electrical service equipment`,
          `Find commercial service panels`,
          `Locate service panel installations`
        );
        break;
        
      case 'la_mesa_electrical_3':
        examples.push(
          `Show all tree wells with outlets`,
          `Find tree wells near downtown`,
          `Show tree well electrical connections`,
          `Find street tree electrical outlets`,
          `Locate tree well infrastructure`
        );
        break;
        
      case 'la_mesa_electrical_4':
        examples.push(
          `Show all acorn lights with base and top outlets`,
          `Find heritage acorn lighting`,
          `Show decorative lights with dual outlets`,
          `Find acorn lights on main streets`,
          `Locate ornamental street lighting`
        );
        break;
        
      case 'la_mesa_electrical_5':
        examples.push(
          `Show all acorn lights with top outlets`,
          `Find decorative street lights`,
          `Show acorn lights with top access`,
          `Find heritage lighting infrastructure`,
          `Locate vintage style street lights`
        );
        break;
        
      case 'la_mesa_gas_0':
        examples.push(
          `Show all gas meters`,
          `Find residential gas meters`,
          `Show commercial gas connections`,
          `Find SDGE gas infrastructure`,
          `Locate active gas utility meters`
        );
        break;
        
      // Water UN datasets
      case 'water_un_0':
        examples.push(
          `Show all water devices`,
          `Find water monitoring equipment`,
          `Show water infrastructure devices`,
          `Find operational water devices`,
          `Locate water system equipment`
        );
        break;
        
      case 'water_un_1':
        examples.push(
          `Show all water assembly components`,
          `Find water assembly infrastructure`,
          `Show water system assemblies`,
          `Find main water assemblies`,
          `Locate water assembly points`
        );
        break;
        
      case 'water_un_2':
        examples.push(
          `Show all water junctions`,
          `Find main water junctions`,
          `Show water network connections`,
          `Find critical water junctions`,
          `Locate water distribution junctions`
        );
        break;
        

        
      case 'water_un_4':
        examples.push(
          `Show all water network infrastructure`,
          `Find water network components`,
          `Show water system network`,
          `Find main water network`,
          `Locate water infrastructure network`
        );
        break;
        
      case 'water_un_5':
        examples.push(
          `Show all structure junctions`,
          `Find structural junction points`,
          `Show water structure connections`,
          `Find main structure junctions`,
          `Locate structural network junctions`
        );
        break;
        
      case 'water_un_6':
        examples.push(
          `Show all structure lines`,
          `Find structural boundaries`,
          `Show structure line network`,
          `Find main structure lines`,
          `Locate structural line infrastructure`
        );
        break;
        
      case 'water_un_7':
        examples.push(
          `Show all structure boundaries`,
          `Find structural boundary areas`,
          `Show water system boundaries`,
          `Find main boundary structures`,
          `Locate structural boundary zones`
        );
        break;
        
      case 'water_un_9':
        examples.push(
          `Show all dirty areas`,
          `Find areas needing maintenance`,
          `Show contaminated zones`,
          `Find cleanup required areas`,
          `Locate maintenance priority zones`
        );
        break;
        
      default:
        // Generic fallback examples
        examples.push(
          `Show all ${dataset.name.toLowerCase()}`,
          `Find main ${dataset.name.toLowerCase()}`,
          `Show active ${dataset.name.toLowerCase()}`,
          `Find verified ${dataset.name.toLowerCase()}`,
          `Locate public ${dataset.name.toLowerCase()}`
        );
        break;
    }
    
    // Always return exactly 5 examples
    return examples.slice(0, 5);
  }
  
  public static generateDatasetExamples(datasets: DatasetInfo[]): DatasetExamples {
    const examples: DatasetExamples = {};
    
    datasets.forEach(dataset => {
      examples[dataset.id] = this.generateExamplesForLayer(dataset);
    });
    
    return examples;
  }
  
  public static getDatasetDisplayName(datasetId: string, datasets: DatasetInfo[]): string {
    const dataset = datasets.find(d => d.id === datasetId);
    return dataset?.name || 'Infrastructure';
  }
  
  public static groupDatasetsByService(datasets: DatasetInfo[]): Record<string, DatasetInfo[]> {
    const grouped: Record<string, DatasetInfo[]> = {};
    
    datasets.forEach(dataset => {
      const serviceName = dataset.service_name || 'other';
      if (!grouped[serviceName]) {
        grouped[serviceName] = [];
      }
      grouped[serviceName].push(dataset);
    });
    
    return grouped;
  }
  
  public static getServiceDisplayName(serviceName: string): string {
    const serviceNames: Record<string, string> = {
      'ev_charging': 'EV Charging Stations',
      'la_mesa_electrical': 'La Mesa Electrical Infrastructure',
      'la_mesa_gas': 'La Mesa Gas Infrastructure',
      'water_un': 'Water Infrastructure (UN)',
      'other': 'Other Services'
    };
    
    return serviceNames[serviceName] || serviceName;
  }
} 