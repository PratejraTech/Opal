
export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'md' | 'txt';
  size: string;
  uploadDate: string;
  status: 'processing' | 'indexed' | 'error';
  chunkCount: number;
  progress?: number; // 0-100
  metadata?: Record<string, string>; 
  vaultId?: string; // Link to specific vault
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: Source[];
}

export interface Source {
  id: string;
  documentTitle: string;
  snippet: string;
  score: number;
  page?: number;
  metadata?: Record<string, any>;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  val: number; // size
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export enum ViewState {
  UPLOAD = 'UPLOAD',
  QUESTION = 'QUESTION',
  GRAPH = 'GRAPH',
  PROMPT = 'PROMPT',
  MY_PROFILE = 'MY_PROFILE',
  SETTINGS = 'SETTINGS',
  AGENT_CANVAS = 'AGENT_CANVAS'
}

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'ollama';

export type LLMModelID = 
  | 'gpt-5' 
  | 'gpt-5-mini' 
  | 'gpt-5-nano' 
  | 'claude-sonnet-3.5' 
  | 'claude-haiku-3'
  | 'gemini-3-flash-preview'
  | 'llama-3-70b';

export interface Vault {
  id: string;
  name: string;
  type: 'local' | 's3' | 'proton' | 'gcs' | 'google_drive';
  path: string;
  status: 'connected' | 'disconnected' | 'error';
  config?: Record<string, string>; // For OAuth, Keys, etc.
  icon?: string;
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  category: 'analysis' | 'profile' | 'creative' | 'technical';
  lastModified: number;
}

export interface AppConfig {
  userName: string;
  userGoals: string;
  activeVaultId: string;
  vaults: Vault[];
  systemPrompts: SystemPrompt[];
  activeSystemPromptId?: string;
  llm: {
    provider: LLMProvider;
    model: LLMModelID;
    apiKeys: {
      openai?: string;
      anthropic?: string;
      google?: string;
      ollama?: string;
    };
    ollamaUrl?: string;
    temperature: number;
  };
}

export interface AnalyticsEvent {
  id: string;
  type: 'search' | 'generation' | 'indexing';
  latencyMs: number;
  tokenCount: number;
  timestamp: number;
  success: boolean;
}

export type ProfileSummaryMode = 'raw' | 'professional' | 'future' | 'product';

// --- AGENT SYSTEM TYPES ---

export type AgentGoalType = 'synthesis' | 'creation' | 'summarisation' | 'questioning';

export interface AgentGoal {
  id: string;
  type: AgentGoalType;
  label: string;
  description: string;
  systemPrompt: string;
}

export interface KnowledgeBlock {
  id: string;
  x: number;
  y: number;
  shape: 'circle' | 'square' | 'triangle' | 'hexagon';
  color: string;
  content: string;
  scale: number;
}

export interface AgentAction {
  type: 'MERGE' | 'EXPLODE' | 'SHAKE' | 'IDLE';
  targetBlockIds: string[];
  description: string;
}

export interface AgentTurn {
  step: number;
  agentName: 'Coordinator' | 'Critic';
  thought: string;
  action: AgentAction;
  outputContent: string;
}

// --- RECURSIVE KNOWLEDGE TREE ---
export interface RecursiveNode {
  id: string;
  label: string;
  summary: string;
  children: RecursiveNode[];
  isExpanded: boolean;
  depth: number;
  type: 'root' | 'branch' | 'leaf';
}
