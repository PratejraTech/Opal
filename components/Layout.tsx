
import React, { useState } from 'react';
import { ViewState } from '../types';
import { 
  LayoutGrid, 
  MessageSquare, 
  Network, 
  Terminal, 
  Settings, 
  ChevronRight,
  ChevronLeft,
  Cpu,
  UserCircle,
  Bot
} from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  children: React.ReactNode;
}

const SidebarItem: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  expanded: boolean;
}> = ({ active, onClick, icon, label, expanded }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-4 p-3 w-full transition-all duration-200 group relative
      ${active ? 'bg-ink text-white shadow-hard-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-ink'}
    `}
  >
    <div className={`shrink-0 ${active ? 'text-accent' : ''}`}>{icon}</div>
    
    {expanded && (
      <span className="font-bold text-sm tracking-wide whitespace-nowrap animate-fade-in">{label}</span>
    )}

    {!expanded && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-ink text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-hard-sm border-2 border-white">
        {label}
      </div>
    )}
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f4f4f5] font-sans">
      
      {/* Sidebar Dock */}
      <aside 
        className={`
          flex flex-col bg-white border-r-2 border-ink h-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-40 relative
          ${expanded ? 'w-64' : 'w-20'}
        `}
      >
        {/* Brand / Header */}
        <div className="h-24 flex items-center justify-center border-b-2 border-ink bg-ink relative overflow-hidden">
          {/* Logo Placeholder - User attached a logo, simulating its presence with matching aesthetic */}
          <div className={`flex items-center ${expanded ? 'gap-3' : ''} transition-all duration-300`}>
             <div className="w-10 h-10 relative flex items-center justify-center">
                 {/* Abstract representation of the attached logo (Circuit/Water C) */}
                 <div className="absolute inset-0 border-2 border-accent rounded-full border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                 <div className="absolute inset-1 border-2 border-cyan-400 rounded-full border-b-transparent animate-[spin_2s_linear_infinite_reverse]"></div>
                 <Cpu size={20} className="text-white relative z-10" />
             </div>
             
             {expanded && (
                <div className="animate-fade-in flex flex-col">
                    <h1 className="font-serif font-bold text-xl text-white tracking-wide leading-none">
                      PRATEJRA
                    </h1>
                    <span className="text-[9px] font-mono text-accent uppercase tracking-[0.2em] mt-1">
                      Personal RAG
                    </span>
                </div>
             )}
          </div>
          
          {/* Subtle background effect for the header */}
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[gradient_15s_ease_infinite] pointer-events-none"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
          <SidebarItem 
            label="Documents" 
            icon={<LayoutGrid size={22} />} 
            active={currentView === ViewState.UPLOAD} 
            onClick={() => setView(ViewState.UPLOAD)}
            expanded={expanded}
          />
          <SidebarItem 
            label="My Profile" 
            icon={<UserCircle size={22} />} 
            active={currentView === ViewState.MY_PROFILE} 
            onClick={() => setView(ViewState.MY_PROFILE)}
            expanded={expanded}
          />
          <SidebarItem 
            label="Agent Workspace" 
            icon={<Bot size={22} />} 
            active={currentView === ViewState.AGENT_CANVAS} 
            onClick={() => setView(ViewState.AGENT_CANVAS)}
            expanded={expanded}
          />
          <SidebarItem 
            label="Research Chat" 
            icon={<MessageSquare size={22} />} 
            active={currentView === ViewState.QUESTION} 
            onClick={() => setView(ViewState.QUESTION)}
            expanded={expanded}
          />
          <SidebarItem 
            label="Knowledge Graph" 
            icon={<Network size={22} />} 
            active={currentView === ViewState.GRAPH} 
            onClick={() => setView(ViewState.GRAPH)}
            expanded={expanded}
          />
          <SidebarItem 
            label="Prompt Lab" 
            icon={<Terminal size={22} />} 
            active={currentView === ViewState.PROMPT} 
            onClick={() => setView(ViewState.PROMPT)}
            expanded={expanded}
          />
        </nav>

        {/* Footer */}
        <div className="p-3 border-t-2 border-ink bg-gray-50">
          <SidebarItem 
             label="Settings" 
             icon={<Settings size={22} />} 
             active={currentView === ViewState.SETTINGS}
             onClick={() => setView(ViewState.SETTINGS)}
             expanded={expanded}
          />
        </div>

        {/* Toggle Handle */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="absolute -right-3 top-28 bg-white border-2 border-ink w-6 h-6 flex items-center justify-center rounded-full hover:bg-accent transition-colors z-50 shadow-sm"
        >
          {expanded ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </button>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 relative overflow-hidden flex flex-col bg-dot-pattern">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-transparent pointer-events-none z-10 h-32" />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 relative z-0">
          <div className="max-w-[1400px] mx-auto min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
