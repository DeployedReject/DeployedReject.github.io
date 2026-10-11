import { useState, useEffect, useRef } from 'react';
import type { Project } from '../data/projects';
import { ConsoleScreenContent, type ScreenTab } from './ConsoleScreenContent';

export type SceneCameraMode = 'closeup' | 'table' | 'inserting' | 'zooming-in' | 'ejecting';

interface TVConsoleSceneProps {
  projects: Project[];
  cameraMode: SceneCameraMode;
  setCameraMode: (mode: SceneCameraMode) => void;
  onSelectProject: (projectId: string) => void;
  activeCartridgeId: string | null;
}

// Desktop Fullscreen TV does NOT include the ROMs menu
const TV_TABS: ScreenTab[] = ['status', 'github', 'pings', 'hire'];
const TAB_LABELS: Record<ScreenTab, string> = {
  status: 'CH1: ABOUT',
  cartridges: 'ROMS',
  github: 'CH2: COMMITS',
  pings: 'CH3: SERVERS',
  hire: 'CH4: CONTACT',
};

const CRT_TINTS = [
  { name: 'GREEN', filter: 'none', color: '#a6e26e' },
  { name: 'AMBER', filter: 'hue-rotate(-48deg) saturate(1.35)', color: '#f59e0b' },
  { name: 'CYAN', filter: 'hue-rotate(72deg) saturate(1.15)', color: '#38bdf8' },
  { name: 'MONO', filter: 'grayscale(1) contrast(1.18) brightness(1.08)', color: '#e5e7eb' },
];

/**
 * 3D Skeuomorphic Rotary Dial on the Fullscreen TV Control Deck.
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
          <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <radialGradient id={`well-${label}`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.65" stopColor="#1c1816" />
                <stop offset="0.92" stopColor="#2d2724" />
                <stop offset="1" stopColor="#4f4640" />
              </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill={`url(#well-${label})`} stroke="#14110f" strokeWidth="2" />
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

          <div className="absolute w-[74%] h-[74%] rounded-full translate-y-1.5 translate-x-0.5 bg-black/75 blur-[3px] pointer-events-none" />

          <div
            className="relative w-[74%] h-[74%] rounded-full pointer-events-none border border-[#fff2e2]/40 group-hover:brightness-105 transition-all"
            style={{
              background:
                'linear-gradient(135deg, #f3e3ce 0%, #dcc6ad 48%, #b39980 85%, #8c735d 100%)',
              boxShadow:
                'inset 0 2px 4px rgba(255,255,255,0.65), inset 0 -4px 6px rgba(60,45,32,0.7)',
            }}
          >
            <div
              className="absolute inset-[12%] rounded-full"
              style={{
                background: 'linear-gradient(135deg, #c2ab93 0%, #dfd0be 60%, #f0e2d0 100%)',
                boxShadow: 'inset 0 3px 6px rgba(70,54,40,0.45)',
              }}
            />
          </div>

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

/**
 * Side-View (Spine View) Cartridge sitting on the Shelf.
 * Displays the artwork icon on the left, the project name along the spine,
 * and smoothly pulls out slightly toward the viewer on hover.
 */
const CartridgeSideSpine: React.FC<{
  project: Project;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}> = ({ project, isHovered, onMouseEnter, onMouseLeave, onClick }) => {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={`group relative w-full h-15 xl:h-17 cursor-pointer select-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isHovered
          ? '-translate-x-7 translate-y-1 scale-[1.03] z-30'
          : 'translate-x-0 translate-y-0 z-10'
      }`}
    >
      {/* Pure SVG 3D Side-View Cartridge Spine */}
      <svg
        viewBox="0 0 540 96"
        className="w-full h-full overflow-visible"
        style={{
          filter: isHovered
            ? 'drop-shadow(12px 14px 18px rgba(0,0,0,0.95)) drop-shadow(-4px 0 16px rgba(166,226,110,0.35))'
            : 'drop-shadow(4px 8px 10px rgba(0,0,0,0.85))',
        }}
      >
        <defs>
          <linearGradient id={`spine-body-${project.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isHovered ? '#2a3b2c' : '#1f2b21'} />
            <stop offset="18%" stopColor={isHovered ? '#233025' : '#19221a'} />
            <stop offset="100%" stopColor="#101511" />
          </linearGradient>

          <linearGradient id={`spine-top-${project.id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isHovered ? '#4e6e52' : '#314534'} />
            <stop offset="100%" stopColor="#161f18" />
          </linearGradient>

          <clipPath id={`spine-icon-clip-${project.id}`}>
            <rect x="26" y="21" width="54" height="54" rx="8" />
          </clipPath>
        </defs>

        {/* 3D Top Depth Face (More visible as cartridge pulls out on hover) */}
        <polygon
          points="10,12 34,2 532,2 512,12"
          fill={`url(#spine-top-${project.id})`}
          stroke={isHovered ? '#a6e26e' : '#3b523e'}
          strokeOpacity={isHovered ? '0.7' : '0.35'}
          strokeWidth="1"
        />

        {/* 3D Right Depth End-Cap */}
        <polygon
          points="512,12 532,2 532,76 512,86"
          fill="#0c100d"
          stroke="#253327"
          strokeWidth="1"
        />

        {/* Main Cartridge Side Spine Face */}
        <rect
          x="10"
          y="12"
          width="502"
          height="74"
          rx="6"
          fill={`url(#spine-body-${project.id})`}
          stroke={isHovered ? '#a6e26e' : '#384f3b'}
          strokeOpacity={isHovered ? '0.9' : '0.5'}
          strokeWidth={isHovered ? '2' : '1.5'}
        />

        {/* Left Edge Green Light Catch (Faces the CRT TV) */}
        <line
          x1="11"
          y1="15"
          x2="11"
          y2="83"
          stroke="#a6e26e"
          strokeWidth={isHovered ? '3.5' : '2'}
          strokeOpacity={isHovered ? '0.95' : '0.55'}
        />

        {/* Recessed Spine Label Slot */}
        <rect
          x="20"
          y="17"
          width="415"
          height="62"
          rx="6"
          fill="#0b0f0c"
          stroke={isHovered ? '#5c8244' : '#253327'}
          strokeWidth="1.5"
        />

        {/* Project Artwork Icon on the Left of the Spine */}
        <rect
          x="25"
          y="20"
          width="56"
          height="56"
          rx="8"
          fill="#141c15"
          stroke={project.accentColor}
          strokeWidth="1.5"
        />
        <image
          href={project.labelSvg}
          x="26"
          y="21"
          width="54"
          height="54"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#spine-icon-clip-${project.id})`}
        />

        {/* Accent Color Bar Next to Icon */}
        <rect
          x="90"
          y="24"
          width="4"
          height="48"
          rx="2"
          fill={project.accentColor}
        />

        {/* Project Name Written on the Side Spine */}
        <text
          x="108"
          y="55"
          fill="#ffffff"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="23"
          fontWeight="800"
          letterSpacing="0.4"
        >
          {project.name}
        </text>

        {/* Molded Cartridge Grip Ribs on the Right End of the Spine */}
        {[450, 462, 474, 486, 498].map((rx) => (
          <g key={rx}>
            <line x1={rx} y1="22" x2={rx} y2="76" stroke="#090c0a" strokeWidth="4" strokeLinecap="round" />
            <line x1={rx + 2} y1="22" x2={rx + 2} y2="76" stroke="#354a38" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}
      </svg>
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
  const [pingRefreshKey, setPingRefreshKey] = useState<number>(0);
  const [channelKnobAngle, setChannelKnobAngle] = useState<number>(-45);
  const [tintKnobAngle, setTintKnobAngle] = useState<number>(0);
  const [tintIndex, setTintIndex] = useState<number>(0);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [autoZoomingToCloseup, setAutoZoomingToCloseup] = useState(false);

  const zoomCooldownRef = useRef<number>(0);

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;
  const hoveredProject = projects.find((p) => p.id === hoveredProjectId) || null;
  const currentTint = CRT_TINTS[tintIndex] || CRT_TINTS[0];

  const turnChannel = (dir: 'next' | 'prev') => {
    const idx = TV_TABS.indexOf(screenTab);
    const safeIdx = idx === -1 ? 0 : idx;
    const nextIdx =
      dir === 'next' ? (safeIdx + 1) % TV_TABS.length : (safeIdx - 1 + TV_TABS.length) % TV_TABS.length;
    setScreenTab(TV_TABS[nextIdx]);
    setChannelKnobAngle((prev) => (dir === 'next' ? prev + 45 : prev - 45));
  };

  const turnTint = (dir: 'next' | 'prev') => {
    setTintIndex((prev) =>
      dir === 'next'
        ? (prev + 1) % CRT_TINTS.length
        : (prev - 1 + CRT_TINTS.length) % CRT_TINTS.length
    );
    setTintKnobAngle((prev) => (dir === 'next' ? prev + 45 : prev - 45));
  };

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

  // Automatic zoom out when mouse moves to the outer screen edge in Fullscreen TV mode
  const handleEdgeZoomOut = () => {
    if (cameraMode !== 'closeup') return;
    if (Date.now() < zoomCooldownRef.current) return;
    zoomCooldownRef.current = Date.now() + 850;
    setAutoZoomingToCloseup(false);
    setCameraMode('table');
  };

  // Automatic zoom in when mouse moves onto the TV in the zoomed-out room view
  const handleTvMouseEnterZoomIn = () => {
    if (cameraMode !== 'table') return;
    if (Date.now() < zoomCooldownRef.current) return;
    zoomCooldownRef.current = Date.now() + 950;
    setAutoZoomingToCloseup(true);
    window.setTimeout(() => {
      setAutoZoomingToCloseup(false);
      setCameraMode('closeup');
    }, 520);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') setScreenTab('status');
      if (e.key === '2') setScreenTab('github');
      if (e.key === '3') setScreenTab('pings');
      if (e.key === '4') setScreenTab('hire');
      if (e.key === 'ArrowRight') turnChannel('next');
      if (e.key === 'ArrowLeft') turnChannel('prev');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // ============================================================================
  // MODE 1: FULLSCREEN CRT VIEW (cameraMode === 'closeup')
  // - ROM menu removed from fullscreen TV view.
  // - No Cartridge Shelf button: moving mouse to the outer edge of the screen
  //   automatically zooms out to the room & shelf view.
  // ============================================================================
  if (cameraMode === 'closeup') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black select-none flex items-stretch animate-fadeIn">
        {/* Invisible Screen-Edge Sensors: Moving mouse to the edge automatically zooms out */}
        <div
          onMouseEnter={handleEdgeZoomOut}
          className="fixed top-0 bottom-0 left-0 w-4 z-50"
        />
        <div
          onMouseEnter={handleEdgeZoomOut}
          className="fixed top-0 bottom-0 right-0 w-4 z-50"
        />
        <div
          onMouseEnter={handleEdgeZoomOut}
          className="fixed bottom-0 left-0 right-0 h-4 z-50"
        />
        <div
          onMouseEnter={handleEdgeZoomOut}
          className="fixed top-0 left-0 right-0 h-3 z-50"
        />

        {/* Outer 3D Moulded CRT Bezel Frame */}
        <div
          className="relative w-full h-full p-3 sm:p-5 md:p-7 flex items-stretch"
          style={{
            background:
              'linear-gradient(145deg, #2b2623 0%, #1c1917 50%, #0e0c0b 100%)',
            boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.1), inset 0 -10px 30px rgba(0,0,0,0.95)',
          }}
        >
          {/* Inner Recessed Chamfered CRT Bezel Well */}
          <div
            className="relative flex-1 h-full rounded-[28px] p-3 sm:p-4 md:p-5 flex gap-4 sm:gap-5 items-stretch overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #171412 0%, #241f1c 50%, #2e2723 100%)',
              boxShadow:
                'inset 0 12px 35px rgba(0,0,0,0.95), inset 0 -4px 16px rgba(166,226,110,0.12), 0 2px 4px rgba(255,255,255,0.08)',
              border: '3px solid #3d3530',
            }}
          >
            {/* FULLSCREEN CRT TUBE DISPLAY */}
            <div
              className="relative flex-1 h-full rounded-[22px] overflow-hidden bg-[#070c08] crt-screen-container shadow-[0_0_50px_rgba(166,226,110,0.18),inset_0_0_60px_rgba(0,0,0,0.95)] border-4 border-[#121712] transition-all duration-300"
              style={{ filter: currentTint.filter }}
            >
              <ConsoleScreenContent
                projects={projects}
                activeTab={screenTab}
                pingRefreshKey={pingRefreshKey}
                isTableZoomedOut={false}
                insertingProject={null}
                hideRomsTab={true}
              />

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
                  'linear-gradient(160deg, #423c38 0%, #2e2a27 55%, #1e1b19 100%)',
                boxShadow:
                  '-10px 0 30px rgba(0,0,0,0.8), inset 0 2px 3px rgba(255,255,255,0.18), inset 0 -4px 10px rgba(0,0,0,0.85)',
                border: '2px solid #595049',
              }}
            >
              {/* Top Speaker Grille & Power Indicator Module */}
              <div
                className="rounded-xl p-2.5 border border-[#544940] relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #6b5c4f 0%, #52463c 100%)',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full animate-pulse"
                      style={{
                        backgroundColor: currentTint.color,
                        boxShadow: `0 0 8px ${currentTint.color}`,
                      }}
                    />
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
                <div
                  className="w-full h-6 rounded opacity-55"
                  style={{
                    backgroundImage: 'radial-gradient(#1f1916 2px, transparent 2px)',
                    backgroundSize: '7px 7px',
                  }}
                />
              </div>

              {/* TOP PHYSICAL BUTTON A */}
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
                  sublabel={`CH-0${TV_TABS.indexOf(screenTab) + 1}`}
                  accentColor="#e6cf65"
                />

                <div className="w-full h-[1px] bg-[#3d3530]" />

                {/* Knob 2: Phosphor Color Tint */}
                <RetroRotaryKnob
                  angle={tintKnobAngle}
                  onTurnClockwise={() => turnTint('next')}
                  onTurnCounterClockwise={() => turnTint('prev')}
                  label="COLOR"
                  sublabel={currentTint.name}
                  accentColor={currentTint.color}
                />
              </div>

              {/* BOTTOM PHYSICAL BUTTON B: PREVIOUS CHANNEL */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[7px] text-[#d9c8b4] uppercase tracking-wider"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                  >
                    BUTTON B
                  </span>
                  <span className="text-[9px] font-mono text-[#e6cf65]">
                    Prev Channel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => turnChannel('prev')}
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
                    ◀ PREV CH
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
  // MODE 2: PURE BLACK ROOM WITH PURE SVG TV ON TOP OF SVG CONSOLE & SIDE-VIEW
  // CARTRIDGES ON THE SHELF, ILLUMINATED BY TINGLING GREEN CRT LIGHT.
  // - Moving mouse onto the TV automatically zooms in to Fullscreen TV view.
  // - Hovering over a cartridge on the shelf slightly pulls it out and shows
  //   its origin note in bold white text.
  // ============================================================================
  const isZoomingIntoScreen = cameraMode === 'zooming-in' || autoZoomingToCloseup;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Camera Zoom Stage targeting the SVG CRT Screen on top of the SVG Console */}
      <div
        className="relative w-screen h-screen transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        style={{
          transformOrigin: '26% 42%',
          transform: isZoomingIntoScreen ? 'scale(3.35)' : 'scale(1)',
        }}
      >
        {/* ================================================================== */}
        {/* LAYER 1: PITCH-BLACK ROOM WITH GREEN LIGHT SLIGHTLY TINGLING OUT   */}
        {/* ================================================================== */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Subtle Green Light Gradients Tingling Out from the CRT Screen */}
            <radialGradient id="tingleCoreGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.22" />
              <stop offset="45%" stopColor="#6eb844" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="tingleRightRay" x1="0" y1="0.45" x2="1" y2="0.55">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.16" />
              <stop offset="40%" stopColor="#7ec252" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="tingleDownRay" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#6eb844" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            <filter id="tingleBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          {/* Pure Black Room Backdrop */}
          <rect x="0" y="0" width="1920" height="1080" fill="#000000" />

          {/* Subtle Floor Horizon Line */}
          <line x1="0" y1="900" x2="1920" y2="900" stroke="#142416" strokeWidth="1" opacity="0.6" />

          {/* Green Light Slightly Tingling Out from the TV */}
          <g className="animate-tv-tingle">
            {/* Soft Ambient Phosphor Halo Around the TV */}
            <ellipse
              cx="490"
              cy="450"
              rx="390"
              ry="310"
              fill="url(#tingleCoreGlow)"
              filter="url(#tingleBlur)"
            />

            {/* Subtle Tingling Light Cone Reaching Toward the Shelf */}
            <polygon
              points="580,310 580,555 1580,860 1580,190"
              fill="url(#tingleRightRay)"
              filter="url(#tingleBlur)"
            />

            {/* Subtle Tingling Downward Glow onto the SVG Console Beneath the TV */}
            <polygon
              points="310,560 620,560 710,920 220,920"
              fill="url(#tingleDownRay)"
              filter="url(#tingleBlur)"
            />
          </g>
        </svg>

        {/* ================================================================== */}
        {/* LAYER 2: BOLD WHITE TEXT (HEADLINE & HOVERED CARTRIDGE NOTE)       */}
        {/* ================================================================== */}
        <div className="absolute top-[4.5%] inset-x-0 z-40 flex flex-col items-center px-6 text-center pointer-events-none">
          <h1 className="text-white font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight">
            Projects that I made based on my needs not for showcases
          </h1>

          {/* Smoothly Animated Hover Origin Note in Bold White Text */}
          <div className="h-14 sm:h-16 mt-3 flex items-center justify-center max-w-3xl">
            <p
              className={`text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl tracking-tight leading-snug transition-all duration-300 ease-out ${
                hoveredProject
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-2'
              }`}
            >
              {hoveredProject
                ? `${hoveredProject.name}: "${hoveredProject.originNote || hoveredProject.tagline}"`
                : ''}
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* LAYER 3: PURE SVG TV STACKED ON TOP OF PURE SVG CONSOLE            */}
        {/* Positioned to the side of the Shelf and slightly behind it (z-15)  */}
        {/* ================================================================== */}
        <div
          className="absolute z-15"
          style={{
            left: '10%',
            bottom: '8%',
            width: '34%',
            height: '74%',
          }}
        >
          {/* 3A. Pure SVG CRT TV (Top of Stack) — Hovering the TV automatically zooms in */}
          <div
            onMouseEnter={handleTvMouseEnterZoomIn}
            onClick={() => setCameraMode('closeup')}
            className="absolute left-[4%] top-[2%] w-[92%] h-[62%] z-20 cursor-zoom-in group"
          >
            {/* Live CRT Screen Content Positioned Inside the SVG TV Bezel */}
            <div
              className="absolute z-10 bg-[#070c08] crt-screen-container overflow-hidden shadow-[0_0_65px_12px_rgba(166,226,110,0.32)]"
              style={{
                left: '9.5%',
                top: '11.5%',
                width: '64.5%',
                height: '74.5%',
                borderRadius: '18px',
                filter: currentTint.filter,
              }}
            >
              <ConsoleScreenContent
                projects={projects}
                activeTab={screenTab}
                pingRefreshKey={pingRefreshKey}
                isTableZoomedOut={true}
                insertingProject={
                  cameraMode === 'inserting' || cameraMode === 'zooming-in'
                    ? activeCartridge
                    : null
                }
                hideRomsTab={true}
              />
              <div className="crt-vignette" />
            </div>

            {/* Pure SVG Drawn CRT Television Casing */}
            <svg
              viewBox="0 0 680 480"
              className="relative z-20 w-full h-full pointer-events-none overflow-visible"
            >
              <defs>
                <linearGradient id="svgTvBody" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1e2920" />
                  <stop offset="50%" stopColor="#121813" />
                  <stop offset="100%" stopColor="#090c0a" />
                </linearGradient>
                <linearGradient id="svgTvTop" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#263629" />
                  <stop offset="100%" stopColor="#141c15" />
                </linearGradient>
                <linearGradient id="svgTvScreenBezel" x1="0.2" y1="0" x2="0.8" y2="1">
                  <stop offset="0%" stopColor="#0c120d" />
                  <stop offset="100%" stopColor="#1a261c" />
                </linearGradient>
              </defs>

              {/* 3D Top Perspective Roof of TV */}
              <polygon
                points="24,28 68,6 646,6 656,28"
                fill="url(#svgTvTop)"
                stroke="#3b543f"
                strokeWidth="1.5"
              />

              {/* 3D Right Side Depth Panel of TV */}
              <polygon
                points="656,28 646,6 646,432 656,456"
                fill="#0b0f0c"
                stroke="#28382b"
                strokeWidth="1.5"
              />

              {/* Main CRT Front Cabinet WITH Cutout Hole for the Live Screen */}
              <path
                fillRule="evenodd"
                d="M 24,28 H 656 V 456 H 24 Z M 64,55 H 502 V 412 H 64 Z"
                fill="url(#svgTvBody)"
                stroke="#436148"
                strokeWidth="2"
              />

              {/* Inner Chamfered Screen Bezel Frame (Glowing with Green Phosphor Reflection) */}
              <rect
                x="56"
                y="47"
                width="454"
                height="373"
                rx="22"
                fill="none"
                stroke="#a6e26e"
                strokeOpacity="0.45"
                strokeWidth="2.5"
              />
              <rect
                x="63"
                y="54"
                width="440"
                height="359"
                rx="18"
                fill="none"
                stroke="#050806"
                strokeWidth="5"
              />

              {/* Right-Side Control Panel on SVG TV */}
              <rect
                x="524"
                y="54"
                width="110"
                height="358"
                rx="10"
                fill="#0e130f"
                stroke="#2c3e2e"
                strokeWidth="1.5"
              />

              {/* Power LED on TV */}
              <circle cx="546" cy="80" r="5" fill="#a6e26e" />
              <rect x="562" y="76" width="54" height="8" rx="2" fill="#293b2b" />

              {/* SVG Rotary Dials on TV */}
              <circle cx="579" cy="145" r="28" fill="#18211a" stroke="#425e46" strokeWidth="2" />
              <circle cx="579" cy="145" r="20" fill="#243026" />
              <line x1="579" y1="127" x2="579" y2="145" stroke="#a6e26e" strokeWidth="3" strokeLinecap="round" />

              <circle cx="579" cy="225" r="28" fill="#18211a" stroke="#425e46" strokeWidth="2" />
              <circle cx="579" cy="225" r="20" fill="#243026" />
              <line x1="579" y1="225" x2="594" y2="215" stroke="#e6cf65" strokeWidth="3" strokeLinecap="round" />

              {/* SVG Speaker Grille Slots on TV */}
              {[285, 300, 315, 330, 345, 360, 375].map((sy) => (
                <rect key={sy} x="542" y={sy} width="74" height="5" rx="2.5" fill="#070a08" />
              ))}

              {/* TV Bottom Support Feet Resting on the Console Riser */}
              <rect x="65" y="456" width="75" height="14" rx="3" fill="#0d120e" stroke="#2c3e2e" strokeWidth="1" />
              <rect x="535" y="456" width="75" height="14" rx="3" fill="#0d120e" stroke="#2c3e2e" strokeWidth="1" />
            </svg>
          </div>

          {/* 3B. Pure SVG Console & Open-Bay Stand Underneath the TV */}
          <div className="absolute inset-x-0 bottom-0 h-[42%] z-10 pointer-events-none">
            {/* Sliding Cartridge Animation into the SVG Console Slot */}
            {activeCartridge &&
              (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting') && (
                <div
                  className={`absolute z-15 left-[33%] top-[-8%] w-[28%] h-[58%] ${
                    cameraMode === 'ejecting' ? 'animate-ejectCartridge' : 'animate-insertCartridge'
                  }`}
                >
                  <svg viewBox="0 0 220 180" className="w-full h-full">
                    <rect
                      x="15"
                      y="10"
                      width="190"
                      height="155"
                      rx="10"
                      fill="#233025"
                      stroke="#a6e26e"
                      strokeWidth="2.5"
                    />
                    <image
                      href={activeCartridge.labelSvg}
                      x="35"
                      y="25"
                      width="150"
                      height="95"
                      preserveAspectRatio="xMidYMid slice"
                    />
                    <text
                      x="110"
                      y="145"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="16"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {activeCartridge.name}
                    </text>
                  </svg>
                </div>
              )}

            {/* Pure SVG Console & Riser Bridge */}
            <svg viewBox="0 0 720 340" className="relative z-20 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="svgConsoleTop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#263829" />
                  <stop offset="100%" stopColor="#141e16" />
                </linearGradient>
                <linearGradient id="svgConsoleFront" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#162018" />
                  <stop offset="50%" stopColor="#1d2b20" />
                  <stop offset="100%" stopColor="#0f1510" />
                </linearGradient>
              </defs>

              {/* Riser Stand Pillars (Holding the TV above the Console's Top-Loading Slot) */}
              <polygon points="36,18 68,18 68,315 36,315" fill="#121a14" stroke="#354d39" strokeWidth="1.5" />
              <polygon points="652,18 684,18 684,315 652,315" fill="#101712" stroke="#2c402f" strokeWidth="1.5" />
              {/* Riser Top Shelf Bar under TV Feet */}
              <rect x="26" y="6" width="668" height="16" rx="3" fill="#1d291f" stroke="#537a59" strokeWidth="1.5" />
              <line x1="40" y1="7" x2="680" y2="7" stroke="#a6e26e" strokeOpacity="0.65" strokeWidth="2" />

              {/* Top-Loading Console 3D Upper Deck (Lit by the TV Screen Above It) */}
              <polygon
                points="105,195 145,145 575,145 615,195"
                fill="url(#svgConsoleTop)"
                stroke="#4a6b4f"
                strokeWidth="2"
              />

              {/* Cartridge Slot Opening in the Center of the Console */}
              <rect
                x="235"
                y="158"
                width="250"
                height="24"
                rx="4"
                fill="#050806"
                stroke="#a6e26e"
                strokeOpacity="0.5"
                strokeWidth="1.5"
              />

              {/* Console Front Body */}
              <rect
                x="105"
                y="195"
                width="510"
                height="112"
                rx="8"
                fill="url(#svgConsoleFront)"
                stroke="#3b543f"
                strokeWidth="2"
              />

              {/* Green Rim Highlight on Console Front Lip */}
              <line x1="108" y1="196" x2="612" y2="196" stroke="#a6e26e" strokeOpacity="0.6" strokeWidth="2" />

              {/* Console Power & Reset Buttons + Controller Ports */}
              <rect x="138" y="225" width="46" height="22" rx="4" fill="#263629" stroke="#5c8244" strokeWidth="1.5" />
              <rect x="196" y="225" width="46" height="22" rx="4" fill="#1c261e" stroke="#3b523e" strokeWidth="1.5" />
              <circle cx="138" cy="275" r="5" fill="#a6e26e" />
              <text x="152" y="279" fill="#6ca144" fontSize="11" fontFamily="monospace">
                CONSOLE
              </text>

              {/* Controller Port Sockets */}
              <rect x="465" y="226" width="52" height="26" rx="4" fill="#090d0a" stroke="#2f4232" strokeWidth="1.5" />
              <rect x="530" y="226" width="52" height="26" rx="4" fill="#090d0a" stroke="#2f4232" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* ================================================================== */}
        {/* LAYER 4: FOREGROUND SVG SHELF WITH SIDE-VIEW CARTRIDGES            */}
        {/* Positioned to the side of the TV/Console and in front of it (z-30) */}
        {/* ================================================================== */}
        <div
          className="absolute z-30 flex flex-col justify-between"
          style={{
            left: '51%',
            bottom: '8%',
            width: '41%',
            height: '71%',
          }}
        >
          {/* Pure SVG 3D Shelf Frame */}
          <svg
            viewBox="0 0 760 760"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          >
            <defs>
              <linearGradient id="svgShelfLeftWall" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3c5940" />
                <stop offset="100%" stopColor="#141f16" />
              </linearGradient>
              <linearGradient id="svgShelfBack" x1="0" y1="0.3" x2="1" y2="0.7">
                <stop offset="0%" stopColor="#0f1710" />
                <stop offset="60%" stopColor="#070a08" />
                <stop offset="100%" stopColor="#030504" />
              </linearGradient>
              <linearGradient id="svgShelfPlank" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38543b" />
                <stop offset="40%" stopColor="#1e2d20" />
                <stop offset="100%" stopColor="#0e140f" />
              </linearGradient>
            </defs>

            {/* 3D Left Side Wall of Shelf (Rim-Lit by the TV's Tingling Green Light) */}
            <polygon
              points="8,24 38,4 38,736 8,756"
              fill="url(#svgShelfLeftWall)"
              stroke="#a6e26e"
              strokeOpacity="0.65"
              strokeWidth="2"
            />

            {/* Recessed Back Wall of Shelf */}
            <rect
              x="38"
              y="4"
              width="690"
              height="732"
              fill="url(#svgShelfBack)"
              stroke="#243626"
              strokeWidth="2"
            />

            {/* Right Side Wall of Shelf */}
            <polygon
              points="728,4 750,24 750,756 728,736"
              fill="#080c09"
              stroke="#1b291d"
              strokeWidth="1.5"
            />

            {/* Top Cap Plank */}
            <rect x="8" y="20" width="742" height="16" fill="url(#svgShelfPlank)" />
            <line x1="8" y1="21" x2="750" y2="21" stroke="#a6e26e" strokeOpacity="0.6" strokeWidth="2" />

            {/* 5 Shelf Slot Divider Planks (One under each Side-View Cartridge) */}
            {[164, 308, 452, 596, 740].map((py) => (
              <g key={py}>
                <polygon
                  points={`12,${py} 38,${py - 14} 728,${py - 14} 748,${py}`}
                  fill="#162118"
                />
                <rect x="12" y={py} width="736" height="14" fill="url(#svgShelfPlank)" />
                <line
                  x1="12"
                  y1={py + 1}
                  x2="748"
                  y2={py + 1}
                  stroke="#a6e26e"
                  strokeOpacity="0.45"
                  strokeWidth="1.5"
                />
              </g>
            ))}

            {/* Left Front Vertical Post Catching the TV's Green Light */}
            <rect x="8" y="20" width="14" height="736" fill="url(#svgShelfLeftWall)" />
            <line x1="9" y1="20" x2="9" y2="756" stroke="#b8f284" strokeOpacity="0.85" strokeWidth="2.5" />
          </svg>

          {/* The 5 Side-View Cartridges Stacked in the Shelf Bays */}
          <div className="relative z-20 flex-1 flex flex-col justify-around py-[5%] pl-[6%] pr-[7%]">
            {projects.map((project) => {
              const isCurrentlyInSlot =
                activeCartridgeId === project.id &&
                (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

              if (isCurrentlyInSlot) {
                return <div key={project.id} className="w-full h-15 xl:h-17" />;
              }

              return (
                <CartridgeSideSpine
                  key={project.id}
                  project={project}
                  isHovered={hoveredProjectId === project.id}
                  onMouseEnter={() => setHoveredProjectId(project.id)}
                  onMouseLeave={() =>
                    setHoveredProjectId((prev) => (prev === project.id ? null : prev))
                  }
                  onClick={() => onSelectProject(project.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
