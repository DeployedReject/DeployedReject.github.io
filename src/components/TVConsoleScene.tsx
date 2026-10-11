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
  cartridges: 'CH2: PROJECTS',
  github: 'CH3: COMMITS',
  pings: 'CH4: SERVERS',
  hire: 'CH5: CONTACT',
};

// Resting positions for the 5 cartridges on the wooden table
const TABLE_CARTRIDGE_SLOTS = [
  { left: '61.5%', bottom: '17.5%' },
  { left: '68.5%', bottom: '15.8%' },
  { left: '75.5%', bottom: '17.8%' },
  { left: '82.5%', bottom: '16.0%' },
  { left: '89.5%', bottom: '17.2%' },
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

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;
  const highlightedProject =
    projects[((selectedIndex % projects.length) + projects.length) % projects.length] || projects[0];

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

  const handlePrimaryAction = () => {
    if (screenTab === 'pings') {
      setPingRefreshKey((prev) => prev + 1);
      return;
    }
    if (screenTab === 'hire') {
      window.open('https://github.com/DeployedReject', '_blank', 'noopener,noreferrer');
      return;
    }
    // On 'cartridges', 'status', or 'github': load the currently highlighted project cartridge!
    setCameraMode('table');
    setTimeout(() => onSelectProject(highlightedProject.id), 450);
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
      if (e.key === 'Enter' && cameraMode === 'closeup') {
        handlePrimaryAction();
      }
      if (e.key === 'Escape' && cameraMode === 'table') {
        setCameraMode('closeup');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // ============================================================================
  // MODE 1: FULLSCREEN CRT VIEW (cameraMode === 'closeup')
  // Ditches the zoomed-in room/shell bitmap; renders a full-viewport dimensional
  // CRT monitor with a tactile 3D hardware control overlay on the right!
  // ============================================================================
  if (cameraMode === 'closeup') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#0a0908] select-none flex items-stretch">
        {/* Outer 3D Moulded CRT Bezel Frame (Gives real depth & recessed shadow to the fullscreen monitor) */}
        <div
          className="relative w-full h-full p-3 sm:p-5 md:p-7 flex items-stretch"
          style={{
            background:
              'linear-gradient(145deg, #38312d 0%, #241f1c 50%, #151210 100%)',
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.12), inset 0 -10px 30px rgba(0,0,0,0.9)',
          }}
        >
          {/* Subtle Wood Desk Reflection along the very bottom outer edge */}
          <img
            src="/img/desk-top.webp"
            alt=""
            className="absolute inset-x-0 bottom-0 h-4 w-full object-cover opacity-20 mix-blend-overlay pointer-events-none"
          />

          {/* Inner Recessed Chamfered CRT Bezel Well (Left/Main Fullscreen Screen + Right Control Deck) */}
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
                      CRT-TRINITRON
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

              {/* TOP PHYSICAL BUTTON 1: LOAD / ACTIVATE (Teal 3D Pushbutton) */}
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
                      ? 'Refresh Pings'
                      : screenTab === 'hire'
                      ? 'Open GitHub'
                      : `Insert ${highlightedProject.name}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handlePrimaryAction}
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
                      ? '▶ RE-PING SERVERS'
                      : screenTab === 'hire'
                      ? '▶ OPEN GITHUB'
                      : '▶ LOAD CARTRIDGE'}
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

                {/* Knob 2: Project / Item Selector */}
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
                  label="SELECT ROM"
                  sublabel={`#${selectedIndex + 1} ${highlightedProject.id.slice(0, 6).toUpperCase()}`}
                  accentColor="#a6e26e"
                />
              </div>

              {/* BOTTOM PHYSICAL BUTTON 2: ZOOM OUT TO DARK ROOM TABLE */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[7px] text-[#d9c8b4] uppercase tracking-wider"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    BUTTON B
                  </span>
                  <span className="text-[9px] font-mono text-[#e6cf65]">
                    Room & 5 Cartridges
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
                    ▼ TABLE & CARTRIDGES
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
  // MODE 2: ZOOMED-OUT DARK ROOM TABLE VIEW (cameraMode !== 'closeup')
  // Shows the dark room illuminated by the glowing CRT TV, with the console and
  // 5 cartridges resting on the table in dim ambient phosphor light.
  // ============================================================================
  const isZoomingIntoScreen = cameraMode === 'zooming-in';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040607] select-none">
      {/* Full-Viewport Dark Room Stage */}
      <div
        className="relative w-screen h-screen transition-transform duration-[750ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transformOrigin: '25% 52%',
          transform: isZoomingIntoScreen ? 'scale(3.4)' : 'scale(1)',
        }}
      >
        {/* 1. Darkened Room & Wooden Table Backdrop (Barely visible except where lit by the TV) */}
        <img
          src="/img/room-backdrop.webp"
          alt="Dark Retro Room"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none filter brightness-[0.14] contrast-[1.3] saturate-[0.45]"
        />

        {/* Deep Room Vignette & Shadow Falloff */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 26% 54%, rgba(166,226,110,0.14) 0%, rgba(12,20,14,0.68) 42%, rgba(3,4,5,0.95) 88%)',
          }}
        />

        {/* Volumetric CRT Light Cone Casting Across the Table & Console */}
        <div
          className="absolute inset-0 pointer-events-none animate-tv-ambient"
          style={{
            background:
              'radial-gradient(ellipse 55% 42% at 32% 62%, rgba(166,226,110,0.22) 0%, rgba(166,226,110,0.07) 52%, transparent 80%)',
            mixBlendMode: 'screen',
          }}
        />

        {/* Headline in the Big Upper Wall Area (Illuminated by Phosphor Glow) */}
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 w-full max-w-4xl px-4 text-center animate-fadeIn">
          <div className="bg-[#0b110d]/90 border-2 border-[#a6e26e]/60 px-6 py-4 rounded-lg shadow-[0_0_40px_rgba(166,226,110,0.2),0_12px_30px_rgba(0,0,0,0.9)] backdrop-blur-sm">
            <h1
              className="text-[#e6cf65] text-xs sm:text-sm md:text-base font-bold tracking-wide leading-relaxed drop-shadow-[0_0_10px_rgba(230,207,101,0.4)]"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              "Projects that I made based on my needs not for showcases"
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
              <span className="text-[#a6e26e] text-xs sm:text-sm font-mono">
                Hover over a cartridge to see why I made it • Click to insert into console
              </span>
              <button
                type="button"
                onClick={() => setCameraMode('closeup')}
                className="px-3 py-1.5 bg-[#a6e26e] text-[#0c140d] hover:bg-[#c3f593] cursor-pointer font-bold text-[10px] rounded shadow-[0_0_15px_rgba(166,226,110,0.5)] transition-transform active:scale-95"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                [ ▲ FULLSCREEN TV ]
              </button>
            </div>
          </div>
        </div>

        {/* 2. CRT TV Unit on Left-Center of Table (Acts as the primary light source in the dark room) */}
        <div
          onClick={() => setCameraMode('closeup')}
          className="group absolute z-10 cursor-zoom-in"
          style={{
            left: '6.5%',
            bottom: '16.5%',
            width: '36%',
            aspectRatio: '1278 / 999',
          }}
          title="Click TV to return to Fullscreen Mode"
        >
          {/* Intense Phosphor Halo Behind & Around the TV */}
          <div className="absolute -inset-8 bg-[#a6e26e]/15 rounded-full blur-3xl pointer-events-none animate-tv-ambient" />

          {/* Contact shadow under TV feet */}
          <div className="absolute -bottom-3 left-[6%] right-[6%] h-7 bg-black/95 rounded-full blur-md pointer-events-none" />

          {/* 2a. Bright Glowing CRT Screen Layer (Illuminates the room!) */}
          <div
            className="absolute z-0 bg-[#111912] crt-screen-container overflow-hidden shadow-[0_0_90px_20px_rgba(166,226,110,0.45)]"
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

          {/* 2b. TV Plastic Shell (Shaded for the dark room so only the screen glows brightly) */}
          <img
            src="/img/tv-crt.webp"
            alt="CRT Television"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none filter brightness-[0.42] contrast-[1.2] saturate-[0.7] group-hover:brightness-[0.55] transition-all duration-300"
          />
        </div>

        {/* 3. Top-Loading Console Unit Next to the TV (Dimly lit by the TV's side glow) */}
        <div
          className="absolute z-20"
          style={{
            left: '43.5%',
            bottom: '16.2%',
            width: '16.8%',
            aspectRatio: '2262 / 1061',
          }}
        >
          {/* Contact shadow under Console */}
          <div className="absolute -bottom-2.5 left-[5%] right-[5%] h-6 bg-black/95 rounded-full blur-md pointer-events-none" />

          {/* Back Layer: Full Console Image (Dimmed for dark room) */}
          <img
            src="/img/console-topload.webp"
            alt="Top-Loading Console"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none filter brightness-[0.38] contrast-[1.2] saturate-[0.7]"
          />

          {/* Middle Layer: Cartridge Sliding Into or Ejecting From the Slot */}
          {activeCartridge &&
            (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting') && (
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

          {/* Front Lip Mask Layer: Console cropped from y=232 (21.87%) downward */}
          <img
            src="/img/console-topload.webp"
            alt=""
            className="absolute inset-0 z-20 w-full h-full object-contain pointer-events-none select-none filter brightness-[0.38] contrast-[1.2] saturate-[0.7]"
            style={{
              clipPath: 'inset(21.87% 0 0 0)',
            }}
          />
        </div>

        {/* 4. The 5 Project Cartridges Laid Out on the Dark Wooden Table Surface */}
        {projects.map((project, idx) => {
          const slot = TABLE_CARTRIDGE_SLOTS[idx] || TABLE_CARTRIDGE_SLOTS[0];
          const isCurrentlyInSlot =
            activeCartridgeId === project.id &&
            (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

          if (isCurrentlyInSlot) return null;

          return (
            <div
              key={project.id}
              onMouseEnter={() => setSelectedIndex(idx)}
              className="absolute z-25 filter brightness-[0.58] hover:brightness-105 hover:drop-shadow-[0_0_24px_rgba(166,226,110,0.45)] transition-all duration-300"
              style={{
                left: slot.left,
                bottom: slot.bottom,
                width: '6.0%',
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
