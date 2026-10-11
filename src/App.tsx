import { useState, useEffect } from 'react';
import { PROJECTS } from './data/projects';
import { TVConsoleScene } from './components/TVConsoleScene';
import { HandheldScene } from './components/HandheldScene';
import { FullscreenProjectView } from './components/FullscreenProjectView';
import { PlainPortfolio } from './components/PlainPortfolio';
import { Monitor, Smartphone, LayoutList } from 'lucide-react';

export function App() {
  const [viewMode, setViewMode] = useState<'retro' | 'plain'>('retro');
  const [deviceLayout, setDeviceLayout] = useState<'tv' | 'handheld'>('tv');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState<string | null>(null);

  // Auto-detect mobile screen on initial mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setDeviceLayout('handheld');
      } else {
        setDeviceLayout('tv');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectProject = (projectId: string) => {
    // 1. Play insertion animation for 700ms
    setIsInserting(projectId);
    setTimeout(() => {
      setIsInserting(null);
      // 2. Expand into fullscreen project view
      setActiveProject(projectId);
    }, 750);
  };

  const handleEject = () => {
    setActiveProject(null);
  };

  const currentProjectObj = PROJECTS.find((p) => p.id === activeProject);

  if (viewMode === 'plain') {
    return (
      <PlainPortfolio
        projects={PROJECTS}
        onSwitchToRetro={() => setViewMode('retro')}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* Top Floating Controls Bar */}
      <nav className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-1.5 rounded-full bg-stone-900/90 border border-stone-800 shadow-2xl backdrop-blur-md text-xs font-mono">
        <button
          onClick={() => setDeviceLayout('tv')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
            deviceLayout === 'tv'
              ? 'bg-stone-800 text-emerald-400 font-bold border border-stone-700'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Switch to TV & Console (Desktop View)"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TV Console</span>
        </button>

        <button
          onClick={() => setDeviceLayout('handheld')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
            deviceLayout === 'handheld'
              ? 'bg-stone-800 text-emerald-400 font-bold border border-stone-700'
              : 'text-stone-400 hover:text-stone-200'
          }`}
          title="Switch to Handheld Game Boy View"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Handheld</span>
        </button>

        <div className="w-px h-4 bg-stone-700 mx-1" />

        <button
          onClick={() => setViewMode('plain')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-stone-400 hover:text-white transition-colors cursor-pointer"
          title="View Clean Accessible Portfolio"
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span>Skip to Clean Mode</span>
        </button>
      </nav>

      {/* Main Content: Fullscreen Project or Console Scene */}
      {currentProjectObj ? (
        <FullscreenProjectView
          project={currentProjectObj}
          onEject={handleEject}
        />
      ) : deviceLayout === 'tv' ? (
        <TVConsoleScene
          projects={PROJECTS}
          onSelectProject={handleSelectProject}
          insertingProjectId={isInserting}
        />
      ) : (
        <HandheldScene
          projects={PROJECTS}
          onSelectProject={handleSelectProject}
          insertingProjectId={isInserting}
        />
      )}
    </div>
  );
}

export default App;
