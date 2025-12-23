
import React, { useState, useMemo, useEffect } from 'react';
import { PaperCard, PaperButton, PaperBadge } from '../components/PaperComponents';
import { Document, AppConfig, RecursiveNode } from '../types';
import { Filter, X, Zap, BarChart2, Hash, Settings2, GitBranch, Cloud, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { ragSystem } from '../services/RAGEngine';

interface MyProfileViewProps {
  documents: Document[];
  config: AppConfig;
}

// --- Improved Cloud Component ---
const WordCloud: React.FC<{ data: { text: string; value: number }[] }> = ({ data }) => {
  // Fibonacci Spiral Distribution
  const layout = useMemo(() => {
     const items: any[] = [];
     const goldenAngle = Math.PI * (3 - Math.sqrt(5));
     
     data.forEach((item, i) => {
         // Scale value to a reasonable size range (12px to 48px)
         const maxVal = data[0].value;
         const size = Math.max(12, (item.value / maxVal) * 48);
         
         // Spiral Calculation
         const r = Math.sqrt(i + 1) * 35; // Spread factor
         const theta = i * goldenAngle;
         
         const x = r * Math.cos(theta);
         const y = r * Math.sin(theta);
         
         items.push({ ...item, x, y, size });
     });
     return items;
  }, [data]);

  return (
    <div className="relative w-full h-[400px] bg-white border border-gray-200 overflow-hidden flex items-center justify-center cursor-move active:cursor-grabbing">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-radial-gradient from-gray-100 to-transparent opacity-50 rounded-full blur-3xl"></div>
      </div>
      
      {layout.map((item, idx) => (
         <div 
            key={idx}
            className="absolute transition-all duration-700 ease-out hover:z-50 group"
            style={{
                transform: `translate(${item.x}px, ${item.y}px)`,
            }}
         >
             <span 
                className={`
                    block font-serif font-bold transition-all duration-300
                    group-hover:scale-110 group-hover:text-accent cursor-pointer select-none
                    ${idx < 5 ? 'text-ink' : 'text-gray-400'}
                `}
                style={{ fontSize: `${item.size}px` }}
             >
                 {item.text}
             </span>
             {/* Tooltip */}
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                 Count: {item.value}
             </div>
         </div>
      ))}
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-gray-300 bg-white/80 px-2 py-1 rounded border border-gray-100">
          Semantic Projection v2.0
      </div>
    </div>
  );
};

// --- Recursive Tree Component ---
const RecursiveTreeItem: React.FC<{ 
    node: RecursiveNode; 
    onExpand: (node: RecursiveNode) => void; 
    isLoading: boolean 
}> = ({ node, onExpand, isLoading }) => {
    return (
        <div className="pl-4 border-l-2 border-gray-200 relative animate-fade-in">
            <div className="absolute top-4 left-0 w-4 h-0.5 bg-gray-200"></div>
            <div className="py-2">
                <div className="bg-white border border-gray-200 hover:border-accent p-3 rounded-sm shadow-sm transition-all group flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            {node.type === 'root' && <Cloud size={14} className="text-accent"/>}
                            {node.type === 'branch' && <GitBranch size={14} className="text-blue-500"/>}
                            {node.type === 'leaf' && <Hash size={14} className="text-gray-400"/>}
                            <span className="text-sm font-bold text-ink">{node.label}</span>
                        </div>
                        
                        {(node.type === 'branch' || node.type === 'root') && (
                            <button 
                                onClick={() => onExpand(node)}
                                disabled={node.children.length > 0 || isLoading}
                                className={`
                                    p-1 rounded hover:bg-gray-100 transition-colors
                                    ${node.children.length > 0 ? 'text-gray-300 cursor-default' : 'text-accent'}
                                `}
                                title="Recursive Breakdown"
                            >
                                {isLoading ? <RefreshCw size={14} className="animate-spin"/> : <Zap size={14}/>}
                            </button>
                        )}
                    </div>
                    
                    <p className="text-xs text-gray-500 font-mono leading-relaxed">
                        {node.summary}
                    </p>
                </div>
            </div>

            {node.children.length > 0 && (
                <div className="ml-2">
                    {node.children.map(child => (
                        <RecursiveTreeItem key={child.id} node={child} onExpand={onExpand} isLoading={isLoading} />
                    ))}
                </div>
            )}
        </div>
    );
};

const RecursiveTreeView: React.FC<{
    rootConcept: string;
    onReset: () => void;
}> = ({ rootConcept, onReset }) => {
    const [treeData, setTreeData] = useState<RecursiveNode>({
        id: 'root',
        label: rootConcept,
        summary: "Root Concept derived from your selection.",
        children: [],
        isExpanded: true,
        depth: 0,
        type: 'root'
    });
    const [loadingNodeId, setLoadingNodeId] = useState<string | null>(null);

    const handleExpand = async (node: RecursiveNode) => {
        setLoadingNodeId(node.id);
        try {
            const children = await ragSystem.recursiveBreakdown(node.label, node.summary);
            
            // Helper to update tree deeply
            const updateTree = (current: RecursiveNode): RecursiveNode => {
                if (current.id === node.id) {
                    return { ...current, children: children, isExpanded: true };
                }
                return { ...current, children: current.children.map(updateTree) };
            };

            setTreeData(prev => updateTree(prev));
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingNodeId(null);
        }
    };

    return (
        <div className="h-[500px] flex flex-col bg-gray-50 border border-gray-200">
             <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                 <h4 className="font-bold text-sm text-ink flex items-center gap-2">
                     <GitBranch size={16}/> Recursive Analysis: <span className="text-accent">{rootConcept}</span>
                 </h4>
                 <PaperButton size="sm" variant="secondary" onClick={onReset} icon={<X size={14}/>}>Close</PaperButton>
             </div>
             
             <div className="flex-1 overflow-auto p-6">
                 <RecursiveTreeItem 
                    node={treeData} 
                    onExpand={handleExpand} 
                    isLoading={loadingNodeId === treeData.id || loadingNodeId !== null && loadingNodeId !== treeData.id && false /* simplistic loading logic */}
                 />
                 {loadingNodeId && (
                     <div className="fixed bottom-10 right-10 bg-white border-2 border-accent p-3 shadow-lg flex items-center gap-3 animate-fade-in z-50 rounded-sm">
                         <RefreshCw size={16} className="animate-spin text-accent"/>
                         <span className="text-xs font-bold text-ink">Analyzing Sub-components...</span>
                     </div>
                 )}
             </div>
        </div>
    );
};


export const MyProfileView: React.FC<MyProfileViewProps> = ({ documents, config }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [keywordFilter, setKeywordFilter] = useState('');
  
  // Summary State
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  // Recursive View State
  const [activeRecursiveConcept, setActiveRecursiveConcept] = useState<string | null>(null);
  
  // Use config's system prompts
  const [selectedPromptId, setSelectedPromptId] = useState<string>(config.activeSystemPromptId || (config.systemPrompts[0]?.id || ''));

  const activePrompt = config.systemPrompts.find(p => p.id === selectedPromptId) 
    || config.systemPrompts[0] 
    || { content: 'Summarize.', name: 'Default Strategy' };

  const metadataOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {};
    documents.forEach(doc => {
      if (doc.metadata) {
        Object.entries(doc.metadata).forEach(([k, v]) => {
          if (!options[k]) options[k] = new Set();
          options[k].add(v);
        });
      }
    });
    return options;
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (keywordFilter && !doc.title.toLowerCase().includes(keywordFilter.toLowerCase())) return false;
      for (const [key, val] of Object.entries(activeFilters)) {
        if (!doc.metadata || doc.metadata[key] !== val) return false;
      }
      return true;
    });
  }, [documents, keywordFilter, activeFilters]);

  const wordCloudData = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredDocs.forEach(doc => {
        doc.title.split(/[\s._-]+/).forEach(w => {
           if (w.length > 4) counts[w] = (counts[w] || 0) + 100;
        });
        if(doc.metadata) {
            Object.values(doc.metadata).forEach(v => {
                counts[v] = (counts[v] || 0) + 300;
            });
        }
     });
     return Object.entries(counts)
       .map(([text, value]) => ({ text, value }))
       .sort((a,b) => b.value - a.value)
       .slice(0, 30); // Increased slice
  }, [filteredDocs]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary('');
    
    const sources = filteredDocs.map((doc, idx) => ({
        id: doc.id,
        documentTitle: doc.title,
        snippet: `Metadata: ${JSON.stringify(doc.metadata)}.`,
        score: 1,
        page: 1
    }));

    const query = `Analyze these documents using the following system instruction: ${activePrompt.content}`;
    const result = await ragSystem.generateRAGResponse(query, sources);
    
    setSummary(result);
    setIsSummarizing(false);
  };

  const toggleFilter = (key: string, value: string) => {
    setActiveFilters(prev => {
       const next = { ...prev };
       if (next[key] === value) delete next[key];
       else next[key] = value;
       return next;
    });
  };

  return (
    <div className="h-[calc(100vh-6rem)] relative flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-gray-200 pb-6">
        <div>
           <h2 className="text-3xl font-serif font-bold text-ink">My Profile</h2>
           <p className="text-gray-500 font-mono text-sm mt-1">Analytics & Collections</p>
        </div>
        <div className="flex gap-4">
           <PaperButton 
             variant="secondary" 
             icon={<Filter size={16}/>} 
             onClick={() => setIsFilterOpen(true)}
           >
             Filters {Object.keys(activeFilters).length > 0 && `(${Object.keys(activeFilters).length})`}
           </PaperButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Col: Word Cloud OR Recursive Tree */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {!activeRecursiveConcept ? (
                <PaperCard 
                    title="Semantic Cloud" 
                    className="flex-1 flex flex-col min-h-[400px]"
                    action={
                        <div className="text-[10px] text-gray-400 font-mono">
                            Select Filtered Topic to Analyze Recusively
                        </div>
                    }
                >
                    {wordCloudData.length > 0 ? (
                        <div className="relative h-full">
                            <WordCloud data={wordCloudData} />
                            {/* Recursive Control Overlay */}
                            <div className="absolute top-2 right-2 bg-white/90 p-2 border border-gray-200 shadow-sm text-xs rounded-sm">
                                <span className="font-bold text-ink block mb-2">Recursive Tool</span>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {wordCloudData.slice(0, 5).map(item => (
                                        <button 
                                            key={item.text}
                                            onClick={() => setActiveRecursiveConcept(item.text)}
                                            className="block w-full text-left px-2 py-1 hover:bg-accent hover:text-white transition-colors"
                                        >
                                            Breakdown "{item.text}"
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 italic">
                            No data available. Try adjusting filters.
                        </div>
                    )}
                </PaperCard>
            ) : (
                <RecursiveTreeView 
                    rootConcept={activeRecursiveConcept} 
                    onReset={() => setActiveRecursiveConcept(null)} 
                />
            )}
            
            {/* Output Summary Box */}
            <PaperCard 
                className="min-h-[250px] border-ink flex flex-col"
                title="Strategic Analysis"
                action={
                    <div className="flex items-center gap-2">
                        <select 
                            className="bg-gray-100 border border-gray-300 text-xs font-bold uppercase py-1 px-2 rounded-sm focus:outline-none max-w-[150px] truncate"
                            value={selectedPromptId}
                            onChange={(e) => setSelectedPromptId(e.target.value)}
                        >
                            {config.systemPrompts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                             <Settings2 size={12}/> Cmd+I to Manage
                        </div>
                    </div>
                }
            >
                <div className="flex-1 relative">
                    {summary ? (
                        <div className="prose prose-sm max-w-none animate-fade-in font-serif leading-relaxed p-2">
                            {summary.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-10">
                            <BarChart2 size={32} className="opacity-20"/>
                            <p className="text-sm italic">Select a strategy and generate insights.</p>
                        </div>
                    )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <PaperButton 
                        onClick={handleSummarize} 
                        disabled={isSummarizing || filteredDocs.length === 0}
                        icon={isSummarizing ? <Zap size={16} className="animate-pulse"/> : <Zap size={16}/>}
                        className="w-full"
                    >
                        {isSummarizing ? 'Processing Intelligence...' : `Run Analysis: ${activePrompt.name}`}
                    </PaperButton>
                </div>
            </PaperCard>
        </div>

        {/* Right Col: Stats */}
        <div className="lg:col-span-1 space-y-6">
            <PaperCard title="Collection Stats">
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100">
                        <span className="text-sm font-bold text-gray-600">Total Documents</span>
                        <span className="text-xl font-serif font-bold text-ink">{documents.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100">
                        <span className="text-sm font-bold text-gray-600">Filtered View</span>
                        <span className="text-xl font-serif font-bold text-accent">{filteredDocs.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100">
                        <span className="text-sm font-bold text-gray-600">Metadata Tags</span>
                        <span className="text-xl font-serif font-bold text-ink">{Object.keys(metadataOptions).length}</span>
                    </div>
                </div>
            </PaperCard>

            <div className="p-4 border-2 border-dashed border-gray-300 rounded-sm text-center">
                 <h4 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-2">Active Filters</h4>
                 <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(activeFilters).map(([k, v]) => (
                        <PaperBadge key={k} color="ink">
                            {k}: {v} <button onClick={() => toggleFilter(k, v)} className="ml-1 hover:text-red-400">×</button>
                        </PaperBadge>
                    ))}
                    {Object.keys(activeFilters).length === 0 && <span className="text-gray-400 italic text-xs">None</span>}
                 </div>
            </div>
        </div>
      </div>

      {/* Slide-over Filter Panel */}
      {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
              <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
                onClick={() => setIsFilterOpen(false)}
              ></div>
              <div className="relative w-80 bg-white shadow-hard-lg border-l-2 border-ink h-full flex flex-col animate-slide-in">
                  <div className="p-6 border-b-2 border-ink flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-ink flex items-center gap-2"><Filter size={18}/> Filters</h3>
                      <button onClick={() => setIsFilterOpen(false)} className="hover:text-red-500"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div>
                          <label className="text-xs font-bold uppercase text-gray-500 mb-2 block">Keyword</label>
                          <input 
                            className="w-full border-2 border-gray-200 p-2 text-sm focus:border-accent outline-none" 
                            placeholder="Filter by title..."
                            value={keywordFilter}
                            onChange={e => setKeywordFilter(e.target.value)}
                          />
                      </div>
                      <hr className="border-gray-100"/>
                      {Object.entries(metadataOptions).map(([key, values]) => (
                          <div key={key}>
                              <div className="flex items-center gap-2 mb-2">
                                  <Hash size={14} className="text-accent"/>
                                  <label className="text-xs font-bold uppercase text-ink">{key}</label>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {Array.from(values).map(val => (
                                      <button 
                                        key={val}
                                        onClick={() => toggleFilter(key, val)}
                                        className={`
                                            px-2 py-1 text-xs border transition-all
                                            ${activeFilters[key] === val 
                                                ? 'bg-accent text-white border-accent shadow-sm' 
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-accent'}
                                        `}
                                      >
                                          {val}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="p-4 border-t-2 border-gray-100 bg-gray-50">
                      <PaperButton 
                        onClick={() => { setActiveFilters({}); setKeywordFilter(''); }} 
                        variant="ghost" 
                        className="w-full"
                      >
                        Reset All
                      </PaperButton>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
