import { useState, useEffect, useRef } from 'react';
import { PROJECTS } from './data/projects';
import { TVConsoleScene, type SceneCameraMode } from './components/TVConsoleScene';
import { HandheldScene } from './components/HandheldScene';
import { FullscreenProjectView } from './components/FullscreenProjectView';

export function App() {
  const [deviceLayout, setDeviceLayout] = useState<'tv' | 'handheld'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight > window.innerWidth)
        ? 'handheld'
        : 'tv';
    }
    return 'tv';
  });

  // Starts fullscreen on the CRT TV / Handheld closeup by default
  const [cameraMode, setCameraMode] = useState<SceneCameraMode>('closeup');
  const [activeCartridgeId, setActiveCartridgeId] = useState<string | null>(null);
  const [isFullscreenProject, setIsFullscreenProject] = useState(false);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  // Automatic TV vs Handheld layout based on viewport size/orientation (no manual toggle UI)
  useEffect(() => {
    const handleResize = () => {
      const useHandheld =
        window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight > window.innerWidth);
      setDeviceLayout(useHandheld ? 'handheld' : 'tv');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleSelectProject = (projectId: string) => {
    clearTimers();
    setActiveCartridgeId(projectId);
    // Step 1: Slide cartridge into the console slot on the table (700ms)
    setCameraMode('inserting');

    // Step 2: Zoom camera into the CRT screen (700ms)
    const t1 = window.setTimeout(() => {
      setCameraMode('zooming-in');
    }, 700);

    // Step 3: Transition into the fullscreen interactive project view
    const t2 = window.setTimeout(() => {
      setIsFullscreenProject(true);
    }, 1400);

    timersRef.current.push(t1, t2);
  };

  const handleEject = () => {
    clearTimers();
    // Return from fullscreen to the table scene and play the cartridge eject animation
    setIsFullscreenProject(false);
    setCameraMode('ejecting');

    const t1 = window.setTimeout(() => {
      setCameraMode('table');
      setActiveCartridgeId(null);
    }, 700);

    timersRef.current.push(t1);
  };

  const activeProject = PROJECTS.find((p) => p.id === activeCartridgeId) || null;

  if (isFullscreenProject && activeProject) {
    return (
      <FullscreenProjectView
        project={activeProject}
        onEject={handleEject}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen bg-[#0c0a09] overflow-hidden select-none">
      {deviceLayout === 'tv' ? (
        <TVConsoleScene
          projects={PROJECTS}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          onSelectProject={handleSelectProject}
          activeCartridgeId={activeCartridgeId}
        />
      ) : (
        <HandheldScene
          projects={PROJECTS}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          onSelectProject={handleSelectProject}
          activeCartridgeId={activeCartridgeId}
        />
      )}
    </div>
  );
}

export default App;
