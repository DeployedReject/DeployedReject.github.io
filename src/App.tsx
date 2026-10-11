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
  // Hanging room light bulb starts OFF (dark mode) and sets everything to light mode when touched
  const [isLightMode, setIsLightMode] = useState(false);
  const [staticBurst, setStaticBurst] = useState(false);

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
      const tBurst = window.setTimeout(() => setStaticBurst(true), 240);
      const t1 = window.setTimeout(() => {
        setIsFullscreenProject(true);
      }, 400);
      const tClear = window.setTimeout(() => setStaticBurst(false), 600);
      timersRef.current.push(tBurst, t1, tClear);
      return;
    }

    // Desktop: Slide cartridge into console slot, then burst static as ROM boots
    setCameraMode('inserting');
    const tBurst = window.setTimeout(() => setStaticBurst(true), 480);

    const t1 = window.setTimeout(() => {
      setIsFullscreenProject(true);
    }, 700);

    const tClear = window.setTimeout(() => setStaticBurst(false), 900);

    timersRef.current.push(tBurst, t1, tClear);
  };

  const handleEject = () => {
    clearTimers();
    setStaticBurst(true);
    setIsFullscreenProject(false);

    if (deviceLayout === 'handheld') {
      setCameraMode('closeup');
      setActiveCartridgeId(null);
      const tClear = window.setTimeout(() => setStaticBurst(false), 380);
      timersRef.current.push(tClear);
      return;
    }

    // Desktop: Return to the shelf/console scene and play the cartridge eject animation
    setCameraMode('ejecting');

    const t1 = window.setTimeout(() => {
      setCameraMode('table');
      setActiveCartridgeId(null);
    }, 650);

    const tClear = window.setTimeout(() => setStaticBurst(false), 420);

    timersRef.current.push(t1, tClear);
  };

  const activeProject = PROJECTS.find((p) => p.id === activeCartridgeId) || null;

  if (isFullscreenProject && activeProject) {
    return (
      <>
        <FullscreenProjectView
          project={activeProject}
          onEject={handleEject}
          isLightMode={isLightMode}
        />
        {staticBurst && (
          <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden animate-tvStaticBurst">
            <img
              src="/img/tv-static.gif"
              alt="TV Static Transition"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${
        isLightMode ? 'bg-[#ede4d3]' : 'bg-[#0c0a09]'
      }`}
    >
      {deviceLayout === 'tv' ? (
        <TVConsoleScene
          projects={PROJECTS}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          onSelectProject={handleSelectProject}
          activeCartridgeId={activeCartridgeId}
          isLightMode={isLightMode}
          onToggleLightMode={() => setIsLightMode((prev) => !prev)}
        />
      ) : (
        <HandheldScene
          projects={PROJECTS}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          onSelectProject={handleSelectProject}
          activeCartridgeId={activeCartridgeId}
          isLightMode={isLightMode}
          onToggleLightMode={() => setIsLightMode((prev) => !prev)}
        />
      )}

      {/* Global TV Static Transition Overlay */}
      {staticBurst && (
        <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden animate-tvStaticBurst">
          <img
            src="/img/tv-static.gif"
            alt="TV Static Transition"
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      )}
    </div>
  );
}

export default App;
