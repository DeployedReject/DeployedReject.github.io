import { useState, useEffect } from 'react';
import type { Project } from '../data/projects';
import { ConsoleScreenContent, type ScreenTab } from './ConsoleScreenContent';
import { Cartridge } from './Cartridge';

export type SceneCameraMode = 'closeup' | 'table' | 'inserting' | 'zooming-in' | 'ejecting';

interface TVConsoleSceneProps {
  projects: Project[];
  cameraMode: SceneCameraMode;
  setCameraMode: (mode: SceneCameraMode) => void;
  onSelectProject: (projectId: string) => void;
  activeCartridgeId: string | null;
}

const TABS: ScreenTab[] = ['status', 'github', 'pings', 'hire', 'cartridges'];

// Exact resting positions for the 5 cartridges on the wooden table (in % of 2752x1536 backdrop)
const TABLE_CARTRIDGE_SLOTS = [
  { left: '63.2%', bottom: '19.0%' },
  { left: '69.6%', bottom: '17.4%' },
  { left: '76.0%', bottom: '19.3%' },
  { left: '82.4%', bottom: '17.6%' },
  { left: '88.8%', bottom: '18.8%' },
];

export const TVConsoleScene: React.FC<TVConsoleSceneProps> = ({
  projects,
  cameraMode,
  setCameraMode,
  onSelectProject,
  activeCartridgeId,
}) => {
  const [screenTab, setScreenTab] = useState<ScreenTab>('status');
  const [knobAngle, setKnobAngle] = useState<number>(0);

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;

  // Keyboard shortcuts for retro navigation (1-5 for channels, Escape/Tab to toggle table zoom)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setScreenTab('status');
      if (e.key === '2') setScreenTab('github');
      if (e.key === '3') setScreenTab('pings');
      if (e.key === '4') setScreenTab('hire');
      if (e.key === '5') {
        setScreenTab('cartridges');
        setCameraMode('table');
      }
      if (e.key === 'Escape' && cameraMode === 'table') {
        setCameraMode('closeup');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cameraMode, setCameraMode]);

  const cycleChannel = () => {
    setKnobAngle((prev) => prev + 45);
    const nextIdx = (TABS.indexOf(screenTab) + 1) % TABS.length;
    setScreenTab(TABS[nextIdx]);
  };

  // Compute exact 2D camera transform on the 2752x1536 locked stage
  const getCameraTransform = (): string => {
    if (cameraMode === 'closeup') {
      // Zoomed into the CRT TV (center: x=25.0%, y=55.6%) so it fills the viewport by default
      return 'translate(3.0%, -54.5%) scale(1.88)';
    }
    if (cameraMode === 'zooming-in') {
      // Zoom all the way into the CRT screen hole (center: x=22.51%, y=54.71%) until bezel leaves viewport
      return 'translate(-31.04%, -146.96%) scale(3.6)';
    }
    // 'table', 'inserting', 'ejecting' -> full table overview
    return 'translate(0%, 0%) scale(1)';
  };

  const isTableZoomedOut = cameraMode !== 'closeup';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1e2629] flex items-center justify-center select-none">
      {/* Ambient background fill matching wall (top) and wood desk (bottom) for ultra-wide/tall monitors */}
      <div className="absolute inset-x-0 top-0 h-[72%] bg-[#2d393d] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[#473223] pointer-events-none" />

      {/* Locked 16:9 Stage (2752 x 1536 coordinate space) */}
      <div
        className="relative w-screen h-[55.81vw] max-h-screen max-w-[179.17vh] transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transformOrigin: '0 0',
          transform: getCameraTransform(),
        }}
      >
        {/* 1. Room Wall & Wooden Table Backdrop */}
        <img
          src="/img/room-backdrop.webp"
          alt="Retro Room & Table"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
        />

        {/* Subtle Retro HUD Hint in Table Mode */}
        {isTableZoomedOut && (
          <div
            className="absolute top-[5%] left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-[#171513]/95 border-2 border-[#d9d0c6] px-4 py-2 text-[#e6cf65] text-[10px] sm:text-xs shadow-[4px_4px_0px_#000]"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span>CLICK A CARTRIDGE ON THE TABLE TO INSERT</span>
            <button
              type="button"
              onClick={() => setCameraMode('closeup')}
              className="px-2 py-1 bg-[#a6e26e] text-[#111912] hover:bg-[#c3f593] cursor-pointer font-bold"
            >
              [ ▲ ZOOM TO TV ]
            </button>
          </div>
        )}

        {/* 2. CRT TV Unit on Left-Center of Table (left: 6.5%, bottom: 18.5%, width: 37%) */}
        <div
          onClick={() => {
            if (cameraMode === 'table') setCameraMode('closeup');
          }}
          className={`absolute z-10 ${cameraMode === 'table' ? 'cursor-zoom-in' : ''}`}
          style={{
            left: '6.5%',
            bottom: '18.5%',
            width: '37%',
            aspectRatio: '1278 / 999',
          }}
        >
          {/* Contact shadow under TV feet */}
          <div className="absolute -bottom-3 left-[6%] right-[6%] h-6 bg-black/75 rounded-full blur-md pointer-events-none" />

          {/* 2a. Live CRT Screen Layer (Positioned behind the transparent hole in tv-crt.webp) */}
          {/* Hole in 1278x999 is x=154, y=152, w=798, h=661. Slightly bled by 0.6% behind opaque bezel */}
          <div
            className="absolute z-0 bg-[#111912] crt-screen-container overflow-hidden"
            style={{
              left: '11.4%',
              top: '14.6%',
              width: '63.7%',
              height: '67.4%',
              borderRadius: '24px',
            }}
          >
            <ConsoleScreenContent
              projects={projects}
              activeTab={screenTab}
              setActiveTab={setScreenTab}
              onZoomToTable={() => setCameraMode('table')}
              onSelectProject={(id) => {
                setCameraMode('table');
                setTimeout(() => onSelectProject(id), 450);
              }}
              isTableZoomedOut={isTableZoomedOut}
              insertingProjectName={
                cameraMode === 'inserting' || cameraMode === 'zooming-in'
                  ? activeCartridge?.name
                  : null
              }
            />

            {/* Curved CRT Glass Reflection Overlay */}
            <img
              src="/svg/glass-overlay.svg"
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none opacity-55"
            />
            <div className="crt-vignette" />
          </div>

          {/* 2b. TV Plastic Bezel Image (with transparent screen hole) */}
          <img
            src="/img/tv-crt.webp"
            alt="CRT Television"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
          />

          {/* 2c. Interactive Physical Buttons & Rotary Knobs on the TV Right Bezel */}
          {/* Teal Rectangular Channel Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleChannel();
            }}
            title="Switch CRT Channel"
            className="absolute z-20 cursor-pointer hover:bg-white/10 active:scale-95 transition-transform rounded"
            style={{
              left: '84.5%',
              top: '42.8%',
              width: '6.8%',
              height: '5.2%',
            }}
          />

          {/* Top Rotary Knob (Channel Dial) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleChannel();
            }}
            title="Turn Knob: Next Channel"
            className="absolute z-20 cursor-pointer rounded-full hover:ring-2 hover:ring-[#e6cf65]/60 transition-transform"
            style={{
              left: '83.5%',
              top: '53.6%',
              width: '9.0%',
              height: '11.2%',
              transform: `rotate(${knobAngle}deg)`,
            }}
          />

          {/* Bottom Rotary Knob (Toggle Table View) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCameraMode(cameraMode === 'closeup' ? 'table' : 'closeup');
            }}
            title="Turn Knob: Toggle Table / Cartridges View"
            className="absolute z-20 cursor-pointer rounded-full hover:ring-2 hover:ring-[#a6e26e]/60"
            style={{
              left: '83.5%',
              top: '69.8%',
              width: '9.0%',
              height: '11.2%',
            }}
          />
        </div>

        {/* 3. Top-Loading Console Unit Sitting Next to the TV on the Wooden Table */}
        {/* Console is 2262 x 1061. Slot opening at y=127..224, front rim clip at y=232 (21.87%) */}
        <div
          className="absolute z-20"
          style={{
            left: '44.5%',
            bottom: '18.2%',
            width: '17.2%',
            aspectRatio: '2262 / 1061',
          }}
        >
          {/* Contact shadow under Console */}
          <div className="absolute -bottom-2.5 left-[5%] right-[5%] h-5 bg-black/75 rounded-full blur-md pointer-events-none" />

          {/* Back Layer: Full Console Image */}
          <img
            src="/img/console-topload.webp"
            alt="Top-Loading Console"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Middle Layer: Cartridge Sliding Into or Ejecting From the Slot */}
          {activeCartridge && (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting') && (
            <div
              className={`absolute z-15 w-[34%] aspect-[800/900] ${
                cameraMode === 'ejecting' ? 'animate-ejectCartridge' : 'animate-insertCartridge'
              }`}
              style={{
                left: '33%',
                top: '-65%',
              }}
            >
              <Cartridge
                project={activeCartridge}
                showShadow={false}
                showTooltip={false}
              />
            </div>
          )}

          {/* Front Lip Mask Layer: Console cropped from y=232 (21.87%) downward so cartridge goes INSIDE slot! */}
          <img
            src="/img/console-topload.webp"
            alt=""
            className="absolute inset-0 z-20 w-full h-full object-contain pointer-events-none select-none"
            style={{
              clipPath: 'inset(21.87% 0 0 0)',
            }}
          />
        </div>

        {/* 4. The 5 Project Cartridges Laid Out on the Wooden Table Surface */}
        {projects.map((project, idx) => {
          const slot = TABLE_CARTRIDGE_SLOTS[idx] || TABLE_CARTRIDGE_SLOTS[0];
          const isCurrentlyInSlot =
            activeCartridgeId === project.id &&
            (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

          if (isCurrentlyInSlot) return null;

          return (
            <div
              key={project.id}
              className="absolute z-25"
              style={{
                left: slot.left,
                bottom: slot.bottom,
                width: '5.8%',
                aspectRatio: '800 / 900',
              }}
            >
              <Cartridge
                project={project}
                onClick={() => onSelectProject(project.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
