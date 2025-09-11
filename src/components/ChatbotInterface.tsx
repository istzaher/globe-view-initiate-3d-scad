/**
 * Chatbot Interface Component for SCAD GenAI Tool
 * Simplified version for debugging
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Bot, User, Sparkles, MessageSquare, X } from 'lucide-react';

interface ChatMessage {
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

interface FollowUpSuggestion {
  question: string;
  type: 'spatial' | 'analytical' | 'comparative' | 'exploratory';
  confidence: number;
}

interface ChatbotResponse {
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

interface ChatbotInterfaceProps {
  onQuerySubmit: (query: string, dataset?: string) => void;
  currentDataset?: string;
  isProcessing?: boolean;
  visibleLayers?: string[];
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({
  onQuerySubmit,
  currentDataset = 'education_0',
  isProcessing = false,
  visibleLayers = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<FollowUpSuggestion[]>([]);
  const [sessionId] = useState(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate suggestions based on visible layers
  const generateLayerBasedSuggestions = () => {
    const suggestions: FollowUpSuggestion[] = [];
    
    if (visibleLayers.length === 0) {
      // Default suggestions when no layers are visible
      suggestions.push(
        { question: "Show all bus stops in Abu Dhabi", type: "search", confidence: 0.9 },
        { question: "Find mosques near city center", type: "spatial", confidence: 0.9 },
        { question: "Display parks and green spaces", type: "search", confidence: 0.8 },
        { question: "Show parking areas", type: "search", confidence: 0.7 },
        { question: "Find healthcare facilities in GDB data", type: "spatial", confidence: 0.8 }
      );
    } else {
      // Generate suggestions based on visible layers
      visibleLayers.forEach(layerId => {
        if (layerId.includes('education') || layerId.includes('school')) {
          suggestions.push({ question: "Find schools in Central Abu Dhabi", type: "spatial", confidence: 0.9 });
        } else if (layerId.includes('healthcare') || layerId.includes('hospital')) {
          suggestions.push({ question: "Show hospitals with emergency services", type: "analytical", confidence: 0.8 });
        } else if (layerId.includes('infrastructure')) {
          suggestions.push({ question: "List infrastructure by operational status", type: "analytical", confidence: 0.8 });
        } else if (layerId.includes('transportation')) {
          suggestions.push({ question: "Show road conditions in my area", type: "spatial", confidence: 0.8 });
        }
      });
      
      // Add some general suggestions
      if (suggestions.length > 0) {
        suggestions.push(
          { question: "Compare visible layers by district", type: "comparative", confidence: 0.7 },
          { question: "Show me areas with multiple facilities", type: "analytical", confidence: 0.7 }
        );
      }
    }
    
    setFollowUpSuggestions(suggestions.slice(0, 6)); // Limit to 6 suggestions
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update suggestions when visible layers change
  useEffect(() => {
    generateLayerBasedSuggestions();
  }, [visibleLayers]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage({
        type: 'assistant',
        content: "Hello! I'm the SCAD GenAI Assistant. I can help you analyze Abu Dhabi's spatial data using ArcGIS feature layers. Try asking about schools, hospitals, farms, police stations, or other infrastructure. What would you like to explore?",
        metadata: {
          queryType: 'greeting'
        }
      });
      
      // Set initial follow-up suggestions based on visible layers
      generateLayerBasedSuggestions();
    }
  }, []);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...message
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const detectDatasetFromMessage = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    // Education datasets
    if (lowerMessage.includes('school') || lowerMessage.includes('university') || 
        lowerMessage.includes('library') || lowerMessage.includes('education') ||
        lowerMessage.includes('student') || lowerMessage.includes('training') ||
        lowerMessage.includes('research')) {
      if (lowerMessage.includes('university')) return 'education_1';
      if (lowerMessage.includes('library')) return 'education_2';
      if (lowerMessage.includes('training')) return 'education_3';
      if (lowerMessage.includes('research')) return 'education_4';
      if (lowerMessage.includes('housing') || lowerMessage.includes('dormitory')) return 'education_5';
      return 'education_0'; // Default to schools
    }
    
    // Public Safety datasets
    if (lowerMessage.includes('police') || lowerMessage.includes('fire') || 
        lowerMessage.includes('hospital') || lowerMessage.includes('emergency') ||
        lowerMessage.includes('safety') || lowerMessage.includes('security') ||
        lowerMessage.includes('medical') || lowerMessage.includes('health')) {
      if (lowerMessage.includes('fire')) return 'public_safety_1';
      if (lowerMessage.includes('hospital') || lowerMessage.includes('medical') || lowerMessage.includes('health')) return 'public_safety_2';
      if (lowerMessage.includes('emergency')) return 'public_safety_3';
      if (lowerMessage.includes('zone') || lowerMessage.includes('area')) return 'public_safety_4';
      if (lowerMessage.includes('surveillance') || lowerMessage.includes('camera')) return 'public_safety_5';
      return 'public_safety_0'; // Default to police stations
    }
    
    // Agriculture datasets
    if (lowerMessage.includes('agriculture') || lowerMessage.includes('farm') || 
        lowerMessage.includes('crop') || lowerMessage.includes('irrigation') ||
        lowerMessage.includes('soil') || lowerMessage.includes('weather') ||
        lowerMessage.includes('storage') || lowerMessage.includes('equipment')) {
      if (lowerMessage.includes('irrigation')) return 'agriculture_1';
      if (lowerMessage.includes('equipment') || lowerMessage.includes('machinery')) return 'agriculture_2';
      if (lowerMessage.includes('storage') || lowerMessage.includes('facility')) return 'agriculture_3';
      if (lowerMessage.includes('soil') || lowerMessage.includes('quality')) return 'agriculture_4';
      if (lowerMessage.includes('weather') || lowerMessage.includes('station')) return 'agriculture_5';
      return 'agriculture_0'; // Default to crop fields
    }
    
    return null; // No specific dataset detected
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    // Add user message
    addMessage({
      type: 'user',
      content: message,
      metadata: {
        queryType: 'user_input'
      }
    });

    setIsTyping(true);

    try {
      const response = await fetch('/api/chatbot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
          context: {
            currentDataset,
            previousQuery: messages[messages.length - 1]?.content,
            spatialContext: null
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get chatbot response');
      }

      const chatbotResponse: ChatbotResponse = await response.json();

      // Add assistant response
      addMessage({
        type: 'assistant',
        content: chatbotResponse.message,
        metadata: {
          queryType: chatbotResponse.metadata?.queryType,
          dataset: chatbotResponse.metadata?.dataset,
          spatialOperation: chatbotResponse.metadata?.spatialOperation
        }
      });

      // Update follow-up suggestions
      if (chatbotResponse.followUpSuggestions) {
        setFollowUpSuggestions(chatbotResponse.followUpSuggestions);
      }

      // If it's a spatial query, trigger the map query with intelligent dataset detection
      if (chatbotResponse.type === 'query' && chatbotResponse.metadata?.queryType === 'spatial') {
        const detectedDataset = detectDatasetFromMessage(message) || currentDataset || 'education_0';
        onQuerySubmit(message, detectedDataset);
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      addMessage({
        type: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        metadata: {
          queryType: 'error'
        }
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: FollowUpSuggestion) => {
    sendMessage(suggestion.question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-700/50 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold">SCAD GenAI Assistant</h2>
            <p className="text-gray-200 text-xs font-medium">Abu Dhabi Spatial Analysis</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:text-white hover:bg-purple-600/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full ml-1"></div>
                    <div className="w-1 h-1 bg-white rounded-full ml-1"></div>
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`px-4 py-3 rounded-2xl shadow-lg ${
                message.type === 'user'
                  ? 'bg-gray-800 text-white border border-gray-600'
                  : 'bg-purple-700/90 text-white backdrop-blur-sm border border-purple-500/30'
              }`}>
                <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                {message.metadata?.queryType && message.metadata.queryType !== 'greeting' && (
                  <div className="mt-2 text-xs opacity-80 font-medium">
                    {message.metadata.queryType === 'spatial' && '🗺️ Spatial Query'}
                    {message.metadata.queryType === 'analytical' && '📊 Analysis'}
                    {message.metadata.queryType === 'comparative' && '⚖️ Comparison'}
                    {message.metadata.queryType === 'error' && '❌ Error'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-1 h-1 bg-white rounded-full ml-1"></div>
                  <div className="w-1 h-1 bg-white rounded-full ml-1"></div>
                </div>
              </div>
              <div className="bg-purple-700/90 text-white backdrop-blur-sm px-4 py-3 rounded-2xl shadow-lg border border-purple-500/30">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up Suggestions */}
      {followUpSuggestions.length > 0 && (
        <div className="p-4 border-t border-purple-700/50 bg-black/40 backdrop-blur-sm">
          <p className="text-white font-medium text-sm mb-3">Suggested follow-ups:</p>
          <div className="flex flex-wrap gap-2">
            {followUpSuggestions.slice(0, 3).map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-white border-purple-400 bg-purple-800/50 hover:bg-purple-600 hover:text-white text-xs font-medium transition-colors duration-200"
              >
                {suggestion.question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-purple-700/50 bg-black/40 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-lg">
            AP
          </div>
          
          {/* Plus Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-white hover:text-white hover:bg-purple-600/50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>

          {/* Input Field */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What would you like to do?"
              className="bg-gray-800/80 border-purple-400/60 text-white placeholder-gray-300 rounded-xl pr-12 focus:ring-purple-400 focus:border-purple-400 focus:bg-gray-700/80"
              disabled={isProcessing}
            />
          </div>

          {/* Character Counter */}
          <div className="text-gray-200 text-xs font-medium">
            {inputValue.length}/1000
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!inputValue.trim() || isProcessing}
            className="w-10 h-10 p-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotInterface;