/**
 * Conversation Memory Service for SCAD GenAI Tool
 * Handles conversation context, memory, and follow-up question processing
 */

export interface ConversationContext {
  sessionId: string;
  messages: ConversationMessage[];
  currentDataset?: string;
  lastQuery?: string;
  lastResults?: any[];
  spatialContext?: {
    center: { x: number; y: number };
    zoom: number;
    extent?: any;
  };
  analysisContext?: {
    currentAnalysis?: string;
    datasets?: string[];
    indicators?: string[];
  };
  timestamp: number;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    queryType?: string;
    dataset?: string;
    resultsCount?: number;
    spatialOperation?: string;
  };
}

export interface FollowUpSuggestion {
  question: string;
  type: 'spatial' | 'analytical' | 'comparative' | 'exploratory';
  confidence: number;
}

class ConversationMemoryService {
  private conversations: Map<string, ConversationContext> = new Map();
  private readonly MAX_MESSAGES_PER_SESSION = 50;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  /**
   * Get or create conversation context for a session
   */
  getConversationContext(sessionId: string): ConversationContext {
    let context = this.conversations.get(sessionId);
    
    if (!context || this.isSessionExpired(context)) {
      context = {
        sessionId,
        messages: [],
        timestamp: Date.now()
      };
      this.conversations.set(sessionId, context);
    }
    
    return context;
  }

  /**
   * Add a message to the conversation
   */
  addMessage(sessionId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>): ConversationMessage {
    const context = this.getConversationContext(sessionId);
    
    const newMessage: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...message
    };
    
    context.messages.push(newMessage);
    
    // Keep only the most recent messages
    if (context.messages.length > this.MAX_MESSAGES_PER_SESSION) {
      context.messages = context.messages.slice(-this.MAX_MESSAGES_PER_SESSION);
    }
    
    context.timestamp = Date.now();
    return newMessage;
  }

  /**
   * Update conversation context with query results
   */
  updateContext(sessionId: string, updates: Partial<ConversationContext>): void {
    const context = this.getConversationContext(sessionId);
    Object.assign(context, updates);
    context.timestamp = Date.now();
  }

  /**
   * Get conversation history for context
   */
  getConversationHistory(sessionId: string, limit: number = 10): ConversationMessage[] {
    const context = this.getConversationContext(sessionId);
    return context.messages.slice(-limit);
  }

  /**
   * Generate follow-up suggestions based on conversation context
   */
  generateFollowUpSuggestions(sessionId: string): FollowUpSuggestion[] {
    const context = this.getConversationContext(sessionId);
    const suggestions: FollowUpSuggestion[] = [];
    
    if (context.messages.length === 0) {
      return this.getInitialSuggestions();
    }

    const lastMessage = context.messages[context.messages.length - 1];
    const lastUserMessage = context.messages.filter(m => m.type === 'user').slice(-1)[0];
    
    // Analyze the conversation context
    const hasSpatialQuery = context.messages.some(m => 
      m.metadata?.spatialOperation || 
      m.content.toLowerCase().includes('within') ||
      m.content.toLowerCase().includes('near') ||
      m.content.toLowerCase().includes('distance')
    );
    
    const hasAnalysisQuery = context.messages.some(m => 
      m.content.toLowerCase().includes('analyze') ||
      m.content.toLowerCase().includes('compare') ||
      m.content.toLowerCase().includes('trend')
    );
    
    const currentDataset = context.currentDataset;
    const lastResults = context.lastResults;

    // Generate contextual suggestions
    if (hasSpatialQuery) {
      suggestions.push({
        question: "Show me more details about these locations",
        type: 'spatial',
        confidence: 0.9
      });
      
      suggestions.push({
        question: "What's within 5km of these points?",
        type: 'spatial',
        confidence: 0.8
      });
    }

    if (hasAnalysisQuery) {
      suggestions.push({
        question: "Compare this with other districts in Abu Dhabi",
        type: 'comparative',
        confidence: 0.9
      });
      
      suggestions.push({
        question: "What are the trends over time?",
        type: 'analytical',
        confidence: 0.8
      });
    }

    if (currentDataset) {
      const datasetType = this.getDatasetType(currentDataset);
      
      if (datasetType === 'education') {
        suggestions.push({
          question: "Show me the nearest hospitals to these schools",
          type: 'spatial',
          confidence: 0.9
        });
        
        suggestions.push({
          question: "What's the student capacity of these institutions?",
          type: 'analytical',
          confidence: 0.8
        });
      } else if (datasetType === 'public_safety') {
        suggestions.push({
          question: "Show me the coverage area of these facilities",
          type: 'spatial',
          confidence: 0.9
        });
        
        suggestions.push({
          question: "What's the response time for these services?",
          type: 'analytical',
          confidence: 0.8
        });
      } else if (datasetType === 'agriculture') {
        suggestions.push({
          question: "Show me the soil quality in these areas",
          type: 'spatial',
          confidence: 0.9
        });
        
        suggestions.push({
          question: "What's the productivity of these farms?",
          type: 'analytical',
          confidence: 0.8
        });
      }
    }

    // Add general exploratory suggestions
    suggestions.push({
      question: "Tell me more about Abu Dhabi District Pulse indicators",
      type: 'exploratory',
      confidence: 0.7
    });
    
    suggestions.push({
      question: "What other datasets are available?",
      type: 'exploratory',
      confidence: 0.6
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  /**
   * Process follow-up question with context
   */
  processFollowUpQuestion(sessionId: string, question: string): {
    enhancedQuery: string;
    suggestedDataset?: string;
    contextInfo: any;
  } {
    const context = this.getConversationContext(sessionId);
    const history = this.getConversationHistory(sessionId, 5);
    
    // Build context-aware query
    let enhancedQuery = question;
    let suggestedDataset = context.currentDataset;
    
    // Extract context from previous messages
    const contextInfo = {
      previousDataset: context.currentDataset,
      lastQuery: context.lastQuery,
      spatialContext: context.spatialContext,
      analysisContext: context.analysisContext,
      messageCount: context.messages.length
    };

    // Enhance query based on context
    if (context.currentDataset && !question.toLowerCase().includes('dataset')) {
      const datasetName = this.getDatasetDisplayName(context.currentDataset);
      if (!question.toLowerCase().includes(datasetName.toLowerCase())) {
        enhancedQuery = `${question} (continuing with ${datasetName})`;
      }
    }

    // Add spatial context if available
    if (context.spatialContext && question.toLowerCase().includes('near') || 
        question.toLowerCase().includes('within') || question.toLowerCase().includes('around')) {
      enhancedQuery = `${enhancedQuery} in the current map area`;
    }

    // Add analysis context if available
    if (context.analysisContext?.currentAnalysis) {
      enhancedQuery = `${enhancedQuery} (related to ${context.analysisContext.currentAnalysis})`;
    }

    return {
      enhancedQuery,
      suggestedDataset,
      contextInfo
    };
  }

  /**
   * Clear conversation context
   */
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Get initial suggestions for new conversations
   */
  private getInitialSuggestions(): FollowUpSuggestion[] {
    return [
      {
        question: "Show me all schools in Abu Dhabi",
        type: 'spatial',
        confidence: 0.9
      },
      {
        question: "Analyze Abu Dhabi District Pulse livability indicators",
        type: 'analytical',
        confidence: 0.9
      },
      {
        question: "Find police stations near hospitals",
        type: 'spatial',
        confidence: 0.8
      },
      {
        question: "Compare agricultural productivity across districts",
        type: 'comparative',
        confidence: 0.8
      },
      {
        question: "What datasets are available for analysis?",
        type: 'exploratory',
        confidence: 0.7
      }
    ];
  }

  /**
   * Get dataset type from dataset ID
   */
  private getDatasetType(datasetId: string): string {
    if (datasetId.startsWith('education_')) return 'education';
    if (datasetId.startsWith('public_safety_')) return 'public_safety';
    if (datasetId.startsWith('agriculture_')) return 'agriculture';
    return 'unknown';
  }

  /**
   * Get display name for dataset
   */
  private getDatasetDisplayName(datasetId: string): string {
    const type = this.getDatasetType(datasetId);
    const layer = datasetId.split('_')[1];
    
    switch (type) {
      case 'education':
        return `Abu Dhabi ${this.getEducationLayerName(layer)}`;
      case 'public_safety':
        return `Abu Dhabi ${this.getPublicSafetyLayerName(layer)}`;
      case 'agriculture':
        return `Abu Dhabi ${this.getAgricultureLayerName(layer)}`;
      default:
        return datasetId;
    }
  }

  private getEducationLayerName(layer: string): string {
    const names: { [key: string]: string } = {
      '0': 'Schools',
      '1': 'Universities',
      '2': 'Libraries',
      '3': 'Training Centers',
      '4': 'Research Facilities',
      '5': 'Student Housing'
    };
    return names[layer] || 'Education Facilities';
  }

  private getPublicSafetyLayerName(layer: string): string {
    const names: { [key: string]: string } = {
      '0': 'Police Stations',
      '1': 'Fire Stations',
      '2': 'Hospitals',
      '3': 'Emergency Services',
      '4': 'Safety Zones',
      '5': 'Surveillance Systems'
    };
    return names[layer] || 'Public Safety Facilities';
  }

  private getAgricultureLayerName(layer: string): string {
    const names: { [key: string]: string } = {
      '0': 'Crop Fields',
      '1': 'Irrigation Systems',
      '2': 'Farming Equipment',
      '3': 'Storage Facilities',
      '4': 'Soil Quality Zones',
      '5': 'Weather Stations'
    };
    return names[layer] || 'Agricultural Facilities';
  }

  /**
   * Check if session has expired
   */
  private isSessionExpired(context: ConversationContext): boolean {
    return Date.now() - context.timestamp > this.SESSION_TIMEOUT;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, context] of this.conversations.entries()) {
      if (now - context.timestamp > this.SESSION_TIMEOUT) {
        this.conversations.delete(sessionId);
      }
    }
  }
}

export const conversationMemoryService = new ConversationMemoryService();
