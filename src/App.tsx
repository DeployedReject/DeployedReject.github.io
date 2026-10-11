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

    if (deviceLayout === 'handheld') {
      setCameraMode('inserting');
      const t1 = window.setTimeout(() => {
        setIsFullscreenProject(true);
      }, 400);
      timersRef.current.push(t1);
      return;
    }

    // Desktop: Slide cartridge into the console slot (700ms), then zoom into the TV screen (700ms)
    setCameraMode('inserting');

    const t1 = window.setTimeout(() => {
      setCameraMode('zooming-in');
    }, 700);

    const t2 = window.setTimeout(() => {
      setIsFullscreenProject(true);
    }, 1400);

    timersRef.current.push(t1, t2);
  };

  const handleEject = () => {
    clearTimers();
    setIsFullscreenProject(false);

    if (deviceLayout === 'handheld') {
      setCameraMode('closeup');
      setActiveCartridgeId(null);
      return;
    }

    // Desktop: Return from fullscreen to the shelf/console scene and play the cartridge eject animation
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
