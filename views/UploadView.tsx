import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PaperCard, PaperButton, PaperBadge, PaperInput } from '../components/PaperComponents';
import { Document, AppConfig } from '../types';
import { FileText, Trash2, Upload, RefreshCw, Database, CheckCircle2, Search, X, Cpu, Tag, Plus, Activity, Cloud, HardDrive, Shield } from 'lucide-react';

interface UploadViewProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  config: AppConfig;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
    <div 
      className="bg-accent h-full rounded-full transition-all duration-300 ease-out" 
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

// --- Resource Manager Sub-Components ---

const TabSidebarItem: React.FC<{ 
    active: boolean; 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void 
}> = ({ active, icon, label, onClick }) => (
    <div 
        onClick={onClick}
        className={`relative group flex items-center justify-center p-4 cursor-pointer transition-all duration-200 border-l-4 ${active ? 'bg-white border-accent text-accent' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100 hover:text-ink'}`}
    >
        {icon}
        {/* Tooltip */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-ink text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
            {label}
            {/* Arrow */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-ink transform rotate-45"></div>
        </div>
    </div>
);

const UploadTab: React.FC<{ 
    handleDrop: (e: React.DragEvent) => void; 
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: () => void;
    isDragging: boolean;
    activeVaultName: string;
}> = ({ handleDrop, handleDragOver, handleDragLeave, isDragging, activeVaultName }) => (
    <div className="h-full flex flex-col animate-fade-in">
        <h4 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <Cloud size={20} className="text-accent"/> Upload Files
        </h4>
        <div className="mb-2 text-xs font-mono text-gray-400">Target: <span className="font-bold text-ink">{activeVaultName}</span></div>
        <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 border-2 border-dashed rounded-sm p-6 text-center transition-all cursor-pointer flex flex-col justify-center items-center ${
            isDragging ? 'border-accent bg-accent-light/30' : 'border-gray-200 hover:border-ink hover:bg-gray-50'
            }`}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors mb-4 ${isDragging ? 'bg-accent text-white' : 'bg-ink text-white'}`}>
                <Upload size={20} />
            </div>
            <p className="text-sm font-bold text-ink">Drag & Drop</p>
            <p className="text-gray-400 text-xs mt-1 mb-4">PDF, MD, TXT</p>
            <input type="file" className="hidden" />
            <PaperButton variant={isDragging ? 'primary' : 'secondary'} size="sm">Browse Files</PaperButton>
        </div>
    </div>
);

const MetadataTab: React.FC<{
    selectedDoc: Document | undefined;
    metaKey: string;
    setMetaKey: (v: string) => void;
    metaValue: string;
    setMetaValue: (v: string) => void;
    handleAddMetadata: () => void;
    removeMetadata: (id: string, key: string) => void;
}> = ({ selectedDoc, metaKey, setMetaKey, metaValue, setMetaValue, handleAddMetadata, removeMetadata }) => (
    <div className="h-full flex flex-col animate-fade-in">
        <h4 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
            <Tag size={20} className="text-accent"/> Metadata Editor
        </h4>
        
        {selectedDoc ? (
            <div className="flex flex-col h-full gap-4">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-sm">
                    <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Selected Document</p>
                    <div className="flex items-center gap-2 font-bold text-ink text-sm truncate">
                        <FileText size={14}/> {selectedDoc.title}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 border border-gray-100 p-2 bg-gray-50/50">
                    {selectedDoc.metadata && Object.keys(selectedDoc.metadata).length > 0 ? (
                        Object.entries(selectedDoc.metadata).map(([k, v]) => (
                            <div key={k} className="flex justify-between items-center bg-white px-3 py-2 text-xs border border-gray-200 shadow-sm group hover:border-accent transition-colors">
                                <span className="font-mono text-gray-600"><span className="font-bold text-ink">{k}:</span> {v}</span>
                                <button onClick={() => removeMetadata(selectedDoc.id, k)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 italic text-xs">
                            No tags. Add one below.
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <PaperInput placeholder="Key" value={metaKey} onChange={e => setMetaKey(e.target.value)} className="!py-2 !text-xs" />
                        <PaperInput placeholder="Value" value={metaValue} onChange={e => setMetaValue(e.target.value)} className="!py-2 !text-xs" />
                    </div>
                    <PaperButton onClick={handleAddMetadata} size="sm" className="w-full" icon={<Plus size={14}/>}>Add Tag</PaperButton>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 rounded-sm">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                    <Tag size={20}/>
                </div>
                <p className="text-sm font-bold text-gray-500">No Selection</p>
                <p className="text-xs text-gray-400 mt-1">Select a document from the Knowledge Base to edit tags.</p>
            </div>
        )}
    </div>
);

const StatsTab: React.FC<{ documents: Document[], config: AppConfig }> = ({ documents, config }) => {
    const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0);
    const indexedDocs = documents.filter(d => d.status === 'indexed').length;
    const activeVault = config.vaults.find(v => v.id === config.activeVaultId);

    const getVaultIcon = () => {
        if (!activeVault) return <HardDrive size={14} className="text-gray-400"/>;
        if (activeVault.type === 's3') return <Cloud size={14} className="text-orange-400"/>;
        if (activeVault.type === 'proton') return <Shield size={14} className="text-purple-400"/>;
        return <HardDrive size={14} className="text-gray-400"/>;
    };
    
    return (
        <div className="h-full flex flex-col animate-fade-in">
            <h4 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
                <Activity size={20} className="text-accent"/> System Stats
            </h4>
            
            <div className="space-y-4 flex-1 overflow-y-auto">
                {/* Active Vault Card */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm">
                    <div className="flex items-center gap-2 mb-1">
                        {getVaultIcon()}
                        <span className="text-[10px] font-bold uppercase text-gray-500">Active Vault</span>
                    </div>
                    <div className="font-bold text-ink text-sm truncate">{activeVault?.name || 'None Selected'}</div>
                    <div className="text-[10px] font-mono text-gray-400 truncate">{activeVault?.path}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-sm text-center">
                        <p className="text-2xl font-bold text-emerald-700">{documents.length}</p>
                        <p className="text-[10px] font-bold uppercase text-emerald-400">Total Docs</p>
                     </div>
                     <div className="p-3 bg-blue-50 border border-blue-100 rounded-sm text-center">
                        <p className="text-2xl font-bold text-blue-700">{indexedDocs}</p>
                        <p className="text-[10px] font-bold uppercase text-blue-400">Indexed</p>
                     </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-600">Vector Storage</span>
                        <span className="font-mono text-ink">142 MB / 500 MB</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-ink w-[28%]"></div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs mt-2">
                        <span className="font-bold text-gray-600">Context Window</span>
                        <span className="font-mono text-ink">45% Used</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-[45%]"></div>
                    </div>
                </div>

                <div className="border-t border-dashed border-gray-300 pt-4">
                     <div className="flex items-center gap-3 mb-2">
                        <Database size={14} className="text-gray-400"/>
                        <span className="text-xs font-mono text-gray-500">Total Chunks: <span className="text-ink font-bold">{totalChunks}</span></span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Cpu size={14} className="text-gray-400"/>
                        <span className="text-xs font-mono text-gray-500">Est. Cost: <span className="text-ink font-bold">$0.04/mo</span></span>
                     </div>
                </div>
            </div>
        </div>
    );
}

// --- Main View ---

export const UploadView: React.FC<UploadViewProps> = ({ documents, setDocuments, config }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'meta' | 'stats'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // Metadata Form State
  const [metaKey, setMetaKey] = useState('');
  const [metaValue, setMetaValue] = useState('');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const activeVault = config.vaults.find(v => v.id === config.activeVaultId);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Simulation of file drop
    const newId = Math.random().toString();
    const newDoc: Document = {
      id: newId,
      title: "New_Upload_" + Math.floor(Math.random() * 1000) + ".pdf",
      type: 'pdf',
      size: (Math.random() * 5).toFixed(1) + ' MB',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'processing',
      chunkCount: 0,
      progress: 0,
      metadata: {},
      vaultId: config.activeVaultId // Assign to active vault
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    
    // Simulate Upload & Indexing Progress
    let progress = 0;
    const interval = setInterval(() => {
      if (!isMounted.current) {
        clearInterval(interval);
        return;
      }

      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDocuments(prev => prev.map(d => 
          d.id === newId 
            ? { ...d, status: 'indexed', chunkCount: Math.floor(Math.random() * 200) + 50, progress: 100 } 
            : d
        ));
      } else {
        setDocuments(prev => prev.map(d => 
          d.id === newId ? { ...d, progress } : d
        ));
      }
    }, 400);
  };

  const handleAddMetadata = () => {
    if (!selectedDocId || !metaKey.trim() || !metaValue.trim()) return;
    
    setDocuments(prev => prev.map(doc => {
      if (doc.id === selectedDocId) {
        return {
          ...doc,
          metadata: { ...doc.metadata, [metaKey]: metaValue }
        };
      }
      return doc;
    }));
    
    setMetaKey('');
    setMetaValue('');
  };

  const removeMetadata = (docId: string, key: string) => {
     setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        const newMeta = { ...doc.metadata };
        delete newMeta[key];
        return { ...doc, metadata: newMeta };
      }
      return doc;
    }));
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  // Filter Logic
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || doc.type === filterType;
      const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
      const matchesVault = doc.vaultId ? doc.vaultId === config.activeVaultId : true; 
      
      return matchesSearch && matchesType && matchesStatus && matchesVault;
    });
  }, [documents, searchQuery, filterType, filterStatus, config.activeVaultId]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
  };

  const hasFilters = searchQuery || filterType !== 'all' || filterStatus !== 'all';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Section */}
      <div className="relative h-64 w-full rounded-sm bg-black overflow-hidden shadow-hard group flex flex-col items-center justify-center gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-90"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] mask-image-gradient"></div>
        
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-full border-[4px] border-cyan-500/30 border-t-cyan-400 border-l-cyan-400 border-r-transparent shadow-[0_0_20px_rgba(34,211,238,0.4)] animate-[spin_4s_linear_infinite]"></div>
            <div className="absolute inset-2 rounded-full border-[4px] border-emerald-500/30 border-b-emerald-400 border-r-emerald-400 border-l-transparent shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-[spin_3s_linear_infinite_reverse]"></div>
            <Cpu size={28} className="text-white relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </div>

        <div className="relative z-10 text-center">
             <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-sm leading-tight">
                PRATEJRA
             </h1>
             <div className="flex items-center justify-center gap-3 mt-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-accent"></div>
                <span className="font-mono text-accent text-[10px] uppercase tracking-[0.3em]">Personal RAG System</span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-accent"></div>
             </div>
        </div>
      </div>

      {/* Main Content Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
        
        {/* Left Panel: Resource Manager (Combined) */}
        <div className="lg:col-span-4 h-full">
            <div className="bg-white border-2 border-ink shadow-hard rounded-none h-full flex flex-row overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-2 shrink-0">
                    <TabSidebarItem 
                        icon={<Cloud size={20}/>} 
                        label="Upload Files" 
                        active={activeTab === 'upload'} 
                        onClick={() => setActiveTab('upload')} 
                    />
                    <TabSidebarItem 
                        icon={<Tag size={20}/>} 
                        label="Metadata" 
                        active={activeTab === 'meta'} 
                        onClick={() => setActiveTab('meta')} 
                    />
                    <TabSidebarItem 
                        icon={<Activity size={20}/>} 
                        label="System Stats" 
                        active={activeTab === 'stats'} 
                        onClick={() => setActiveTab('stats')} 
                    />
                    {/* Add Vault Shortcut */}
                     <div 
                        onClick={() => alert("Navigate to Settings to add a new vault fully.")}
                        className="mt-auto relative group flex items-center justify-center p-4 cursor-pointer transition-all duration-200 hover:text-accent"
                    >
                        <Plus size={20}/>
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-ink text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                            New Vault
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-ink transform rotate-45"></div>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-hidden relative">
                    {activeTab === 'upload' && (
                        <UploadTab 
                            handleDrop={handleDrop} 
                            handleDragOver={handleDragOver} 
                            handleDragLeave={handleDragLeave} 
                            isDragging={isDragging} 
                            activeVaultName={activeVault?.name || 'Local'}
                        />
                    )}
                    {activeTab === 'meta' && (
                        <MetadataTab 
                            selectedDoc={selectedDoc}
                            metaKey={metaKey} setMetaKey={setMetaKey}
                            metaValue={metaValue} setMetaValue={setMetaValue}
                            handleAddMetadata={handleAddMetadata}
                            removeMetadata={removeMetadata}
                        />
                    )}
                    {activeTab === 'stats' && (
                        <StatsTab documents={documents} config={config} />
                    )}
                </div>
            </div>
        </div>

        {/* Right Panel: Document List */}
        <div className="lg:col-span-8 h-full flex flex-col">
          <PaperCard title={`Knowledge Base (${filteredDocs.length})`} className="h-full flex flex-col">
            {/* Filter Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 mb-4 p-3 bg-gray-50 border border-gray-200 rounded-sm">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search by name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-sm focus:border-accent focus:outline-none bg-white text-xs"
                />
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-sm focus:border-accent focus:outline-none bg-white text-xs min-w-[100px]"
                >
                  <option value="all">All Types</option>
                  <option value="pdf">PDF</option>
                  <option value="md">MD</option>
                  <option value="txt">TXT</option>
                </select>

                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-sm focus:border-accent focus:outline-none bg-white text-xs min-w-[100px]"
                >
                  <option value="all">All Status</option>
                  <option value="indexed">Indexed</option>
                  <option value="processing">Processing</option>
                  <option value="error">Error</option>
                </select>

                {hasFilters && (
                  <button 
                    onClick={clearFilters}
                    className="px-2 py-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                    title="Clear Filters"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto border-t border-gray-100">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="py-3 pl-4 font-bold bg-white">Name</th>
                    <th className="py-3 font-bold bg-white">Type</th>
                    <th className="py-3 font-bold bg-white">Status</th>
                    <th className="py-3 font-bold bg-white">Metadata</th>
                    <th className="py-3 pr-4 text-right bg-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.length > 0 ? (
                    filteredDocs.map((doc) => (
                      <tr 
                        key={doc.id} 
                        onClick={() => {
                            setSelectedDocId(doc.id);
                        }}
                        className={`border-b border-gray-50 transition-colors cursor-pointer text-xs ${selectedDocId === doc.id ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                      >
                        <td className="py-3 pl-4 font-medium w-[40%]">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded border shrink-0 ${doc.type === 'pdf' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                              <FileText size={14} />
                            </div>
                            <div className="w-full max-w-[250px]">
                              <div className={`truncate ${selectedDocId === doc.id ? 'text-blue-700 font-bold' : 'text-ink'}`}>{doc.title}</div>
                              {doc.status === 'processing' && doc.progress !== undefined && (
                                <ProgressBar progress={doc.progress} />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-gray-500 uppercase">{doc.type}</td>
                        <td className="py-3">
                          {doc.status === 'processing' ? (
                             <PaperBadge color="blue"><RefreshCw size={10} className="mr-1 animate-spin"/> Processing</PaperBadge>
                          ) : (
                             <PaperBadge color="green"><CheckCircle2 size={10} className="mr-1"/> Indexed</PaperBadge>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            {doc.metadata && Object.keys(doc.metadata).length > 0 ? (
                              Object.entries(doc.metadata).slice(0, 3).map(([k,v]) => (
                                 <span key={k} className="text-[10px] bg-white border border-gray-200 px-1 rounded text-gray-600 truncate max-w-[80px]">{k}:{v}</span>
                              ))
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                            {doc.metadata && Object.keys(doc.metadata).length > 3 && <span className="text-[10px] text-gray-400">...</span>}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* Add delete logic */ }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 italic text-sm">
                        No documents found in this vault.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </PaperCard>
        </div>
      </div>
    </div>
  );
};