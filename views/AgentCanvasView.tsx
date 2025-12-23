
import React, { useState, useEffect, useRef } from 'react';
import { PaperCard, PaperButton, PaperBadge } from '../components/PaperComponents';
import { AppConfig, AgentGoal, AgentTurn, KnowledgeBlock } from '../types';
import { AGENT_GOALS, INITIAL_BLOCKS, agentService } from '../services/AgentGraphService';
import { Play, Square, RefreshCw, Bot, BrainCircuit, Target, Sparkles, Zap, Box, Terminal, ArrowRight, Loader2 } from 'lucide-react';

interface AgentCanvasViewProps {
  config: AppConfig;
}

// --- Visual Components ---

const RobotAgent: React.FC<{ 
    type: 'Coordinator' | 'Critic'; 
    isActive: boolean; 
    position: { x: number; y: number };
    message?: string;
}> = ({ type, isActive, position, message }) => (
    <div 
        className="absolute transition-all duration-700 ease-in-out z-20 flex flex-col items-center pointer-events-none"
        style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
        {/* Thought Bubble */}
        {message && isActive && (
            <div className="absolute bottom-full mb-4 w-48 bg-white border-2 border-ink p-3 rounded-sm shadow-hard-sm text-xs font-mono animate-fade-in z-30">
                <span className="font-bold text-accent uppercase block mb-1">{type}</span>
                {message}
                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-ink rotate-45"></div>
            </div>
        )}

        {/* Robot Body */}
        <div className={`
            w-16 h-16 rounded-2xl border-2 border-ink flex items-center justify-center shadow-hard transition-all duration-300
            ${isActive ? 'bg-ink text-white scale-110' : 'bg-white text-ink scale-100'}
            ${type === 'Critic' ? 'rounded-full' : 'rounded-none'}
        `}>
            {type === 'Coordinator' ? <Bot size={32}/> : <BrainCircuit size={32}/>}
        </div>
        
        {/* Status Indicator */}
        <div className={`mt-2 px-2 py-0.5 text-[10px] font-bold uppercase border border-ink bg-white ${isActive ? 'opacity-100' : 'opacity-50'}`}>
            {type}
        </div>
    </div>
);

const BlockComponent: React.FC<{ block: KnowledgeBlock }> = ({ block }) => {
    const getShapeClass = () => {
        switch(block.shape) {
            case 'circle': return 'rounded-full';
            case 'triangle': return 'clip-triangle'; // Would need custom CSS, using rounded-sm for now
            case 'hexagon': return 'rounded-3xl';
            default: return 'rounded-sm';
        }
    };

    return (
        <div 
            className={`
                absolute flex items-center justify-center text-center p-4 border-2 border-ink shadow-hard-sm transition-all duration-1000 ease-in-out cursor-help group
                ${getShapeClass()}
            `}
            style={{ 
                left: `${block.x}%`, 
                top: `${block.y}%`, 
                width: `${120 * block.scale}px`, 
                height: `${120 * block.scale}px`,
                backgroundColor: block.color,
                color: '#fff',
                transform: 'translate(-50%, -50%)',
                zIndex: 10
            }}
        >
            <span className="font-bold text-xs drop-shadow-md pointer-events-none select-none">
                {block.content.substring(0, 30)}{block.content.length > 30 && '...'}
            </span>

            {/* Tooltip */}
            <div className="absolute top-full mt-2 w-48 bg-black/90 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-xl border border-white/20">
                {block.content}
            </div>
        </div>
    );
};

// --- Main View ---

export const AgentCanvasView: React.FC<AgentCanvasViewProps> = ({ config }) => {
  const [selectedGoal, setSelectedGoal] = useState<AgentGoal>(AGENT_GOALS[0]);
  const [selectedModel, setSelectedModel] = useState<string>(config.llm.model);
  const [blocks, setBlocks] = useState<KnowledgeBlock[]>([]);
  const [history, setHistory] = useState<AgentTurn[]>([]);
  
  // Interaction State
  const [goalInput, setGoalInput] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  
  // Animation State
  const [coordinatorPos, setCoordinatorPos] = useState({ x: 10, y: 50 });
  const [criticPos, setCriticPos] = useState({ x: 90, y: 50 });
  const [rays, setRays] = useState<{from: {x:number,y:number}, to: {x:number,y:number}}[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [history]);

  // --- Logic ---

  const handleInitialize = async () => {
      if (!goalInput.trim()) return;
      setIsInitializing(true);
      try {
          const generatedBlocks = await agentService.generateInitialBlocks(goalInput, selectedModel);
          setBlocks(generatedBlocks);
          setIsInitialized(true);
          setTurnCount(0);
          setHistory([]);
          // Auto-start
          setIsRunning(true);
      } catch (e) {
          console.error(e);
      } finally {
          setIsInitializing(false);
      }
  };

  const reset = () => {
      setIsRunning(false);
      setIsInitialized(false);
      setTurnCount(0);
      setHistory([]);
      setBlocks([]);
      setGoalInput('');
      setRays([]);
      setCoordinatorPos({ x: 10, y: 50 });
      setCriticPos({ x: 90, y: 50 });
  };

  const executeTurn = async () => {
      if (turnCount >= 5) {
          setIsRunning(false);
          return;
      }

      try {
          const turn = await agentService.generateTurn(selectedGoal, history, blocks, turnCount, selectedModel);
          setHistory(prev => [...prev, turn]);
          setTurnCount(prev => prev + 1);

          // Handle Visual Actions
          handleAgentAction(turn);
      } catch (e) {
          console.error("Agent Turn Failed", e);
          setIsRunning(false);
      }
  };

  const handleAgentAction = (turn: AgentTurn) => {
      const activeAgentPos = turn.agentName === 'Coordinator' ? { x: 10, y: 50 } : { x: 90, y: 50 };
      
      // 1. Move Agent slightly to indicate activity
      if (turn.agentName === 'Coordinator') {
          setCoordinatorPos({ x: 15, y: 50 });
          setTimeout(() => setCoordinatorPos({ x: 10, y: 50 }), 1000);
      } else {
          setCriticPos({ x: 85, y: 50 });
          setTimeout(() => setCriticPos({ x: 90, y: 50 }), 1000);
      }

      // 2. Draw Rays if there are targets
      if (turn.action.targetBlockIds.length > 0) {
          const newRays = turn.action.targetBlockIds.map(tid => {
              const target = blocks.find(b => b.id === tid);
              if (!target) return null;
              return { from: activeAgentPos, to: { x: target.x, y: target.y } };
          }).filter(Boolean) as any;
          setRays(newRays);
          setTimeout(() => setRays([]), 1500); // Clear rays after animation
      }

      // 3. Manipulate Blocks based on action type
      setTimeout(() => {
          setBlocks(prev => {
              let nextBlocks = [...prev];

              if (turn.action.type === 'MERGE') {
                  // Remove targets, add new synthesized block in center
                  const targets = nextBlocks.filter(b => turn.action.targetBlockIds.includes(b.id));
                  if (targets.length > 0) {
                      nextBlocks = nextBlocks.filter(b => !turn.action.targetBlockIds.includes(b.id));
                      nextBlocks.push({
                          id: `b-${Date.now()}`,
                          x: 50,
                          y: 50,
                          shape: 'hexagon',
                          color: '#8b5cf6', // Purple for synthesis
                          content: turn.outputContent || "Synthesized Insight",
                          scale: 1.5
                      });
                  }
              } 
              else if (turn.action.type === 'EXPLODE') {
                   // Remove target, add smaller blocks
                   const targetId = turn.action.targetBlockIds[0];
                   const target = nextBlocks.find(b => b.id === targetId);
                   if (target) {
                       nextBlocks = nextBlocks.filter(b => b.id !== targetId);
                       // Spawn 3 sub-blocks
                       for(let i=0; i<3; i++) {
                           nextBlocks.push({
                               id: `b-${Date.now()}-${i}`,
                               x: target.x + (Math.random() * 20 - 10),
                               y: target.y + (Math.random() * 20 - 10),
                               shape: 'triangle',
                               color: '#10b981',
                               content: i === 0 ? turn.outputContent : `Sub-component ${i+1} of ${target.content}`,
                               scale: 0.8
                           });
                       }
                   }
              }
              else if (turn.action.type === 'SHAKE') {
                  // Jitter effect (simulated by slight position change)
                  nextBlocks = nextBlocks.map(b => {
                      if (turn.action.targetBlockIds.includes(b.id)) {
                          return { ...b, x: b.x + (Math.random()*2 - 1), y: b.y + (Math.random()*2 - 1), color: '#ef4444' };
                      }
                      return b;
                  });
              }

              return nextBlocks;
          });
      }, 1000);
  };

  // Loop Effect
  useEffect(() => {
      let timer: any;
      if (isRunning && turnCount < 5) {
          timer = setTimeout(executeTurn, 3000); // 3 seconds per turn
      } else if (turnCount >= 5) {
          setIsRunning(false);
      }
      return () => clearTimeout(timer);
  }, [isRunning, turnCount]);


  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-6 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-gray-200 pb-2">
            <div>
                <h2 className="text-3xl font-serif font-bold text-ink">Agent Workspace</h2>
            </div>
             <PaperButton onClick={reset} variant="ghost" size="sm" className="!px-3"><RefreshCw size={14} className="mr-1"/> New Session</PaperButton>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            
            {/* 1. Mission Control (Goal Input) */}
            <PaperCard title="Mission Control" className="bg-gray-50/50">
                <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold uppercase text-gray-500">Simulation Context / Goal</label>
                        <textarea
                            value={goalInput}
                            onChange={e => setGoalInput(e.target.value)}
                            disabled={isInitialized || isInitializing}
                            className="w-full h-20 p-3 text-sm font-mono border-2 border-gray-200 rounded-sm focus:border-accent focus:outline-none resize-none bg-white"
                            placeholder="e.g., Deconstruct the implications of Quantum Computing on Data Security..."
                        />
                    </div>
                    
                    <div className="w-1/3 space-y-4">
                         <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-gray-500">Agent Strategy</label>
                            <select 
                                className="w-full p-2 bg-white border-2 border-gray-200 text-sm font-bold text-ink rounded-sm focus:border-accent outline-none"
                                value={selectedGoal.id}
                                onChange={(e) => {
                                    const g = AGENT_GOALS.find(x => x.id === e.target.value);
                                    if(g) setSelectedGoal(g);
                                }}
                                disabled={isInitialized}
                            >
                                {AGENT_GOALS.map(g => (
                                    <option key={g.id} value={g.id}>{g.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <PaperButton 
                            className="w-full h-10" 
                            onClick={handleInitialize} 
                            disabled={!goalInput.trim() || isInitialized || isInitializing}
                            icon={isInitializing ? <Loader2 size={16} className="animate-spin"/> : <ArrowRight size={16}/>}
                        >
                            {isInitializing ? 'Generating Blocks...' : 'Initialize Simulation'}
                        </PaperButton>
                    </div>
                </div>
            </PaperCard>

            {/* 2. The Arena */}
            <div className="bg-white border-2 border-ink shadow-hard relative h-[500px] overflow-hidden" ref={containerRef}>
                <div className="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none"></div>
                
                {/* Overlay Status */}
                <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
                    <PaperBadge color={isRunning ? 'green' : 'ink'}>
                        {isRunning ? 'Agents Active' : isInitialized ? 'Ready' : 'Waiting for Input'}
                    </PaperBadge>
                    {isInitialized && <PaperBadge color="ink">Turn: {turnCount}/5</PaperBadge>}
                </div>

                {isInitialized ? (
                    <>
                        <RobotAgent 
                            type="Coordinator" 
                            isActive={history[history.length-1]?.agentName === 'Coordinator' && isRunning} 
                            position={coordinatorPos}
                            message={history.length > 0 && history[history.length-1].agentName === 'Coordinator' ? history[history.length-1].thought : undefined}
                        />
                        
                        <RobotAgent 
                            type="Critic" 
                            isActive={history[history.length-1]?.agentName === 'Critic' && isRunning} 
                            position={criticPos}
                            message={history.length > 0 && history[history.length-1].agentName === 'Critic' ? history[history.length-1].thought : undefined}
                        />

                        {blocks.map(block => (
                            <BlockComponent key={block.id} block={block} />
                        ))}

                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                            {rays.map((ray, i) => (
                                <line 
                                    key={i}
                                    x1={`${ray.from.x}%`} y1={`${ray.from.y}%`}
                                    x2={`${ray.to.x}%`} y2={`${ray.to.y}%`}
                                    stroke={selectedGoal.type === 'synthesis' ? '#8b5cf6' : '#ef4444'}
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    className="animate-pulse"
                                />
                            ))}
                        </svg>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                        <Target size={64} className="mb-4 opacity-50"/>
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting Mission Parameters</p>
                    </div>
                )}
            </div>

            {/* 3. Mission Output (Logs) */}
            <div className={`transition-all duration-500 ${isInitialized ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                <PaperCard title="Mission Output & Reasoning" className="bg-gray-50 min-h-[300px]">
                    <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-4" ref={logsRef}>
                        {!isInitialized && (
                            <div className="text-center text-gray-400 italic text-sm py-10">
                                Output stream is offline. Initialize simulation to begin data feed.
                            </div>
                        )}
                        {history.map((turn, i) => (
                            <div key={i} className="flex gap-4 animate-slide-in">
                                <div className="flex flex-col items-center gap-2 pt-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white border-2 border-ink shadow-sm ${turn.agentName === 'Coordinator' ? 'bg-blue-600' : 'bg-red-500'}`}>
                                        {turn.agentName === 'Coordinator' ? <Bot size={16}/> : <BrainCircuit size={16}/>}
                                    </div>
                                    <div className="w-px h-full bg-gray-200"></div>
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`text-xs font-bold uppercase ${turn.agentName === 'Coordinator' ? 'text-blue-700' : 'text-red-700'}`}>
                                            {turn.agentName}
                                        </span>
                                        <span className="text-[10px] font-mono text-gray-400">Step {turn.step}</span>
                                    </div>
                                    
                                    <div className="bg-white border border-gray-200 p-4 rounded-sm shadow-sm">
                                        <p className="text-sm text-ink mb-3 italic font-serif">"{turn.thought}"</p>
                                        
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <PaperBadge color="ink">{turn.action.type}</PaperBadge>
                                            {turn.action.targetBlockIds.length > 0 && (
                                                <span className="text-[10px] text-gray-500">
                                                    Targeting: {turn.action.targetBlockIds.length} blocks
                                                </span>
                                            )}
                                        </div>

                                        {turn.outputContent && (
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <div className="text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                                                    <Terminal size={10}/> Result Content
                                                </div>
                                                <p className="text-xs font-mono text-gray-700 bg-gray-50 p-2 rounded">
                                                    {turn.outputContent}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </PaperCard>
            </div>
        </div>
    </div>
  );
};
