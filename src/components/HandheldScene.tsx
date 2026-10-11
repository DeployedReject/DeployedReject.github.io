import { useState } from 'react';
import type { Project } from '../data/projects';
import { ConsoleScreenContent, type ScreenTab } from './ConsoleScreenContent';
import { Cartridge } from './Cartridge';
import type { SceneCameraMode } from './TVConsoleScene';

interface HandheldSceneProps {
  projects: Project[];
  cameraMode: SceneCameraMode;
  setCameraMode: (mode: SceneCameraMode) => void;
  onSelectProject: (projectId: string) => void;
  activeCartridgeId: string | null;
}

const TABS: ScreenTab[] = ['status', 'github', 'pings', 'hire', 'cartridges'];

// Positions of the 5 cartridges laid out on the portrait wooden desk below the handheld
const DESK_CARTRIDGE_SLOTS = [
  { left: '6%', bottom: '18%' },
  { left: '38%', bottom: '19%' },
  { left: '70%', bottom: '18%' },
  { left: '21%', bottom: '3%' },
  { left: '55%', bottom: '3%' },
];

export const HandheldScene: React.FC<HandheldSceneProps> = ({
  projects,
  cameraMode,
  setCameraMode,
  onSelectProject,
  activeCartridgeId,
}) => {
  const [screenTab, setScreenTab] = useState<ScreenTab>('status');
  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;

  const cycleTab = (dir: 'prev' | 'next') => {
    const idx = TABS.indexOf(screenTab);
    if (dir === 'next') {
      setScreenTab(TABS[(idx + 1) % TABS.length]);
    } else {
      setScreenTab(TABS[(idx - 1 + TABS.length) % TABS.length]);
    }
  };

  // Handheld sits at left: 19%, top: 6%, width: 62%, height: 55.2% (center x=50%, y=33.6%)
  // Screen hole center inside handheld is x=50%, y=31.6% -> stage x=50%, y=23.4%
  const getCameraTransform = (): string => {
    if (cameraMode === 'closeup') {
      // Zoomed in so the Handheld fills the mobile viewport by default
      return 'translate(-35.5%, 4.5%) scale(1.71)';
    }
    if (cameraMode === 'zooming-in') {
      // Zoom all the way into the screen hole until handheld bezel disappears
      return 'translate(-125%, -38%) scale(3.5)';
    }
    return 'translate(0%, 0%) scale(1)';
  };

  const isTableZoomedOut = cameraMode !== 'closeup';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#3c281b] flex items-center justify-center select-none">
      {/* Portrait Wooden Desk Backdrop */}
      <div
        className="relative w-screen h-screen max-w-[62vh] max-h-screen transition-transform duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transformOrigin: '0 0',
          transform: getCameraTransform(),
        }}
      >
        <img
          src="/img/desk-top-portrait.webp"
          alt="Wooden Desk"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
          style={{ filter: 'saturate(0.82) brightness(0.85)' }}
        />

        {/* Top Retro Banner when zoomed out on desk */}
        {isTableZoomedOut && (
          <div
            className="absolute top-[1.5%] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#171513]/95 border-2 border-[#d9d0c6] px-2.5 py-1.5 text-[#e6cf65] text-[8px] whitespace-nowrap shadow-[3px_3px_0px_#000]"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <span>TAP A CARTRIDGE ON DESK</span>
            <button
              type="button"
              onClick={() => setCameraMode('closeup')}
              className="px-1.5 py-0.5 bg-[#a6e26e] text-[#111912] font-bold"
            >
              [▲ ZOOM IN]
            </button>
          </div>
        )}

        {/* Handheld Console Unit Lying on the Upper Desk */}
        <div
          onClick={() => {
            if (cameraMode === 'table') setCameraMode('closeup');
          }}
          className="absolute z-10 left-[19%] top-[6%] w-[62%] aspect-[790/1290]"
        >
          {/* Drop shadow on the wooden desk */}
          <div className="absolute inset-2 translate-y-3 bg-black/70 rounded-[28px] blur-lg pointer-events-none" />

          {/* Cartridge Sliding Into Top Edge Slot (Behind Handheld Body!) */}
          {activeCartridge &&
            (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting') && (
              <div
                className={`absolute z-0 w-[44%] aspect-[800/900] ${
                  cameraMode === 'ejecting' ? 'animate-ejectHandheld' : 'animate-insertHandheld'
                }`}
                style={{ left: '28%', top: '-18%' }}
              >
                <Cartridge
                  project={activeCartridge}
                  showShadow={false}
                  showTooltip={false}
                />
              </div>
            )}

          {/* 1. Live Screen Layer (Behind transparent screen hole at x=175, y=210, w=440, h=396 of 790x1290) */}
          <div
            className="absolute z-5 bg-[#111912] crt-screen-container overflow-hidden"
            style={{
              left: '21.5%',
              top: '15.8%',
              width: '57.0%',
              height: '31.6%',
              borderRadius: '10px',
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

            <img
              src="/svg/glass-overlay.svg"
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
            />
            <div className="crt-vignette" />
          </div>

          {/* 2. Handheld Plastic Shell PNG (on top of screen and top-slot cartridge) */}
          <img
            src="/img/handheld-body.webp"
            alt="Retro Handheld"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
          />

          {/* 3. Physical D-Pad & Buttons Overlay (Exact PIL-measured coordinates on 790x1290) */}
          {/* D-Pad: x=64..264 (8.1%..33.4%), y=809..1011 (62.7%..78.4%) */}
          <div
            className="absolute z-20"
            style={{
              left: '8.1%',
              top: '62.7%',
              width: '25.3%',
              height: '15.7%',
            }}
          >
            {/* D-Pad Cross Graphic */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md pointer-events-none">
              <path
                d="M34,6 H66 V34 H94 V66 H66 V94 H34 V66 H6 V34 H34 Z"
                fill="#2d2926"
                stroke="#1a1715"
                strokeWidth="3"
              />
              <circle cx="50" cy="50" r="9" fill="#221f1d" />
              <polygon points="50,14 42,26 58,26" fill="#57504a" />
              <polygon points="50,86 42,74 58,74" fill="#57504a" />
              <polygon points="14,50 26,42 26,58" fill="#57504a" />
              <polygon points="86,50 74,42 74,58" fill="#57504a" />
            </svg>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cycleTab('prev');
              }}
              className="absolute top-0 left-1/3 w-1/3 h-1/3 cursor-pointer active:bg-white/15"
              title="Previous Tab"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cycleTab('next');
              }}
              className="absolute bottom-0 left-1/3 w-1/3 h-1/3 cursor-pointer active:bg-white/15"
              title="Next Tab"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cycleTab('prev');
              }}
              className="absolute top-1/3 left-0 w-1/3 h-1/3 cursor-pointer active:bg-white/15"
              title="Previous Tab"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cycleTab('next');
              }}
              className="absolute top-1/3 right-0 w-1/3 h-1/3 cursor-pointer active:bg-white/15"
              title="Next Tab"
            />
          </div>

          {/* B Button: center (555, 928) -> left: 64.5%, top: 68.5% */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleTab('prev');
            }}
            className="absolute z-20 w-[11.5%] aspect-square rounded-full bg-[#7c2d38] border-2 border-[#4a1820] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_3px_4px_rgba(0,0,0,0.6)] active:translate-y-0.5 flex items-center justify-center text-[#f5e4d7] text-[9px] cursor-pointer"
            style={{
              left: '64.5%',
              top: '68.5%',
              fontFamily: "'Press Start 2P', monospace",
            }}
          >
            B
          </button>

          {/* A Button: center (686, 864) -> left: 81.0%, top: 63.5% */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCameraMode(cameraMode === 'closeup' ? 'table' : 'closeup');
            }}
            className="absolute z-20 w-[11.5%] aspect-square rounded-full bg-[#7c2d38] border-2 border-[#4a1820] shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),0_3px_4px_rgba(0,0,0,0.6)] active:translate-y-0.5 flex items-center justify-center text-[#f5e4d7] text-[9px] cursor-pointer"
            style={{
              left: '81.0%',
              top: '63.5%',
              fontFamily: "'Press Start 2P', monospace",
            }}
          >
            A
          </button>

          {/* SELECT & START Pill Buttons: y=1048..1139 */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cycleTab('next');
            }}
            className="absolute z-20 w-[11%] h-[2.2%] bg-[#57504a] border border-[#2d2926] rounded-full -rotate-24 active:scale-95 cursor-pointer"
            style={{ left: '31.5%', top: '83.5%' }}
            title="SELECT (Next Screen)"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCameraMode(cameraMode === 'closeup' ? 'table' : 'closeup');
            }}
            className="absolute z-20 w-[11%] h-[2.2%] bg-[#57504a] border border-[#2d2926] rounded-full -rotate-24 active:scale-95 cursor-pointer"
            style={{ left: '49.5%', top: '83.5%' }}
            title="START (View Table Cartridges)"
          />
        </div>

        {/* 4. The 5 Cartridges Laid Out on the Wooden Desk Surface */}
        {projects.map((project, idx) => {
          const slot = DESK_CARTRIDGE_SLOTS[idx] || DESK_CARTRIDGE_SLOTS[0];
          const isCurrentlyInSlot =
            activeCartridgeId === project.id &&
            (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

          if (isCurrentlyInSlot) return null;

          return (
            <div
              key={project.id}
              className="absolute z-20"
              style={{
                left: slot.left,
                bottom: slot.bottom,
                width: '23%',
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
