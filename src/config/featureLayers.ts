export interface FeatureLayerConfig {
  id: string;
  title: string;
  url: string;
  visible: boolean;
  category: 'demo' | 'geodatabase';
  renderer?: any;
  popupTemplate?: any;
}

export const FEATURE_LAYERS: FeatureLayerConfig[] = [
  // Demo Layers (Client-side mock data)
  {
    id: 'abu_dhabi_schools',
    title: 'Abu Dhabi Schools',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },
  {
    id: 'abu_dhabi_hospitals',
    title: 'Abu Dhabi Hospitals',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },
  {
    id: 'abu_dhabi_universities',
    title: 'Abu Dhabi Universities',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },
  {
    id: 'abu_dhabi_police_stations',
    title: 'Abu Dhabi Police Stations',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },
  {
    id: 'abu_dhabi_farms',
    title: 'Abu Dhabi Agricultural Areas',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },
  {
    id: 'abu_dhabi_irrigation',
    title: 'Abu Dhabi Irrigation Systems',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },
  {
    id: 'abu_dhabi_roads',
    title: 'Abu Dhabi Road Network',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },
  {
    id: 'abu_dhabi_utilities',
    title: 'Abu Dhabi Utilities',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'demo'
  },

  // Geodatabase Layers (Client-side mock data)
  {
    id: 'gdb_education_facilities',
    title: 'Education Facilities (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  },
  {
    id: 'gdb_healthcare_facilities',
    title: 'Healthcare Facilities (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  },
  {
    id: 'gdb_infrastructure',
    title: 'Infrastructure (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  },
  {
    id: 'gdb_transportation',
    title: 'Transportation (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  },
  {
    id: 'gdb_land_use',
    title: 'Land Use (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  },
  {
    id: 'gdb_utilities',
    title: 'Utilities (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  },
  {
    id: 'gdb_boundaries',
    title: 'Boundaries (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  },
  {
    id: 'gdb_environmental',
    title: 'Environmental (GDB)',
    url: '', // Empty URL indicates client-side layer
    visible: false,
    category: 'geodatabase'
  }
];

// Helper functions
export const getLayerById = (id: string): FeatureLayerConfig | undefined => {
  return FEATURE_LAYERS.find(layer => layer.id === id);
};

export const getLayersByCategory = (category: 'demo' | 'geodatabase'): FeatureLayerConfig[] => {
  return FEATURE_LAYERS.filter(layer => layer.category === category);
};

export const getVisibleLayers = (): FeatureLayerConfig[] => {
  return FEATURE_LAYERS.filter(layer => layer.visible);
};

export const getDemoLayers = (): FeatureLayerConfig[] => {
  return getLayersByCategory('demo');
};

export const getGeodatabaseLayers = (): FeatureLayerConfig[] => {
  return getLayersByCategory('geodatabase');
};

// Layer field configurations for different layer types
export const LAYER_FIELD_MAPPINGS = {
  // Demo layer fields
  schools: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    capacityField: 'Students'
  },
  hospitals: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    capacityField: 'Beds'
  },
  universities: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    capacityField: 'Students'
  },
  police: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    capacityField: 'Officers'
  },
  
  // Geodatabase layer fields
  education_facilities: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    capacityField: 'Capacity'
  },
  healthcare_facilities: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    capacityField: 'Beds'
  },
  infrastructure: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    statusField: 'Status'
  },
  transportation: {
    nameField: 'Name',
    typeField: 'Type',
    lengthField: 'Length_KM',
    statusField: 'Status'
  },
  land_use: {
    typeField: 'Zone_Type',
    locationField: 'District',
    areaField: 'Area_SQM',
    codeField: 'Zoning_Code'
  },
  utilities: {
    nameField: 'Name',
    typeField: 'Type',
    locationField: 'District',
    capacityField: 'Capacity'
  },
  boundaries: {
    nameField: 'Name',
    typeField: 'Type',
    areaField: 'Area_SQM',
    populationField: 'Population'
  },
  environmental: {
    nameField: 'Name',
    typeField: 'Type',
    protectionField: 'Protection_Level',
    areaField: 'Area_SQM'
  }
};

export default FEATURE_LAYERS;
