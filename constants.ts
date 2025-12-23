
import { Document, GraphData, ChatMessage, AppConfig, Vault, SystemPrompt } from './types';

export const HERO_IMAGE_URL = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop";

export const DEFAULT_VAULTS: Vault[] = [
  {
    id: 'v1',
    name: 'Local Research',
    type: 'local',
    path: '/Users/admin/documents/research',
    status: 'connected'
  },
  {
    id: 'v2',
    name: 'Company S3 Archive',
    type: 's3',
    path: 's3://pratejra-corp-data/q4-reports',
    status: 'connected'
  },
  {
    id: 'v3',
    name: 'Personal Proton',
    type: 'proton',
    path: 'proton://drive/secure/vault-01',
    status: 'disconnected'
  }
];

export const DEFAULT_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'sp-1',
    name: 'Graph Analyst',
    content: 'You are a knowledge graph analyst. Provide concise, structural insights focusing on centrality and clusters.',
    category: 'analysis',
    lastModified: Date.now()
  },
  {
    id: 'sp-2',
    name: 'Executive Summary',
    content: 'Generate a professional profile summary based on the topics found. Assume the user is an expert. Use formal language.',
    category: 'profile',
    lastModified: Date.now()
  },
  {
    id: 'sp-3',
    name: 'Technical Auditor',
    content: 'Provide a raw, technical analysis of the document set, focusing on data density, types, and metadata distribution.',
    category: 'technical',
    lastModified: Date.now()
  },
  {
    id: 'sp-4',
    name: 'Future Planner',
    content: 'Analyze the content to predict future projects, learning paths, or gaps in knowledge. Suggest next steps.',
    category: 'creative',
    lastModified: Date.now()
  }
];

export const DEFAULT_CONFIG: AppConfig = {
  userName: 'Sunyata',
  userGoals: 'I want to identify cross-disciplinary connections in my research and prepare a technical roadmap for Q4.',
  activeVaultId: 'v1',
  vaults: DEFAULT_VAULTS,
  systemPrompts: DEFAULT_SYSTEM_PROMPTS,
  activeSystemPromptId: 'sp-1',
  llm: {
    provider: 'google',
    model: 'gemini-3-flash-preview',
    apiKeys: {
      google: process.env.API_KEY || '',
    },
    temperature: 0.3
  }
};

export const MOCK_DOCUMENTS: Document[] = [
  { 
    id: '1', 
    title: 'Deep Learning Research.pdf', 
    type: 'pdf', 
    size: '2.4 MB', 
    uploadDate: '2023-10-24', 
    status: 'indexed', 
    chunkCount: 142,
    metadata: { 'Topic': 'AI', 'Author': 'Vaswani', 'Year': '2017' },
    vaultId: 'v1'
  },
  { 
    id: '2', 
    title: 'Project Pratejra Specs.md', 
    type: 'md', 
    size: '12 KB', 
    uploadDate: '2023-10-25', 
    status: 'indexed', 
    chunkCount: 8,
    metadata: { 'Topic': 'Engineering', 'Status': 'Active', 'Priority': 'High' },
    vaultId: 'v1'
  },
  { 
    id: '3', 
    title: 'Meeting Notes Q3.txt', 
    type: 'txt', 
    size: '4 KB', 
    uploadDate: '2023-10-26', 
    status: 'processing', 
    chunkCount: 0,
    metadata: { 'Topic': 'Business', 'Type': 'Meeting' },
    vaultId: 'v1'
  },
];

export const MOCK_KNOWLEDGE_BASE = [
  {
    docId: '1',
    content: "The Transformer model architecture relies heavily on self-attention mechanisms to process input sequences in parallel, unlike RNNs which process sequentially. This allows for significantly faster training on large datasets.",
    metadata: { page: 1 }
  },
  {
    docId: '1',
    content: "Latency is a critical factor in real-time inference. Optimizing the attention matrix calculation can yield a 40% reduction in memory footprint and improved response times on edge devices.",
    metadata: { page: 4 }
  },
  {
    docId: '2',
    content: "Pratejra System Requirements: The RAG system must support hybrid search (dense vector + sparse keyword) and enforce a strict latency budget of 50ms for the retrieval phase using HNSW indexing.",
    metadata: { section: "NFR" }
  },
  {
    docId: '2',
    content: "The frontend is built with React 18 using Vite, while the backend utilizes FastAPI. Data persistence is handled by ChromaDB for vectors and PostgreSQL for relational metadata.",
    metadata: { section: "Stack" }
  },
  {
    docId: '3',
    content: "Q3 Meeting: Discussed the roadmap for Q4. Key deliverables include the 'My Profile' view, metadata tagging, and knowledge graph visualization updates. Budget approved.",
    metadata: { section: "Minutes" }
  }
];

export const MOCK_GRAPH_DATA: GraphData = {
  nodes: [],
  links: []
};

export const MOCK_CHAT_HISTORY: ChatMessage[] = [
  {
    id: 'c1',
    role: 'assistant',
    content: 'Hello! I am your personal knowledge assistant. Ask me anything about your documents, or use @ to reference specific topics.',
    timestamp: Date.now(),
  }
];

export const WORD_CLOUD_DATA = [
  { text: 'Neural Networks', value: 1000 },
  { text: 'Architecture', value: 800 },
  { text: 'Latency', value: 700 },
  { text: 'Optimization', value: 650 },
  { text: 'Dataset', value: 600 },
  { text: 'Transformer', value: 500 },
  { text: 'Attention', value: 400 },
];
