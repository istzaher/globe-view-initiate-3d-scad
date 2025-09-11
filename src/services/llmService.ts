/**
 * LLM Service for SCAD GenAI Tool
 * Integrates OpenRouter ChatGPT-4o for intelligent responses
 */

interface LLMResponse {
  message: string;
  success: boolean;
  error?: string;
}

export class LLMService {
  private apiKey: string;
  private model: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';

  constructor() {
    // Note: In a real app, these would come from environment variables
    // For now, we'll use the backend to make the API calls to keep the key secure
    this.apiKey = '';
    this.model = 'openai/gpt-4o';
    console.log('🤖 LLMService initialized for OpenRouter ChatGPT-4o');
  }

  /**
   * Generate response using ChatGPT-4o via OpenRouter
   */
  async generateResponse(
    message: string, 
    context: string = '',
    systemPrompt: string = ''
  ): Promise<LLMResponse> {
    try {
      console.log(`🧠 Generating LLM response for: "${message}"`);

      // Call backend endpoint that securely handles OpenRouter API
      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          systemPrompt: systemPrompt || this.getDefaultSystemPrompt()
        })
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ LLM response generated successfully');
      return {
        message: result.message,
        success: true
      };

    } catch (error) {
      console.error('❌ Error generating LLM response:', error);
      return {
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate response specifically for Abu Dhabi spatial queries
   */
  async generateSpatialResponse(
    query: string,
    spatialContext: {
      layerType?: string;
      featureCount?: number;
      location?: string;
    }
  ): Promise<LLMResponse> {
    const systemPrompt = `You are the SCAD GenAI Assistant for Abu Dhabi Statistics Centre. 
    You specialize in spatial analysis and GIS data interpretation for Abu Dhabi, UAE.
    
    Current spatial context:
    - Layer type: ${spatialContext.layerType || 'Unknown'}
    - Feature count: ${spatialContext.featureCount || 0}
    - Location: ${spatialContext.location || 'Abu Dhabi'}
    
    Provide helpful, context-aware responses about Abu Dhabi's infrastructure and spatial data.
    Keep responses concise but informative. Suggest relevant follow-up questions.`;

    return this.generateResponse(query, '', systemPrompt);
  }

  /**
   * Default system prompt for SCAD GenAI Tool
   */
  private getDefaultSystemPrompt(): string {
    return `You are the SCAD GenAI Assistant, an AI-powered spatial analysis assistant for the Abu Dhabi Statistics Centre (SCAD).

Your expertise includes:
- Abu Dhabi geographic information systems (GIS)
- Spatial data analysis and interpretation
- Infrastructure planning and analysis
- Abu Dhabi District Pulse livability indicators
- Real-time spatial queries and insights

You have access to real Abu Dhabi datasets including:
- Bus stops and public transportation (ITC)
- Mosques and religious facilities
- Parks and recreational areas
- Buildings and infrastructure
- Parking facilities
- Road networks

Always provide helpful, accurate responses focused on Abu Dhabi's spatial data and infrastructure. 
Suggest relevant follow-up questions to help users explore the data further.
Keep responses professional but conversational.`;
  }

  /**
   * Generate follow-up suggestions using LLM
   */
  async generateFollowUpSuggestions(
    conversationHistory: string[],
    currentQuery: string
  ): Promise<string[]> {
    try {
      const prompt = `Based on this conversation about Abu Dhabi spatial data:
      
Recent queries: ${conversationHistory.slice(-3).join(', ')}
Current query: ${currentQuery}

Generate 3 relevant follow-up questions that would help the user explore Abu Dhabi's infrastructure data further. 
Return only the questions, one per line, without numbering or bullets.`;

      const response = await this.generateResponse(prompt);
      
      if (response.success) {
        return response.message.split('\n').filter(q => q.trim().length > 0).slice(0, 3);
      }
      
      return [];
    } catch (error) {
      console.error('Error generating follow-up suggestions:', error);
      return [];
    }
  }
}

export const llmService = new LLMService();
