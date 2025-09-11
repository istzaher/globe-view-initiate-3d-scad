/**
 * GenAI Chatbot Service for SCAD GenAI Tool
 * Provides intelligent conversational capabilities with context awareness
 * Now powered by ChatGPT-4o via OpenRouter
 */

import { conversationMemoryService, ConversationMessage, FollowUpSuggestion } from './conversationMemoryService';
import { llmService } from './llmService';

export interface ChatbotResponse {
  message: string;
  type: 'query' | 'analysis' | 'explanation' | 'suggestion' | 'error';
  followUpSuggestions?: FollowUpSuggestion[];
  metadata?: {
    queryType?: string;
    dataset?: string;
    spatialOperation?: string;
    confidence?: number;
  };
  context?: {
    previousQuery?: string;
    dataset?: string;
    resultsCount?: number;
  };
}

export interface ChatbotQuery {
  message: string;
  sessionId: string;
  currentDataset?: string;
  spatialContext?: {
    center: { x: number; y: number };
    zoom: number;
  };
}

class GenAIChatbotService {
  private readonly SCAD_CONTEXT = `
    You are the SCAD GenAI Assistant, an intelligent spatial analysis chatbot for the Abu Dhabi Statistics Centre (SCAD).
    
    Your capabilities include:
    - Natural language querying of GIS datasets (Agriculture, Education, Public Safety)
    - Abu Dhabi District Pulse livability indicator analysis
    - Spatial analysis (buffers, overlays, proximity analysis)
    - Multi-dataset comparative analysis
    - Contextual follow-up questions and suggestions
    
    Available datasets:
    - Agriculture: Crop Fields, Irrigation Systems, Farming Equipment, Storage Facilities, Soil Quality Zones, Weather Stations
    - Education: Schools, Universities, Libraries, Training Centers, Research Facilities, Student Housing
    - Public Safety: Police Stations, Fire Stations, Hospitals, Emergency Services, Safety Zones, Surveillance Systems
    
    Always respond in a helpful, professional manner and provide context-aware suggestions for follow-up questions.
    Focus on Abu Dhabi, UAE and SCAD's District Pulse initiative.
  `;

  /**
   * Process a conversational query with context awareness
   */
  async processQuery(query: ChatbotQuery): Promise<ChatbotResponse> {
    try {
      const { message, sessionId, currentDataset, spatialContext } = query;
      
      // Get conversation context
      const context = conversationMemoryService.getConversationContext(sessionId);
      
      // Process the query with context
      const processedQuery = conversationMemoryService.processFollowUpQuestion(sessionId, message);
      
      // Determine query type and generate appropriate response
      const queryType = this.analyzeQueryType(message);
      const response = await this.generateResponse(message, queryType, context, processedQuery);
      
      // Add user message to conversation
      conversationMemoryService.addMessage(sessionId, {
        type: 'user',
        content: message,
        metadata: {
          queryType,
          dataset: currentDataset
        }
      });
      
      // Add assistant response to conversation
      conversationMemoryService.addMessage(sessionId, {
        type: 'assistant',
        content: response.message,
        metadata: response.metadata
      });
      
      // Update conversation context
      conversationMemoryService.updateContext(sessionId, {
        currentDataset: currentDataset,
        lastQuery: message,
        spatialContext
      });
      
      // Generate follow-up suggestions
      response.followUpSuggestions = conversationMemoryService.generateFollowUpSuggestions(sessionId);
      
      return response;
      
    } catch (error) {
      console.error('Error processing chatbot query:', error);
      return {
        message: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        type: 'error',
        followUpSuggestions: conversationMemoryService.generateFollowUpSuggestions(query.sessionId)
      };
    }
  }

  /**
   * Analyze the type of query being asked
   */
  private analyzeQueryType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis')) {
      return 'analysis';
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('comparison')) {
      return 'comparative';
    } else if (lowerMessage.includes('show') || lowerMessage.includes('find') || lowerMessage.includes('display')) {
      return 'spatial';
    } else if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('why')) {
      return 'exploratory';
    } else if (lowerMessage.includes('near') || lowerMessage.includes('within') || lowerMessage.includes('distance')) {
      return 'proximity';
    } else {
      return 'general';
    }
  }

  /**
   * Generate contextual response based on query type and conversation history
   */
  private async generateResponse(
    message: string, 
    queryType: string, 
    context: any, 
    processedQuery: any
  ): Promise<ChatbotResponse> {
    
    const lowerMessage = message.toLowerCase();
    
    // Handle greetings and initial queries
    if (this.isGreeting(message)) {
      const llmResponse = await llmService.generateResponse(
        message,
        `User is greeting the SCAD GenAI Assistant. Previous conversation: ${context.messages?.slice(-2).map((m: any) => m.content).join(', ') || 'None'}`
      );
      
      return {
        message: llmResponse.success ? llmResponse.message : `Hello! I'm the SCAD GenAI Assistant. I can help you analyze Abu Dhabi's spatial data including bus stops, mosques, parks, and other infrastructure. What would you like to explore?`,
        type: 'suggestion',
        followUpSuggestions: conversationMemoryService.generateFollowUpSuggestions(context.sessionId)
      };
    }
    
    // Handle help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return {
        message: `I can help you with:\n\n• **Spatial Queries**: "Show me all schools in Abu Dhabi", "Find hospitals near police stations"\n• **Analysis**: "Analyze education accessibility", "Compare agricultural productivity"\n• **District Pulse**: "Show livability indicators", "Compare districts"\n• **Multi-dataset**: "Find schools within 2km of hospitals"\n\nWhat would you like to explore?`,
        type: 'explanation'
      };
    }
    
    // Handle dataset inquiries
    if (lowerMessage.includes('dataset') || lowerMessage.includes('available data')) {
      return {
        message: `Here are the available datasets for Abu Dhabi analysis:\n\n**Education (6 layers):**\n• Schools, Universities, Libraries\n• Training Centers, Research Facilities, Student Housing\n\n**Public Safety (6 layers):**\n• Police Stations, Fire Stations, Hospitals\n• Emergency Services, Safety Zones, Surveillance Systems\n\n**Agriculture (6 layers):**\n• Crop Fields, Irrigation Systems, Farming Equipment\n• Storage Facilities, Soil Quality Zones, Weather Stations\n\nWhich dataset interests you?`,
        type: 'explanation'
      };
    }
    
    // Handle spatial queries
    if (queryType === 'spatial' || queryType === 'proximity') {
      return {
        message: `I'll help you with that spatial query. ${this.getSpatialQueryGuidance(message)}`,
        type: 'query',
        metadata: {
          queryType: 'spatial',
          spatialOperation: this.extractSpatialOperation(message),
          confidence: 0.9
        }
      };
    }
    
    // Handle analysis queries
    if (queryType === 'analysis' || queryType === 'comparative') {
      return {
        message: `I'll perform that analysis for you. ${this.getAnalysisGuidance(message)}`,
        type: 'analysis',
        metadata: {
          queryType: 'analysis',
          confidence: 0.9
        }
      };
    }
    
    // Handle follow-up questions with context
    if (context.messages.length > 2) {
      return this.handleFollowUpQuery(message, context, processedQuery);
    }
    
    // Default response for general queries using LLM
    const conversationContext = context.messages?.slice(-3).map((m: any) => `${m.type}: ${m.content}`).join('\n') || 'No previous conversation';
    
    const llmResponse = await llmService.generateResponse(
      message,
      conversationContext,
      `You are helping a user with Abu Dhabi spatial data analysis. The user asked: "${message}". 
      
      Available real datasets: bus stops, mosques, parks, buildings, parking areas, roads.
      
      Provide a helpful response and suggest specific queries they could try with the real Abu Dhabi data.`
    );
    
    return {
      message: llmResponse.success ? llmResponse.message : `I understand you're asking about "${message}". Let me help you with that. You can try queries like "Show bus stops in Abu Dhabi" or "Find mosques near city center".`,
      type: 'suggestion',
      metadata: {
        queryType: 'general',
        confidence: llmResponse.success ? 0.9 : 0.7
      }
    };
  }

  /**
   * Handle follow-up questions with conversation context
   */
  private handleFollowUpQuery(message: string, context: any, processedQuery: any): ChatbotResponse {
    const lowerMessage = message.toLowerCase();
    
    // Check for references to previous results
    if (lowerMessage.includes('these') || lowerMessage.includes('those') || lowerMessage.includes('them')) {
      return {
        message: `I'll analyze the data from your previous query. ${this.getContextualGuidance(message, context)}`,
        type: 'query',
        context: {
          previousQuery: context.lastQuery,
          dataset: context.currentDataset,
          resultsCount: context.lastResults?.length
        },
        metadata: {
          queryType: 'follow-up',
          confidence: 0.8
        }
      };
    }
    
    // Check for spatial context references
    if (lowerMessage.includes('here') || lowerMessage.includes('this area') || lowerMessage.includes('current area')) {
      return {
        message: `I'll focus on the current map area for your query. ${this.getSpatialContextGuidance(message, context)}`,
        type: 'query',
        metadata: {
          queryType: 'spatial',
          confidence: 0.9
        }
      };
    }
    
    // Check for analysis continuation
    if (lowerMessage.includes('also') || lowerMessage.includes('additionally') || lowerMessage.includes('further')) {
      return {
        message: `I'll extend the analysis with additional insights. ${this.getExtendedAnalysisGuidance(message, context)}`,
        type: 'analysis',
        metadata: {
          queryType: 'extended-analysis',
          confidence: 0.8
        }
      };
    }
    
    // Default follow-up response
    return {
      message: `I'll help you with that follow-up question. ${this.getGeneralFollowUpGuidance(message, context)}`,
      type: 'query',
      metadata: {
        queryType: 'follow-up',
        confidence: 0.7
      }
    };
  }

  /**
   * Check if message is a greeting
   */
  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => message.toLowerCase().includes(greeting));
  }

  /**
   * Extract spatial operation from message
   */
  private extractSpatialOperation(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('within') || lowerMessage.includes('inside')) return 'within';
    if (lowerMessage.includes('near') || lowerMessage.includes('close to')) return 'proximity';
    if (lowerMessage.includes('buffer') || lowerMessage.includes('around')) return 'buffer';
    if (lowerMessage.includes('overlay') || lowerMessage.includes('intersect')) return 'overlay';
    
    return 'spatial';
  }

  /**
   * Get spatial query guidance
   */
  private getSpatialQueryGuidance(message: string): string {
    if (message.toLowerCase().includes('school')) {
      return "I'll show you the education facilities and their spatial distribution.";
    } else if (message.toLowerCase().includes('hospital') || message.toLowerCase().includes('health')) {
      return "I'll display the healthcare facilities and their coverage areas.";
    } else if (message.toLowerCase().includes('police') || message.toLowerCase().includes('safety')) {
      return "I'll show you the public safety infrastructure and response coverage.";
    } else if (message.toLowerCase().includes('agriculture') || message.toLowerCase().includes('farm')) {
      return "I'll display the agricultural areas and farming infrastructure.";
    }
    
    return "I'll process your spatial query and display the relevant features on the map.";
  }

  /**
   * Get analysis guidance
   */
  private getAnalysisGuidance(message: string): string {
    if (message.toLowerCase().includes('district pulse') || message.toLowerCase().includes('livability')) {
      return "I'll analyze the Abu Dhabi District Pulse livability indicators across different districts.";
    } else if (message.toLowerCase().includes('compare')) {
      return "I'll perform a comparative analysis between the specified areas or datasets.";
    } else if (message.toLowerCase().includes('trend') || message.toLowerCase().includes('over time')) {
      return "I'll analyze the temporal trends and patterns in the data.";
    }
    
    return "I'll perform a comprehensive analysis of the requested data.";
  }

  /**
   * Get contextual guidance for follow-up queries
   */
  private getContextualGuidance(message: string, context: any): string {
    const dataset = context.currentDataset;
    if (dataset) {
      const datasetType = dataset.split('_')[0];
      return `I'll analyze the ${datasetType} data from your previous query and provide additional insights.`;
    }
    return "I'll build upon your previous analysis and provide more detailed information.";
  }

  /**
   * Get spatial context guidance
   */
  private getSpatialContextGuidance(message: string, context: any): string {
    return "I'll focus the analysis on the current map extent and provide location-specific insights.";
  }

  /**
   * Get extended analysis guidance
   */
  private getExtendedAnalysisGuidance(message: string, context: any): string {
    return "I'll extend your previous analysis with additional layers of information and deeper insights.";
  }

  /**
   * Get general follow-up guidance
   */
  private getGeneralFollowUpGuidance(message: string, context: any): string {
    return "I'll process your follow-up question using the context from our conversation.";
  }

  /**
   * Get conversation summary
   */
  getConversationSummary(sessionId: string): string {
    const context = conversationMemoryService.getConversationContext(sessionId);
    const messages = context.messages.slice(-5); // Last 5 messages
    
    if (messages.length === 0) {
      return "No conversation history available.";
    }
    
    const summary = messages.map(msg => 
      `${msg.type === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    return `Recent conversation:\n\n${summary}`;
  }

  /**
   * Clear conversation history
   */
  clearConversation(sessionId: string): void {
    conversationMemoryService.clearConversation(sessionId);
  }
}

export const genAIChatbotService = new GenAIChatbotService();
