import { useState, useEffect, useRef, useMemo } from 'react';
import type { Project } from '../data/projects';
import {
  ConsoleScreenContent,
  getChannelOptions,
  type ScreenTab,
  type ChannelOption,
} from './ConsoleScreenContent';
import { fetchDeveloperStats, type DeveloperStats } from '../services/githubStats';

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
 * Fullscreen CRT Analog Static Overlay (used when zooming in to fill the screen
 * with static and then clearing to show the TV, and during zoom-out).
 */
const CRTStaticOverlay: React.FC<{ mode: 'fill' | 'clear' }> = ({ mode }) => {
  return (
    <div
      className={`fixed inset-0 z-[80] pointer-events-none overflow-hidden ${
        mode === 'fill' ? 'animate-crtStaticFill' : 'animate-crtStaticClear'
      }`}
    >
      {/* Rapidly Jittering Analog CRT Snow + Green Phosphor Grain */}
      <div
        className="absolute -inset-10 animate-crtStaticNoise"
        style={{
          backgroundColor: '#050a06',
          backgroundImage: `
            repeating-radial-gradient(circle at 25% 35%, rgba(196, 210, 196, 0.92) 0px, rgba(10, 18, 12, 0.96) 1.5px, rgba(166, 226, 110, 0.8) 3px, rgba(4, 8, 5, 0.98) 4.5px),
            repeating-radial-gradient(circle at 75% 65%, rgba(220, 230, 220, 0.85) 0px, rgba(0, 0, 0, 0.92) 2px, rgba(126, 194, 82, 0.65) 3.5px, rgba(8, 14, 10, 0.96) 5px),
            repeating-linear-gradient(0deg, rgba(166, 226, 110, 0.32) 0px, rgba(0, 0, 0, 0.88) 2px, rgba(210, 225, 210, 0.24) 4px)
          `,
          backgroundSize: '26px 26px, 34px 34px, 100% 6px',
        }}
      />
      {/* Rolling Horizontal Sync Interference Band */}
      <div
        className="absolute inset-x-0 top-1/3 h-24 opacity-60"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(166,226,110,0.45) 45%, rgba(220,235,220,0.7) 50%, rgba(166,226,110,0.45) 55%, transparent 100%)',
        }}
      />
    </div>
  );
};

/**
 * Pure SVG Rotary Dial used in Fullscreen TV View — matches the exact SVG look
 * of the rotary dials on the zoomed-out Blue TV.
 */
const MatchingSvgRotaryKnob: React.FC<{
  angle: number;
  onTurnClockwise: () => void;
  onTurnCounterClockwise: () => void;
  label: string;
  sublabel: string;
  accentColor: string;
}> = ({
  angle,
  onTurnClockwise,
  onTurnCounterClockwise,
  label,
  sublabel,
  accentColor,
}) => {
  return (
    <div className="flex flex-col items-center select-none w-full">
      <div className="w-full flex items-center justify-between px-1 mb-1">
        <span
          className="text-[8px] tracking-wider text-[#b4beb4] uppercase"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          {label}
        </span>
        <span className="text-[10px] font-mono text-[#a6e26e] bg-[#0b1522] px-1.5 py-0.2 rounded border border-[#2d4a6b]">
          {sublabel}
        </span>
      </div>

      <div className="relative flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTurnCounterClockwise();
          }}
          className="w-6 h-6 rounded bg-[#102033] hover:bg-[#19304d] active:translate-y-0.5 border border-[#32537a] text-[#b4beb4] text-xs flex items-center justify-center cursor-pointer shadow-[0_2px_0_#070e17] nf-glyph"
          title={`Turn ${label} Counter-Clockwise`}
        >
          {'\uf053'}
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
          title={`Click or scroll to turn ${label}`}
          className="relative w-20 h-20 xl:w-22 xl:h-22 rounded-full cursor-pointer group flex items-center justify-center"
        >
          {/* Exact Same SVG Dial Geometry as the Zoomed-Out TV */}
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {/* Outer Tick Marks */}
            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
              <line
                key={deg}
                x1="50"
                y1="4"
                x2="50"
                y2="10"
                stroke={deg % 72 === 0 ? accentColor : '#3e5c82'}
                strokeWidth={deg % 72 === 0 ? '2.5' : '1.5'}
                strokeLinecap="round"
                transform={`rotate(${deg} 50 50)`}
              />
            ))}

            {/* Outer Ring (#132236 with #3d6089 border, matching zoomed-out SVG TV) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="#111f30"
              stroke="#3b5e87"
              strokeWidth="3"
            />
            {/* Subtle Green Ray-Traced Rim Highlight on Left Arc */}
            <path
              d="M 22,24 A 38,38 0 0,0 22,76"
              fill="none"
              stroke="#a6e26e"
              strokeWidth="2"
              strokeOpacity="0.55"
            />

            {/* Inner Cap (#1b2f48) */}
            <circle
              cx="50"
              cy="50"
              r="27"
              fill="#1b2f48"
              stroke="#2a4669"
              strokeWidth="1.5"
            />

            {/* Rotating Pointer Line (Matches zoomed-out TV knob pointer) */}
            <g
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: '50px 50px',
                transition: 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <line
                x1="50"
                y1="50"
                x2="50"
                y2="25"
                stroke={accentColor}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="50" r="4.5" fill="#0d1826" stroke={accentColor} strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTurnClockwise();
          }}
          className="w-6 h-6 rounded bg-[#102033] hover:bg-[#19304d] active:translate-y-0.5 border border-[#32537a] text-[#b4beb4] text-xs flex items-center justify-center cursor-pointer shadow-[0_2px_0_#070e17] nf-glyph"
          title={`Turn ${label} Clockwise`}
        >
          {'\uf054'}
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
  const [optionIndex, setOptionIndex] = useState<number>(0);
  const [pingRefreshKey, setPingRefreshKey] = useState<number>(0);
  const [channelKnobAngle, setChannelKnobAngle] = useState<number>(0);
  const [tintKnobAngle, setTintKnobAngle] = useState<number>(35);
  const [tintIndex, setTintIndex] = useState<number>(0);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [hoveredConsole, setHoveredConsole] = useState<boolean>(false);
  const [stats, setStats] = useState<DeveloperStats | null>(null);

  // Transition states for smooth Zoom-In with Static and Zoom-Out with Static
  const [zoomPhase, setZoomPhase] = useState<
    'idle' | 'zooming-in-static' | 'clearing-closeup' | 'zooming-out-static' | 'zooming-out-dolly'
  >('idle');

  const zoomCooldownRef = useRef<number>(0);

  useEffect(() => {
    fetchDeveloperStats().then(setStats);
  }, []);

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;
  const hoveredProject = projects.find((p) => p.id === hoveredProjectId) || null;
  const currentTint = CRT_TINTS[tintIndex] || CRT_TINTS[0];

  const currentChannelOptions = useMemo(
    () => getChannelOptions(screenTab, stats),
    [screenTab, stats]
  );

  const turnChannel = (dir: 'next' | 'prev') => {
    const idx = TV_TABS.indexOf(screenTab);
    const safeIdx = idx === -1 ? 0 : idx;
    const nextIdx =
      dir === 'next' ? (safeIdx + 1) % TV_TABS.length : (safeIdx - 1 + TV_TABS.length) % TV_TABS.length;
    setScreenTab(TV_TABS[nextIdx]);
    setOptionIndex(0);
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

  const triggerOption = (opt: ChannelOption) => {
    if (opt.action === 'ping') {
      setPingRefreshKey((prev) => prev + 1);
      return;
    }
    if (opt.url) {
      window.open(opt.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePressEnterButton = () => {
    if (currentChannelOptions.length === 0) return;
    const safeIdx =
      ((optionIndex % currentChannelOptions.length) + currentChannelOptions.length) %
      currentChannelOptions.length;
    triggerOption(currentChannelOptions[safeIdx]);
  };

  // Smooth Zoom-Out when mouse moves to the outer screen edge in Fullscreen TV mode
  const handleEdgeZoomOut = () => {
    if (cameraMode !== 'closeup' || zoomPhase !== 'idle') return;
    if (Date.now() < zoomCooldownRef.current) return;
    zoomCooldownRef.current = Date.now() + 1050;

    setZoomPhase('zooming-out-static');
    window.setTimeout(() => {
      setCameraMode('table');
      setZoomPhase('zooming-out-dolly');
      // After mounting in 'zooming-out-dolly', trigger smooth camera pull-back to 'idle'
      window.setTimeout(() => {
        setZoomPhase('idle');
      }, 40);
    }, 240);
  };

  // Smooth Zoom-In with Static Filling the Screen and Clearing to Show the TV
  const handleTvZoomIn = () => {
    if (cameraMode !== 'table' || zoomPhase !== 'idle') return;
    if (Date.now() < zoomCooldownRef.current) return;
    zoomCooldownRef.current = Date.now() + 1150;

    setZoomPhase('zooming-in-static');
    window.setTimeout(() => {
      setCameraMode('closeup');
      setZoomPhase('clearing-closeup');
      window.setTimeout(() => {
        setZoomPhase('idle');
      }, 460);
    }, 410);
  };

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '1') {
        setScreenTab('status');
        setOptionIndex(0);
      }
      if (e.key === '2') {
        setScreenTab('github');
        setOptionIndex(0);
      }
      if (e.key === '3') {
        setScreenTab('pings');
        setOptionIndex(0);
      }
      if (e.key === '4') {
        setScreenTab('hire');
        setOptionIndex(0);
      }
      if (e.key === 'ArrowRight') turnChannel('next');
      if (e.key === 'ArrowLeft') turnChannel('prev');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOptionIndex((prev) => prev + 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setOptionIndex((prev) => Math.max(0, prev - 1));
      }
      if (e.key === 'Enter' && cameraMode === 'closeup') {
        e.preventDefault();
        handlePressEnterButton();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // ============================================================================
  // MODE 1: FULLSCREEN CRT VIEW (cameraMode === 'closeup')
  // - Retro Blue TV Casing matching the zoomed-out SVG TV
  // - Matching SVG Rotary Knobs (Channel & Color)
  // - Single ENTER button to open selected option on screen
  // - Moving mouse to screen edge smoothly zooms out with static transition
  // ============================================================================
  if (cameraMode === 'closeup') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black select-none flex items-stretch">
        {/* CRT Static Overlay when clearing into Fullscreen TV or starting Zoom-Out */}
        {zoomPhase === 'clearing-closeup' && <CRTStaticOverlay mode="clear" />}
        {zoomPhase === 'zooming-out-static' && <CRTStaticOverlay mode="fill" />}

        {/* Invisible Screen-Edge Sensors: Moving mouse to the edge automatically zooms out */}
        <div onMouseEnter={handleEdgeZoomOut} className="fixed top-0 bottom-0 left-0 w-4 z-50" />
        <div onMouseEnter={handleEdgeZoomOut} className="fixed top-0 bottom-0 right-0 w-4 z-50" />
        <div onMouseEnter={handleEdgeZoomOut} className="fixed bottom-0 left-0 right-0 h-4 z-50" />
        <div onMouseEnter={handleEdgeZoomOut} className="fixed top-0 left-0 right-0 h-3 z-50" />

        {/* Outer 3D Moulded Blue CRT Television Cabinet */}
        <div
          className="relative w-full h-full p-3 sm:p-5 md:p-6 flex items-stretch"
          style={{
            background:
              'linear-gradient(145deg, #1e3a5f 0%, #152945 52%, #0b1626 100%)',
            boxShadow:
              'inset 0 2px 6px rgba(140,185,240,0.22), inset 0 -10px 30px rgba(0,0,0,0.95)',
          }}
        >
          {/* Inner Recessed Blue CRT Bezel Well with Green Ray-Traced Tube Rim */}
          <div
            className="relative flex-1 h-full rounded-[26px] p-3 sm:p-4 md:p-5 flex gap-4 sm:gap-5 items-stretch overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, #0f1e33 0%, #162b46 50%, #1c3557 100%)',
              boxShadow:
                'inset 0 12px 35px rgba(0,0,0,0.92), inset 0 0 24px rgba(166,226,110,0.22), 0 2px 4px rgba(140,190,255,0.12)',
              border: '3px solid #2e5077',
            }}
          >
            {/* FULLSCREEN CRT TUBE DISPLAY */}
            <div
              className="relative flex-1 h-full rounded-[20px] overflow-hidden bg-[#070c08] crt-screen-container shadow-[0_0_55px_rgba(166,226,110,0.24),inset_0_0_60px_rgba(0,0,0,0.95)] border-4 border-[#3a6b4c] transition-all duration-300"
              style={{ filter: currentTint.filter }}
            >
              <ConsoleScreenContent
                projects={projects}
                activeTab={screenTab}
                optionIndex={optionIndex}
                onSelectOptionIndex={setOptionIndex}
                onTriggerOption={triggerOption}
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

            {/* RIGHT CONTROL PANEL (Matches the Zoomed-Out Blue SVG TV Panel) */}
            <div
              className="w-60 xl:w-66 shrink-0 h-full rounded-[18px] p-3.5 xl:p-4 flex flex-col justify-between relative z-30"
              style={{
                background:
                  'linear-gradient(160deg, #162840 0%, #101e30 58%, #0a1420 100%)',
                boxShadow:
                  '-8px 0 26px rgba(0,0,0,0.8), inset 2px 0 8px rgba(166,226,110,0.18), inset 0 2px 3px rgba(140,190,255,0.16)',
                border: '2px solid #2b4a6f',
              }}
            >
              {/* Top Power LED & Channel Readout */}
              <div
                className="rounded-xl p-2.5 border border-[#2b4a6f] bg-[#0c1726]"
                style={{
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.75)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{
                        backgroundColor: currentTint.color,
                        boxShadow: `0 0 10px ${currentTint.color}`,
                      }}
                    />
                    <span
                      className="text-[7px] text-[#b4beb4] tracking-wider"
                      style={{ fontFamily: 'var(--font-pixel)' }}
                    >
                      POWER
                    </span>
                  </div>
                  <span
                    className="text-[8px] text-[#e6cf65]"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    {TAB_LABELS[screenTab]}
                  </span>
                </div>
              </div>

              {/* MATCHING SVG DUAL ROTARY KNOBS (Same design as zoomed-out SVG TV) */}
              <div
                className="rounded-2xl p-3 flex flex-col items-center justify-around gap-3 border border-[#274466] bg-[#0b1524]"
                style={{
                  boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.9)',
                }}
              >
                {/* Knob 1: Channel Selector */}
                <MatchingSvgRotaryKnob
                  angle={channelKnobAngle}
                  onTurnClockwise={() => turnChannel('next')}
                  onTurnCounterClockwise={() => turnChannel('prev')}
                  label="CHANNEL"
                  sublabel={`CH-0${TV_TABS.indexOf(screenTab) + 1}`}
                  accentColor="#a6e26e"
                />

                <div className="w-full h-[1px] bg-[#213a57]" />

                {/* Knob 2: Phosphor Color Tint */}
                <MatchingSvgRotaryKnob
                  angle={tintKnobAngle}
                  onTurnClockwise={() => turnTint('next')}
                  onTurnCounterClockwise={() => turnTint('prev')}
                  label="COLOR"
                  sublabel={currentTint.name}
                  accentColor="#e6cf65"
                />
              </div>

              {/* SINGLE ENTER BUTTON TO OPEN SELECTED OPTION (With Option Up/Down Selectors) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[7px] text-[#b4beb4] uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    SELECT OPTION
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setOptionIndex((prev) => Math.max(0, prev - 1))}
                      className="w-6 h-5 rounded bg-[#102033] hover:bg-[#19304d] border border-[#32537a] text-[#a6e26e] text-xs flex items-center justify-center cursor-pointer nf-glyph"
                      title="Previous Option"
                    >
                      {'\uf077'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptionIndex((prev) => prev + 1)}
                      className="w-6 h-5 rounded bg-[#102033] hover:bg-[#19304d] border border-[#32537a] text-[#a6e26e] text-xs flex items-center justify-center cursor-pointer nf-glyph"
                      title="Next Option"
                    >
                      {'\uf078'}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePressEnterButton}
                  className="w-full py-3 px-3 rounded-xl cursor-pointer active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                  style={{
                    background: 'linear-gradient(180deg, #2b6e48 0%, #1e5235 65%, #143824 100%)',
                    boxShadow:
                      '0 5px 0 #0c2416, 0 8px 14px rgba(0,0,0,0.8), inset 0 1px 2px rgba(166,226,110,0.55)',
                    border: '2px solid #a6e26e',
                  }}
                  title="Open Selected Option on Screen"
                >
                  <span
                    className="text-[9px] xl:text-[10px] text-[#e2f9c8] font-bold tracking-wider uppercase group-hover:text-white transition-colors"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    {'\uf061'} ENTER
                  </span>
                </button>
              </div>

              {/* Matching SVG Speaker Grille Slots at Bottom of Panel */}
              <div className="flex flex-col gap-1.5 px-2 py-1 opacity-80">
                {[0, 1, 2, 3, 4].map((slot) => (
                  <div
                    key={slot}
                    className="w-full h-1.5 rounded-full bg-[#060c14] border-b border-[#233d5c]"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // MODE 2: PITCH-BLACK ROOM WITH RAY-TRACED GREEN CRT LIGHTING
  // - Blue TV angled diagonally toward the Brown Shelf so its light shines across
  // - White Console ("Definetly Legally Distinct Console") underneath the TV,
  //   with greenish ray-traced bounce light on its upper deck & slot rim
  // - Cartridge slides cleanly into the Console's top-loading slot mouth
  // - 5 Side-View Cartridges sitting flush inside the Brown Shelf cubbies with
  //   matching 3D perspective and greenish ray-traced rim lighting on left edges
  // ============================================================================
  const isZoomingIn =
    cameraMode === 'zooming-in' || zoomPhase === 'zooming-in-static';
  const isZoomOutStart = zoomPhase === 'zooming-out-dolly';

  // Subtitle text in dull pixelated white when hovering a cartridge or the console
  const hoverSubtitle = hoveredProject
    ? `${hoveredProject.name}: "${hoveredProject.originNote || hoveredProject.tagline}"`
    : hoveredConsole
    ? 'Definetly Legally Distinct Console: "this doesnt really do much"'
    : '';

  // Shelf cubby floor Y-coordinates in the unified 1920x1080 SVG scene
  const cubbyFloorYs = [332, 452, 572, 692, 812];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* CRT Static Overlay Filling the Screen During Zoom-In or Clearing During Zoom-Out */}
      {isZoomingIn && <CRTStaticOverlay mode="fill" />}
      {zoomPhase === 'zooming-out-dolly' && <CRTStaticOverlay mode="clear" />}

      {/* Camera Zoom Stage centered on the angled CRT screen (22.5% 37.5%) */}
      <div
        className={`relative w-screen h-screen will-change-transform ${
          isZoomOutStart
            ? 'transition-none'
            : 'transition-transform duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)]'
        }`}
        style={{
          transformOrigin: '22.5% 37.5%',
          transform: isZoomingIn
            ? 'scale(3.75)'
            : isZoomOutStart
            ? 'scale(2.85)'
            : 'scale(1)',
        }}
      >
        {/* ================================================================== */}
        {/* TOP HEADLINE & HOVER NOTE IN DULL PIXELATED WHITE FONT             */}
        {/* ================================================================== */}
        <div className="absolute top-[4%] inset-x-0 z-40 flex flex-col items-center px-6 text-center pointer-events-none">
          <h1 className="pixel-dull-white text-xs sm:text-sm md:text-base lg:text-xl tracking-wider leading-relaxed">
            Projects that I made based on my needs not for showcases
          </h1>

          <div className="h-14 sm:h-16 mt-2.5 flex items-center justify-center max-w-4xl">
            <p
              className={`pixel-dull-white text-[10px] sm:text-xs md:text-sm leading-relaxed transition-all duration-200 ${
                hoverSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
              }`}
            >
              {hoverSubtitle}
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* LIVE DIAGONALLY ANGLED CRT SCREEN CONTENT INSIDE THE BLUE SVG TV   */}
        {/* ================================================================== */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            perspective: '1200px',
          }}
        >
          <div
            className="absolute bg-[#070c08] crt-screen-container overflow-hidden shadow-[0_0_70px_16px_rgba(166,226,110,0.35)]"
            style={{
              left: '12.6%',
              top: '23.2%',
              width: '17.6%',
              height: '26.2%',
              borderRadius: '14px',
              transform: 'rotateY(18deg) rotateZ(1.4deg) skewY(2.2deg)',
              transformOrigin: 'left center',
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
        </div>

        {/* ================================================================== */}
        {/* UNIFIED 1920x1080 SVG SCENE:                                       */}
        {/* 1. Pitch-Black Room + Floor + Ray-Traced Volumetric Green Light    */}
        {/* 2. Diagonally Angled Blue TV Stacked on White Console              */}
        {/* 3. Cartridge Sliding Cleanly into the White Console's Top Slot     */}
        {/* 4. Brown Wooden Shelf with 5 Properly Seated 3D Cartridges         */}
        {/* ================================================================== */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid meet"
          className="relative z-20 w-full h-full"
        >
          <defs>
            {/* ---------------- RAY-TRACED LIGHTING GRADIENTS ---------------- */}
            {/* Volumetric Primary Frustum Beam from Angled CRT to Brown Shelf */}
            <linearGradient id="rtPrimaryBeam" x1="0" y1="0.38" x2="1" y2="0.55">
              <stop offset="0%" stopColor="#b8f284" stopOpacity="0.30" />
              <stop offset="22%" stopColor="#a6e26e" stopOpacity="0.18" />
              <stop offset="58%" stopColor="#72b846" stopOpacity="0.09" />
              <stop offset="88%" stopColor="#4c852c" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Individual Scanline God-Ray Shafts */}
            <linearGradient id="rtGodRayShaft" x1="0" y1="0.4" x2="1" y2="0.55">
              <stop offset="0%" stopColor="#d4f7b5" stopOpacity="0.22" />
              <stop offset="45%" stopColor="#a6e26e" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Downward CRT Light Cone Hitting the White Console Below */}
            <linearGradient id="rtDownwardCone" x1="0.45" y1="0" x2="0.55" y2="1">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#7ec252" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Ambient Halo Around the CRT Screen */}
            <radialGradient id="rtScreenHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.32" />
              <stop offset="48%" stopColor="#6eb844" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            {/* Floor Bounce Light Pool Across the Black Room Floor */}
            <radialGradient id="rtFloorBounce" cx="0.38" cy="0.5" r="0.55">
              <stop offset="0%" stopColor="#8ed158" stopOpacity="0.18" />
              <stop offset="50%" stopColor="#4f8230" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <filter id="rtSoftBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <filter id="rtFineBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="6" />
            </filter>

            {/* ---------------- BLUE TV CASING GRADIENTS ---------------- */}
            {/* Front Cabinet of Blue TV (Right side slightly darker, screen rim greenish) */}
            <linearGradient id="tvBlueFront" x1="0" y1="0" x2="1" y2="0.3">
              <stop offset="0%" stopColor="#23456e" />
              <stop offset="55%" stopColor="#1a3454" />
              <stop offset="100%" stopColor="#102238" />
            </linearGradient>
            {/* Left 3D Side Wall of Blue TV */}
            <linearGradient id="tvBlueLeftSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d1b2e" />
              <stop offset="100%" stopColor="#1b3657" />
            </linearGradient>
            {/* Top 3D Roof of Blue TV */}
            <linearGradient id="tvBlueTop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#294f7d" />
              <stop offset="100%" stopColor="#162d4a" />
            </linearGradient>
            {/* Inner Bezel of Blue TV Catching Green Ray-Traced Glow from Tube */}
            <linearGradient id="tvBezelGreenRay" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6cbf64" />
              <stop offset="50%" stopColor="#356e4c" />
              <stop offset="100%" stopColor="#1d4245" />
            </linearGradient>

            {/* ---------------- WHITE CONSOLE GRADIENTS (WITH GREEN RAY BOUNCE) ---------------- */}
            {/* Top Deck of White Console: Greenish directly under CRT screen, white/grey toward edges */}
            <radialGradient id="consoleWhiteTopRay" cx="0.42" cy="0.35" r="0.65">
              <stop offset="0%" stopColor="#a9db9c" />
              <stop offset="38%" stopColor="#b8d4b4" />
              <stop offset="72%" stopColor="#c9d0d6" />
              <stop offset="100%" stopColor="#a4adb5" />
            </radialGradient>
            {/* Front Face of White Console (Off-white in dark room, top lip slightly greenish) */}
            <linearGradient id="consoleWhiteFront" x1="0" y1="0" x2="0.15" y2="1">
              <stop offset="0%" stopColor="#c4d9c0" />
              <stop offset="18%" stopColor="#d2d7dc" />
              <stop offset="75%" stopColor="#b8bfc7" />
              <stop offset="100%" stopColor="#8c949e" />
            </linearGradient>
            {/* Left 3D Side Wall of White Console (In shadow away from TV screen) */}
            <linearGradient id="consoleWhiteLeftSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6e7680" />
              <stop offset="100%" stopColor="#9aa2ab" />
            </linearGradient>

            {/* Clip Path at the Exact Front Lip of the Console's Top-Loading Cartridge Slot */}
            <clipPath id="consoleSlotMouthClip">
              <polygon points="310,480 570,480 570,715 310,707" />
            </clipPath>

            {/* ---------------- BROWN WOODEN SHELF GRADIENTS (WITH GREEN RAY RIM) ---------------- */}
            {/* Left Outer Wall of Brown Shelf: Directly hit by green CRT rays on its front/top-left */}
            <linearGradient id="shelfBrownLeftWallRay" x1="0" y1="0.2" x2="1" y2="0.8">
              <stop offset="0%" stopColor="#6ca352" />
              <stop offset="28%" stopColor="#4f6e3b" />
              <stop offset="65%" stopColor="#4a301d" />
              <stop offset="100%" stopColor="#2e1c10" />
            </linearGradient>
            {/* Interior Recessed Back Wall of Brown Shelf */}
            <linearGradient id="shelfBrownBackWall" x1="0" y1="0.3" x2="1" y2="0.7">
              <stop offset="0%" stopColor="#293620" />
              <stop offset="25%" stopColor="#2b1b10" />
              <stop offset="70%" stopColor="#1c110a" />
              <stop offset="100%" stopColor="#120b06" />
            </linearGradient>
            {/* Top Surface of Each Wooden Shelf Plank (Greenish on left near TV, brown wood to the right) */}
            <linearGradient id="shelfBrownPlankTop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5e8747" />
              <stop offset="22%" stopColor="#524628" />
              <stop offset="55%" stopColor="#4a2e1b" />
              <stop offset="100%" stopColor="#2b190e" />
            </linearGradient>
            {/* Front Edge of Each Wooden Shelf Plank */}
            <linearGradient id="shelfBrownPlankFront" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7ec258" />
              <stop offset="18%" stopColor="#5d6e38" />
              <stop offset="50%" stopColor="#593822" />
              <stop offset="100%" stopColor="#362012" />
            </linearGradient>
          </defs>

          {/* ================================================================ */}
          {/* 1. PITCH-BLACK ROOM BACKDROP, FLOOR BOUNCE & CAST SHADOWS        */}
          {/* ================================================================ */}
          <rect x="0" y="0" width="1920" height="1080" fill="#020302" />

          {/* Subtle Room Horizon Line */}
          <line x1="0" y1="845" x2="1920" y2="845" stroke="#162919" strokeWidth="1.5" opacity="0.6" />

          {/* Floor Green Bounce Pool from CRT Rays */}
          <ellipse
            cx="780"
            cy="920"
            rx="720"
            ry="135"
            fill="url(#rtFloorBounce)"
            filter="url(#rtSoftBlur)"
          />

          {/* Ray-Traced Cast Shadow Behind/Right of the Shelf on the Floor */}
          <polygon
            points="995,895 1715,895 1890,965 1060,955"
            fill="#000000"
            opacity="0.88"
          />
          {/* Ray-Traced Cast Shadow Under the Console */}
          <polygon
            points="160,868 685,882 720,912 135,895"
            fill="#000000"
            opacity="0.92"
          />

          {/* ================================================================ */}
          {/* 2. DIAGONALLY ANGLED WHITE CONSOLE & RISER STAND                 */}
          {/*    ("Definetly Legally Distinct Console")                        */}
          {/* ================================================================ */}
          <g
            onMouseEnter={() => setHoveredConsole(true)}
            onMouseLeave={() => setHoveredConsole(false)}
            className="cursor-pointer"
          >
            {/* Riser Left Support Pillar (Behind Console Left Edge) */}
            <polygon
              points="158,548 196,552 196,860 158,842"
              fill="#182638"
              stroke="#2e4a6b"
              strokeWidth="1.5"
            />
            {/* Riser Right Support Pillar */}
            <polygon
              points="642,566 676,568 676,876 642,874"
              fill="#121e2e"
              stroke="#27405e"
              strokeWidth="1.5"
            />
            {/* Riser Bridge Shelf Holding the Angled Blue TV Above the Console */}
            <polygon
              points="152,536 205,512 690,528 652,556"
              fill="#1b304a"
              stroke="#487556"
              strokeWidth="1.5"
            />
            <polygon
              points="152,536 652,556 652,570 152,550"
              fill="#132338"
              stroke="#3b5e4c"
              strokeWidth="1.5"
            />

            {/* WHITE CONSOLE: 3D Left Side Wall (Receding diagonally back-left) */}
            <polygon
              points="178,704 222,664 222,824 178,864"
              fill="url(#consoleWhiteLeftSide)"
              stroke="#5c646e"
              strokeWidth="1.5"
            />

            {/* WHITE CONSOLE: 3D Sloped Upper Deck (Hit by green ray-traced light from CRT above) */}
            <polygon
              points="222,664 624,678 666,720 178,704"
              fill="url(#consoleWhiteTopRay)"
              stroke="#85b87e"
              strokeWidth="2"
            />

            {/* Specular Green Ray-Traced Reflection Pool on the White Console Top Deck */}
            <ellipse
              cx="425"
              cy="690"
              rx="155"
              ry="16"
              fill="#a6e26e"
              opacity="0.32"
              filter="url(#rtFineBlur)"
            />

            {/* Top-Loading Cartridge Slot Recessed Well (Back Lip drawn BEHIND the cartridge) */}
            <polygon
              points="332,684 536,691 548,713 322,705"
              fill="#0a120c"
              stroke="#6cbf5e"
              strokeWidth="2"
            />
            <line x1="334" y1="686" x2="534" y2="693" stroke="#a6e26e" strokeWidth="1.5" strokeOpacity="0.8" />

            {/* ============================================================== */}
            {/* SLIDING CARTRIDGE ENTERING THE CONSOLE SLOT MOUTH              */}
            {/* Clipped at the front lip of the slot (y=707..715) so the       */}
            {/* bottom half of the cartridge goes INSIDE the console slot!     */}
            {/* ============================================================== */}
            {activeCartridge &&
              (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting') && (
                <g clipPath="url(#consoleSlotMouthClip)">
                  <g
                    className={
                      cameraMode === 'ejecting' ? 'animate-ejectCartridge' : 'animate-insertCartridge'
                    }
                  >
                    {/* 3D Cartridge Shell Angled to Match the Console Slot */}
                    <polygon
                      points="344,598 358,590 526,596 514,604"
                      fill="#35523a"
                      stroke="#a6e26e"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="344,598 514,604 514,740 344,734"
                      fill="#1d2b20"
                      stroke="#a6e26e"
                      strokeWidth="2"
                    />
                    {/* Cartridge Label Artwork */}
                    <rect
                      x="362"
                      y="610"
                      width="134"
                      height="68"
                      rx="4"
                      fill="#0d140e"
                      stroke={activeCartridge.accentColor}
                      strokeWidth="1.5"
                    />
                    <image
                      href={activeCartridge.labelSvg}
                      x="364"
                      y="612"
                      width="130"
                      height="64"
                      preserveAspectRatio="xMidYMid slice"
                    />
                    {/* Dull Pixelated White Name on Inserting Cartridge */}
                    <text
                      x="429"
                      y="696"
                      textAnchor="middle"
                      fill="#b4beb4"
                      fontSize="11"
                      fontFamily="'Press Start 2P', monospace"
                    >
                      {activeCartridge.name}
                    </text>
                  </g>
                </g>
              )}

            {/* Front Lip of the Console Slot (Drawn ON TOP of the cartridge so it sits inside!) */}
            <polygon
              points="320,705 550,713 554,719 318,711"
              fill="#b8d4b4"
              stroke="#76bd68"
              strokeWidth="1"
            />

            {/* WHITE CONSOLE: Front Body Panel (Angled diagonally to match TV) */}
            <polygon
              points="178,704 666,720 666,878 178,864"
              fill="url(#consoleWhiteFront)"
              stroke="#8c9ba6"
              strokeWidth="2"
            />

            {/* Ray-Traced Green Rim Highlight Along the Console's Upper Front Lip */}
            <line
              x1="180"
              y1="705"
              x2="664"
              y2="721"
              stroke="#a6e26e"
              strokeOpacity="0.85"
              strokeWidth="2.5"
            />

            {/* Console Recessed Control Strip & Controller Ports */}
            <polygon
              points="204,732 640,746 640,806 204,792"
              fill="#9ba4ad"
              stroke="#747d87"
              strokeWidth="1.5"
            />

            {/* Power & Reset Tactile Buttons on White Console */}
            <polygon
              points="222,746 276,748 276,774 222,772"
              fill="#2e4a36"
              stroke="#8ae070"
              strokeWidth="1.5"
            />
            <polygon
              points="290,748 342,750 342,776 290,774"
              fill="#5a636e"
              stroke="#3b424a"
              strokeWidth="1.5"
            />

            {/* Controller Port Sockets */}
            <polygon
              points="508,754 562,756 562,786 508,784"
              fill="#1e242b"
              stroke="#49535e"
              strokeWidth="1.5"
            />
            <polygon
              points="574,756 628,758 628,788 574,786"
              fill="#1e242b"
              stroke="#49535e"
              strokeWidth="1.5"
            />

            {/* Console Front Nameplate: "Definetly Legally Distinct Console" */}
            <polygon
              points="204,814 640,828 640,854 204,840"
              fill="#182026"
              stroke="#5b7a5e"
              strokeWidth="1.5"
            />
            <circle cx="222" cy="827" r="5" fill="#a6e26e" />
            <text
              x="426"
              y="839"
              textAnchor="middle"
              fill="#b4beb4"
              fontSize="11.5"
              fontFamily="'Press Start 2P', monospace"
              letterSpacing="0.5"
            >
              Definetly Legally Distinct Console
            </text>
          </g>

          {/* ================================================================ */}
          {/* 3. DIAGONALLY ANGLED BLUE CRT TV ON TOP OF THE CONSOLE           */}
          {/*    Angled toward the right so its screen shines on the shelf     */}
          {/* ================================================================ */}
          <g
            onMouseEnter={handleTvZoomIn}
            onClick={handleTvZoomIn}
            className="cursor-zoom-in"
          >
            {/* 3D Left Side Depth Wall of Blue TV (Visible because TV is angled right) */}
            <polygon
              points="154,238 202,202 202,534 154,512"
              fill="url(#tvBlueLeftSide)"
              stroke="#2c4f7c"
              strokeWidth="2"
            />
            {/* Ventilation Slots on Left Side of Blue TV */}
            {[285, 305, 325, 345, 365, 385].map((vy) => (
              <line
                key={vy}
                x1="164"
                y1={vy}
                x2="192"
                y2={vy - 18}
                stroke="#091321"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}

            {/* 3D Top Roof of Blue TV (Angled diagonally toward the right) */}
            <polygon
              points="154,238 202,202 668,224 644,254"
              fill="url(#tvBlueTop)"
              stroke="#3b699e"
              strokeWidth="2"
            />

            {/* Main Diagonally Angled Blue Front Cabinet WITH Cutout Window for the Live CRT Tube */}
            <path
              fillRule="evenodd"
              d="M 202,202 L 644,224 L 644,548 L 202,534 Z M 236,238 L 538,252 L 538,504 L 236,492 Z"
              fill="url(#tvBlueFront)"
              stroke="#38669c"
              strokeWidth="2.5"
            />

            {/* Inner Chamfered Screen Bezel (Glowing Greenish from Ray-Traced CRT Light) */}
            <polygon
              points="230,232 544,246 544,510 230,498"
              fill="none"
              stroke="url(#tvBezelGreenRay)"
              strokeWidth="5"
            />
            <polygon
              points="235,237 539,251 539,505 235,493"
              fill="none"
              stroke="#a6e26e"
              strokeOpacity="0.65"
              strokeWidth="2"
            />

            {/* Right-Side Control Panel on the Angled Blue SVG TV */}
            <polygon
              points="554,250 630,254 630,512 554,508"
              fill="#0e1d30"
              stroke="#2d527d"
              strokeWidth="1.5"
            />
            {/* Green Ray-Traced Rim Highlight on Control Panel Left Edge */}
            <line
              x1="554"
              y1="252"
              x2="554"
              y2="506"
              stroke="#8ce072"
              strokeOpacity="0.7"
              strokeWidth="2"
            />

            {/* Power LED on Blue SVG TV */}
            <circle cx="570" cy="274" r="4.5" fill="#a6e26e" />
            <line x1="582" y1="274" x2="618" y2="276" stroke="#3a628f" strokeWidth="5" strokeLinecap="round" />

            {/* Rotary Knob 1 (Channel) on Blue SVG TV — Matches Fullscreen TV Knob */}
            <circle cx="592" cy="326" r="22" fill="#111f30" stroke="#3b5e87" strokeWidth="2.5" />
            <circle cx="592" cy="326" r="15" fill="#1b2f48" />
            <line x1="592" y1="326" x2="592" y2="310" stroke="#a6e26e" strokeWidth="3.5" strokeLinecap="round" />

            {/* Rotary Knob 2 (Color) on Blue SVG TV — Matches Fullscreen TV Knob */}
            <circle cx="592" cy="388" r="22" fill="#111f30" stroke="#3b5e87" strokeWidth="2.5" />
            <circle cx="592" cy="388" r="15" fill="#1b2f48" />
            <line x1="592" y1="388" x2="604" y2="378" stroke="#e6cf65" strokeWidth="3.5" strokeLinecap="round" />

            {/* Single ENTER Button on Blue SVG TV */}
            <rect
              x="566"
              y="424"
              width="52"
              height="18"
              rx="4"
              fill="#1e5235"
              stroke="#a6e26e"
              strokeWidth="1.5"
            />

            {/* Speaker Grille Slots on Blue SVG TV */}
            {[456, 468, 480, 492].map((sy) => (
              <line
                key={sy}
                x1="566"
                y1={sy}
                x2="618"
                y2={sy + 2}
                stroke="#07101c"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* ================================================================ */}
          {/* 4. FOREGROUND BROWN WOODEN SHELF WITH 5 PROPERLY SEATED          */}
          {/*    3D SIDE-VIEW CARTRIDGES (Exact offset & 3D perspective)       */}
          {/* ================================================================ */}
          <g>
            {/* 3D Top Wooden Roof Plank of Brown Shelf (Receding back-left by dx=-30, dy=-16) */}
            <polygon
              points="1008,210 978,194 1676,194 1706,210"
              fill="url(#shelfBrownPlankTop)"
              stroke="#658c4a"
              strokeWidth="1.5"
            />

            {/* 3D Left Outer Wooden Wall of Shelf — Directly Facing the Angled CRT TV! */}
            {/* Greenish at top/front where the CRT rays hit brightest, brown deeper down */}
            <polygon
              points="978,194 1008,210 1008,850 978,832"
              fill="url(#shelfBrownLeftWallRay)"
              stroke="#98de74"
              strokeOpacity="0.85"
              strokeWidth="2"
            />

            {/* Recessed Interior Back Wooden Wall of Shelf */}
            <rect
              x="1008"
              y="210"
              width="684"
              height="640"
              fill="url(#shelfBrownBackWall)"
              stroke="#3b2416"
              strokeWidth="2"
            />

            {/* Top Frame Lip of Brown Shelf */}
            <rect
              x="1008"
              y="210"
              width="698"
              height="14"
              fill="url(#shelfBrownPlankFront)"
            />
            <line x1="1008" y1="211" x2="1706" y2="211" stroke="#a6e26e" strokeOpacity="0.7" strokeWidth="2" />

            {/* ============================================================== */}
            {/* 5 SHELF CUBBIES: EACH WITH ITS 3D WOODEN PLANK FLOOR AND       */}
            {/* A SIDE-VIEW CARTRIDGE RESTING FLUSH ON THE PLANK               */}
            {/* ============================================================== */}
            {cubbyFloorYs.map((floorY, idx) => {
              const project = projects[idx];
              const isHovered = project ? hoveredProjectId === project.id : false;
              const isCurrentlyInSlot =
                project &&
                activeCartridgeId === project.id &&
                (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

              // Cartridge sits directly on top of the cubby plank floor (height = 72)
              const cartBottomY = floorY;
              const cartTopY = cartBottomY - 72;
              const cartLeftX = 1044;
              const cartRightX = 1656;

              return (
                <g key={floorY}>
                  {/* Inner Left Cubby Wall Shadow / Depth Line */}
                  <line
                    x1="1008"
                    y1={floorY}
                    x2="1036"
                    y2={floorY - 14}
                    stroke="#4e6e3a"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                  />

                  {/* 3D Top Surface of the Wooden Cubby Plank (Cartridge rests on this!) */}
                  <polygon
                    points={`1008,${floorY} 1036,${floorY - 14} 1680,${floorY - 14} 1706,${floorY}`}
                    fill="url(#shelfBrownPlankTop)"
                  />

                  {/* Ray-Traced Contact Shadow on the Plank Directly Under the Cartridge */}
                  {!isCurrentlyInSlot && (
                    <polygon
                      points={`${cartLeftX - 8},${floorY - 1} ${cartLeftX + 16},${floorY - 11} ${cartRightX + 10},${floorY - 11} ${cartRightX - 4},${floorY - 1}`}
                      fill="#050302"
                      opacity={isHovered ? '0.55' : '0.82'}
                    />
                  )}

                  {/* Front Thickness Face of the Wooden Shelf Plank */}
                  <rect
                    x="1008"
                    y={floorY}
                    width="698"
                    height="14"
                    fill="url(#shelfBrownPlankFront)"
                  />
                  {/* Greenish Ray-Traced Highlight on Left Portion of Plank Front Lip */}
                  <line
                    x1="1008"
                    y1={floorY + 1}
                    x2="1480"
                    y2={floorY + 1}
                    stroke="#a6e26e"
                    strokeOpacity="0.6"
                    strokeWidth="1.5"
                  />

                  {/* 3D SIDE-VIEW CARTRIDGE SITTING FLUSH ON THE PLANK */}
                  {project && !isCurrentlyInSlot && (
                    <g
                      onMouseEnter={() => setHoveredProjectId(project.id)}
                      onMouseLeave={() =>
                        setHoveredProjectId((prev) => (prev === project.id ? null : prev))
                      }
                      onClick={() => onSelectProject(project.id)}
                      className="cursor-pointer"
                      style={{
                        transform: isHovered ? 'translate(-30px, 8px)' : 'translate(0px, 0px)',
                        transition: 'transform 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    >
                      <defs>
                        <clipPath id={`cubby-icon-clip-${project.id}`}>
                          <rect
                            x={cartLeftX + 18}
                            y={cartTopY + 10}
                            width="52"
                            height="52"
                            rx="7"
                          />
                        </clipPath>
                        {/* Cartridge Spine Body: Greenish ray-traced left side fading into dark slate */}
                        <linearGradient
                          id={`cubby-cart-face-${project.id}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor={isHovered ? '#3b5e3e' : '#2b452e'}
                          />
                          <stop
                            offset="26%"
                            stopColor={isHovered ? '#29382c' : '#1e2820'}
                          />
                          <stop offset="100%" stopColor="#141816" />
                        </linearGradient>
                      </defs>

                      {/* 3D Top Face of Cartridge (Matches Shelf Plank Perspective dx=+24, dy=-12) */}
                      <polygon
                        points={`${cartLeftX},${cartTopY} ${cartLeftX + 24},${cartTopY - 12} ${cartRightX + 24},${cartTopY - 12} ${cartRightX},${cartTopY}`}
                        fill={isHovered ? '#4c7350' : '#314a34'}
                        stroke={isHovered ? '#a6e26e' : '#4a6b4e'}
                        strokeWidth="1.2"
                      />

                      {/* 3D Right Depth Face of Cartridge Inside the Cubby */}
                      <polygon
                        points={`${cartRightX},${cartTopY} ${cartRightX + 24},${cartTopY - 12} ${cartRightX + 24},${cartBottomY - 12} ${cartRightX},${cartBottomY}`}
                        fill="#0d110e"
                        stroke="#253027"
                        strokeWidth="1"
                      />

                      {/* Main Cartridge Side Spine Face Resting Flush on `cartBottomY = floorY` */}
                      <rect
                        x={cartLeftX}
                        y={cartTopY}
                        width={cartRightX - cartLeftX}
                        height={72}
                        rx="5"
                        fill={`url(#cubby-cart-face-${project.id})`}
                        stroke={isHovered ? '#a6e26e' : '#436147'}
                        strokeWidth={isHovered ? '2.2' : '1.5'}
                      />

                      {/* Bright Green Ray-Traced Specular Left Edge (Faces the Angled CRT TV) */}
                      <line
                        x1={cartLeftX + 1}
                        y1={cartTopY + 3}
                        x2={cartLeftX + 1}
                        y2={cartBottomY - 3}
                        stroke="#b8f284"
                        strokeWidth={isHovered ? '4' : '2.5'}
                        strokeOpacity={isHovered ? '1' : '0.8'}
                      />

                      {/* Recessed Spine Label Bay */}
                      <rect
                        x={cartLeftX + 12}
                        y={cartTopY + 6}
                        width={495}
                        height={60}
                        rx="5"
                        fill="#0c100d"
                        stroke={isHovered ? '#6ca144' : '#28382a'}
                        strokeWidth="1.5"
                      />

                      {/* Artwork Icon on the Left of the Spine */}
                      <rect
                        x={cartLeftX + 17}
                        y={cartTopY + 9}
                        width="54"
                        height="54"
                        rx="7"
                        fill="#141c15"
                        stroke={project.accentColor}
                        strokeWidth="1.5"
                      />
                      <image
                        href={project.labelSvg}
                        x={cartLeftX + 18}
                        y={cartTopY + 10}
                        width="52"
                        height="52"
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#cubby-icon-clip-${project.id})`}
                      />

                      {/* Project Accent Bar */}
                      <rect
                        x={cartLeftX + 82}
                        y={cartTopY + 14}
                        width="4"
                        height="44"
                        rx="2"
                        fill={project.accentColor}
                      />

                      {/* Project Name on Spine in Dull Pixelated White Font */}
                      <text
                        x={cartLeftX + 100}
                        y={cartTopY + 43}
                        fill={isHovered ? '#d2dcd2' : '#b4beb4'}
                        fontFamily="'Press Start 2P', monospace"
                        fontSize="16"
                        letterSpacing="0.5"
                      >
                        {project.name}
                      </text>

                      {/* Molded Grip Ribs on the Right End of the Cartridge Spine */}
                      {[528, 542, 556, 570, 584].map((offset) => (
                        <g key={offset}>
                          <line
                            x1={cartLeftX + offset}
                            y1={cartTopY + 12}
                            x2={cartLeftX + offset}
                            y2={cartBottomY - 12}
                            stroke="#090c0a"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <line
                            x1={cartLeftX + offset + 2}
                            y1={cartTopY + 12}
                            x2={cartLeftX + offset + 2}
                            y2={cartBottomY - 12}
                            stroke="#3b523e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </g>
                      ))}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Front-Left Vertical Wooden Frame Post of Shelf (Rim-Lit Green on Left Edge) */}
            <rect
              x="1008"
              y="210"
              width="14"
              height="640"
              fill="#423822"
              stroke="#2e2214"
              strokeWidth="1"
            />
            <line
              x1="1009"
              y1="210"
              x2="1009"
              y2="850"
              stroke="#b8f284"
              strokeOpacity="0.9"
              strokeWidth="2.5"
            />

            {/* Front-Right Vertical Wooden Frame Post of Shelf (Overlaps right cubby edge for 3D depth) */}
            <rect
              x="1690"
              y="210"
              width="16"
              height="640"
              fill="#2e1b0f"
              stroke="#1c1008"
              strokeWidth="1.5"
            />
          </g>

          {/* ================================================================ */}
          {/* 5. VOLUMETRIC RAY-TRACED CRT LIGHT BEAMS & GOD-RAYS              */}
          {/*    Shining from the diagonally angled CRT screen onto the        */}
          {/*    brown shelf, cartridges, and white console below              */}
          {/* ================================================================ */}
          <g className="animate-tv-tingle pointer-events-none" style={{ mixBlendMode: 'screen' }}>
            {/* Soft Phosphor Halo Around the Angled CRT Screen */}
            <ellipse
              cx="395"
              cy="372"
              rx="235"
              ry="195"
              fill="url(#rtScreenHalo)"
              filter="url(#rtSoftBlur)"
            />

            {/* Primary Volumetric Frustum Cone Shining Diagonally from TV Screen to Shelf */}
            <polygon
              points="240,238 540,252 1705,190 1705,855 540,506 240,494"
              fill="url(#rtPrimaryBeam)"
              filter="url(#rtSoftBlur)"
            />

            {/* Individual Ray-Traced Scanline Light Shafts Hitting Each Shelf Cubby */}
            <polygon
              points="538,262 1012,215 1680,295 538,312"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />
            <polygon
              points="538,332 1012,355 1680,455 538,388"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />
            <polygon
              points="538,408 1012,505 1680,625 538,458"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />
            <polygon
              points="538,468 1012,655 1680,810 538,504"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />

            {/* Downward Volumetric Ray Cone Illuminating the Top of the White Console */}
            <polygon
              points="236,492 538,504 662,728 182,710"
              fill="url(#rtDownwardCone)"
              filter="url(#rtFineBlur)"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
