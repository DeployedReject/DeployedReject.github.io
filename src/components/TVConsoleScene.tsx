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
  const [knob1Angle, setKnob1Angle] = useState<number>(0);
  const [knob2Angle, setKnob2Angle] = useState<number>(0);

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
    setKnob1Angle((prev) => prev + 45);
    const nextIdx = (TABS.indexOf(screenTab) + 1) % TABS.length;
    setScreenTab(TABS[nextIdx]);
  };

  const toggleTableCloseup = () => {
    setKnob2Angle((prev) => prev + 90);
    setCameraMode(cameraMode === 'closeup' ? 'table' : 'closeup');
  };

  // Compute exact 2D camera transform on the 2752x1536 locked stage
  const getCameraTransform = (): string => {
    if (cameraMode === 'closeup') {
      // Zoomed into the CRT TV so it fills the desktop viewport
      return 'translate(3.0%, -54.5%) scale(1.88)';
    }
    if (cameraMode === 'zooming-in') {
      // Zoom all the way into the CRT screen hole until bezel leaves viewport
      return 'translate(-31.04%, -146.96%) scale(3.6)';
    }
    // 'table', 'inserting', 'ejecting' -> full table overview
    return 'translate(0%, 0%) scale(1)';
  };

  const isTableZoomedOut = cameraMode !== 'closeup';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060809] flex items-center justify-center select-none">
      {/* Pitch black room base with subtle ambient floor horizon */}
      <div className="absolute inset-0 bg-[#050708] pointer-events-none" />

      {/* Responsive Stage filling screen viewport properly */}
      <div
        className="relative w-screen h-screen min-w-full min-h-full transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transformOrigin: '0 0',
          transform: getCameraTransform(),
        }}
      >
        {/* 1. Room Wall & Wooden Table Backdrop - Dimmed heavily so room contents are barely visible in the dark */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none">
          <img
            src="/img/room-backdrop.webp"
            alt="Retro Room & Table"
            className="w-full h-full object-cover filter brightness-[0.16] contrast-[1.25] saturate-[0.5]"
          />

          {/* Deep dark room shadow overlay - vignette & ceiling gloom */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 26% 56%, transparent 22%, rgba(5,7,8,0.75) 60%, rgba(3,4,5,0.96) 95%)',
            }}
          />

          {/* Atmospheric CRT Light Cast on surrounding desk and wall (animates subtle flicker) */}
          <div
            className="absolute z-5 pointer-events-none animate-tv-ambient"
            style={{
              left: '5%',
              top: '25%',
              width: '55%',
              height: '65%',
              background: 'radial-gradient(ellipse at 42% 48%, rgba(166,226,110,0.18) 0%, rgba(166,226,110,0.06) 42%, transparent 75%)',
              mixBlendMode: 'screen',
            }}
          />
        </div>

        {/* Big Area Headline in Table Mode */}
        {isTableZoomedOut && (
          <div
            className="absolute top-[3%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 bg-[#171513]/95 border-2 border-[#d9d0c6] px-5 py-2.5 shadow-[5px_5px_0px_#000] text-center max-w-[85vw]"
          >
            <span
              className="text-[#e6cf65] text-xs sm:text-sm font-bold tracking-wide"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              "Projects that I made based on my needs not for showcases"
            </span>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="text-stone-300 text-xs font-mono">
                HOVER OVER ANY CARTRIDGE ON THE TABLE TO VIEW DETAILS • CLICK TO INSERT
              </span>
              <button
                type="button"
                onClick={() => setCameraMode('closeup')}
                className="px-2.5 py-1 bg-[#a6e26e] text-[#111912] hover:bg-[#c3f593] cursor-pointer font-bold text-[10px]"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                [ ▲ ZOOM TO TV ]
              </button>
            </div>
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

          {/* 2a. Live CRT Screen Layer */}
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

          {/* 2c. Interactive Physical Buttons & Rotary Knobs with Alignment, Rotation Animation & Retro Labels */}
          {/* Upper Button: CH PREV */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const idx = TABS.indexOf(screenTab);
              setScreenTab(TABS[(idx - 1 + TABS.length) % TABS.length]);
              setKnob1Angle((prev) => prev - 45);
            }}
            title="Channel Back (Prev Option)"
            className="group absolute z-20 cursor-pointer rounded bg-black/40 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/20"
            style={{
              left: '83.0%',
              top: '41.5%',
              width: '9.3%',
              height: '3.4%',
            }}
          >
            <span
              className="text-[6px] text-[#f5e4d7] tracking-wider uppercase font-bold opacity-80 group-hover:opacity-100"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              PREV
            </span>
          </button>

          {/* Lower Teal Button: CH NEXT */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleChannel();
            }}
            title="Channel Forward (Next Option)"
            className="group absolute z-20 cursor-pointer rounded hover:ring-2 hover:ring-white/50 active:scale-95 transition-all flex items-center justify-center"
            style={{
              left: '85.8%',
              top: '44.8%',
              width: '4.8%',
              height: '3.5%',
            }}
          >
            <span
              className="text-[6px] text-[#0d2822] tracking-wider uppercase font-bold opacity-90 group-hover:opacity-100"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CH
            </span>
          </button>

          {/* Upper Knob Label */}
          <div
            className="absolute z-20 pointer-events-none text-[6px] text-[#b8a798] font-bold tracking-wider text-center"
            style={{
              left: '82.0%',
              top: '52.6%',
              width: '12.0%',
              fontFamily: "'Press Start 2P', monospace",
            }}
          >
            CHANNEL
          </div>

          {/* Upper Rotary Knob (Channel Dial with smooth rotation animation & dial tick) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleChannel();
            }}
            title="Turn Dial: Next Channel"
            className="absolute z-20 cursor-pointer rounded-full hover:ring-2 hover:ring-[#e6cf65]/80 active:scale-95 transition-transform duration-300 ease-out"
            style={{
              left: '84.1%',
              top: '55.4%',
              width: '7.8%',
              height: '9.6%',
              transform: `rotate(${knob1Angle}deg)`,
            }}
          >
            {/* Visual Indicator Notch */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2.5 bg-[#e6cf65] rounded-full shadow-[0_0_4px_#e6cf65]" />
          </button>

          {/* Lower Knob Label */}
          <div
            className="absolute z-20 pointer-events-none text-[6px] text-[#b8a798] font-bold tracking-wider text-center"
            style={{
              left: '82.0%',
              top: '67.8%',
              width: '12.0%',
              fontFamily: "'Press Start 2P', monospace",
            }}
          >
            VIEW
          </div>

          {/* Lower Rotary Knob (Toggle Table View with smooth rotation animation & dial tick) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTableCloseup();
            }}
            title="Turn Dial: Toggle Table / Cartridges View"
            className="absolute z-20 cursor-pointer rounded-full hover:ring-2 hover:ring-[#a6e26e]/80 active:scale-95 transition-transform duration-300 ease-out"
            style={{
              left: '84.0%',
              top: '70.6%',
              width: '7.9%',
              height: '10.0%',
              transform: `rotate(${knob2Angle}deg)`,
            }}
          >
            {/* Visual Indicator Notch */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-2.5 bg-[#a6e26e] rounded-full shadow-[0_0_4px_#a6e26e]" />
          </button>
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
