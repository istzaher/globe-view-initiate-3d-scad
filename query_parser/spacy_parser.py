"""
Enhanced Natural Language Query Parser using spaCy
Provides advanced NLP capabilities for ArcGIS query processing
"""

import spacy
import re
import logging
from typing import Optional, Dict, Any, List, Tuple
from spacy.matcher import Matcher, PhraseMatcher
from spacy.tokens import Doc, Token, Span
from .models import QueryResult
from .geocoding import geocode_location

logger = logging.getLogger(__name__)

class SpacyQueryParser:
    def __init__(self):
        """Initialize the spaCy-based query parser with advanced NLP capabilities."""
        try:
            # Load English language model
            self.nlp = spacy.load("en_core_web_sm")
            logger.info("✅ Loaded spaCy English model")
        except OSError:
            logger.error("❌ spaCy English model not found. Please install with: python -m spacy download en_core_web_sm")
            # Fallback to blank model
            self.nlp = spacy.blank("en")
            
        # Initialize matchers
        self.matcher = Matcher(self.nlp.vocab)
        self.phrase_matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        
        # Enhanced dataset entities with 5⭐ configurations for service_panels, tree_wells, acorn_lights
        self.dataset_entities = {
            "ev_charging": {
                "FUEL_TYPE": ["electric", "ev", "electric vehicle", "electricity", "ELEC", "charging station", "charging stations"],
                "NETWORK": ["tesla", "chargepoint", "evgo", "electrify america", "blink", "semacharge"],
                "ACCESS_TYPE": ["public", "private", "restricted"],
                "CHARGER_TYPE": ["supercharger", "fast charger", "rapid charger", "tesla charger"],
                "LEVEL2": ["level 2", "level2", "l2", "240v", "level ii", "standard"],
                "LEVEL1": ["level 1", "level1", "l1", "120v", "level i", "slow"],
                "STATUS": ["available", "operational", "working", "active", "in service", "online", "functioning"],
                "CONNECTOR": ["ccs", "chademo", "j1772", "tesla", "type 2"],
                "POWER_LEVEL": ["fast", "rapid", "slow", "standard"]
            },
            "electrical_meters": {
                "UTILITY": ["sdge", "sce", "pge"],
                "SERVICE_TYPE": ["residential", "commercial", "industrial", "mixed"],
                "STATUS": ["active", "inactive", "verified", "operational"],
                "METER_TYPE": ["smart", "analog", "digital"],
                "VERIFICATION": ["verified", "unverified", "field verified", "pending"]
            },
            "gas_meters": {
                "UTILITY": ["sdge", "socalgas", "pge"],
                "SERVICE_TYPE": ["residential", "commercial", "industrial"],
                "STATUS": ["active", "inactive", "verified", "operational"],
                "OWNER": ["la mesa", "caltrans", "city", "county", "private"],
                "VERIFICATION": ["verified", "unverified", "field verified", "pending"]
            },
            
            # ===== 5⭐ OPTIMIZED CONFIGURATIONS =====
            "service_panels": {
                "STATUS": ["active", "inactive", "complete", "incomplete", "yes", "no"],
                "PANEL_TYPE": ["electrical panel", "service cabinet", "meter cabinet", "transformer", "switchgear", "service", "electrical"],
                "VOLTAGE": ["120v", "240v", "480v", "high voltage", "low voltage", "residential", "commercial"],
                "CAPACITY": ["100 amp", "200 amp", "400 amp", "main panel", "sub panel"],
                "OWNER": ["city", "utility", "private", "public", "la mesa", "caltrans"],
                "VERIFICATION": ["verified", "unverified", "field verified", "pending verification"],
                "COMPLETION": ["complete", "incomplete", "finished", "pending", "yes", "no"]
            },
            "tree_wells": {
                "OUTLET_TYPE": ["electrical outlet", "receptacle", "power outlet", "gfci", "weatherproof", "outlet", "yes", "no"],
                "TREE_TYPE": ["palm", "oak", "maple", "street tree", "deciduous", "evergreen"],
                "POWER_RATING": ["15 amp", "20 amp", "standard", "heavy duty"],
                "LOCATION": ["sidewalk", "park", "street", "median", "plaza"],
                "VERIFICATION": ["verified", "unverified", "field verified", "pending verification"],
                "STATUS": ["active", "inactive", "operational", "maintenance", "working"]
            },
            "acorn_lights": {
                "STATUS": ["active", "inactive", "operational", "maintenance", "working", "complete", "incomplete"],
                "LIGHT_TYPE": ["acorn light", "decorative light", "street light", "post light", "streetlight"],
                "MOUNTING": ["pole mounted", "post mounted", "wall mounted", "ground mounted"],
                "POWER_SOURCE": ["electric", "solar", "led", "fluorescent", "halogen"],
                "OUTLET_LOCATION": ["top outlet", "base outlet", "dual outlet", "both outlets", "top", "base", "both", "no outlet"],
                "STYLE": ["traditional", "modern", "historic", "decorative", "acorn"],
                "VERIFICATION": ["verified", "unverified", "field verified", "pending verification"],
                "OWNER": ["city", "utility", "private", "public", "la mesa", "caltrans"]
            }
        }
        
        # Enhanced field mappings with 5⭐ database schema mappings
        self.field_mappings = {
            "ev_charging": {
                "FUEL_TYPE": {"field": "Fuel_Type_", "type": "code", "values": {"ev": "ELEC", "electric": "ELEC", "charging stations": "ELEC", "elec": "ELEC"}},
                "NETWORK": {"field": "EV_Network", "type": "exact", "values": {
                    "tesla": ["Tesla", "Tesla Destination"], 
                    "chargepoint": "ChargePoint Network", 
                    "electrify america": "Electrify America",
                    "evgo": "eVgo Network",
                    "blink": "Blink Network",
                    "non-networked": "Non-Networked"
                }},
                "ACCESS_TYPE": {"field": "Groups_Wit", "type": "code", "values": {"public": "Public", "private": "Private"}},
                "STATUS": {"field": "Status_Cod", "type": "exact", "values": {"available": "E", "operational": "E"}}
            },
            "electrical_meters": {
                "SERVICE_TYPE": {"field": "ServiceType1", "type": "exact", "values": {"residential": "Residential", "commercial": "Commercial"}},
                "VERIFICATION": {"field": "FieldVerified", "type": "boolean", "values": {"verified": "Yes", "unverified": "No"}},
                "STATUS": {"field": "Status", "type": "exact"}
            },
            "gas_meters": {
                "VERIFICATION": {"field": "FieldVerified", "type": "boolean", "values": {"verified": "Yes", "unverified": "No"}},
                "OWNER": {"field": "Owner", "type": "code", "values": {"la mesa": "1", "caltrans": "2"}},
                "STATUS": {"field": "Status", "type": "exact"}
            },
            
            # ===== 5⭐ OPTIMIZED FIELD MAPPINGS =====
            "service_panels": {
                "STATUS": {"field": "Status", "type": "exact"},
                "PANEL_TYPE": {"field": "Type", "type": "exact"},
                "COMPLETION": {"field": "Complete", "type": "exact", "values": {"complete": "Yes", "incomplete": "No"}},
                "OWNER": {"field": "Owner", "type": "exact"},
                "VERIFICATION": {"field": "FieldVerified", "type": "boolean", "values": {"verified": "Yes", "unverified": "No"}},
                "SERVICE_TYPE": {"field": "ServiceType1", "type": "exact"}
            },
            "tree_wells": {
                "OUTLET_TYPE": {"field": "Outlet", "type": "exact", "values": {"outlet": "Yes", "no outlet": "No"}},
                "STATUS": {"field": "Outlet", "type": "exact", "values": {"active": "Yes", "inactive": "No"}},
                "SERVICE_TYPE": {"field": "Service_De", "type": "exact"}
            },
            "acorn_lights": {
                "LIGHT_TYPE": {"field": "LightType", "type": "exact"},
                "WATTAGE": {"field": "Wattage", "type": "numeric"},
                "LOCATION": {"field": "LOCATION", "type": "exact"},
                "STREET": {"field": "STREET", "type": "exact"},
                "ROAD_TYPE": {"field": "ROAD_TYPE", "type": "exact"},
                "LAMP_WARRANTER": {"field": "Lamp_Warranter", "type": "exact"},
                "LAMP_HEADS": {"field": "LAMP_HEADS", "type": "numeric"}
            }
        }
        
        # Dynamic mappings from service discovery
        self.dynamic_dataset_entities = {}
        self.dynamic_field_mappings = {}
        
        # Initialize custom patterns and entities (after datasets are defined)
        self._setup_custom_patterns()
        self._setup_phrase_patterns()
    
    def _setup_custom_patterns(self):
        """Set up custom spaCy patterns for matching domain-specific entities."""
        
        # Numeric comparison patterns
        numeric_patterns = [
            # "more than X", "greater than X", "> X"
            [{"LOWER": {"IN": ["more", "greater", "above", "over"]}}, 
             {"LOWER": "than", "OP": "?"}, 
             {"LIKE_NUM": True, "OP": "+"}],
            
            # "less than X", "under X", "< X"
            [{"LOWER": {"IN": ["less", "fewer", "under", "below"]}}, 
             {"LOWER": "than", "OP": "?"}, 
             {"LIKE_NUM": True, "OP": "+"}],
            
            # "at least X", "minimum X"
            [{"LOWER": {"IN": ["at", "minimum", "min"]}}, 
             {"LOWER": {"IN": ["least", "of"]}, "OP": "?"}, 
             {"LIKE_NUM": True, "OP": "+"}],
            
            # "exactly X", "equal to X"
            [{"LOWER": {"IN": ["exactly", "equal"]}}, 
             {"LOWER": "to", "OP": "?"}, 
             {"LIKE_NUM": True, "OP": "+"}],
            
            # "X or more", "X+"
            [{"LIKE_NUM": True, "OP": "+"}, 
             {"LOWER": {"IN": ["or", "+"]}}, 
             {"LOWER": "more", "OP": "?"}],
        ]
        
        for i, pattern in enumerate(numeric_patterns):
            self.matcher.add(f"NUMERIC_COMPARISON_{i}", [pattern])
        
        # Distance patterns
        distance_patterns = [
            # "within X miles/km"
            [{"LOWER": {"IN": ["within", "in", "inside"]}}, 
             {"LIKE_NUM": True}, 
             {"LOWER": {"IN": ["miles", "mile", "mi", "km", "kilometers", "kilometer"]}}],
            
            # "X miles away", "X km radius"
            [{"LIKE_NUM": True}, 
             {"LOWER": {"IN": ["miles", "mile", "mi", "km", "kilometers", "kilometer"]}}, 
             {"LOWER": {"IN": ["away", "radius", "around", "from"]}}],
        ]
        
        for i, pattern in enumerate(distance_patterns):
            self.matcher.add(f"DISTANCE_{i}", [pattern])
        
        # Status and condition patterns
        status_patterns = [
            # "currently available", "actively operational"
            [{"LOWER": {"IN": ["currently", "actively", "presently"]}}, 
             {"LOWER": {"IN": ["available", "operational", "working", "active"]}}],
            
            # "out of order", "not working"
            [{"LOWER": {"IN": ["out", "not"]}}, 
             {"LOWER": {"IN": ["of", "working", "available"]}}, 
             {"LOWER": {"IN": ["order", "service"]}, "OP": "?"}],
        ]
        
        for i, pattern in enumerate(status_patterns):
            self.matcher.add(f"STATUS_{i}", [pattern])

    def _setup_phrase_patterns(self):
        """Set up phrase matchers for entity recognition."""
        
        # Create phrase patterns for each dataset
        for dataset, entities in self.dataset_entities.items():
            for entity_type, phrases in entities.items():
                # Convert phrases to spaCy docs
                patterns = [self.nlp(phrase) for phrase in phrases]
                self.phrase_matcher.add(f"{dataset}_{entity_type}", patterns)

    def parse_query(self, query_text: str, dataset: str = "ev_charging") -> QueryResult:
        """
        Parse natural language query using advanced spaCy NLP.
        
        Args:
            query_text: User's natural language query
            dataset: Target dataset identifier
            
        Returns:
            QueryResult with parsed conditions and location info
        """
        logger.info(f"🔍 Parsing query with spaCy: '{query_text}' for dataset: {dataset}")
        
        # Map dynamic dataset names to base dataset types
        base_dataset = self._map_to_base_dataset(dataset)
        logger.info(f"🔄 Mapped dataset '{dataset}' to base dataset '{base_dataset}'")
        
        # Process text with spaCy
        doc = self.nlp(query_text)
        
        # Extract different components
        location_coords = self._extract_location_spacy(doc)
        distance_km = self._extract_distance_spacy(doc)
        entities = self._extract_entities_spacy(doc, base_dataset)
        conditions = self._extract_conditions_spacy(doc, base_dataset)
        
        # Build WHERE clause
        where_conditions = self._build_where_conditions_spacy(entities, conditions, base_dataset)
        # Remove duplicates while preserving order
        unique_conditions = []
        for condition in where_conditions:
            if condition not in unique_conditions:
                unique_conditions.append(condition)
        where_clause = " AND ".join(unique_conditions) if unique_conditions else "1=1"
        
        result = QueryResult(
            where_clause=where_clause,
            location_lat=location_coords[0] if location_coords else None,
            location_lon=location_coords[1] if location_coords else None,
            distance_km=distance_km
        )
        
        logger.info(f"✅ spaCy parsed result: {result}")
        return result

    def _extract_location_spacy(self, doc: Doc) -> Optional[Tuple[float, float]]:
        """Extract location using spaCy's named entity recognition."""
        
        # Look for geopolitical entities (cities, states, countries)
        locations = []
        for ent in doc.ents:
            if ent.label_ in ["GPE", "LOC", "FAC"]:  # Geopolitical entity, location, facility
                locations.append(ent.text)
                logger.info(f"📍 Found location entity: {ent.text} ({ent.label_})")
            elif ent.label_ == "ORG":
                # Some place names are misclassified as organizations
                # Check if this could be a location by looking for location indicators nearby
                ent_start = ent.start
                ent_end = ent.end
                
                # Look for location prepositions near this entity
                has_location_context = False
                for i in range(max(0, ent_start - 3), min(len(doc), ent_end + 3)):
                    if doc[i].lower_ in ["near", "in", "at", "around", "by", "to", "from", "within"]:
                        has_location_context = True
                        break
                
                if has_location_context:
                    locations.append(ent.text)
                    logger.info(f"📍 Found potential location entity: {ent.text} ({ent.label_}) - has location context")
        
        # Also check for common location indicators with dependency parsing
        for token in doc:
            if token.lower_ in ["near", "in", "at", "around", "by"]:
                # Look for the location this preposition refers to
                for child in token.children:
                    if child.pos_ in ["NOUN", "PROPN"] and child.ent_type_ in ["GPE", "LOC", "ORG", ""]:
                        locations.append(child.text)
                        logger.info(f"📍 Found location via dependency: {child.text}")
                        
                # Also look at siblings and nearby tokens
                for i in range(max(0, token.i - 2), min(len(doc), token.i + 3)):
                    sibling = doc[i]
                    if (sibling.pos_ in ["PROPN", "NOUN"] and 
                        sibling.i != token.i and 
                        len(sibling.text) > 2 and
                        sibling.text not in ["EV", "charging", "station", "stations"]):
                        locations.append(sibling.text)
                        logger.info(f"📍 Found location near preposition: {sibling.text}")
        
        # Try to geocode the first valid location found
        for location in locations:
            if len(location) > 2:  # Filter out very short matches
                coords = geocode_location(location)
                if coords:
                    logger.info(f"✅ Geocoded '{location}' to {coords}")
                    return coords
                else:
                    logger.info(f"❌ Failed to geocode '{location}'")
        
        return None

    def _extract_distance_spacy(self, doc: Doc) -> Optional[float]:
        """Extract distance using spaCy pattern matching and NER."""
        
        # Use the matcher to find distance patterns
        matches = self.matcher(doc)
        
        for match_id, start, end in matches:
            match_label = self.nlp.vocab.strings[match_id]
            if match_label.startswith("DISTANCE"):
                span = doc[start:end]
                logger.info(f"🎯 Found distance pattern: {span.text}")
                
                # Extract numeric value and unit
                for token in span:
                    if token.like_num:
                        try:
                            distance_value = float(token.text)
                            
                            # Look for unit in the span
                            unit = "km"  # default
                            for unit_token in span:
                                if unit_token.lower_ in ["miles", "mile", "mi"]:
                                    unit = "miles"
                                    break
                                elif unit_token.lower_ in ["km", "kilometers", "kilometer"]:
                                    unit = "km"
                                    break
                            
                            # Convert to kilometers if needed
                            if unit == "miles":
                                distance_km = distance_value * 1.60934
                            else:
                                distance_km = distance_value
                            
                            logger.info(f"📏 Extracted distance: {distance_value} {unit} = {distance_km} km")
                            return distance_km
                            
                        except ValueError:
                            continue
        
        return None

    def parse_with_enhanced_tools(self, query_text: str, dataset: str = "ev_charging") -> dict:
        """
        Parse query using enhanced GIS tools and router.
        This integrates the spaCy parser with the new tool-based system.
        """
        try:
            from query_parser.tool_router import get_tool_router
            router = get_tool_router()
            
            # Use the enhanced router for better results
            result = router.route_query(query_text)
            
            # Convert to spaCy-compatible format
            return {
                "where_clause": result.metadata.get("where_clause", "1=1") if result.metadata else "1=1",
                "text": result.text,
                "geojson": result.geojson,
                "center": result.center,
                "statistics": result.statistics,
                "location_lat": result.center["coordinates"][1] if result.center else None,
                "location_lon": result.center["coordinates"][0] if result.center else None,
                "distance_km": result.statistics.get("search_radius_km") if result.statistics else None
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced parsing: {e}")
            # Fallback to original spaCy parsing
            spacy_result = self.parse_query(query_text, dataset)
            return {
                "where_clause": spacy_result.where_clause,
                "text": f"Found infrastructure matching your query criteria.",
                "geojson": None,
                "center": None,
                "statistics": None,
                "location_lat": spacy_result.location_lat,
                "location_lon": spacy_result.location_lon,
                "distance_km": spacy_result.distance_km
            }

    def _extract_entities_spacy(self, doc: Doc, dataset: str) -> Dict[str, List[str]]:
        """Extract domain-specific entities using phrase matching with dynamic mappings support."""
        
        entities = {}
        
        # Use phrase matcher to find dataset-specific entities
        matches = self.phrase_matcher(doc)
        
        for match_id, start, end in matches:
            match_label = self.nlp.vocab.strings[match_id]
            
            # Check if this match belongs to the current dataset (including dynamic datasets)
            if match_label.startswith(dataset):
                entity_type = match_label.replace(f"{dataset}_", "")
                entity_value = doc[start:end].text.lower()
                
                if entity_type not in entities:
                    entities[entity_type] = []
                
                entities[entity_type].append(entity_value)
                logger.info(f"🏷️ Found {entity_type} entity: {entity_value}")
        
        return entities

    def _extract_conditions_spacy(self, doc: Doc, dataset: str) -> Dict[str, Any]:
        """Extract numeric conditions and comparisons using dependency parsing."""
        
        conditions = {}
        
        # Use pattern matcher for numeric comparisons
        matches = self.matcher(doc)
        
        for match_id, start, end in matches:
            match_label = self.nlp.vocab.strings[match_id]
            
            if match_label.startswith("NUMERIC_COMPARISON"):
                span = doc[start:end]
                logger.info(f"🔢 Found numeric condition: {span.text}")
                
                # Extract operator and value
                operator = "="  # default
                value = None
                
                for token in span:
                    if token.like_num:
                        try:
                            value = float(token.text)
                        except ValueError:
                            continue
                    elif token.lower_ in ["more", "greater", "above", "over"]:
                        operator = ">"
                    elif token.lower_ in ["less", "fewer", "under", "below"]:
                        operator = "<"
                    elif token.lower_ in ["at", "minimum", "min"]:
                        operator = ">="
                    elif token.lower_ in ["exactly", "equal"]:
                        operator = "="
                
                # Try to find what field this condition refers to
                # Look for nearby nouns that might indicate the field
                field_candidates = []
                for i in range(max(0, start-3), min(len(doc), end+3)):
                    token = doc[i]
                    if token.pos_ in ["NOUN", "PROPN"] and token.lower_ in ["ports", "chargers", "stations", "power", "level"]:
                        field_candidates.append(token.lower_)
                
                if value is not None:
                    condition_key = f"numeric_{len(conditions)}"
                    conditions[condition_key] = {
                        "operator": operator,
                        "value": value,
                        "field_hints": field_candidates,
                        "span_text": span.text
                    }
                    logger.info(f"📊 Extracted condition: {operator} {value} (hints: {field_candidates})")
        
        return conditions

    def _build_where_conditions_spacy(self, entities: Dict[str, List[str]], 
                                     conditions: Dict[str, Any], 
                                     dataset: str) -> List[str]:
        """Build SQL WHERE conditions from extracted entities and conditions."""
        
        where_conditions = []
        field_conditions = {}  # Group conditions by field to avoid conflicts
        
        # Process entities using both static and dynamic field mappings
        for entity_type, entity_values in entities.items():
            field_config = None
            
            # Check static field mappings first
            if dataset in self.field_mappings and entity_type in self.field_mappings[dataset]:
                field_config = self.field_mappings[dataset][entity_type]
            # Check dynamic field mappings
            elif dataset in self.dynamic_field_mappings and entity_type in self.dynamic_field_mappings[dataset]:
                field_config = self.dynamic_field_mappings[dataset][entity_type]
            
            if field_config:
                field_name = field_config["field"]
                field_type = field_config["type"]
                
                # Initialize field conditions array if not exists
                if field_name not in field_conditions:
                    field_conditions[field_name] = []
                
                for value in entity_values:
                    if field_type == "exact":
                        # Handle both direct values and arrays
                        if "values" in field_config and value in field_config["values"]:
                            mapped_value = field_config["values"][value]
                            if isinstance(mapped_value, list):
                                # Handle array values (like Tesla networks)
                                or_conditions = [f"{field_name} = '{v}'" for v in mapped_value]
                                combined_condition = f"({' OR '.join(or_conditions)})"
                                if combined_condition not in field_conditions[field_name]:
                                    field_conditions[field_name].append(combined_condition)
                            else:
                                # Handle single values
                                field_conditions[field_name].append(f"{field_name} = '{mapped_value}'")
                        else:
                            # Direct string match
                            field_conditions[field_name].append(f"{field_name} = '{value.title()}'")
                    
                    elif field_type == "code":
                        # Map to specific codes
                        if "values" in field_config and value in field_config["values"]:
                            code_value = field_config["values"][value]
                            if isinstance(code_value, list):
                                # Handle array values
                                or_conditions = [f"{field_name} = '{v}'" for v in code_value]
                                combined_condition = f"({' OR '.join(or_conditions)})"
                                if combined_condition not in field_conditions[field_name]:
                                    field_conditions[field_name].append(combined_condition)
                            else:
                                field_conditions[field_name].append(f"{field_name} = '{code_value}'")
                    
                    elif field_type == "boolean":
                        # Map to Yes/No values
                        if "values" in field_config and value in field_config["values"]:
                            bool_value = field_config["values"][value]
                            field_conditions[field_name].append(f"{field_name} = '{bool_value}'")
                    
                    elif field_type == "existence":
                        # Check for field existence (can be shared across values)
                        if f"{field_name} IS NOT NULL" not in field_conditions[field_name]:
                            field_conditions[field_name].append(f"{field_name} IS NOT NULL")
                    
                    elif field_type == "numeric" and "condition" in field_config:
                        # Apply numeric condition (usually unique)
                        condition = field_config["condition"]
                        if condition not in field_conditions[field_name]:
                            field_conditions[field_name].append(f"{field_name} {condition}")
                    
                    logger.info(f"🔗 Mapped {entity_type}:{value} to field condition using {'static' if dataset in self.field_mappings else 'dynamic'} mappings")
            else:
                logger.info(f"⚠️ No field mapping found for entity type: {entity_type} in dataset: {dataset}")
        
        # Convert field_conditions to proper WHERE clauses - FIXED LOGIC
        for field_name, conditions_list in field_conditions.items():
            if len(conditions_list) == 1:
                # Single condition - use as is
                where_conditions.append(conditions_list[0])
            elif len(conditions_list) > 1:
                # Multiple conditions for same field - handle smartly based on field type
                if field_name == "Fuel_Type_" and dataset.startswith("ev_charging"):
                    # For EV charging, always use ELEC as it's the only valid value for electric vehicles
                    where_conditions.append("Fuel_Type_ = 'ELEC'")
                    logger.info(f"🔋 Using ELEC for Fuel_Type_ field (EV charging standard)")
                elif field_name in ["EV_Level2_", "EV_DC_Fast"]:
                    # For EV charging levels, use existence check for multiple values
                    where_conditions.append(f"{field_name} > 0")
                    logger.info(f"⚡ Using existence check for {field_name}")
                elif field_name == "OutletPosition":
                    # For outlet positions, prefer Top if available
                    if any("'Top'" in cond for cond in conditions_list):
                        where_conditions.append("OutletPosition = 'Top'")
                        logger.info(f"⚡ Selected Top for OutletPosition field")
                    else:
                        where_conditions.append(conditions_list[0])
                elif field_name == "Groups_Wit":
                    # For access type, prefer Public if available
                    if any("'Public'" in cond for cond in conditions_list):
                        where_conditions.append("Groups_Wit = 'Public'")
                        logger.info(f"🔓 Selected Public for Groups_Wit field")
                    else:
                        where_conditions.append(conditions_list[0])
                else:
                    # For other fields, use OR logic instead of impossible AND logic
                    unique_conditions = list(set(conditions_list))  # Remove duplicates
                    if len(unique_conditions) == 1:
                        where_conditions.append(unique_conditions[0])
                    else:
                        or_condition = f"({' OR '.join(unique_conditions)})"
                        where_conditions.append(or_condition)
                        logger.info(f"🔄 Combined multiple conditions for {field_name} with OR logic")
        
        # Add dataset-specific default filters ONLY if no related conditions exist
        if dataset.startswith("ev_charging"):
            # Only add default filter if no Fuel_Type_ conditions were already added
            has_fuel_type = any("Fuel_Type_" in cond for cond in where_conditions)
            if not has_fuel_type:
                where_conditions.append("Fuel_Type_ = 'ELEC'")
                logger.info("🔋 Added default electric vehicle filter: Fuel_Type_ = 'ELEC'")
        
        # Process numeric conditions
        for condition_key, condition_data in conditions.items():
            operator = condition_data["operator"]
            value = condition_data["value"]
            field_hints = condition_data["field_hints"]
            
            # Try to map field hints to actual database fields
            field_name = self._map_field_hints_to_database_field(field_hints, dataset)
            
            if field_name:
                where_conditions.append(f"{field_name} {operator} {value}")
                logger.info(f"🔢 Applied numeric condition: {field_name} {operator} {value}")
        
        return where_conditions

    def _map_field_hints_to_database_field(self, field_hints: List[str], dataset: str) -> Optional[str]:
        """Map field hints from natural language to actual database field names."""
        
        # Dataset-specific field hint mappings
        hint_mappings = {
            "ev_charging": {
                "ports": "EV_DC_Fast",
                "chargers": "EV_DC_Fast", 
                "stations": "EV_DC_Fast",
                "level": "EV_Level2_",
                "power": "EV_DC_Fast"
            },
            "electrical_meters": {
                "meters": "SDGE_Meter",
                "service": "ServiceType1"
            },
            "gas_meters": {
                "meters": "SDGE_Meter",
                "service": "ServiceType1"
            }
        }
        
        if dataset in hint_mappings:
            for hint in field_hints:
                if hint in hint_mappings[dataset]:
                    return hint_mappings[dataset][hint]
        
        return None

    def analyze_query_complexity(self, query_text: str) -> Dict[str, Any]:
        """Analyze the complexity and components of a natural language query."""
        
        doc = self.nlp(query_text)
        
        analysis = {
            "tokens": len(doc),
            "sentences": len(list(doc.sents)),
            "entities": [],
            "pos_tags": {},
            "dependencies": [],
            "complexity_score": 0
        }
        
        # Analyze entities
        for ent in doc.ents:
            analysis["entities"].append({
                "text": ent.text,
                "label": ent.label_,
                "description": spacy.explain(ent.label_)
            })
        
        # Analyze POS tags
        for token in doc:
            pos = token.pos_
            if pos not in analysis["pos_tags"]:
                analysis["pos_tags"][pos] = 0
            analysis["pos_tags"][pos] += 1
        
        # Analyze dependencies
        for token in doc:
            if token.dep_ != "ROOT":
                analysis["dependencies"].append({
                    "token": token.text,
                    "dependency": token.dep_,
                    "head": token.head.text
                })
        
        # Calculate complexity score
        analysis["complexity_score"] = (
            len(analysis["entities"]) * 2 +
            len(analysis["dependencies"]) +
            analysis["sentences"]
        )
        
        return analysis 
    
    def _map_to_base_dataset(self, dataset: str) -> str:
        """Map dynamic dataset names to base dataset types for entity recognition."""
        
        # Mapping from dynamic dataset names to base dataset types
        dataset_mappings = {
            # EV charging variants
            "ev_charging_0": "ev_charging",
            "ev_charging": "ev_charging",
            
            # Electrical meters variants  
            "electrical_meters_0": "electrical_meters",
            "electrical_meters": "electrical_meters",
            "la_mesa_electrical_0": "electrical_meters",
            
            # Gas meters variants
            "gas_meters_0": "gas_meters", 
            "gas_meters": "gas_meters",
            "la_mesa_gas_0": "gas_meters",
            
            # ===== 5⭐ OPTIMIZED DATASETS - Direct mapping =====
            "service_panels": "service_panels",
            "la_mesa_electrical_2": "service_panels",
            "tree_wells": "tree_wells", 
            "la_mesa_electrical_3": "tree_wells",
            "acorn_lights": "acorn_lights",
            "la_mesa_electrical_4": "acorn_lights",
            "la_mesa_electrical_5": "acorn_lights",
        }
        
        # Return mapped dataset or original if no mapping found
        mapped = dataset_mappings.get(dataset, dataset)
        
        # If still no match, try to infer from dataset name patterns with 5⭐ support
        if mapped not in self.dataset_entities:
            if "ev" in dataset.lower() or "charging" in dataset.lower():
                mapped = "ev_charging"
            elif "service" in dataset.lower() or "panel" in dataset.lower():
                mapped = "service_panels"  # 5⭐ optimization
            elif "tree" in dataset.lower() or "well" in dataset.lower():
                mapped = "tree_wells"  # 5⭐ optimization
            elif "acorn" in dataset.lower() or "light" in dataset.lower():
                mapped = "acorn_lights"  # 5⭐ optimization
            elif "electrical" in dataset.lower() or "meter" in dataset.lower():
                mapped = "electrical_meters"  
            elif "gas" in dataset.lower():
                mapped = "gas_meters"
            else:
                # Default fallback
                mapped = "ev_charging"
                
        logger.info(f"🔄 Dataset mapping: '{dataset}' -> '{mapped}'")
        return mapped

    def update_dynamic_mappings(self, datasets: Dict[str, Any]):
        """Update dynamic dataset mappings from external service discovery using spaCy-based approach."""
        logger.info("🔄 Updating spaCy parser with dynamic dataset mappings")
        
        for dataset_id, dataset_config in datasets.items():
            try:
                # Extract spaCy-based entity patterns from dataset configuration
                entities = self._extract_entities_from_config(dataset_config)
                field_mappings = self._extract_field_mappings_from_config(dataset_config)
                
                # Update dynamic mappings
                self.dynamic_dataset_entities[dataset_id] = entities
                self.dynamic_field_mappings[dataset_id] = field_mappings
                
                logger.info(f"📊 Added spaCy mappings for {dataset_id}: {len(entities)} entity types")
                
            except Exception as e:
                logger.error(f"❌ Failed to create spaCy mappings for {dataset_id}: {e}")
                continue
        
        # Rebuild phrase patterns with new dynamic data
        self._rebuild_phrase_patterns()
        logger.info(f"✅ Updated spaCy parser with {len(self.dynamic_dataset_entities)} dynamic datasets")

    def _extract_entities_from_config(self, dataset_config: Dict[str, Any]) -> Dict[str, List[str]]:
        """Extract spaCy entities from dataset configuration using NLP-based analysis."""
        entities = {}
        
        # Analyze dataset name and description using spaCy
        name = dataset_config.get('name', '').lower()
        description = dataset_config.get('description', '').lower()
        layer_info = dataset_config.get('layer_info', {})
        
        # Use spaCy to extract semantic patterns from dataset metadata
        combined_text = f"{name} {description}"
        doc = self.nlp(combined_text)
        
        # Extract infrastructure types using NER and POS tagging
        infrastructure_types = []
        for token in doc:
            if token.pos_ in ["NOUN", "PROPN"] and token.text.lower() in [
                "electrical", "electric", "meter", "gas", "charging", "station", 
                "service", "panel", "cabinet", "light", "outlet", "well", "acorn"
            ]:
                infrastructure_types.append(token.text.lower())
        
        # Build entity mappings based on detected infrastructure types
        if any(term in combined_text for term in ["electrical", "electric", "meter"]):
            entities.update({
                "INFRASTRUCTURE_TYPE": ["electrical", "electric", "meter", "electrical meter"],
                "STATUS": ["active", "inactive", "verified", "unverified"],
                "SERVICE_TYPE": ["residential", "commercial", "industrial"]
            })
        
        if any(term in combined_text for term in ["gas", "meter"]):
            entities.update({
                "INFRASTRUCTURE_TYPE": ["gas", "meter", "gas meter"],
                "STATUS": ["active", "inactive", "verified", "unverified"],
                "SERVICE_TYPE": ["residential", "commercial", "industrial"],
                "OWNER": ["la mesa", "caltrans", "city", "county"]
            })
        
        if any(term in combined_text for term in ["charging", "ev", "electric vehicle"]):
            entities.update({
                "INFRASTRUCTURE_TYPE": ["charging", "ev", "electric vehicle", "charging station"],
                "NETWORK": ["tesla", "chargepoint", "evgo", "electrify america"],
                "ACCESS_TYPE": ["public", "private"],
                "STATUS": ["available", "operational", "working"]
            })
        
        if any(term in combined_text for term in ["service", "panel", "cabinet"]):
            entities.update({
                "INFRASTRUCTURE_TYPE": ["service", "panel", "cabinet", "service panel"],
                "STATUS": ["active", "inactive", "complete", "incomplete"]
            })
        
        if any(term in combined_text for term in ["tree", "well", "outlet"]):
            entities.update({
                "INFRASTRUCTURE_TYPE": ["tree", "well", "outlet", "tree well"],
                "STATUS": ["active", "inactive", "complete", "incomplete"]
            })
        
        if any(term in combined_text for term in ["acorn", "light", "lighting"]):
            entities.update({
                "INFRASTRUCTURE_TYPE": ["acorn", "light", "lighting", "acorn light"],
                "STATUS": ["active", "inactive", "complete", "incomplete"]
            })
        
        return entities

    def _extract_field_mappings_from_config(self, dataset_config: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """Extract field mappings from dataset configuration using spaCy-based field analysis."""
        field_mappings = {}
        layer_info = dataset_config.get('layer_info', {})
        fields = layer_info.get('fields', [])
        
        # Analyze field names using spaCy to create semantic mappings
        for field in fields:
            field_name = field.get('name', '').lower()
            field_type = field.get('type', '')
            
            # Use spaCy to analyze field semantics
            doc = self.nlp(field_name)
            
            # Create mappings based on semantic analysis
            if 'status' in field_name:
                field_mappings["STATUS"] = {
                    "field": field['name'],
                    "type": "exact"
                }
            elif 'service' in field_name and 'type' in field_name:
                field_mappings["SERVICE_TYPE"] = {
                    "field": field['name'],
                    "type": "exact"
                }
            elif 'verified' in field_name:
                field_mappings["VERIFICATION"] = {
                    "field": field['name'],
                    "type": "boolean",
                    "values": {"verified": "Yes", "unverified": "No"}
                }
            elif 'owner' in field_name:
                field_mappings["OWNER"] = {
                    "field": field['name'],
                    "type": "code",
                    "values": {"la mesa": "1", "caltrans": "2"}
                }
            elif 'network' in field_name:
                field_mappings["NETWORK"] = {
                    "field": field['name'],
                    "type": "exact"
                }
            elif 'access' in field_name or 'group' in field_name:
                field_mappings["ACCESS_TYPE"] = {
                    "field": field['name'],
                    "type": "exact"
                }
        
        return field_mappings

    def _rebuild_phrase_patterns(self):
        """Rebuild phrase patterns including dynamic dataset entities."""
        # Clear existing patterns
        self.phrase_matcher = PhraseMatcher(self.nlp.vocab, attr="LOWER")
        
        # Add base dataset patterns
        for dataset, entities in self.dataset_entities.items():
            for entity_type, phrases in entities.items():
                patterns = [self.nlp(phrase) for phrase in phrases]
                self.phrase_matcher.add(f"{dataset}_{entity_type}", patterns)
        
        # Add dynamic dataset patterns
        for dataset, entities in self.dynamic_dataset_entities.items():
            for entity_type, phrases in entities.items():
                patterns = [self.nlp(phrase) for phrase in phrases]
                self.phrase_matcher.add(f"{dataset}_{entity_type}", patterns)