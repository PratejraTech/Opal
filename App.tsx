
import React, { useState, Suspense, useEffect } from 'react';
import { Layout } from './components/Layout';
import { UploadView } from './views/UploadView';
import { QuestionView } from './views/QuestionView';
import { KnowledgeGraphView } from './views/KnowledgeGraphView';
import { PromptGenView } from './views/PromptGenView';
import { MyProfileView } from './views/MyProfileView';
import { AgentCanvasView } from './views/AgentCanvasView';
import { SettingsView } from './views/SettingsView';
import { GlobalAIModal } from './components/GlobalAIModal';
import { ViewState, Document, AppConfig } from './types';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MOCK_DOCUMENTS, DEFAULT_CONFIG } from './constants';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.UPLOAD);
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Keyboard Shortcut for My AI Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsAIModalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.UPLOAD:
        return <UploadView documents={documents} setDocuments={setDocuments} config={config} />;
      case ViewState.QUESTION:
        return <QuestionView config={config} />;
      case ViewState.GRAPH:
        return <KnowledgeGraphView documents={documents} />;
      case ViewState.PROMPT:
        return <PromptGenView />;
      case ViewState.MY_PROFILE:
        return <MyProfileView documents={documents} config={config} />;
      case ViewState.AGENT_CANVAS:
        return <AgentCanvasView config={config} />;
      case ViewState.SETTINGS:
        return <SettingsView config={config} setConfig={setConfig} />;
      default:
        return <UploadView documents={documents} setDocuments={setDocuments} config={config} />;
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#f4f4f5]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-emerald-500" />
            <h2 className="font-serif text-xl font-bold text-gray-700">Initializing System...</h2>
          </div>
        </div>
      }>
        <Layout currentView={currentView} setView={setCurrentView}>
          {renderView()}
        </Layout>
        
        {/* Global Modal */}
        <GlobalAIModal 
          isOpen={isAIModalOpen} 
          onClose={() => setIsAIModalOpen(false)} 
          config={config} 
          setConfig={setConfig} 
        />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
