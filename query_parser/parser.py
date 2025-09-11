import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class QueryEntity:
    """Represents an entity extracted from a query"""
    text: str
    label: str
    start: int
    end: int
    confidence: float = 1.0

@dataclass
class ParsedQuery:
    """Represents a parsed natural language query"""
    original_query: str
    intent: str
    entities: List[QueryEntity]
    dataset: str
    where_clause: str
    spatial_filter: Optional[Dict[str, Any]] = None
    temporal_filter: Optional[Dict[str, Any]] = None
    confidence: float = 1.0

class QueryParser:
    """Enhanced query parser for Abu Dhabi datasets"""
    
    def __init__(self):
        self.dataset_patterns = {
            'schools': {
                'patterns': [r'\bschool\b', r'\beducation\b', r'\beducational\b'],
                'layer': 'abu_dhabi_schools',
                'fields': ['Name', 'Type', 'District', 'Students']
            },
            'hospitals': {
                'patterns': [r'\bhospital\b', r'\bmedical\b', r'\bhealthcare\b'],
                'layer': 'abu_dhabi_hospitals',
                'fields': ['Name', 'Type', 'District', 'Beds']
            },
            'universities': {
                'patterns': [r'\buniversit\w*\b', r'\bcollege\b'],
                'layer': 'abu_dhabi_universities',
                'fields': ['Name', 'Type', 'District', 'Students']
            },
            'police': {
                'patterns': [r'\bpolice\b', r'\blaw enforcement\b'],
                'layer': 'abu_dhabi_police_stations',
                'fields': ['Name', 'Type', 'District', 'Officers']
            }
        }
        
        self.location_patterns = {
            'abu_dhabi_island': [r'\babu dhabi island\b', r'\babu dhabi city\b'],
            'al_ain': [r'\bal ain\b'],
            'khalifa_city': [r'\bkhalifa city\b']
        }
        
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Pre-compile regex patterns for better performance"""
        self.compiled_dataset_patterns = {}
        for dataset, config in self.dataset_patterns.items():
            self.compiled_dataset_patterns[dataset] = {
                'patterns': [re.compile(pattern, re.IGNORECASE) for pattern in config['patterns']],
                'layer': config['layer'],
                'fields': config['fields']
            }
    
    def parse_query(self, query: str) -> ParsedQuery:
        """Parse a natural language query into structured components"""
        logger.info(f"Parsing query: {query}")
        
        normalized_query = self._normalize_query(query)
        entities = self._extract_entities(normalized_query)
        intent, dataset = self._determine_intent_and_dataset(normalized_query, entities)
        where_clause = self._build_where_clause(normalized_query, entities, dataset)
        confidence = self._calculate_confidence(entities, intent, dataset)
        
        return ParsedQuery(
            original_query=query,
            intent=intent,
            entities=entities,
            dataset=dataset,
            where_clause=where_clause,
            confidence=confidence
        )
    
    def _normalize_query(self, query: str) -> str:
        """Normalize the query text"""
        normalized = query.lower().strip()
        normalized = re.sub(r'\s+', ' ', normalized)
        
        variations = {
            'show me': 'show',
            'find all': 'find',
            'list all': 'list'
        }
        
        for old, new in variations.items():
            normalized = normalized.replace(old, new)
        
        return normalized
    
    def _extract_entities(self, query: str) -> List[QueryEntity]:
        """Extract entities from the normalized query"""
        entities = []
        
        # Extract dataset entities
        for dataset, config in self.compiled_dataset_patterns.items():
            for pattern in config['patterns']:
                for match in pattern.finditer(query):
                    entities.append(QueryEntity(
                        text=match.group(),
                        label='DATASET',
                        start=match.start(),
                        end=match.end(),
                        confidence=0.95
                    ))
        
        entities.sort(key=lambda x: x.start)
        return entities
    
    def _determine_intent_and_dataset(self, query: str, entities: List[QueryEntity]) -> Tuple[str, str]:
        """Determine the intent and target dataset from the query"""
        intent = 'search'
        
        if any(word in query for word in ['show', 'display', 'list']):
            intent = 'display'
        elif any(word in query for word in ['find', 'search', 'locate']):
            intent = 'search'
        
        dataset = 'abu_dhabi_schools'  # Default
        dataset_scores = {}
        
        for dataset_name, config in self.compiled_dataset_patterns.items():
            score = 0
            for pattern in config['patterns']:
                matches = pattern.findall(query)
                score += len(matches) * 2
            
            if score > 0:
                dataset_scores[dataset_name] = score
        
        if dataset_scores:
            dataset = max(dataset_scores.items(), key=lambda x: x[1])[0]
            dataset = self.compiled_dataset_patterns[dataset]['layer']
        
        return intent, dataset
    
    def _build_where_clause(self, query: str, entities: List[QueryEntity], dataset: str) -> str:
        """Build SQL WHERE clause from query and entities"""
        conditions = []
        
        # Location-based filters
        if 'abu dhabi' in query:
            conditions.append("District = 'Abu Dhabi Island'")
        elif 'al ain' in query:
            conditions.append("District = 'Al Ain'")
        
        # Default condition
        if not conditions:
            conditions.append("1=1")
        
        return " AND ".join(conditions)
    
    def _calculate_confidence(self, entities: List[QueryEntity], intent: str, dataset: str) -> float:
        """Calculate confidence score for the parsed query"""
        base_confidence = 0.5
        entity_boost = min(len(entities) * 0.1, 0.3)
        return min(base_confidence + entity_boost, 1.0)

# Global parser instance
_parser_instance = None

def get_parser() -> QueryParser:
    """Get singleton parser instance"""
    global _parser_instance
    if _parser_instance is None:
        _parser_instance = QueryParser()
    return _parser_instance