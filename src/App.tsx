import { useState, useEffect, useRef } from 'react';
import { PROJECTS } from './data/projects';
import { TVConsoleScene, type SceneCameraMode } from './components/TVConsoleScene';
import { HandheldScene } from './components/HandheldScene';
import { FullscreenProjectView } from './components/FullscreenProjectView';
import { RetroLoadingScreen } from './components/RetroLoadingScreen';

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceLayout, setDeviceLayout] = useState<'tv' | 'handheld'>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 || (window.innerWidth < 1024 && window.innerHeight > window.innerWidth)
        ? 'handheld'
        : 'tv';
    }
    return 'tv';
  });

  // Starts in fullscreen closeup view on the TV by default
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

  // Failsafe: never let the BIOS boot overlay gate the app indefinitely
  useEffect(() => {
    const failsafe = window.setTimeout(() => setIsLoading(false), 8000);
    return () => window.clearTimeout(failsafe);
  }, []);

  const [isRomReady, setIsRomReady] = useState<boolean>(false);
  const [isRomLoading, setIsRomLoading] = useState<boolean>(false);
  const isLaunchingRomRef = useRef(false);

  const handleLaunchRom = () => {
    if (isLaunchingRomRef.current || (!isRomReady && !isRomLoading)) return;
    isLaunchingRomRef.current = true;
    clearTimers();
    setIsRomReady(false);
    setIsRomLoading(false);
    setStaticBurst(true);
    const tBoot = window.setTimeout(() => {
      setIsFullscreenProject(true);
      isLaunchingRomRef.current = false;
    }, 240);
    const tClear = window.setTimeout(() => setStaticBurst(false), 520);
    timersRef.current.push(tBoot, tClear);
  };

  // Listen for Enter key when ROM is ready to launch
  useEffect(() => {
    if (!isRomReady) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLaunchRom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRomReady]);

  const handleSelectProject = (projectId: string) => {
    clearTimers();
    isLaunchingRomRef.current = false;
    setActiveCartridgeId(projectId);
    setIsRomLoading(true);
    setIsRomReady(false);

    // Zoom straight to TV closeup so user sees the 5s loading screen & briefing
    setCameraMode('closeup');

    // 5 second loading time before showing "Press Enter"
    const tReady = window.setTimeout(() => {
      setIsRomLoading(false);
      setIsRomReady(true);
    }, 5000);

    timersRef.current.push(tReady);
  };

  const handleEject = () => {
    clearTimers();
    isLaunchingRomRef.current = false;
    setIsRomLoading(false);
    setIsRomReady(false);
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
      className={`relative w-screen h-screen overflow-hidden select-none ${
        isLightMode && deviceLayout !== 'handheld' ? 'bg-[#ede4d3]' : 'bg-[#0c0a09]'
      }`}
    >
      {deviceLayout === 'tv' ? (
        <TVConsoleScene
          projects={PROJECTS}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          onSelectProject={handleSelectProject}
          activeCartridgeId={activeCartridgeId}
          isRomLoading={isRomLoading}
          isRomReady={isRomReady}
          onLaunchRom={handleLaunchRom}
          isLightMode={isLightMode}
          onToggleLightMode={() => setIsLightMode((prev) => !prev)}
          isBooting={isLoading}
        />
      ) : (
        <HandheldScene
          projects={PROJECTS}
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          onSelectProject={handleSelectProject}
          activeCartridgeId={activeCartridgeId}
          isRomLoading={isRomLoading}
          isRomReady={isRomReady}
          onLaunchRom={handleLaunchRom}
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

      {/* Themed BIOS Boot Loading Screen to prevent flashing unrendered SVG/elements */}
      {isLoading && <RetroLoadingScreen onComplete={() => setIsLoading(false)} />}
    </div>
  );
}

export default App;
