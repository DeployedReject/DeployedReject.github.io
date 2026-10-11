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

const TABS: ScreenTab[] = ['status', 'cartridges', 'github', 'pings', 'hire'];
const TAB_LABELS: Record<ScreenTab, string> = {
  status: 'CH1: ABOUT',
  cartridges: 'CH2: ROMS',
  github: 'CH3: COMMITS',
  pings: 'CH4: SERVERS',
  hire: 'CH5: CONTACT',
};

// Positions of the 5 cartridges on the 3-tier foreground shelf (relative to the shelf container)
const SHELF_CARTRIDGE_SLOTS = [
  // Top shelf tier
  { left: '16%', bottom: '68.8%', tier: 0 },
  { left: '54%', bottom: '68.8%', tier: 0 },
  // Middle shelf tier
  { left: '16%', bottom: '38.3%', tier: 1 },
  { left: '54%', bottom: '38.3%', tier: 1 },
  // Bottom shelf tier
  { left: '35%', bottom: '7.8%', tier: 2 },
];

/**
 * High-depth 3D Skeuomorphic Rotary Dial matching the vintage CRT TV aesthetic.
 * The raised pointer bar rotates smoothly with CSS transitions.
 */
const RetroRotaryKnob: React.FC<{
  angle: number;
  onTurnClockwise: () => void;
  onTurnCounterClockwise: () => void;
  label: string;
  sublabel: string;
  accentColor?: string;
}> = ({
  angle,
  onTurnClockwise,
  onTurnCounterClockwise,
  label,
  sublabel,
  accentColor = '#a6e26e',
}) => {
  return (
    <div className="flex flex-col items-center select-none">
      {/* Label Plate Above Knob */}
      <div className="w-full flex items-center justify-between px-1 mb-1">
        <span
          className="text-[8px] tracking-wider text-[#d9c8b4] font-bold uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          {label}
        </span>
        <span className="text-[10px] font-mono text-[#a6e26e] bg-[#161a16] px-1.5 py-0.2 rounded border border-[#3a4a35] shadow-inner">
          {sublabel}
        </span>
      </div>

      {/* Recessed Well + 3D Knob */}
      <div className="relative flex items-center gap-1.5">
        {/* Counter-Clockwise Step Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTurnCounterClockwise();
          }}
          className="w-6 h-6 rounded bg-[#2c2724] hover:bg-[#3d3632] active:translate-y-0.5 border border-[#574d47] text-[#d9c8b4] text-xs font-mono flex items-center justify-center cursor-pointer shadow-[0_2px_0_#141110]"
          title={`Turn ${label} Counter-Clockwise`}
        >
          ◀
        </button>

        {/* Main 3D Rotary Dial */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onTurnClockwise();
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTurnCounterClockwise();
          }}
          onWheel={(e) => {
            e.stopPropagation();
            if (e.deltaY > 0) onTurnClockwise();
            else onTurnCounterClockwise();
          }}
          title={`Click to turn ${label} (or scroll mousewheel)`}
          className="relative w-20 h-20 xl:w-22 xl:h-22 rounded-full cursor-pointer group flex items-center justify-center"
        >
          {/* Outer Recessed Dark Bezel Well & Tick Marks */}
          <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <radialGradient id={`well-${label}`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.65" stopColor="#1c1816" />
                <stop offset="0.92" stopColor="#2d2724" />
                <stop offset="1" stopColor="#4f4640" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill={`url(#well-${label})`} stroke="#14110f" strokeWidth="2" />
            {/* Dial Ticks around Perimeter */}
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <line
                key={deg}
                x1="60"
                y1="7"
                x2="60"
                y2="12"
                stroke={deg % 72 === 0 ? accentColor : '#786b60'}
                strokeWidth={deg % 72 === 0 ? '2.5' : '1.5'}
                strokeLinecap="round"
                transform={`rotate(${deg} 60 60)`}
              />
            ))}
          </svg>

          {/* Cast Shadow of the 3D Knob Body (Stationary) */}
          <div className="absolute w-[74%] h-[74%] rounded-full translate-y-1.5 translate-x-0.5 bg-black/75 blur-[3px] pointer-events-none" />

          {/* Stationary 3D Moulded Beige Knob Base */}
          <div
            className="relative w-[74%] h-[74%] rounded-full pointer-events-none border border-[#fff2e2]/40 group-hover:brightness-105 transition-all"
            style={{
              background:
                'linear-gradient(135deg, #f3e3ce 0%, #dcc6ad 48%, #b39980 85%, #8c735d 100%)',
              boxShadow:
                'inset 0 2px 4px rgba(255,255,255,0.65), inset 0 -4px 6px rgba(60,45,32,0.7)',
            }}
          >
            {/* Inner Concave Dish */}
            <div
              className="absolute inset-[12%] rounded-full"
              style={{
                background: 'linear-gradient(135deg, #c2ab93 0%, #dfd0be 60%, #f0e2d0 100%)',
                boxShadow: 'inset 0 3px 6px rgba(70,54,40,0.45)',
              }}
            />
          </div>

          {/* Rotating 3D Raised Pointer Bar */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div
              className="w-[22%] h-[68%] rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, #f7ead9 0%, #e5cfb5 55%, #a88e75 100%)',
                boxShadow:
                  '0 3px 6px rgba(0,0,0,0.65), inset 0 1px 2px rgba(255,255,255,0.8)',
                border: '1px solid rgba(120,95,72,0.5)',
              }}
            >
              {/* Glowing Indicator Notch at Top of Bar */}
              <div
                className="w-1.5 h-3 mx-auto mt-1.5 rounded-full"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 6px ${accentColor}`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Clockwise Step Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTurnClockwise();
          }}
          className="w-6 h-6 rounded bg-[#2c2724] hover:bg-[#3d3632] active:translate-y-0.5 border border-[#574d47] text-[#d9c8b4] text-xs font-mono flex items-center justify-center cursor-pointer shadow-[0_2px_0_#141110]"
          title={`Turn ${label} Clockwise`}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export const TVConsoleScene: React.FC<TVConsoleSceneProps> = ({
  projects,
  cameraMode,
  setCameraMode,
  onSelectProject,
  activeCartridgeId,
}) => {
  const [screenTab, setScreenTab] = useState<ScreenTab>('status');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [pingRefreshKey, setPingRefreshKey] = useState<number>(0);
  const [channelKnobAngle, setChannelKnobAngle] = useState<number>(-45);
  const [selectKnobAngle, setSelectKnobAngle] = useState<number>(0);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;
  const highlightedProject =
    projects[((selectedIndex % projects.length) + projects.length) % projects.length] || projects[0];
  const hoveredProject = projects.find((p) => p.id === hoveredProjectId) || null;

  const turnChannel = (dir: 'next' | 'prev') => {
    const idx = TABS.indexOf(screenTab);
    const nextIdx =
      dir === 'next' ? (idx + 1) % TABS.length : (idx - 1 + TABS.length) % TABS.length;
    setScreenTab(TABS[nextIdx]);
    setChannelKnobAngle((prev) => (dir === 'next' ? prev + 45 : prev - 45));
  };

  const turnSelector = (dir: 'next' | 'prev') => {
    setSelectedIndex((prev) =>
      dir === 'next'
        ? (prev + 1) % projects.length
        : (prev - 1 + projects.length) % projects.length
    );
    setSelectKnobAngle((prev) => (dir === 'next' ? prev + 36 : prev - 36));
  };

  // Fullscreen primary button does NOT load cartridges directly (cartridges are loaded from the shelf view)
  const handleFullscreenButtonA = () => {
    if (screenTab === 'pings') {
      setPingRefreshKey((prev) => prev + 1);
      return;
    }
    if (screenTab === 'hire') {
      window.open('https://github.com/DeployedReject', '_blank', 'noopener,noreferrer');
      return;
    }
    turnChannel('next');
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setScreenTab('status');
      if (e.key === '2') setScreenTab('cartridges');
      if (e.key === '3') setScreenTab('github');
      if (e.key === '4') setScreenTab('pings');
      if (e.key === '5') setScreenTab('hire');
      if (e.key === 'ArrowRight') turnChannel('next');
      if (e.key === 'ArrowLeft') turnChannel('prev');
      if (e.key === 'ArrowDown') turnSelector('next');
      if (e.key === 'ArrowUp') turnSelector('prev');
      if (e.key === 'Escape' && cameraMode === 'table') {
        setCameraMode('closeup');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // ============================================================================
  // MODE 1: FULLSCREEN CRT VIEW (cameraMode === 'closeup')
  // Full-viewport dimensional CRT monitor with 3D hardware control overlay.
  // Cartridges cannot be loaded directly from fullscreen—users switch to the
  // Shelf view to pick and insert a cartridge.
  // ============================================================================
  if (cameraMode === 'closeup') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#0a0908] select-none flex items-stretch">
        {/* Outer 3D Moulded CRT Bezel Frame */}
        <div
          className="relative w-full h-full p-3 sm:p-5 md:p-7 flex items-stretch"
          style={{
            background:
              'linear-gradient(145deg, #38312d 0%, #241f1c 50%, #151210 100%)',
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.12), inset 0 -10px 30px rgba(0,0,0,0.9)',
          }}
        >
          {/* Inner Recessed Chamfered CRT Bezel Well */}
          <div
            className="relative flex-1 h-full rounded-[28px] p-3 sm:p-4 md:p-5 flex gap-4 sm:gap-5 items-stretch overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #1b1715 0%, #2b2420 50%, #382f29 100%)',
              boxShadow:
                'inset 0 12px 35px rgba(0,0,0,0.95), inset 0 -4px 16px rgba(166,226,110,0.12), 0 2px 4px rgba(255,255,255,0.08)',
              border: '3px solid #4a3f38',
            }}
          >
            {/* FULLSCREEN CRT TUBE DISPLAY */}
            <div className="relative flex-1 h-full rounded-[22px] overflow-hidden bg-[#0b120c] crt-screen-container shadow-[0_0_50px_rgba(166,226,110,0.18),inset_0_0_60px_rgba(0,0,0,0.95)] border-4 border-[#141a14]">
              <ConsoleScreenContent
                projects={projects}
                activeTab={screenTab}
                selectedIndex={selectedIndex}
                pingRefreshKey={pingRefreshKey}
                isTableZoomedOut={false}
                insertingProjectName={null}
              />

              {/* Curved CRT Glass Reflection Asset */}
              <img
                src="/svg/glass-overlay.svg"
                alt=""
                className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-60"
              />
              <div className="crt-vignette" />
            </div>

            {/* 3D HARDWARE CONTROL OVERLAY PANEL (Right Bezel Deck) */}
            <div
              className="w-60 xl:w-68 shrink-0 h-full rounded-[20px] p-3.5 xl:p-4 flex flex-col justify-between relative z-30"
              style={{
                background:
                  'linear-gradient(160deg, #47403c 0%, #332e2b 55%, #231f1d 100%)',
                boxShadow:
                  '-10px 0 30px rgba(0,0,0,0.8), inset 0 2px 3px rgba(255,255,255,0.18), inset 0 -4px 10px rgba(0,0,0,0.85)',
                border: '2px solid #635850',
              }}
            >
              {/* Top Speaker Grille & Power Indicator Module */}
              <div
                className="rounded-xl p-2.5 border border-[#544940] relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #736355 0%, #594c41 100%)',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a6e26e] shadow-[0_0_8px_#a6e26e] animate-pulse" />
                    <span
                      className="text-[7px] text-[#f3e3ce] font-bold tracking-wider"
                      style={{ fontFamily: "'Press Start 2P', monospace" }}
                    >
                      POWER
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-[#e6cf65] font-bold">
                    {TAB_LABELS[screenTab]}
                  </span>
                </div>
                {/* Perforated Speaker Dots */}
                <div
                  className="w-full h-6 rounded opacity-55"
                  style={{
                    backgroundImage: 'radial-gradient(#1f1916 2px, transparent 2px)',
                    backgroundSize: '7px 7px',
                  }}
                />
              </div>

              {/* TOP PHYSICAL BUTTON 1: CHANNEL ACTION (No direct cartridge load from fullscreen) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[7px] text-[#d9c8b4] uppercase tracking-wider"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    BUTTON A
                  </span>
                  <span className="text-[9px] font-mono text-[#a6e26e]">
                    {screenTab === 'pings'
                      ? 'Refresh'
                      : screenTab === 'hire'
                      ? 'GitHub'
                      : 'Next Channel'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFullscreenButtonA}
                  className="w-full py-2.5 px-3 rounded-lg cursor-pointer active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                  style={{
                    background: 'linear-gradient(180deg, #6ba397 0%, #4e8075 65%, #3b635a 100%)',
                    boxShadow:
                      '0 5px 0 #223b35, 0 8px 14px rgba(0,0,0,0.75), inset 0 1px 2px rgba(255,255,255,0.5)',
                    border: '2px solid #8ec2b7',
                  }}
                >
                  <span
                    className="text-[9px] xl:text-[10px] text-[#0c1f1b] font-bold tracking-wider uppercase group-hover:text-white transition-colors"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    {screenTab === 'pings'
                      ? '▶ RE-PING'
                      : screenTab === 'hire'
                      ? '▶ GITHUB'
                      : '▶ NEXT CH'}
                  </span>
                </button>
              </div>

              {/* RECESSED DUAL ROTARY KNOB BAY */}
              <div
                className="rounded-2xl p-3 flex flex-col items-center justify-around gap-3 border border-[#4a413b]"
                style={{
                  background: 'linear-gradient(180deg, #211d1b 0%, #2d2724 100%)',
                  boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                {/* Knob 1: Channel Selector */}
                <RetroRotaryKnob
                  angle={channelKnobAngle}
                  onTurnClockwise={() => turnChannel('next')}
                  onTurnCounterClockwise={() => turnChannel('prev')}
                  label="CHANNEL"
                  sublabel={`CH-0${TABS.indexOf(screenTab) + 1}`}
                  accentColor="#e6cf65"
                />

                <div className="w-full h-[1px] bg-[#3d3530]" />

                {/* Knob 2: Scroll / Browse List */}
                <RetroRotaryKnob
                  angle={selectKnobAngle}
                  onTurnClockwise={() => {
                    if (screenTab !== 'cartridges') setScreenTab('cartridges');
                    turnSelector('next');
                  }}
                  onTurnCounterClockwise={() => {
                    if (screenTab !== 'cartridges') setScreenTab('cartridges');
                    turnSelector('prev');
                  }}
                  label="SCROLL"
                  sublabel={`#${selectedIndex + 1} ${highlightedProject.name.slice(0, 7).toUpperCase()}`}
                  accentColor="#a6e26e"
                />
              </div>

              {/* BOTTOM PHYSICAL BUTTON 2: ZOOM OUT TO SHELF & CONSOLE TO LOAD CARTRIDGES */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[7px] text-[#d9c8b4] uppercase tracking-wider"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    BUTTON B
                  </span>
                  <span className="text-[9px] font-mono text-[#e6cf65]">
                    Pick Cartridge
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraMode('table')}
                  className="w-full py-2.5 px-3 rounded-lg cursor-pointer active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                  style={{
                    background: 'linear-gradient(180deg, #e6cf65 0%, #c4ab45 65%, #9c8428 100%)',
                    boxShadow:
                      '0 5px 0 #574812, 0 8px 14px rgba(0,0,0,0.75), inset 0 1px 2px rgba(255,255,255,0.65)',
                    border: '2px solid #f7e695',
                  }}
                >
                  <span
                    className="text-[9px] xl:text-[10px] text-[#171409] font-bold tracking-wider uppercase"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    ▼ CARTRIDGE SHELF
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE 2: ZOOMED-OUT PURE SVG/CSS ROOM WITH RAY-TRACED TV ILLUMINATION
  // - TV is stacked on top of the Console (via an open-bay monitor stand so the
  //   top-loading cartridge slot has clearance right under the TV).
  // - Positioned to the side of a 3D Shelf and slightly behind it.
  // - The Shelf holds the 5 Cartridges in the right foreground.
  // - Ray-traced volumetric light beams from the CRT screen illuminate the
  //   console, floor, shelf edges, and cartridges.
  // - Clean bold white text at the top and on cartridge hover.
  // ============================================================================
  const isZoomingIntoScreen = cameraMode === 'zooming-in';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040605] select-none">
      {/* Camera Zoom Container targeting the CRT Screen on top of the Console */}
      <div
        className="relative w-screen h-screen transition-transform duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transformOrigin: '24% 39%',
          transform: isZoomingIntoScreen ? 'scale(3.5)' : 'scale(1)',
        }}
      >
        {/* ================================================================== */}
        {/* LAYER 1: PURE SVG ARCHITECTURAL ROOM & RAY-TRACED TV LIGHT ENGINE  */}
        {/* ================================================================== */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Room Wall & Floor Gradients */}
            <linearGradient id="wallGrad" x1="0.2" y1="0.3" x2="0.9" y2="1">
              <stop offset="0%" stopColor="#0f1712" />
              <stop offset="45%" stopColor="#080c0a" />
              <stop offset="100%" stopColor="#030404" />
            </linearGradient>

            <linearGradient id="floorGrad" x1="0.25" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#141d16" />
              <stop offset="40%" stopColor="#0b100d" />
              <stop offset="100%" stopColor="#040605" />
            </linearGradient>

            {/* Ray-Traced Volumetric Light Gradients from CRT Screen (x≈450, y≈420) */}
            <linearGradient id="rayMainBeam" x1="0.18" y1="0.38" x2="0.88" y2="0.65">
              <stop offset="0%" stopColor="#b8f284" stopOpacity="0.42" />
              <stop offset="28%" stopColor="#a6e26e" stopOpacity="0.20" />
              <stop offset="65%" stopColor="#88c455" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#a6e26e" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="rayUpperShaft" x1="0.2" y1="0.35" x2="0.85" y2="0.25">
              <stop offset="0%" stopColor="#d4f9b0" stopOpacity="0.30" />
              <stop offset="45%" stopColor="#a6e26e" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#a6e26e" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="rayDownConsole" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#c2f593" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#a6e26e" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#a6e26e" stopOpacity="0.02" />
            </linearGradient>

            <radialGradient id="floorSpecularBounce" cx="0.32" cy="0.5" r="0.55">
              <stop offset="0%" stopColor="#b8f284" stopOpacity="0.28" />
              <stop offset="45%" stopColor="#89c456" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="tvBackscatter" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.34" />
              <stop offset="50%" stopColor="#7db84a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <filter id="volumetricBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="24" />
            </filter>

            <filter id="softRayBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* Back Wall */}
          <rect x="0" y="0" width="1920" height="870" fill="url(#wallGrad)" />

          {/* Subtle Architectural Wall Paneling Lines */}
          <line x1="0" y1="870" x2="1920" y2="870" stroke="#223325" strokeWidth="2" opacity="0.6" />
          <line x1="890" y1="0" x2="890" y2="870" stroke="#18241a" strokeWidth="1.5" opacity="0.5" />

          {/* Perspective Desk / Floor Plane */}
          <polygon points="0,870 1920,870 1920,1080 0,1080" fill="url(#floorGrad)" />

          {/* Wall Backscatter Halo behind the CRT TV */}
          <ellipse
            cx="455"
            cy="430"
            rx="420"
            ry="340"
            fill="url(#tvBackscatter)"
            filter="url(#volumetricBlur)"
          />

          {/* Ray-Traced Downward Light Cone hitting the Console & Riser beneath the TV */}
          <polygon
            points="275,540 595,540 740,965 160,965"
            fill="url(#rayDownConsole)"
            filter="url(#softRayBlur)"
          />

          {/* Ray-Traced Specular Bounce Reflection on the Floor/Desk Surface */}
          <ellipse
            cx="560"
            cy="955"
            rx="520"
            ry="95"
            fill="url(#floorSpecularBounce)"
            filter="url(#softRayBlur)"
          />

          {/* Ray-Traced Volumetric Frustum Casting Rightward onto the Cartridge Shelf */}
          <polygon
            points="540,265 540,555 1780,990 1780,110"
            fill="url(#rayMainBeam)"
            filter="url(#volumetricBlur)"
          />

          {/* Distinct Volumetric Scanline God-Rays Fanning from TV Screen to the Shelf */}
          <polygon
            points="535,280 535,345 1680,260 1680,140"
            fill="url(#rayUpperShaft)"
            filter="url(#softRayBlur)"
          />
          <polygon
            points="535,365 535,435 1720,560 1720,410"
            fill="url(#rayMainBeam)"
            filter="url(#softRayBlur)"
          />
          <polygon
            points="535,455 535,535 1740,860 1740,690"
            fill="url(#rayMainBeam)"
            filter="url(#softRayBlur)"
          />

          {/* Ray-Traced Shadow Occlusion Cast by the Shelf onto the Right Wall & Floor */}
          <polygon
            points="1690,170 1920,210 1920,1080 1640,1080"
            fill="#020303"
            opacity="0.82"
            filter="url(#softRayBlur)"
          />
        </svg>

        {/* ================================================================== */}
        {/* LAYER 2: BOLD WHITE TEXT (TOP STATEMENT & HOVERED CARTRIDGE NOTE)  */}
        {/* ================================================================== */}
        <div className="absolute top-[4.5%] inset-x-0 z-40 flex flex-col items-center px-6 text-center pointer-events-none">
          <h1 className="text-white font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            Projects that I made based on my needs not for showcases
          </h1>

          {/* Smoothly Animated Hover Origin Note in Bold White Text */}
          <div className="h-14 sm:h-16 mt-3 flex items-center justify-center max-w-3xl">
            <p
              className={`text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-snug transition-all duration-300 ease-out drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)] ${
                hoveredProject
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-2 scale-98'
              }`}
            >
              {hoveredProject
                ? `${hoveredProject.name}: "${hoveredProject.originNote || hoveredProject.tagline}"`
                : ''}
            </p>
          </div>
        </div>

        {/* Clean Return to Fullscreen Button */}
        <button
          type="button"
          onClick={() => setCameraMode('closeup')}
          className="absolute top-6 left-6 z-40 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm tracking-wide backdrop-blur-md border border-white/25 cursor-pointer transition-all active:scale-95"
        >
          ← Fullscreen TV
        </button>

        {/* ================================================================== */}
        {/* LAYER 3: STACKED TV ON TOP OF CONSOLE (Left-Center, Behind Shelf)  */}
        {/* ================================================================== */}

        {/* 3A. Top-Loading Console at the Base of the Stack */}
        <div
          className="absolute z-15"
          style={{
            left: '14.5%',
            bottom: '9.5%',
            width: '23.5%',
            aspectRatio: '2262 / 1061',
          }}
        >
          {/* Contact Shadow under Console */}
          <div className="absolute -bottom-3 left-[4%] right-[4%] h-7 bg-black/95 rounded-full blur-md pointer-events-none" />

          {/* Back Layer: Full Console Asset illuminated from above by the TV */}
          <img
            src="/img/console-topload.webp"
            alt="Top-Loading Console"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none filter brightness-[0.68] contrast-[1.15] saturate-[0.85]"
          />

          {/* Middle Layer: Cartridge Sliding Into or Ejecting From the Console Slot */}
          {activeCartridge &&
            (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting') && (
              <div
                className={`absolute z-15 w-[33%] aspect-[800/900] ${
                  cameraMode === 'ejecting' ? 'animate-ejectCartridge' : 'animate-insertCartridge'
                }`}
                style={{
                  left: '33.5%',
                  top: '-62%',
                }}
              >
                <Cartridge
                  project={activeCartridge}
                  showShadow={false}
                />
              </div>
            )}

          {/* Front Lip Mask Layer: Console cropped from y=232 (21.87%) downward */}
          <img
            src="/img/console-topload.webp"
            alt=""
            className="absolute inset-0 z-20 w-full h-full object-contain pointer-events-none select-none filter brightness-[0.68] contrast-[1.15] saturate-[0.85]"
            style={{
              clipPath: 'inset(21.87% 0 0 0)',
            }}
          />

          {/* Ray-Traced Phosphor Rim Highlight on Top of Console */}
          <div
            className="absolute inset-x-[8%] top-[8%] h-[28%] z-25 pointer-events-none rounded-full opacity-45 mix-blend-screen"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(184,242,132,0.65) 0%, transparent 75%)',
            }}
          />
        </div>

        {/* 3B. Pure SVG 3D Monitor Stand / Bridge Riser Supporting the TV Above the Console */}
        <svg
          viewBox="0 0 700 440"
          className="absolute z-14 pointer-events-none"
          style={{
            left: '10.2%',
            bottom: '9.0%',
            width: '32%',
            aspectRatio: '700 / 440',
          }}
        >
          <defs>
            <linearGradient id="riserTop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#263328" />
              <stop offset="45%" stopColor="#384d3b" />
              <stop offset="100%" stopColor="#1b241c" />
            </linearGradient>
            <linearGradient id="riserFront" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#182019" />
              <stop offset="50%" stopColor="#29382b" />
              <stop offset="100%" stopColor="#121713" />
            </linearGradient>
            <linearGradient id="riserLeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e2920" />
              <stop offset="100%" stopColor="#0f1410" />
            </linearGradient>
          </defs>
          {/* Back Shadow inside Riser Bay */}
          <rect x="68" y="48" width="564" height="370" fill="#040705" opacity="0.55" rx="6" />
          {/* Left Support Pillar */}
          <polygon points="30,40 72,40 72,425 30,425" fill="url(#riserLeg)" stroke="#3b523e" strokeWidth="1.5" />
          <polygon points="72,40 92,24 92,405 72,425" fill="#121813" />
          {/* Right Support Pillar */}
          <polygon points="628,40 670,40 670,425 628,425" fill="url(#riserLeg)" stroke="#3b523e" strokeWidth="1.5" />
          <polygon points="670,40 688,24 688,405 670,425" fill="#0d120e" />
          {/* Riser Top Platform Surface (TV sits on this) */}
          <polygon points="20,26 650,26 688,6 58,6" fill="url(#riserTop)" stroke="#7ab856" strokeOpacity="0.45" strokeWidth="1.5" />
          {/* Riser Front Bevel Edge */}
          <rect x="20" y="26" width="630" height="20" rx="2" fill="url(#riserFront)" stroke="#5b8c40" strokeOpacity="0.4" strokeWidth="1" />
          {/* Phosphor Light Reflection Strip along Riser Front Lip */}
          <line x1="75" y1="27" x2="595" y2="27" stroke="#b8f284" strokeWidth="2.5" strokeOpacity="0.7" />
        </svg>

        {/* 3C. CRT Television Stacked on Top of the Console Riser */}
        <div
          onClick={() => setCameraMode('closeup')}
          className="group absolute z-18 cursor-zoom-in"
          style={{
            left: '11.2%',
            bottom: '38.2%',
            width: '30%',
            aspectRatio: '1278 / 999',
          }}
          title="Click TV to enter Fullscreen Mode"
        >
          {/* Intense Phosphor Halo Emitted by the CRT Screen */}
          <div className="absolute -inset-6 bg-[#a6e26e]/20 rounded-full blur-2xl pointer-events-none animate-tv-ambient" />

          {/* Contact shadow of TV feet on the Riser platform */}
          <div className="absolute -bottom-2 left-[8%] right-[8%] h-5 bg-black/90 rounded-full blur-sm pointer-events-none" />

          {/* Bright Glowing CRT Screen Layer (Primary light source in the room) */}
          <div
            className="absolute z-0 bg-[#111912] crt-screen-container overflow-hidden shadow-[0_0_95px_24px_rgba(166,226,110,0.55)]"
            style={{
              left: '11.4%',
              top: '14.6%',
              width: '63.7%',
              height: '67.4%',
              borderRadius: '22px',
            }}
          >
            <ConsoleScreenContent
              projects={projects}
              activeTab={screenTab}
              selectedIndex={selectedIndex}
              pingRefreshKey={pingRefreshKey}
              isTableZoomedOut={true}
              insertingProjectName={
                cameraMode === 'inserting' || cameraMode === 'zooming-in'
                  ? activeCartridge?.name
                  : null
              }
            />

            <img
              src="/svg/glass-overlay.svg"
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none opacity-65"
            />
            <div className="crt-vignette" />
          </div>

          {/* TV Plastic Shell */}
          <img
            src="/img/tv-crt.webp"
            alt="CRT Television"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none filter brightness-[0.65] contrast-[1.15] saturate-[0.85] group-hover:brightness-[0.8] transition-all duration-300"
          />
        </div>

        {/* ================================================================== */}
        {/* LAYER 4: 3D FOREGROUND SHELF WITH THE 5 CARTRIDGES (Right Side)    */}
        {/* Positioned to the side of and in front of the TV/Console stack,    */}
        {/* with ray-traced rim highlights on the left edges facing the TV.    */}
        {/* ================================================================== */}
        <div
          className="absolute z-30"
          style={{
            left: '48%',
            bottom: '6.5%',
            width: '43%',
            height: '74%',
          }}
        >
          {/* Pure SVG 3D Perspective Bookcase / Cartridge Shelf */}
          <svg
            viewBox="0 0 900 860"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          >
            <defs>
              {/* Left Outer Wall of Shelf (Directly lit by the CRT TV to its left!) */}
              <linearGradient id="shelfLeftLitWall" x1="0" y1="0.3" x2="1" y2="0.7">
                <stop offset="0%" stopColor="#6c9c4e" />
                <stop offset="35%" stopColor="#354d2b" />
                <stop offset="100%" stopColor="#1b2618" />
              </linearGradient>

              {/* Inner Back Panel of Shelf (Dark recessed cavity with subtle green light falloff from left to right) */}
              <linearGradient id="shelfBackCavity" x1="0" y1="0.35" x2="1" y2="0.65">
                <stop offset="0%" stopColor="#1b2819" />
                <stop offset="45%" stopColor="#111811" />
                <stop offset="100%" stopColor="#090c09" />
              </linearGradient>

              {/* Shelf Plank Top Surface (Receives ray-traced bounce light from TV) */}
              <linearGradient id="plankTopSurface" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#466337" />
                <stop offset="35%" stopColor="#2c3d24" />
                <stop offset="100%" stopColor="#182015" />
              </linearGradient>

              {/* Shelf Plank Front Edge Bevel */}
              <linearGradient id="plankFrontBevel" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#587d44" />
                <stop offset="25%" stopColor="#344a2a" />
                <stop offset="100%" stopColor="#1c2618" />
              </linearGradient>

              {/* Specular Phosphor Rim Glow on Shelf Edges Facing the TV */}
              <linearGradient id="rimHighlight" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d2fcab" stopOpacity="0.95" />
                <stop offset="30%" stopColor="#a6e26e" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#a6e26e" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Drop Shadow of Shelf on the Floor & Wall */}
            <polygon
              points="40,845 875,845 910,875 15,875"
              fill="#000000"
              opacity="0.9"
            />

            {/* 3D Left Exterior Side Panel (Facing the TV -> Brightest Ray-Traced Illumination) */}
            <polygon
              points="12,35 52,10 52,825 12,850"
              fill="url(#shelfLeftLitWall)"
              stroke="#b8f284"
              strokeOpacity="0.65"
              strokeWidth="2"
            />

            {/* Main Recessed Interior Back Wall */}
            <rect
              x="52"
              y="10"
              width="800"
              height="815"
              fill="url(#shelfBackCavity)"
              stroke="#2a3b24"
              strokeWidth="2"
            />

            {/* Interior Right Side Wall (In deep shadow away from TV) */}
            <polygon
              points="852,10 882,35 882,850 852,825"
              fill="#0c110b"
              stroke="#23301f"
              strokeWidth="2"
            />

            {/* Top Roof Cap of Shelf */}
            <polygon
              points="12,35 52,10 852,10 882,35"
              fill="url(#plankTopSurface)"
              stroke="#5c8244"
              strokeOpacity="0.5"
              strokeWidth="1.5"
            />
            <rect x="12" y="35" width="870" height="18" fill="url(#plankFrontBevel)" />
            <line x1="12" y1="36" x2="882" y2="36" stroke="url(#rimHighlight)" strokeWidth="3" />

            {/* ============================================================ */}
            {/* TIER 1 (TOP SHELF PLANK - y=280)                             */}
            {/* ============================================================ */}
            <polygon
              points="16,280 52,254 852,254 880,280"
              fill="url(#plankTopSurface)"
            />
            <rect x="16" y="280" width="864" height="22" fill="url(#plankFrontBevel)" />
            <line x1="16" y1="281" x2="880" y2="281" stroke="url(#rimHighlight)" strokeWidth="3" />

            {/* ============================================================ */}
            {/* TIER 2 (MIDDLE SHELF PLANK - y=555)                          */}
            {/* ============================================================ */}
            <polygon
              points="16,555 52,529 852,529 880,555"
              fill="url(#plankTopSurface)"
            />
            <rect x="16" y="555" width="864" height="22" fill="url(#plankFrontBevel)" />
            <line x1="16" y1="556" x2="880" y2="556" stroke="url(#rimHighlight)" strokeWidth="3" />

            {/* ============================================================ */}
            {/* TIER 3 (BOTTOM SHELF PLANK - y=828)                          */}
            {/* ============================================================ */}
            <polygon
              points="12,828 52,802 852,802 882,828"
              fill="url(#plankTopSurface)"
            />
            <rect x="12" y="828" width="870" height="24" fill="url(#plankFrontBevel)" />
            <line x1="12" y1="829" x2="882" y2="829" stroke="url(#rimHighlight)" strokeWidth="3" />

            {/* Left Front Vertical Post Rim-Lit by the TV */}
            <rect x="12" y="35" width="16" height="817" fill="url(#plankFrontBevel)" />
            <line x1="13" y1="35" x2="13" y2="852" stroke="#d2fcab" strokeWidth="3" strokeOpacity="0.85" />

            {/* Right Front Vertical Post */}
            <rect x="866" y="35" width="16" height="817" fill="#141c12" />
          </svg>

          {/* The 5 Project Cartridges Placed on the 3 Shelf Tiers */}
          {projects.map((project, idx) => {
            const slot = SHELF_CARTRIDGE_SLOTS[idx] || SHELF_CARTRIDGE_SLOTS[0];
            const isCurrentlyInSlot =
              activeCartridgeId === project.id &&
              (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

            if (isCurrentlyInSlot) return null;

            const isHovered = hoveredProjectId === project.id;

            return (
              <div
                key={project.id}
                onMouseEnter={() => {
                  setHoveredProjectId(project.id);
                  setSelectedIndex(idx);
                }}
                onMouseLeave={() => {
                  setHoveredProjectId((prev) => (prev === project.id ? null : prev));
                }}
                className={`absolute z-35 transition-all duration-300 ${
                  isHovered
                    ? 'brightness-110 drop-shadow-[0_0_28px_rgba(184,242,132,0.55)] scale-105'
                    : 'brightness-[0.82] hover:brightness-105'
                }`}
                style={{
                  left: slot.left,
                  bottom: slot.bottom,
                  width: '26%',
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
    </div>
  );
};
