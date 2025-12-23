
import React, { useState } from 'react';
import { PaperCard, PaperInput, PaperButton, PaperBadge } from '../components/PaperComponents';
import { AppConfig, Vault, LLMProvider, LLMModelID } from '../types';
import { 
  HardDrive, Cloud, Shield, Server, Check, Plus, Trash2, 
  Cpu, Key, Database, Settings as SettingsIcon, Edit2, Save, X, Globe, Folder
} from 'lucide-react';

interface SettingsViewProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

// --- Vault Tool UI ---
const VaultEditor: React.FC<{
    vault: Vault;
    onSave: (v: Vault) => void;
    onCancel: () => void;
}> = ({ vault, onSave, onCancel }) => {
    const [edited, setEdited] = useState(vault);

    return (
        <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-sm space-y-4 animate-fade-in">
             <div className="flex justify-between items-center mb-2">
                 <h4 className="font-bold text-sm text-ink uppercase flex items-center gap-2">
                     <Edit2 size={14}/> Edit Connection
                 </h4>
                 <button onClick={onCancel} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <PaperInput 
                    label="Vault Name" 
                    value={edited.name}
                    onChange={e => setEdited({...edited, name: e.target.value})}
                />
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Provider</label>
                    <select 
                        className="w-full bg-white border-2 border-ink px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent"
                        value={edited.type}
                        onChange={e => setEdited({...edited, type: e.target.value as Vault['type']})}
                    >
                        <option value="local">Local Filesystem</option>
                        <option value="s3">Amazon S3</option>
                        <option value="gcs">Google Cloud Storage</option>
                        <option value="google_drive">Google Drive</option>
                        <option value="proton">Proton Drive</option>
                    </select>
                </div>
             </div>
             
             <PaperInput 
                label={edited.type === 'local' ? 'System Path' : 'Bucket / URI / Folder ID'} 
                value={edited.path}
                onChange={e => setEdited({...edited, path: e.target.value})}
             />

             {/* Dynamic Auth Fields based on Type */}
             {(edited.type === 's3' || edited.type === 'gcs') && (
                 <div className="grid grid-cols-2 gap-4 bg-white p-3 border border-gray-200">
                     <PaperInput label="Access Key ID" placeholder="User ID" className="!text-xs"/>
                     <PaperInput type="password" label="Secret Access Key" placeholder="**********" className="!text-xs"/>
                 </div>
             )}

             {edited.type === 'google_drive' && (
                 <div className="flex items-center gap-3 p-3 bg-white border border-gray-200">
                     <Globe size={16} className="text-blue-500"/>
                     <span className="text-xs font-bold text-gray-600">OAuth 2.0 Connection</span>
                     <PaperButton size="sm" variant="secondary">Authorize</PaperButton>
                 </div>
             )}

             <div className="flex justify-end gap-2 pt-2">
                 <PaperButton variant="ghost" size="sm" onClick={onCancel}>Cancel</PaperButton>
                 <PaperButton size="sm" onClick={() => onSave(edited)} icon={<Save size={14}/>}>Save Configuration</PaperButton>
             </div>
        </div>
    );
};

const VaultItem: React.FC<{ 
    vault: Vault; 
    isActive: boolean; 
    onActivate: () => void;
    onDelete: () => void;
    onUpdate: (v: Vault) => void;
}> = ({ vault, isActive, onActivate, onDelete, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);

    const getIcon = () => {
        switch(vault.type) {
            case 's3': return <Cloud size={18} className="text-orange-500"/>;
            case 'gcs': return <Server size={18} className="text-blue-500"/>;
            case 'google_drive': return <Folder size={18} className="text-green-500"/>;
            case 'proton': return <Shield size={18} className="text-purple-500"/>;
            default: return <HardDrive size={18} className="text-gray-500"/>;
        }
    };

    if (isEditing) {
        return <VaultEditor vault={vault} onSave={(v) => { onUpdate(v); setIsEditing(false); }} onCancel={() => setIsEditing(false)} />;
    }

    return (
        <div className={`
            p-4 border-2 rounded-sm transition-all duration-200 flex flex-col gap-3 group
            ${isActive ? 'border-accent bg-accent-light/10 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}
        `}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full border ${isActive ? 'bg-white border-accent' : 'bg-gray-50 border-gray-200'}`}>
                        {getIcon()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className={`font-bold text-sm ${isActive ? 'text-ink' : 'text-gray-600'}`}>{vault.name}</h4>
                            {isActive && <PaperBadge color="green">Active</PaperBadge>}
                            {vault.status === 'disconnected' && <PaperBadge color="red">Offline</PaperBadge>}
                        </div>
                        <p className="text-xs font-mono text-gray-400 mt-1 truncate max-w-[300px]">{vault.path}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isActive && (
                        <PaperButton size="sm" variant="secondary" onClick={onActivate}>
                            Mount
                        </PaperButton>
                    )}
                    <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-ink transition-colors" title="Configure">
                        <SettingsIcon size={16}/>
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 size={16}/>
                    </button>
                </div>
            </div>
            
            {/* Connection Details Preview */}
            <div className="pl-14 flex gap-4 text-[10px] text-gray-400 font-mono uppercase">
                 <span>Type: {vault.type}</span>
                 <span>ID: {vault.id}</span>
                 {vault.type !== 'local' && <span>Auth: {vault.type === 'google_drive' ? 'OAuth2' : 'Key'}</span>}
            </div>
        </div>
    );
};

export const SettingsView: React.FC<SettingsViewProps> = ({ config, setConfig }) => {
  const [activeTab, setActiveTab] = useState<'vaults' | 'llm'>('vaults');
  
  // New Vault State
  const [isAddingVault, setIsAddingVault] = useState(false);

  const handleCreateVault = (vault: Vault) => {
      setConfig(prev => ({
          ...prev,
          vaults: [...prev.vaults, vault],
          activeVaultId: prev.activeVaultId || vault.id
      }));
      setIsAddingVault(false);
  };

  const handleUpdateVault = (updated: Vault) => {
      setConfig(prev => ({
          ...prev,
          vaults: prev.vaults.map(v => v.id === updated.id ? updated : v)
      }));
  };

  const deleteVault = (id: string) => {
      setConfig(prev => ({
          ...prev,
          vaults: prev.vaults.filter(v => v.id !== id),
          activeVaultId: prev.activeVaultId === id ? (prev.vaults.find(v => v.id !== id)?.id || '') : prev.activeVaultId
      }));
  };

  const updateLLMConfig = (updates: Partial<AppConfig['llm']>) => {
      setConfig(prev => ({
          ...prev,
          llm: { ...prev.llm, ...updates }
      }));
  };

  const updateApiKey = (provider: keyof AppConfig['llm']['apiKeys'], value: string) => {
      setConfig(prev => ({
          ...prev,
          llm: {
              ...prev.llm,
              apiKeys: { ...prev.llm.apiKeys, [provider]: value }
          }
      }));
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col animate-fade-in gap-6">
       {/* Header */}
       <div className="flex justify-between items-end border-b-2 border-gray-200 pb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-ink flex items-center gap-3">
                <SettingsIcon size={28}/> Configuration
            </h2>
            <p className="text-gray-500 font-mono text-sm mt-2">Manage Storage Vaults & Artificial Intelligence Providers</p>
          </div>
       </div>

       <div className="grid grid-cols-12 gap-8 flex-1 min-h-0">
          {/* Sidebar Nav */}
          <div className="col-span-3 space-y-2">
             <button 
                onClick={() => setActiveTab('vaults')}
                className={`w-full text-left p-4 font-bold border-l-4 transition-all ${activeTab === 'vaults' ? 'bg-white border-accent text-ink shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
             >
                <div className="flex items-center gap-3">
                    <Database size={18}/> Data Vaults
                </div>
             </button>
             <button 
                onClick={() => setActiveTab('llm')}
                className={`w-full text-left p-4 font-bold border-l-4 transition-all ${activeTab === 'llm' ? 'bg-white border-accent text-ink shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
             >
                <div className="flex items-center gap-3">
                    <Cpu size={18}/> Model Intelligence
                </div>
             </button>
          </div>

          {/* Main Content Area */}
          <div className="col-span-9 h-full overflow-y-auto pr-2">
             
             {/* --- VAULTS TAB --- */}
             {activeTab === 'vaults' && (
                 <div className="space-y-6 animate-slide-in">
                    <PaperCard title="Storage Vaults" action={
                        !isAddingVault && (
                            <PaperButton size="sm" icon={<Plus size={16}/>} onClick={() => setIsAddingVault(true)}>
                                Add Vault
                            </PaperButton>
                        )
                    }>
                        <div className="space-y-4">
                            {config.vaults.map(vault => (
                                <VaultItem 
                                    key={vault.id} 
                                    vault={vault} 
                                    isActive={config.activeVaultId === vault.id}
                                    onActivate={() => setConfig(prev => ({ ...prev, activeVaultId: vault.id }))}
                                    onDelete={() => deleteVault(vault.id)}
                                    onUpdate={handleUpdateVault}
                                />
                            ))}
                        </div>

                        {isAddingVault && (
                            <div className="mt-4">
                                <VaultEditor 
                                    vault={{
                                        id: `v-${Date.now()}`,
                                        name: 'New Vault',
                                        type: 'local',
                                        path: '',
                                        status: 'connected'
                                    }}
                                    onSave={handleCreateVault}
                                    onCancel={() => setIsAddingVault(false)}
                                />
                            </div>
                        )}
                    </PaperCard>
                 </div>
             )}

             {/* --- LLM TAB --- */}
             {activeTab === 'llm' && (
                 <div className="space-y-6 animate-slide-in">
                     <PaperCard title="Model Selection">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Provider</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['openai', 'anthropic', 'google', 'ollama'] as LLMProvider[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => updateLLMConfig({ provider: p })}
                                            className={`
                                                p-3 border-2 text-sm font-bold uppercase tracking-wide transition-all
                                                ${config.llm.provider === p 
                                                    ? 'border-ink bg-ink text-white' 
                                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}
                                            `}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Model</label>
                                <select 
                                    className="w-full bg-white border-2 border-ink px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent"
                                    value={config.llm.model}
                                    onChange={e => updateLLMConfig({ model: e.target.value as LLMModelID })}
                                >
                                    {config.llm.provider === 'google' && (
                                        <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                                    )}
                                    {config.llm.provider === 'openai' && (
                                        <>
                                            <option value="gpt-5">GPT-5 (Preview)</option>
                                            <option value="gpt-5-mini">GPT-5 Mini</option>
                                            <option value="gpt-5-nano">GPT-5 Nano</option>
                                        </>
                                    )}
                                    {config.llm.provider === 'anthropic' && (
                                        <>
                                            <option value="claude-sonnet-3.5">Claude 3.5 Sonnet</option>
                                            <option value="claude-haiku-3">Claude 3 Haiku</option>
                                        </>
                                    )}
                                    {config.llm.provider === 'ollama' && (
                                        <option value="llama-3-70b">Llama 3 70B</option>
                                    )}
                                </select>
                            </div>
                         </div>
                     </PaperCard>

                     <PaperCard title="API Credentials" className="border-t-4 border-t-accent">
                         <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 text-blue-800 text-xs mb-4">
                                <Key size={14}/>
                                Keys are stored locally in your browser's secure memory.
                            </div>

                            {config.llm.provider === 'google' && (
                                <PaperInput 
                                    label="Google AI Studio Key" 
                                    type="password"
                                    value={config.llm.apiKeys.google || ''}
                                    onChange={e => updateApiKey('google', e.target.value)}
                                    placeholder="AIzaSy..."
                                />
                            )}
                            {config.llm.provider === 'openai' && (
                                <PaperInput 
                                    label="OpenAI Secret Key" 
                                    type="password"
                                    value={config.llm.apiKeys.openai || ''}
                                    onChange={e => updateApiKey('openai', e.target.value)}
                                    placeholder="sk-..."
                                />
                            )}
                            {config.llm.provider === 'anthropic' && (
                                <PaperInput 
                                    label="Anthropic API Key" 
                                    type="password"
                                    value={config.llm.apiKeys.anthropic || ''}
                                    onChange={e => updateApiKey('anthropic', e.target.value)}
                                    placeholder="sk-ant-..."
                                />
                            )}
                            {config.llm.provider === 'ollama' && (
                                <PaperInput 
                                    label="Ollama Server URL" 
                                    value={config.llm.ollamaUrl || 'http://localhost:11434'}
                                    onChange={e => updateLLMConfig({ ollamaUrl: e.target.value })}
                                />
                            )}
                         </div>
                     </PaperCard>
                 </div>
             )}
          </div>
       </div>
    </div>
  );
};
