import React, { useState, useEffect } from 'react';
import { PaperCard, PaperInput, PaperButton, PaperBadge } from '../components/PaperComponents';
import { Copy, Wand2, Loader2, Save, Trash2, Clock, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SavedPrompt {
  id: string;
  content: string;
  timestamp: number;
  mode: 'precise' | 'creative';
  preview: string;
}

export const PromptGenView: React.FC = () => {
  const [temperature, setTemperature] = useState(0.7);
  const [inputText, setInputText] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'precise' | 'creative'>('precise');
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  
  // Load saved prompts from local storage
  useEffect(() => {
    const saved = localStorage.getItem('pratejra_saved_prompts');
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved prompts");
      }
    }
  }, []);

  // Save to local storage whenever list changes
  useEffect(() => {
    localStorage.setItem('pratejra_saved_prompts', JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  const generate = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setGeneratedPrompt('');
    setJustSaved(false);
    
    try {
      // Safely access API Key
      const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
        ? process.env.API_KEY 
        : '';
      
      const ai = new GoogleGenAI({ apiKey });
      
      const systemPrompt = `You are a world-class prompt engineer. Your goal is to take a user's rough idea and convert it into a highly optimized system prompt for an LLM (Large Language Model). 
      
      Follow these rules:
      1. Use the "${mode}" style. (Precise = clear, structured, constraint-heavy. Creative = descriptive, persona-based, open-ended).
      2. Include specific sections for [Role], [Context], [Task], and [Constraints].
      3. Output ONLY the optimized prompt, no conversational filler.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            { role: 'user', parts: [{ text: `Original Input: ${inputText}\n\nOptimize this prompt.` }] }
        ],
        config: {
            systemInstruction: systemPrompt,
            temperature: temperature
        }
      });

      setGeneratedPrompt(response.text || "Failed to generate prompt.");
    } catch (error) {
      console.error("Prompt generation failed:", error);
      setGeneratedPrompt("Error: Could not access the backend generation service or API Key is missing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!generatedPrompt) return;
    
    const newPrompt: SavedPrompt = {
      id: Date.now().toString(),
      content: generatedPrompt,
      timestamp: Date.now(),
      mode: mode,
      preview: inputText.slice(0, 40) + (inputText.length > 40 ? '...' : '')
    };
    
    setSavedPrompts(prev => [newPrompt, ...prev]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleDelete = (id: string) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-ink">Prompt Engineering Lab</h2>
        <p className="text-gray-500 mt-2">Refine your queries into high-quality LLM prompts using our backend engine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <PaperCard title="Parameters">
            <div className="space-y-6">
              <div>
                <label className="flex justify-between text-xs font-bold uppercase text-gray-500 mb-2">
                  Temperature <span>{temperature}</span>
                </label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-accent h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div className="space-y-2">
                 <p className="text-xs font-bold uppercase text-gray-500">Target Model</p>
                 <select className="w-full p-2 border-2 border-ink rounded-sm font-sans bg-white focus:ring-2 focus:ring-accent outline-none">
                   <option>GPT-4o</option>
                   <option>Gemini 1.5 Pro</option>
                   <option>Llama 3 (Local)</option>
                   <option>Mistral</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <p className="text-xs font-bold uppercase text-gray-500">Optimization Mode</p>
                 <div className="flex gap-2">
                   <button 
                    onClick={() => setMode('precise')}
                    className={`flex-1 py-1.5 text-xs font-bold border-2 transition-all ${mode === 'precise' ? 'border-ink bg-ink text-white' : 'border-gray-200 text-gray-500 hover:border-ink'}`}
                   >
                     PRECISE
                   </button>
                   <button 
                    onClick={() => setMode('creative')}
                    className={`flex-1 py-1.5 text-xs font-bold border-2 transition-all ${mode === 'creative' ? 'border-ink bg-ink text-white' : 'border-gray-200 text-gray-500 hover:border-ink'}`}
                   >
                     CREATIVE
                   </button>
                 </div>
              </div>
            </div>
          </PaperCard>

          {/* Saved Library Card */}
          <PaperCard title="Library" className="max-h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {savedPrompts.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm italic">
                  No prompts saved yet.
                </div>
              ) : (
                savedPrompts.map(p => (
                  <div key={p.id} className="p-3 border border-gray-200 rounded-sm bg-gray-50 hover:border-accent hover:shadow-sm transition-all group relative">
                    <div className="flex justify-between items-start mb-2">
                      <PaperBadge color={p.mode === 'precise' ? 'blue' : 'green'}>
                        {p.mode}
                      </PaperBadge>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-ink font-medium mb-2 line-clamp-2">"{p.preview}"</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                      <Clock size={10} />
                      {new Date(p.timestamp).toLocaleDateString()}
                    </div>
                    
                    {/* Expand/Copy Trigger */}
                    <button 
                      onClick={() => {
                        setGeneratedPrompt(p.content);
                        setMode(p.mode);
                      }}
                      className="absolute inset-0 bg-transparent w-full h-full cursor-pointer"
                    />
                  </div>
                ))
              )}
            </div>
          </PaperCard>
        </div>

        <div className="md:col-span-2 space-y-6">
          <PaperCard title="Input Strategy">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 p-4 border-2 border-gray-200 focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none font-sans text-sm"
              placeholder="Describe what you want the LLM to do (e.g., 'Summarize legal contracts emphasizing liabilities')..."
            ></textarea>
            <div className="mt-4 flex justify-end">
              <PaperButton onClick={generate} disabled={isLoading} icon={isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}>
                {isLoading ? 'Optimizing...' : 'Generate Prompt'}
              </PaperButton>
            </div>
          </PaperCard>

          {generatedPrompt && (
            <div className="animate-slide-up">
              <div className="bg-ink text-white p-6 rounded-sm shadow-hard relative group border-2 border-ink">
                <div className="absolute top-4 right-4 flex gap-2">
                   <button 
                    onClick={handleSave}
                    disabled={justSaved}
                    className={`p-2 rounded transition-all duration-200 ${justSaved ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-emerald-500 hover:text-white'}`}
                    title="Save to Library"
                  >
                    {justSaved ? <Check size={16} /> : <Save size={16} />}
                  </button>
                  <button 
                    onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                    className="p-2 bg-white/10 hover:bg-blue-500 hover:text-white rounded transition-all duration-200"
                    title="Copy to Clipboard"
                  >
                    <Copy size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                   <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                   <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Optimized Result</h4>
                </div>
                <p className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-200">{generatedPrompt}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};