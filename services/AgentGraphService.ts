
import { GoogleGenAI, Type } from "@google/genai";
import { AgentGoal, AgentTurn, KnowledgeBlock, AgentAction, AgentGoalType } from "../types";

const SYSTEM_INSTRUCTION_BASE = `You are the Pratejra Agent System. You operate in a 'LangGraph' simulation where you act as two distinct nodes: The 'Coordinator' (Execution) and the 'Critic' (Refinement).

Your goal is to manipulate 'Knowledge Blocks' to achieve a specific outcome (Synthesis, Creation, Summarization, or Questioning).

You must output your response in JSON format containing:
1. 'agentName': Which agent is acting (Coordinator or Critic).
2. 'thought': The reasoning process.
3. 'action': The visual action to take on the blocks (MERGE, EXPLODE, SHAKE, IDLE).
4. 'targetBlockIds': Which blocks are affected.
5. 'outputContent': The actual text content generated or synthesized.

For 'MERGE' actions: You are combining ideas. The 'outputContent' should be the synthesis.
For 'EXPLODE' actions: You are breaking down a complex idea. The 'outputContent' should be one of the sub-components (the system will handle generating the others visually).
`;

export class AgentGraphService {
    private ai: GoogleGenAI | null = null;
    
    constructor() {
        const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
            ? process.env.API_KEY 
            : '';
        if (apiKey) {
            this.ai = new GoogleGenAI({ apiKey });
        }
    }

    async generateInitialBlocks(topic: string, model: string): Promise<KnowledgeBlock[]> {
        if (!this.ai) throw new Error("API Key missing");

        const prompt = `
        Analyze the following topic and break it down into 6 key component concepts.
        TOPIC: ${topic}
        
        Return a JSON object with a 'concepts' array. Each item should have 'label' and 'type' (concept, constraint, or data).
        `;

        try {
            const response = await this.ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            concepts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        label: { type: Type.STRING },
                                        type: { type: Type.STRING, enum: ["concept", "constraint", "data"] }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const json = JSON.parse(response.text || '{ "concepts": [] }');
            
            // Map to KnowledgeBlocks with random positions
            return json.concepts.map((c: any, i: number) => ({
                id: `init-${i}-${Date.now()}`,
                x: 20 + (i % 3) * 30 + (Math.random() * 10 - 5), 
                y: 20 + Math.floor(i / 3) * 30 + (Math.random() * 10 - 5),
                shape: c.type === 'constraint' ? 'circle' : c.type === 'data' ? 'triangle' : 'square',
                color: c.type === 'constraint' ? '#3b82f6' : c.type === 'data' ? '#10b981' : '#ef4444',
                content: c.label,
                scale: 1
            }));
        } catch (error) {
            console.error("Block gen failed", error);
            // Fallback
            return INITIAL_BLOCKS;
        }
    }

    async generateTurn(
        goal: AgentGoal,
        history: AgentTurn[],
        blocks: KnowledgeBlock[],
        turnCount: number,
        model: string
    ): Promise<AgentTurn> {
        if (!this.ai) throw new Error("API Key missing");

        const currentAgent = turnCount % 2 === 0 ? 'Coordinator' : 'Critic';
        
        const blockContext = blocks.map(b => `[ID: ${b.id}]: ${b.content}`).join('\n');
        const historyContext = history.map(h => `${h.agentName}: ${h.thought}`).join('\n');

        const prompt = `
        CURRENT GOAL: ${goal.type.toUpperCase()} - ${goal.description}
        CURRENT AGENT: ${currentAgent}
        TURN: ${turnCount + 1}/5
        
        AVAILABLE BLOCKS:
        ${blockContext}

        HISTORY:
        ${historyContext}

        INSTRUCTIONS:
        If ${currentAgent} is Coordinator:
        - If Goal is SYNTHESIS/CREATION: Select blocks to MERGE. Synthesize their content into a new insight.
        - If Goal is SUMMARISATION/QUESTIONING: Select a large block to EXPLODE. detailed analysis or specific question derived from it.
        
        If ${currentAgent} is Critic:
        - Review the last action. If it's good, IDLE and praise. If it needs work, select the block and SHAKE it with a critique in 'outputContent'.

        Response must be valid JSON.
        `;

        const response = await this.ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_BASE,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        agentName: { type: Type.STRING },
                        thought: { type: Type.STRING },
                        action: { 
                            type: Type.STRING, 
                            enum: ["MERGE", "EXPLODE", "SHAKE", "IDLE"] 
                        },
                        targetBlockIds: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING } 
                        },
                        outputContent: { type: Type.STRING }
                    }
                }
            }
        });

        const json = JSON.parse(response.text || '{}');

        return {
            step: turnCount + 1,
            agentName: currentAgent,
            thought: json.thought || "Processing...",
            action: {
                type: json.action || "IDLE",
                targetBlockIds: json.targetBlockIds || [],
                description: json.action === 'MERGE' ? 'Merging concepts...' : 'Breaking down complexity...'
            },
            outputContent: json.outputContent || ""
        };
    }
}

export const agentService = new AgentGraphService();

export const AGENT_GOALS: AgentGoal[] = [
    {
        id: 'g1',
        type: 'synthesis',
        label: 'Synthesis Engine',
        description: 'Combine disparate blocks into a unified theory.',
        systemPrompt: 'Focus on finding commonalities and overarching themes.'
    },
    {
        id: 'g2',
        type: 'creation',
        label: 'Creative Forge',
        description: 'Use blocks as inspiration to generate new, novel ideas.',
        systemPrompt: 'Be speculative, creative, and forward-looking.'
    },
    {
        id: 'g3',
        type: 'summarisation',
        label: 'Essence Extractor',
        description: 'Distill complex blocks into their core components.',
        systemPrompt: 'Be concise, reductive, and factual.'
    },
    {
        id: 'g4',
        type: 'questioning',
        label: 'Socratic Critic',
        description: 'Break blocks apart to find logical gaps or new avenues of inquiry.',
        systemPrompt: 'Be critical, inquisitive, and challenging.'
    }
];

export const INITIAL_BLOCKS: KnowledgeBlock[] = [
    { id: 'b1', x: 20, y: 20, shape: 'square', color: '#ef4444', content: 'Neural Architecture', scale: 1 },
    { id: 'b2', x: 70, y: 30, shape: 'circle', color: '#3b82f6', content: 'Latency Constraints', scale: 1 },
    { id: 'b3', x: 30, y: 70, shape: 'triangle', color: '#10b981', content: 'Vector Databases', scale: 1 },
    { id: 'b4', x: 80, y: 80, shape: 'hexagon', color: '#f59e0b', content: 'User Intent', scale: 1 },
];
