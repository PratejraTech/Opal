
import { GoogleGenAI, Type } from "@google/genai";
import { Document, AnalyticsEvent, Source, RecursiveNode } from "../types";
import { MOCK_KNOWLEDGE_BASE, MOCK_DOCUMENTS } from "../constants";

// Configuration for the RAG Engine
const CONFIG = {
  embeddingModel: 'text-embedding-004',
  completionModel: 'gemini-3-flash-preview', 
  chunkSize: 512,
  overlap: 50,
};

/**
 * Analytics Engine
 * Tracks performance metrics for the RAG system
 */
export class AnalyticsEngine {
  private events: AnalyticsEvent[] = [];

  logEvent(type: AnalyticsEvent['type'], latencyMs: number, tokenCount: number, success: boolean) {
    const event: AnalyticsEvent = {
      id: Math.random().toString(36).substring(7),
      type,
      latencyMs,
      tokenCount,
      timestamp: Date.now(),
      success
    };
    this.events.push(event);
    console.debug(`[Analytics] ${type.toUpperCase()} | ${latencyMs}ms | Tokens: ${tokenCount}`);
  }

  getAverageLatency(type: AnalyticsEvent['type']): number {
    const relevant = this.events.filter(e => e.type === type);
    if (relevant.length === 0) return 0;
    return relevant.reduce((acc, curr) => acc + curr.latencyMs, 0) / relevant.length;
  }
}

export const analytics = new AnalyticsEngine();

/**
 * RAG Search Engine
 * Handles embedding generation, retrieval, and synthesis
 */
export class RAGEngine {
  private ai: GoogleGenAI | null = null;
  private apiKey: string = '';

  constructor() {
    try {
      // Safely access process.env 
      this.apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
        ? process.env.API_KEY 
        : '';
        
      if (this.apiKey) {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      }
    } catch (error) {
      console.warn("Failed to initialize GoogleGenAI client:", error);
      this.ai = null;
    }
  }

  /**
   * Generates vector embeddings for a given text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const start = Date.now();
    try {
      if (!this.ai) return new Array(768).fill(0).map(() => Math.random());

      const result = await this.ai.models.embedContent({
        model: CONFIG.embeddingModel,
        contents: [{ parts: [{ text }] }],
      });
      
      const embedding = result.embedding?.values || [];
      
      analytics.logEvent('indexing', Date.now() - start, text.length / 4, true);
      return embedding;
    } catch (error) {
      console.error("Embedding generation failed", error);
      analytics.logEvent('indexing', Date.now() - start, 0, false);
      return [];
    }
  }

  /**
   * Functional Mock Retrieval
   * Scans the MOCK_KNOWLEDGE_BASE for keywords found in the query
   * Supports limiting scope by document IDs
   */
  async search(query: string, documents?: Document[], filterDocIds?: string[]): Promise<Source[]> {
    const start = Date.now();
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 600));

    const terms = query.toLowerCase().split(' ').filter(t => t.length > 3);
    const results: Source[] = [];

    // Scan knowledge base
    MOCK_KNOWLEDGE_BASE.forEach((chunk, index) => {
      // Filter Logic
      if (filterDocIds && filterDocIds.length > 0) {
        if (!filterDocIds.includes(chunk.docId)) return;
      }

      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      
      // Simple scoring: how many terms match?
      terms.forEach(term => {
        if (contentLower.includes(term)) score += 0.2;
      });

      if (score > 0) {
        // Find parent document info
        const parentDoc = MOCK_DOCUMENTS.find(d => d.id === chunk.docId);
        results.push({
          id: `s-${index}`,
          documentTitle: parentDoc ? parentDoc.title : 'Unknown Doc',
          snippet: chunk.content,
          score: Math.min(score, 1), // Cap at 1
          page: chunk.metadata.page || 1,
          metadata: chunk.metadata
        });
      }
    });

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // If no results, provide a generic fallback for demo purposes
    if (results.length === 0) {
        results.push({
            id: 'fallback',
            documentTitle: 'System Help',
            snippet: filterDocIds && filterDocIds.length > 0 
                ? 'No matches found in the selected documents.' 
                : 'No exact matches found in the knowledge base. However, Pratejra is designed to assist with engineering, AI research, and project management tasks.',
            score: 0.1,
            page: 0
        });
    }

    analytics.logEvent('search', Date.now() - start, 0, true);
    return results.slice(0, 4); // Return top 4
  }

  /**
   * Generates a grounded response using retrieved documents
   */
  async generateRAGResponse(query: string, sources: Source[], customInstructions?: string, temperature: number = 0.2): Promise<string> {
    const start = Date.now();
    
    if (!this.ai) {
      return "System Error: API Key missing. Please configure your environment variables.";
    }

    try {
      // 1. Construct Context String
      const contextBlock = sources.map(s => 
        `[Source: ${s.documentTitle} (Relevance: ${Math.round(s.score * 100)}%)]\n${s.snippet}`
      ).join('\n\n');
      
      // 2. Build Prompt
      const prompt = `You are Pratejra, an advanced personal knowledge assistant.
      
      TASK: Answer the user's question based strictly on the provided context.
      
      CONTEXT:
      ${contextBlock}
      
      USER GOALS & CUSTOM INSTRUCTIONS:
      ${customInstructions || 'No specific custom instructions provided.'}
      
      USER QUESTION: 
      ${query}
      
      INSTRUCTIONS:
      - Be concise and technical.
      - If the context does not contain the answer, state that clearly.
      - Cite the document title when referencing specific facts.
      - Align your tone and output with the User Goals provided above.
      `;

      // 3. Call Gemini
      const response = await this.ai.models.generateContent({
        model: CONFIG.completionModel,
        contents: prompt,
        config: {
          temperature: temperature, 
        }
      });

      const text = response.text || "I analyzed the documents but could not generate a coherent response.";
      
      analytics.logEvent('generation', Date.now() - start, text.length / 4, true);
      return text;

    } catch (error) {
      console.error("RAG Generation failed:", error);
      analytics.logEvent('generation', Date.now() - start, 0, false);
      return "An error occurred while communicating with the intelligence engine.";
    }
  }

  /**
   * Recursively breaks down a concept into sub-components
   */
  async recursiveBreakdown(concept: string, context: string): Promise<RecursiveNode[]> {
      if (!this.ai) throw new Error("API Key missing");
      
      const prompt = `
      Break down the concept "${concept}" into 3 distinct sub-components or child concepts based on this context:
      "${context}"

      Return a JSON object with a 'children' array. Each child should have:
      - 'label': The sub-concept name
      - 'summary': A 10-word description
      - 'type': 'branch' if it can be broken down further, or 'leaf' if it's atomic.
      `;

      try {
          const response = await this.ai.models.generateContent({
              model: CONFIG.completionModel,
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          children: {
                              type: Type.ARRAY,
                              items: {
                                  type: Type.OBJECT,
                                  properties: {
                                      label: { type: Type.STRING },
                                      summary: { type: Type.STRING },
                                      type: { type: Type.STRING, enum: ['branch', 'leaf'] }
                                  }
                              }
                          }
                      }
                  }
              }
          });

          const json = JSON.parse(response.text || '{ "children": [] }');
          
          return json.children.map((c: any, i: number) => ({
              id: `${concept}-${i}-${Date.now()}`,
              label: c.label,
              summary: c.summary,
              children: [],
              isExpanded: false,
              depth: 0, // Will be set by caller
              type: c.type
          }));

      } catch (e) {
          console.error("Recursive breakdown failed", e);
          return [];
      }
  }
}

export const ragSystem = new RAGEngine();
