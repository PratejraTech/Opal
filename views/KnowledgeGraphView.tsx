import React, { useRef, useEffect, useState, useMemo } from 'react';
import { PaperCard, PaperBadge, PaperButton } from '../components/PaperComponents';
import { GraphNode, GraphLink, Document } from '../types';
import { MOCK_GRAPH_DATA } from '../constants';
import { Play, Pause, Search, Maximize2, Minimize2, Eye, EyeOff, GripHorizontal, MousePointer2 } from 'lucide-react';
import { GraphAnalysis } from '../components/GraphAnalysis';

interface KnowledgeGraphViewProps {
  documents: Document[];
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface CanvasGraphProps {
    data: { nodes: GraphNode[]; links: GraphLink[] };
    isFrozen: boolean;
    filters: Record<string, boolean>;
    searchQuery: string;
    onNodeClick: (node: GraphNode | null) => void;
    height: number;
}

const GraphLegend: React.FC<{
    filters: Record<string, boolean>;
    toggleFilter: (key: string) => void;
}> = ({ filters, toggleFilter }) => {
    return (
        <div className="flex items-center gap-4 px-4 py-2 bg-white border-2 border-ink shadow-hard-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Filters:</span>
            
            <button 
                onClick={() => toggleFilter('Document')}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all text-xs font-bold ${filters['Document'] ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-gray-100 border-gray-300 text-gray-400 line-through'}`}
            >
                <div className={`w-2 h-2 rounded-full ${filters['Document'] ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                Documents
            </button>

            <button 
                onClick={() => toggleFilter('Metadata')}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all text-xs font-bold ${filters['Metadata'] ? 'bg-white border-ink text-ink' : 'bg-gray-100 border-gray-300 text-gray-400 line-through'}`}
            >
                <div className={`w-2 h-2 rounded-full border border-gray-500 ${filters['Metadata'] ? 'bg-white' : 'bg-gray-300'}`}></div>
                Metadata
            </button>

            <button 
                onClick={() => toggleFilter('Link')}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all text-xs font-bold ${filters['Link'] ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-gray-100 border-gray-300 text-gray-400 line-through'}`}
            >
                <div className={`w-4 h-0.5 ${filters['Link'] ? 'bg-blue-400' : 'bg-gray-400'}`}></div>
                Relations
            </button>
        </div>
    );
};

const CanvasGraph: React.FC<CanvasGraphProps> = ({ data, isFrozen, filters, searchQuery, onNodeClick, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  
  const nodesRef = useRef<SimNode[]>([]);
  const isFrozenRef = useRef(isFrozen);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
  }, [isFrozen]);
  
  // Initialize Simulation Data
  useEffect(() => {
    if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        
        nodesRef.current = data.nodes.map(n => {
            const existing = nodesRef.current.find(old => old.id === n.id);
            return {
                ...n,
                x: existing ? existing.x : Math.random() * (width - 100) + 50,
                y: existing ? existing.y : Math.random() * (height - 100) + 50,
                vx: existing ? existing.vx : 0,
                vy: existing ? existing.vy : 0
            };
        });
    }
  }, [data, height]);

  // Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    const render = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        
        ctx.clearRect(0, 0, width, height);
        
        // --- Force Directed Physics ---
        if (!isFrozenRef.current) {
            const nodes = nodesRef.current;
            const k = Math.sqrt((width * height) / (nodes.length + 1)) * 1.5; // Optimal distance
            
            // 1. Repulsion (Coulomb)
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq === 0) continue;
                    const dist = Math.sqrt(distSq);
                    const force = (k * k) / dist;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    
                    nodes[i].vx += fx * 0.05;
                    nodes[i].vy += fy * 0.05;
                    nodes[j].vx -= fx * 0.05;
                    nodes[j].vy -= fy * 0.05;
                }
            }

            // 2. Attraction (Hooke - Links)
            data.links.forEach(link => {
                const source = nodes.find(n => n.id === link.source);
                const target = nodes.find(n => n.id === link.target);
                if (source && target) {
                    const dx = source.x - target.x;
                    const dy = source.y - target.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const force = (dist * dist) / k;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    
                    source.vx -= fx * 0.05;
                    source.vy -= fy * 0.05;
                    target.vx += fx * 0.05;
                    target.vy += fy * 0.05;
                }
            });

            // 3. Center Gravity
            nodes.forEach(node => {
                const dx = node.x - width / 2;
                const dy = node.y - height / 2;
                node.vx -= dx * 0.005;
                node.vy -= dy * 0.005;
            });

            // 4. Update & Dampen
            nodes.forEach(node => {
                node.vx *= 0.6; // Heavy damping for stability
                node.vy *= 0.6;
                
                // Limit speed
                const speed = Math.sqrt(node.vx*node.vx + node.vy*node.vy);
                if (speed > 10) {
                     node.vx = (node.vx / speed) * 10;
                     node.vy = (node.vy / speed) * 10;
                }

                node.x += node.vx;
                node.y += node.vy;

                // Bounds
                if (node.x <= 20) { node.x = 20; node.vx *= -0.5; }
                if (node.x >= width - 20) { node.x = width - 20; node.vx *= -0.5; }
                if (node.y <= 20) { node.y = 20; node.vy *= -0.5; }
                if (node.y >= height - 20) { node.y = height - 20; node.vy *= -0.5; }
            });
        }
        
        const isSearching = searchQuery.length > 1;

        // Draw Links
        if (filters['Link']) {
            ctx.strokeStyle = '#e4e4e7';
            ctx.lineWidth = 1;
            data.links.forEach(link => {
                const source = nodesRef.current.find(n => n.id === link.source);
                const target = nodesRef.current.find(n => n.id === link.target);
                
                const sourceVisible = source && filters[source.group];
                const targetVisible = target && filters[target.group];

                if (sourceVisible && targetVisible) {
                    ctx.beginPath();
                    ctx.moveTo(source.x, source.y);
                    ctx.lineTo(target.x, target.y);
                    ctx.stroke();
                }
            });
        }

        // Draw Nodes
        nodesRef.current.forEach(node => {
            if (!filters[node.group]) return;

            const isHovered = hoveredNode?.id === node.id;
            const matchesSearch = isSearching && node.label.toLowerCase().includes(searchQuery.toLowerCase());
            
            ctx.globalAlpha = isSearching && !matchesSearch ? 0.2 : 1;
            
            // Outer Glow for Match/Hover
            if (isHovered || matchesSearch) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.val + 6, 0, 2 * Math.PI);
                ctx.fillStyle = matchesSearch ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI);
            ctx.fillStyle = node.group === 'Document' ? '#10b981' : '#ffffff'; 
            ctx.strokeStyle = matchesSearch ? '#ef4444' : '#18181b'; 
            ctx.lineWidth = matchesSearch ? 3 : 2;
            ctx.fill();
            ctx.stroke();
            
            // Label
            if (node.val > 8 || isHovered || matchesSearch) {
                ctx.font = `bold ${isHovered || matchesSearch ? '12px' : '10px'} Inter`;
                ctx.fillStyle = '#18181b';
                ctx.textAlign = 'center';
                // Add white background for legibility
                const text = node.label;
                const metrics = ctx.measureText(text);
                if (isHovered || matchesSearch) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(node.x - metrics.width/2 - 2, node.y + node.val + 5, metrics.width + 4, 14);
                }
                ctx.fillStyle = '#18181b';
                ctx.fillText(text, node.x, node.y + node.val + 15);
            }
            ctx.globalAlpha = 1;
        });
        
        animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [data, hoveredNode, filters, searchQuery, height, isFrozen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const found = nodesRef.current.find(node => {
          if (!filters[node.group]) return false;
          const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
          return dist < node.val + 10;
      });
      
      setHoveredNode(found || null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const found = nodesRef.current.find(node => {
        if (!filters[node.group]) return false;
        const dist = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        return dist < node.val + 10;
    });

    onNodeClick(found || null);
  };

  return (
    <div ref={containerRef} className="w-full relative bg-dot-pattern" style={{ height: `${height}px` }}>
        <canvas 
            ref={canvasRef}
            className="block cursor-crosshair active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseDown={handleClick}
        />
        {hoveredNode && (
            <div className="absolute top-4 left-4 pointer-events-none bg-white/90 border border-ink p-2 shadow-sm z-50">
                <p className="text-xs font-bold text-ink">{hoveredNode.label}</p>
                <p className="text-[10px] uppercase text-gray-500">{hoveredNode.group}</p>
            </div>
        )}
    </div>
  );
};

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ documents }) => {
  const [isFrozen, setIsFrozen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [graphHeight, setGraphHeight] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, boolean>>({
      'Document': true,
      'Metadata': true,
      'Link': true
  });

  const graphData = useMemo(() => {
    if (documents.length === 0) return MOCK_GRAPH_DATA;

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    documents.forEach(doc => {
        // Document Node
        nodes.push({
            id: doc.id,
            label: doc.title,
            group: 'Document',
            val: 10 + Math.random() * 5
        });

        // Metadata Nodes
        if (doc.metadata) {
            Object.entries(doc.metadata).forEach(([k, v]) => {
                const metaId = `meta-${v}`;
                // Avoid duplicates
                if (!nodes.find(n => n.id === metaId)) {
                    nodes.push({
                        id: metaId,
                        label: v,
                        group: 'Metadata',
                        val: 6
                    });
                }
                // Link
                links.push({
                    source: doc.id,
                    target: metaId,
                    relation: k
                });
            });
        }
    });

    return { nodes, links };
  }, [documents]);

  const toggleFilter = (key: string) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isResizing) {
            setGraphHeight(prev => Math.max(300, Math.min(800, prev + e.movementY)));
        }
    };
    const handleGlobalMouseUp = () => setIsResizing(false);

    if (isResizing) {
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-4xl font-serif font-bold text-ink">Semantic Graph</h2>
           <p className="text-gray-500 font-mono text-sm mt-2 border-l-2 border-accent pl-3">
              Force-Directed Layout & Clusters
           </p>
        </div>
        <div className="flex gap-2 items-center">
           <PaperBadge color="ink">{graphData.nodes.length} Nodes</PaperBadge>
        </div>
      </div>

      {/* Main Graph Container */}
      <div className="shadow-hard border-2 border-ink bg-white relative flex flex-col group">
          {/* Top Control Bar removed, Search moved to toolbar below */}
          <div className="absolute top-4 right-4 z-20">
             <button 
                onClick={() => { setIsFrozen(!isFrozen); if(isFrozen) setSelectedNode(null); }}
                className={`p-2 border-2 shadow-hard font-bold text-xs transition-all flex items-center gap-2
                    ${isFrozen ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-ink hover:bg-gray-50'}`}
             >
                {isFrozen ? <Play size={14}/> : <Pause size={14}/>}
                {isFrozen ? 'Physics: ON' : 'Physics: OFF'}
             </button>
          </div>

          <CanvasGraph 
            data={graphData} 
            isFrozen={isFrozen} 
            filters={filters}
            searchQuery={searchQuery}
            onNodeClick={setSelectedNode} 
            height={graphHeight}
          />

          <div 
             className="h-4 w-full bg-gray-100 border-t border-gray-300 hover:bg-accent hover:border-accent cursor-row-resize flex items-center justify-center transition-colors"
             onMouseDown={() => setIsResizing(true)}
          >
             <GripHorizontal size={16} className="text-gray-400"/>
          </div>
      </div>

      {/* Toolbar / Legend Area with Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-2 border border-gray-200">
          <div className="flex items-center gap-4">
              <GraphLegend filters={filters} toggleFilter={toggleFilter} />
              
              {/* Hybrid Search Input */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 shadow-sm">
                 <Search size={14} className="text-gray-400"/>
                 <input 
                    className="outline-none text-xs font-mono w-48 bg-transparent"
                    placeholder="Hybrid Search..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
          </div>
          <div className="text-xs text-gray-400 italic">
              {selectedNode ? `Selected: ${selectedNode.label}` : 'Interact with nodes to inspect connections'}
          </div>
      </div>

      <div className="pt-4 border-t-2 border-gray-200 border-dashed">
          <GraphAnalysis data={graphData} selectedNode={selectedNode} />
      </div>

    </div>
  );
};