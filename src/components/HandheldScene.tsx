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

  const isTableZoomedOut = cameraMode !== 'closeup';

  // In Table / Zoomed-out mode: Show the retro desk with handheld device and cartridges laid out
  if (isTableZoomedOut) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#070605] flex items-center justify-center select-none">
        <div className="relative w-screen h-screen max-w-[62vh] max-h-screen">
          <img
            src="/img/desk-top-portrait.webp"
            alt="Wooden Desk"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none filter brightness-[0.22] contrast-[1.2] saturate-[0.6]"
          />
          {/* Ambient glow from the handheld screen */}
          <div
            className="absolute z-5 pointer-events-none animate-tv-ambient"
            style={{
              left: '12%',
              top: '10%',
              width: '76%',
              height: '45%',
              background: 'radial-gradient(circle at 50% 40%, rgba(166,226,110,0.18) 0%, transparent 68%)',
              mixBlendMode: 'screen',
            }}
          />

          {/* Top Banner on Desk */}
          <div
            className="absolute top-[2%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 bg-[#171513]/95 border-2 border-[#d9d0c6] px-3 py-2 text-center shadow-[4px_4px_0px_#000] max-w-[92vw]"
          >
            <span
              className="text-[#e6cf65] text-[8px] sm:text-[9px]"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              "Projects that I made based on my needs not for showcases"
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-stone-300 text-[10px] font-mono">TAP ANY CARTRIDGE TO INSERT</span>
              <button
                type="button"
                onClick={() => setCameraMode('closeup')}
                className="px-2 py-0.5 bg-[#a6e26e] text-[#111912] font-bold text-[8px] cursor-pointer"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                [▲ PLAY CONSOLE]
              </button>
            </div>
          </div>

          {/* Handheld Device Unit on Desk (Shell view) */}
          <div
            onClick={() => setCameraMode('closeup')}
            className="absolute z-10 left-[19%] top-[9%] w-[62%] aspect-[790/1290] cursor-pointer hover:brightness-105 transition-all"
          >
            <div className="absolute inset-2 translate-y-3 bg-black/70 rounded-[28px] blur-lg pointer-events-none" />

            {/* Sliding Cartridge in slot */}
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

            {/* Screen hole inside shell */}
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
                isTableZoomedOut={true}
                insertingProjectName={
                  cameraMode === 'inserting' || cameraMode === 'zooming-in'
                    ? activeCartridge?.name
                    : null
                }
              />
            </div>

            <img
              src="/img/handheld-body.webp"
              alt="Retro Handheld"
              className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
            />
          </div>

          {/* 5 Cartridges Laid Out on Desk Surface */}
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
  }

  // CLOSEUP / FULLSCREEN MODE: Ditch the shell! Clean 50-50 split layout
  // Top 50%: High-visibility CRT display screen
  // Bottom 50%: Tactile handheld body with responsive navigation buttons
  return (
    <div className="w-screen h-screen flex flex-col bg-[#141210] overflow-hidden select-none">
      {/* TOP 50%: SCREEN AREA */}
      <div className="w-full h-1/2 p-2 sm:p-3 bg-[#0d0f0e] border-b-4 border-[#2b2520] relative crt-screen-container">
        <div className="w-full h-full rounded-md overflow-hidden bg-[#111912] border border-[#3b4b32] relative shadow-inner">
          <ConsoleScreenContent
            projects={projects}
            activeTab={screenTab}
            setActiveTab={setScreenTab}
            onZoomToTable={() => setCameraMode('table')}
            onSelectProject={(id) => {
              setCameraMode('table');
              setTimeout(() => onSelectProject(id), 450);
            }}
            isTableZoomedOut={false}
            insertingProjectName={null}
          />

          <img
            src="/svg/glass-overlay.svg"
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          />
          <div className="crt-vignette" />
        </div>
      </div>

      {/* BOTTOM 50%: BODY WITH CONTROLS */}
      <div className="w-full h-1/2 bg-[#2a2420] border-t border-[#453b34] flex flex-col justify-between p-3 sm:p-5 relative shadow-[inset_0_4px_12px_rgba(0,0,0,0.6)]">
        {/* Subtle Hardware speaker grill & status LED */}
        <div className="flex items-center justify-between px-2 text-[#8c7a6b] text-[10px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="font-bold tracking-wider">PWR ON</span>
          </div>
          <div className="flex items-center gap-1 opacity-70">
            <span className="w-1.5 h-3 bg-[#1c1815] rounded-full" />
            <span className="w-1.5 h-3 bg-[#1c1815] rounded-full" />
            <span className="w-1.5 h-3 bg-[#1c1815] rounded-full" />
            <span className="w-1.5 h-3 bg-[#1c1815] rounded-full" />
          </div>
          <div
            className="text-[#e6cf65] text-[9px] font-bold"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            SYS-PORTABLE
          </div>
        </div>

        {/* Main Controls Area: D-Pad on Left, Action Buttons on Right */}
        <div className="flex-1 flex items-center justify-around px-2 sm:px-6 my-1">
          {/* LEFT: Tactile D-Pad for Tab & Option Navigation */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            {/* D-Pad background shape */}
            <div className="absolute w-28 h-10 sm:w-32 sm:h-11 bg-[#1c1816] rounded-md shadow-[0_4px_0px_#0d0c0a,inset_0_1px_2px_rgba(255,255,255,0.15)]" />
            <div className="absolute w-10 h-28 sm:w-11 sm:h-32 bg-[#1c1816] rounded-md shadow-[0_4px_0px_#0d0c0a,inset_0_1px_2px_rgba(255,255,255,0.15)]" />
            <div className="absolute w-8 h-8 rounded-full bg-[#171412] z-10" />

            {/* D-Pad UP */}
            <button
              type="button"
              onClick={() => cycleTab('prev')}
              className="absolute top-0 w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center text-stone-400 hover:text-white active:translate-y-0.5 cursor-pointer z-20"
              title="Previous Channel"
            >
              <span className="text-sm">▲</span>
            </button>
            {/* D-Pad DOWN */}
            <button
              type="button"
              onClick={() => cycleTab('next')}
              className="absolute bottom-0 w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center text-stone-400 hover:text-white active:translate-y-0.5 cursor-pointer z-20"
              title="Next Channel"
            >
              <span className="text-sm">▼</span>
            </button>
            {/* D-Pad LEFT */}
            <button
              type="button"
              onClick={() => cycleTab('prev')}
              className="absolute left-0 w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center text-stone-400 hover:text-white active:translate-y-0.5 cursor-pointer z-20"
              title="Previous Channel"
            >
              <span className="text-sm">◀</span>
            </button>
            {/* D-Pad RIGHT */}
            <button
              type="button"
              onClick={() => cycleTab('next')}
              className="absolute right-0 w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center text-stone-400 hover:text-white active:translate-y-0.5 cursor-pointer z-20"
              title="Next Channel"
            >
              <span className="text-sm">▶</span>
            </button>
          </div>

          {/* RIGHT: B & A Action Buttons */}
          <div className="flex items-center gap-4 sm:gap-6 -rotate-12">
            {/* B Button (Channel Back / Prev) */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => cycleTab('prev')}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#8c2d38] hover:bg-[#a63542] active:translate-y-1 active:shadow-none border-2 border-[#54151d] shadow-[0_5px_0px_#360d13,inset_0_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center text-[#fceee0] font-bold text-xs sm:text-sm cursor-pointer"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                B
              </button>
              <span
                className="text-[9px] text-[#b8a798] font-bold tracking-wider"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                PREV
              </span>
            </div>

            {/* A Button (Next Channel / Open Cartridges) */}
            <div className="flex flex-col items-center gap-1.5 -translate-y-2">
              <button
                type="button"
                onClick={() => cycleTab('next')}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-[#8c2d38] hover:bg-[#a63542] active:translate-y-1 active:shadow-none border-2 border-[#54151d] shadow-[0_5px_0px_#360d13,inset_0_2px_4px_rgba(255,255,255,0.3)] flex items-center justify-center text-[#fceee0] font-bold text-xs sm:text-sm cursor-pointer"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                A
              </button>
              <span
                className="text-[9px] text-[#b8a798] font-bold tracking-wider"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                NEXT
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM: SELECT & START Pill Buttons (View Cartridges on Table / Eject) */}
        <div className="flex items-center justify-center gap-8 pb-1">
          {/* SELECT Button -> Cycle Options */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => cycleTab('next')}
              className="w-14 h-4 sm:w-16 sm:h-4.5 bg-[#403833] hover:bg-[#524842] active:translate-y-0.5 rounded-full border border-[#2b2521] shadow-[0_2px_0px_#171412] -rotate-25 cursor-pointer"
              title="Next Channel Option"
            />
            <span
              className="text-[8px] sm:text-[9px] text-[#a8988a] font-bold tracking-wider mt-1"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CHANNEL
            </span>
          </div>

          {/* START Button -> Zoom Out to Cartridges Table */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setCameraMode('table')}
              className="w-14 h-4 sm:w-16 sm:h-4.5 bg-[#403833] hover:bg-[#524842] active:translate-y-0.5 rounded-full border border-[#2b2521] shadow-[0_2px_0px_#171412] -rotate-25 cursor-pointer"
              title="View Cartridges on Table"
            />
            <span
              className="text-[8px] sm:text-[9px] text-[#e6cf65] font-bold tracking-wider mt-1"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CARTRIDGES
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
