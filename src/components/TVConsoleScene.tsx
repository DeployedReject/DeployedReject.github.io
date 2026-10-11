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

            {/* Outer Ring (#111f30 with #3b5e87 border, matching zoomed-out SVG TV) */}
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
  const [scrollKnobAngle, setScrollKnobAngle] = useState<number>(35);
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);
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

  const currentChannelOptions = useMemo(
    () => getChannelOptions(screenTab, stats),
    [screenTab, stats]
  );

  const safeOptionIndex =
    currentChannelOptions.length > 0
      ? ((optionIndex % currentChannelOptions.length) + currentChannelOptions.length) %
        currentChannelOptions.length
      : 0;

  const turnChannel = (dir: 'next' | 'prev') => {
    const idx = TV_TABS.indexOf(screenTab);
    const safeIdx = idx === -1 ? 0 : idx;
    const nextIdx =
      dir === 'next' ? (safeIdx + 1) % TV_TABS.length : (safeIdx - 1 + TV_TABS.length) % TV_TABS.length;
    setScreenTab(TV_TABS[nextIdx]);
    setOptionIndex(0);
    setChannelKnobAngle((prev) => (dir === 'next' ? prev + 45 : prev - 45));
  };

  const turnScroll = (dir: 'next' | 'prev') => {
    const total = Math.max(1, currentChannelOptions.length);
    setOptionIndex((prev) =>
      dir === 'next' ? (prev + 1) % total : (prev - 1 + total) % total
    );
    setScrollKnobAngle((prev) => (dir === 'next' ? prev + 40 : prev - 40));
  };

  const triggerOption = (opt: ChannelOption) => {
    if (opt.action === 'ping') {
      setPingRefreshKey((prev) => prev + 1);
      return;
    }
    if (opt.action === 'copy' && opt.copyText) {
      navigator.clipboard?.writeText(opt.copyText).catch(() => {});
      setCopiedBanner(`COPIED: ${opt.copyText}`);
      window.setTimeout(() => setCopiedBanner(null), 2200);
      return;
    }
    if (opt.url) {
      window.open(opt.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePressSelectButton = () => {
    if (currentChannelOptions.length === 0) return;
    triggerOption(currentChannelOptions[safeOptionIndex]);
  };

  // Smooth GPU-composited Zoom-Out when mouse moves to the outer screen edge in Fullscreen TV mode
  const handleEdgeZoomOut = () => {
    if (cameraMode !== 'closeup' || zoomPhase !== 'idle') return;
    if (Date.now() < zoomCooldownRef.current) return;
    zoomCooldownRef.current = Date.now() + 950;

    setCameraMode('table');
    setZoomPhase('zooming-out-dolly');
    window.setTimeout(() => {
      setZoomPhase('idle');
    }, 580);
  };

  // Smooth GPU-composited Zoom-In with Static Filling the Screen and Clearing to Show the TV
  const handleTvZoomIn = () => {
    if (cameraMode !== 'table' || zoomPhase !== 'idle') return;
    if (Date.now() < zoomCooldownRef.current) return;
    zoomCooldownRef.current = Date.now() + 1050;

    setZoomPhase('zooming-in-static');
    window.setTimeout(() => {
      setCameraMode('closeup');
      setZoomPhase('clearing-closeup');
      window.setTimeout(() => {
        setZoomPhase('idle');
      }, 430);
    }, 400);
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
        turnScroll('next');
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        turnScroll('prev');
      }
      if (e.key === 'Enter' && cameraMode === 'closeup') {
        e.preventDefault();
        handlePressSelectButton();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  // ============================================================================
  // MODE 1: FULLSCREEN CRT VIEW (cameraMode === 'closeup')
  // - Retro Blue TV Casing matching the zoomed-out SVG TV
  // - Knob 1: CHANNEL | Knob 2: SCROLL | Button: SELECT
  // - Moving mouse to screen edge smoothly zooms out with static transition
  // ============================================================================
  if (cameraMode === 'closeup') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black select-none flex items-stretch">
        {/* CRT Static Overlay when clearing into Fullscreen TV */}
        {zoomPhase === 'clearing-closeup' && <CRTStaticOverlay mode="clear" />}

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
            <div className="relative flex-1 h-full rounded-[20px] overflow-hidden bg-[#070c08] crt-screen-container shadow-[0_0_55px_rgba(166,226,110,0.24),inset_0_0_60px_rgba(0,0,0,0.95)] border-4 border-[#3a6b4c]">
              <ConsoleScreenContent
                projects={projects}
                activeTab={screenTab}
                optionIndex={safeOptionIndex}
                onSelectOptionIndex={setOptionIndex}
                onTriggerOption={triggerOption}
                pingRefreshKey={pingRefreshKey}
                isTableZoomedOut={false}
                insertingProject={null}
                hideRomsTab={true}
              />

              {copiedBanner && (
                <div
                  className="absolute top-14 right-6 z-40 px-3 py-1.5 bg-[#a6e26e] text-[#071008] border-2 border-[#e2f9c8] text-[10px] font-bold shadow-lg"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  {'\uf00c'} {copiedBanner}
                </div>
              )}

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
                        backgroundColor: '#a6e26e',
                        boxShadow: '0 0 10px #a6e26e',
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

              {/* MATCHING SVG DUAL ROTARY KNOBS: 1. CHANNEL | 2. SCROLL */}
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

                {/* Knob 2: Scroll Selector (Scrolls options on active channel) */}
                <MatchingSvgRotaryKnob
                  angle={scrollKnobAngle}
                  onTurnClockwise={() => turnScroll('next')}
                  onTurnCounterClockwise={() => turnScroll('prev')}
                  label="SCROLL"
                  sublabel={`OPT ${safeOptionIndex + 1}/${Math.max(1, currentChannelOptions.length)}`}
                  accentColor="#e6cf65"
                />
              </div>

              {/* SINGLE SELECT BUTTON TO OPEN SELECTED OPTION */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-1">
                  <span
                    className="text-[7px] text-[#b4beb4] uppercase tracking-wider"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    ACTION
                  </span>
                  <span className="text-[9px] font-mono text-[#a6e26e]">
                    Open Selected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handlePressSelectButton}
                  className="w-full py-3 px-3 rounded-xl cursor-pointer active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                  style={{
                    background: 'linear-gradient(180deg, #2b6e48 0%, #1e5235 65%, #143824 100%)',
                    boxShadow:
                      '0 5px 0 #0c2416, 0 8px 14px rgba(0,0,0,0.8), inset 0 1px 2px rgba(166,226,110,0.55)',
                    border: '2px solid #a6e26e',
                  }}
                  title="Select Highlighted Option on Screen"
                >
                  <span
                    className="text-[9px] xl:text-[10px] text-[#e2f9c8] font-bold tracking-wider uppercase group-hover:text-white transition-colors"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    {'\uf061'} SELECT
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
  // - Left Side: Blue CRT TV sitting 100% inside the rear deck of the White
  //   Console ("Definetly Legally Distinct Console"), angled toward the shelf.
  // - Right Side: Brown Wooden Shelf tilted toward the TV (skewY(1.68) and
  //   depth (+32, -18)) so all 5 cartridges fit flush inside the cubbies and
  //   pull out toward the TV along the shelf's 3D axis.
  // ============================================================================
  const isZoomingIn =
    cameraMode === 'zooming-in' || zoomPhase === 'zooming-in-static';
  const isZoomingOut =
    zoomPhase === 'zooming-out-dolly' || cameraMode === 'ejecting';

  // Subtitle text in dull pixelated white when hovering a cartridge or the console
  const hoverSubtitle = hoveredProject
    ? `${hoveredProject.name}: "${hoveredProject.originNote || hoveredProject.tagline}"`
    : hoveredConsole
    ? 'Definetly Legally Distinct Console: "this doesnt really do much"'
    : '';

  // Shelf cubby floor Y-coordinates in local shelf coordinates
  const cubbyFloorYs = [326, 446, 566, 686, 806];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* CRT Static Overlay Filling the Screen During Zoom-In or Clearing During Zoom-Out */}
      {isZoomingIn && <CRTStaticOverlay mode="fill" />}
      {isZoomingOut && <CRTStaticOverlay mode="clear" />}

      {/* GPU-Composited Camera Zoom Stage centered on the CRT screen (19.5% 42.5%) */}
      <div
        className={`relative w-screen h-screen ${
          isZoomingIn
            ? 'animate-cameraZoomIn'
            : isZoomingOut
            ? 'animate-cameraZoomOut'
            : ''
        }`}
        style={{
          transformOrigin: '19.5% 42.5%',
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
        {/* UNIFIED 1920x1080 SVG SCENE                                        */}
        {/* ================================================================== */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid meet"
          className="relative z-20 w-full h-full"
        >
          <defs>
            {/* ---------------- RAY-TRACED LIGHTING GRADIENTS ---------------- */}
            <linearGradient id="rtPrimaryBeam" x1="0" y1="0.4" x2="1" y2="0.52">
              <stop offset="0%" stopColor="#b8f284" stopOpacity="0.32" />
              <stop offset="24%" stopColor="#a6e26e" stopOpacity="0.19" />
              <stop offset="58%" stopColor="#72b846" stopOpacity="0.09" />
              <stop offset="88%" stopColor="#4c852c" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="rtGodRayShaft" x1="0" y1="0.42" x2="1" y2="0.52">
              <stop offset="0%" stopColor="#d4f7b5" stopOpacity="0.24" />
              <stop offset="45%" stopColor="#a6e26e" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="rtDownwardCone" x1="0.45" y1="0" x2="0.55" y2="1">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.34" />
              <stop offset="60%" stopColor="#7ec252" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="rtScreenHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#a6e26e" stopOpacity="0.34" />
              <stop offset="48%" stopColor="#6eb844" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="rtFloorBounce" cx="0.4" cy="0.5" r="0.55">
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
            <linearGradient id="tvBlueFront" x1="0" y1="0" x2="1" y2="0.2">
              <stop offset="0%" stopColor="#244770" />
              <stop offset="55%" stopColor="#1b3656" />
              <stop offset="100%" stopColor="#11243b" />
            </linearGradient>
            <linearGradient id="tvBlueLeftSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d1b2e" />
              <stop offset="100%" stopColor="#1b3657" />
            </linearGradient>
            <linearGradient id="tvBlueTop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2a5180" />
              <stop offset="100%" stopColor="#18304f" />
            </linearGradient>
            <linearGradient id="tvBezelGreenRay" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#72c768" />
              <stop offset="50%" stopColor="#356e4c" />
              <stop offset="100%" stopColor="#1d4245" />
            </linearGradient>

            {/* Clip Path for Live CRT Screen Inside the Angled Blue TV */}
            <clipPath id="angledTvScreenClip">
              <polygon points="206,314 512,304 512,601 206,611" />
            </clipPath>

            {/* ---------------- WHITE CONSOLE GRADIENTS (WITH GREEN RAY BOUNCE) ---------------- */}
            <radialGradient id="consoleWhiteTopRay" cx="0.46" cy="0.58" r="0.55">
              <stop offset="0%" stopColor="#9ce38a" />
              <stop offset="40%" stopColor="#b5d6b0" />
              <stop offset="75%" stopColor="#cbd1d6" />
              <stop offset="100%" stopColor="#a7b0b8" />
            </radialGradient>
            <linearGradient id="consoleWhiteFront" x1="0" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#c4dbc0" />
              <stop offset="18%" stopColor="#d5dade" />
              <stop offset="75%" stopColor="#bcc3cb" />
              <stop offset="100%" stopColor="#9199a3" />
            </linearGradient>
            <linearGradient id="consoleWhiteLeftSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#707882" />
              <stop offset="100%" stopColor="#9ea6b0" />
            </linearGradient>

            {/* Clip Path at the Exact Front Lip of the Console's Front-Deck Cartridge Slot */}
            <clipPath id="consoleSlotMouthClip">
              <polygon points="300,498 550,488 550,664 300,672" />
            </clipPath>

            {/* ---------------- BROWN WOODEN SHELF GRADIENTS (WITH GREEN RAY RIM) ---------------- */}
            <linearGradient id="shelfBrownLeftWallRay" x1="0" y1="0.2" x2="1" y2="0.8">
              <stop offset="0%" stopColor="#6ea654" />
              <stop offset="32%" stopColor="#4f6e3b" />
              <stop offset="68%" stopColor="#4a301d" />
              <stop offset="100%" stopColor="#2e1c10" />
            </linearGradient>
            <linearGradient id="shelfBrownRightWallDark" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#382214" />
              <stop offset="100%" stopColor="#1c1008" />
            </linearGradient>
            <linearGradient id="shelfBrownBackWall" x1="0" y1="0.3" x2="1" y2="0.7">
              <stop offset="0%" stopColor="#293620" />
              <stop offset="25%" stopColor="#2b1b10" />
              <stop offset="70%" stopColor="#1c110a" />
              <stop offset="100%" stopColor="#120b06" />
            </linearGradient>
            <linearGradient id="shelfBrownPlankTop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5e8747" />
              <stop offset="22%" stopColor="#524628" />
              <stop offset="55%" stopColor="#4a2e1b" />
              <stop offset="100%" stopColor="#2b190e" />
            </linearGradient>
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
          <line x1="0" y1="848" x2="1920" y2="848" stroke="#162919" strokeWidth="1.5" opacity="0.6" />

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
            points="1005,875 1712,895 1860,960 1075,935"
            fill="#000000"
            opacity="0.88"
          />
          {/* Ray-Traced Cast Shadow Under the Console */}
          <polygon
            points="98,780 190,828 682,812 728,848 175,868 85,812"
            fill="#000000"
            opacity="0.92"
          />

          {/* ================================================================ */}
          {/* 2. WHITE CONSOLE DECK ("Definetly Legally Distinct Console")     */}
          {/*    Consistent 3D Geometry:                                       */}
          {/*    - Front face: (190,680) -> (670,664) -> (670,810) -> (190,826)*/}
          {/*    - Depth vector: (-80, -48) receding up-and-left               */}
          {/*    - Rear deck (154..110) holds the Blue TV 100% inside!         */}
          {/* ================================================================ */}
          <g
            onMouseEnter={() => setHoveredConsole(true)}
            onMouseLeave={() => setHoveredConsole(false)}
            className="cursor-pointer"
          >
            {/* Console 3D Left Side Wall (Receding up-and-left by dx=-80, dy=-48) */}
            <polygon
              points="110,632 190,680 190,826 110,778"
              fill="url(#consoleWhiteLeftSide)"
              stroke="#5c646e"
              strokeWidth="1.5"
            />

            {/* Console 3D Deep Top Deck (Rear half holds TV; Front half holds Cartridge Slot) */}
            <polygon
              points="190,680 110,632 590,616 670,664"
              fill="url(#consoleWhiteTopRay)"
              stroke="#85b87e"
              strokeWidth="2"
            />

            {/* Contact Shadow on Rear Half of Console Top Deck Where the Blue TV Sits */}
            <polygon
              points="164,658 122,633 580,618 622,643"
              fill="#0a120d"
              opacity="0.78"
            />
          </g>

          {/* ================================================================ */}
          {/* 3. BLUE CRT TV SITTING 100% INSIDE THE REAR CONSOLE DECK         */}
          {/*    Consistent 3D Geometry (Exact same axes as the Console!):     */}
          {/*    - Front face: (168,286) -> (618,271) -> (618,641) -> (168,656)*/}
          {/*    - Depth vector: (-42, -25) receding up-and-left               */}
          {/* ================================================================ */}
          <g
            onMouseEnter={handleTvZoomIn}
            onClick={handleTvZoomIn}
            className="cursor-zoom-in"
          >
            {/* 3D Top Roof of Blue TV (Opposite edges 100% parallel!) */}
            <polygon
              points="168,286 126,261 576,246 618,271"
              fill="url(#tvBlueTop)"
              stroke="#3b699e"
              strokeWidth="2"
            />

            {/* 3D Left Side Depth Wall of Blue TV (Opposite edges 100% parallel!) */}
            <polygon
              points="126,261 168,286 168,656 126,631"
              fill="url(#tvBlueLeftSide)"
              stroke="#2c4f7c"
              strokeWidth="2"
            />

            {/* Ventilation Slots on Left Side Wall (Parallel to depth vector -42,-25) */}
            {[332, 354, 376, 398, 420, 442].map((vy) => (
              <line
                key={vy}
                x1="134"
                y1={vy}
                x2="160"
                y2={vy + 15}
                stroke="#08111f"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}

            {/* Main Blue TV Front Face (168,286 -> 618,271 -> 618,641 -> 168,656) */}
            <polygon
              points="168,286 618,271 618,641 168,656"
              fill="url(#tvBlueFront)"
              stroke="#38669c"
              strokeWidth="2.5"
            />

            {/* Live CRT Screen Embedded Directly Inside the SVG TV Bezel */}
            <g clipPath="url(#angledTvScreenClip)">
              <polygon
                points="206,314 512,304 512,601 206,611"
                fill="#070c08"
              />
              <foreignObject x="204" y="302" width="310" height="310">
                <div
                  className="w-full h-full crt-screen-container overflow-hidden"
                  style={{
                    transform: 'skewY(-1.9deg)',
                    transformOrigin: 'left center',
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
                </div>
              </foreignObject>
            </g>

            {/* Inner Chamfered Screen Bezel (Glowing Greenish from Ray-Traced CRT Light) */}
            <polygon
              points="202,310 516,300 516,605 202,615"
              fill="none"
              stroke="url(#tvBezelGreenRay)"
              strokeWidth="5"
            />
            <polygon
              points="206,314 512,304 512,601 206,611"
              fill="none"
              stroke="#a6e26e"
              strokeOpacity="0.7"
              strokeWidth="2"
            />

            {/* Right-Side Control Panel on the Angled Blue SVG TV */}
            <polygon
              points="528,299 604,296 604,601 528,604"
              fill="#0e1d30"
              stroke="#2d527d"
              strokeWidth="1.5"
            />
            {/* Green Ray-Traced Rim Highlight on Control Panel Left Edge */}
            <line
              x1="528"
              y1="301"
              x2="528"
              y2="602"
              stroke="#8ce072"
              strokeOpacity="0.75"
              strokeWidth="2"
            />

            {/* Power LED on Blue SVG TV */}
            <circle cx="544" cy="322" r="4.5" fill="#a6e26e" />
            <line x1="556" y1="322" x2="592" y2="321" stroke="#3a628f" strokeWidth="5" strokeLinecap="round" />

            {/* Rotary Knob 1 (CHANNEL) on Blue SVG TV */}
            <circle cx="566" cy="374" r="22" fill="#111f30" stroke="#3b5e87" strokeWidth="2.5" />
            <circle cx="566" cy="374" r="15" fill="#1b2f48" />
            <line x1="566" y1="374" x2="566" y2="358" stroke="#a6e26e" strokeWidth="3.5" strokeLinecap="round" />

            {/* Rotary Knob 2 (SCROLL) on Blue SVG TV */}
            <circle cx="566" cy="436" r="22" fill="#111f30" stroke="#3b5e87" strokeWidth="2.5" />
            <circle cx="566" cy="436" r="15" fill="#1b2f48" />
            <line x1="566" y1="436" x2="578" y2="426" stroke="#e6cf65" strokeWidth="3.5" strokeLinecap="round" />

            {/* Single SELECT Button on Blue SVG TV */}
            <rect
              x="540"
              y="472"
              width="52"
              height="18"
              rx="4"
              fill="#1e5235"
              stroke="#a6e26e"
              strokeWidth="1.5"
            />

            {/* Speaker Grille Slots on Blue SVG TV */}
            {[506, 518, 530, 542].map((sy) => (
              <line
                key={sy}
                x1="540"
                y1={sy}
                x2="592"
                y2={sy - 2}
                stroke="#07101c"
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* ================================================================ */}
          {/* 4. FRONT DECK SLOT & FRONT FACE OF THE WHITE CONSOLE             */}
          {/*    Drawn in front of the TV base so the front deck shelf &       */}
          {/*    cartridge slot sit cleanly in front of the TV!                */}
          {/* ================================================================ */}
          <g
            onMouseEnter={() => setHoveredConsole(true)}
            onMouseLeave={() => setHoveredConsole(false)}
            className="cursor-pointer"
          >
            {/* Specular Green Ray-Traced Reflection Pool on the Front Deck Under the CRT Tube */}
            <ellipse
              cx="415"
              cy="656"
              rx="155"
              ry="12"
              fill="#a6e26e"
              opacity="0.38"
              filter="url(#rtFineBlur)"
            />

            {/* Top-Loading Cartridge Slot Recessed Well on the Front Console Deck */}
            <polygon
              points="314,654 518,647 530,663 326,670"
              fill="#0a120c"
              stroke="#6cbf5e"
              strokeWidth="2"
            />
            <line x1="316" y1="656" x2="516" y2="649" stroke="#a6e26e" strokeWidth="1.5" strokeOpacity="0.85" />

            {/* SLIDING CARTRIDGE ENTERING THE CONSOLE SLOT MOUTH */}
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
                      points="340,564 328,556 498,550 510,558"
                      fill="#35523a"
                      stroke="#a6e26e"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="340,564 510,558 510,694 340,700"
                      fill="#1d2b20"
                      stroke="#a6e26e"
                      strokeWidth="2"
                    />
                    {/* Cartridge Label Artwork */}
                    <rect
                      x="358"
                      y="572"
                      width="134"
                      height="64"
                      rx="4"
                      fill="#0d140e"
                      stroke={activeCartridge.accentColor}
                      strokeWidth="1.5"
                    />
                    <image
                      href={activeCartridge.labelSvg}
                      x="360"
                      y="574"
                      width="130"
                      height="60"
                      preserveAspectRatio="xMidYMid slice"
                    />
                    <text
                      x="425"
                      y="654"
                      textAnchor="middle"
                      fill="#b4beb4"
                      fontSize="11"
                      fontFamily="var(--font-pixel)"
                    >
                      {activeCartridge.name}
                    </text>
                  </g>
                </g>
              )}

            {/* Front Lip of the Console Slot (Drawn ON TOP of the cartridge so it sits inside!) */}
            <polygon
              points="324,668 532,661 536,667 328,674"
              fill="#b8d4b4"
              stroke="#76bd68"
              strokeWidth="1"
            />

            {/* WHITE CONSOLE: Front Body Panel (190,680 -> 670,664 -> 670,810 -> 190,826) */}
            <polygon
              points="190,680 670,664 670,810 190,826"
              fill="url(#consoleWhiteFront)"
              stroke="#8c9ba6"
              strokeWidth="2"
            />

            {/* Ray-Traced Green Rim Highlight Along the Console's Upper Front Lip */}
            <line
              x1="192"
              y1="680"
              x2="668"
              y2="664"
              stroke="#a6e26e"
              strokeOpacity="0.9"
              strokeWidth="2.5"
            />

            {/* Console Recessed Control Strip & Controller Ports */}
            <polygon
              points="214,704 646,690 646,748 214,762"
              fill="#9ba4ad"
              stroke="#747d87"
              strokeWidth="1.5"
            />

            {/* Power & Reset Tactile Buttons on White Console */}
            <polygon
              points="232,718 286,716 286,742 232,744"
              fill="#2e4a36"
              stroke="#8ae070"
              strokeWidth="1.5"
            />
            <polygon
              points="300,715 352,713 352,739 300,741"
              fill="#5a636e"
              stroke="#3b424a"
              strokeWidth="1.5"
            />

            {/* Controller Port Sockets */}
            <polygon
              points="514,706 568,704 568,734 514,736"
              fill="#1e242b"
              stroke="#49535e"
              strokeWidth="1.5"
            />
            <polygon
              points="580,703 634,701 634,731 580,733"
              fill="#1e242b"
              stroke="#49535e"
              strokeWidth="1.5"
            />

            {/* Console Front Nameplate: "Definetly Legally Distinct Console" */}
            <polygon
              points="214,776 646,762 646,792 214,806"
              fill="#182026"
              stroke="#5b7a5e"
              strokeWidth="1.5"
            />
            <circle cx="232" cy="791" r="5" fill="#a6e26e" />
            <text
              x="434"
              y="788"
              textAnchor="middle"
              fill="#b4beb4"
              fontSize="11.5"
              fontFamily="var(--font-pixel)"
              letterSpacing="0.5"
              transform="rotate(-1.9 434 788)"
            >
              Definetly Legally Distinct Console
            </text>
          </g>

          {/* ================================================================ */}
          {/* 5. FOREGROUND BROWN WOODEN SHELF TILTED TOWARD THE TV TO FIT     */}
          {/*    THE 5 3D CARTRIDGES                                           */}
          {/*    - Entire Shelf + Cartridges share:                            */}
          {/*      * Front Tilt: skewY(1.68) (sloping down-right toward viewer)*/}
          {/*      * Depth Vector into Cubby: (+32, -18) for shelf planks/walls*/}
          {/*        and (+24, -13.5) for cartridges (exact same 16:-9 angle!) */}
          {/* ================================================================ */}
          <g transform="translate(1000, 0) skewY(1.68)">
            {/* Recessed Interior Back Wooden Wall of Shelf (at depth +32, -18) */}
            <rect
              x="32"
              y="186"
              width="680"
              height="640"
              fill="url(#shelfBrownBackWall)"
              stroke="#3b2416"
              strokeWidth="2"
            />

            {/* 3D Interior Left Wooden Wall of Shelf (Visible inside cubbies, catching green CRT rays!) */}
            <polygon
              points="0,204 32,186 32,826 0,844"
              fill="url(#shelfBrownLeftWallRay)"
              stroke="#658c4a"
              strokeOpacity="0.8"
              strokeWidth="1.5"
            />

            {/* 3D Top Wooden Roof Plank of Brown Shelf (Receding into cubby by dx=+32, dy=-18) */}
            <polygon
              points="0,204 32,186 712,186 680,204"
              fill="url(#shelfBrownPlankTop)"
              stroke="#658c4a"
              strokeWidth="1.5"
            />

            {/* Top Frame Front Lip of Brown Shelf */}
            <rect
              x="0"
              y="204"
              width="680"
              height="14"
              fill="url(#shelfBrownPlankFront)"
            />
            <line x1="0" y1="205" x2="680" y2="205" stroke="#a6e26e" strokeOpacity="0.7" strokeWidth="2" />

            {/* 5 SHELF CUBBIES WITH PROPERLY SEATED 3D SIDE-VIEW CARTRIDGES */}
            {cubbyFloorYs.map((floorY, idx) => {
              const project = projects[idx];
              const isHovered = project ? hoveredProjectId === project.id : false;
              const isCurrentlyInSlot =
                project &&
                activeCartridgeId === project.id &&
                (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

              // Cartridge sits recessed on the wooden plank (front bottom at floorY - 3, back bottom at floorY - 16.5)
              const cartBottomY = floorY - 3;
              const cartTopY = cartBottomY - 72;
              const cartLeftX = 36;
              const cartRightX = 640;

              return (
                <g key={floorY}>
                  {/* 3D Top Surface of the Wooden Cubby Plank (Receding by dx=+32, dy=-18) */}
                  <polygon
                    points={`0,${floorY} 32,${floorY - 18} 712,${floorY - 18} 680,${floorY}`}
                    fill="url(#shelfBrownPlankTop)"
                  />

                  {/* Interior Left Cubby Corner Crease (Parallel to depth vector +32, -18) */}
                  <line
                    x1="0"
                    y1={floorY}
                    x2="32"
                    y2={floorY - 18}
                    stroke="#6ea654"
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                  />

                  {/* Ray-Traced Contact Shadow on the Plank Directly Under the Cartridge */}
                  {!isCurrentlyInSlot && (
                    <polygon
                      points={`${cartLeftX - 4},${floorY - 2} ${cartLeftX + 22},${floorY - 17} ${cartRightX + 26},${floorY - 17} ${cartRightX + 2},${floorY - 2}`}
                      fill="#050302"
                      opacity={isHovered ? '0.52' : '0.84'}
                    />
                  )}

                  {/* Front Thickness Face of the Wooden Shelf Plank */}
                  <rect
                    x="0"
                    y={floorY}
                    width="680"
                    height="14"
                    fill="url(#shelfBrownPlankFront)"
                  />
                  <line
                    x1="0"
                    y1={floorY + 1}
                    x2="520"
                    y2={floorY + 1}
                    stroke="#a6e26e"
                    strokeOpacity="0.65"
                    strokeWidth="1.5"
                  />

                  {/* 3D SIDE-VIEW CARTRIDGE SITTING FLUSH INSIDE THE CUBBY */}
                  {project && !isCurrentlyInSlot && (
                    <g
                      onMouseEnter={() => setHoveredProjectId(project.id)}
                      onMouseLeave={() =>
                        setHoveredProjectId((prev) => (prev === project.id ? null : prev))
                      }
                      onClick={() => onSelectProject(project.id)}
                      className="cursor-pointer"
                      style={{
                        // Slides straight out of the cubby along the negative depth vector (-24, +13.5)
                        transform: isHovered ? 'translate(-24px, 13.5px)' : 'translate(0px, 0px)',
                        transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
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

                      {/* 3D Top Face of Cartridge (Receding by dx=+24, dy=-13.5 — exact same angle as shelf!) */}
                      <polygon
                        points={`${cartLeftX},${cartTopY} ${cartLeftX + 24},${cartTopY - 13.5} ${cartRightX + 24},${cartTopY - 13.5} ${cartRightX},${cartTopY}`}
                        fill={isHovered ? '#4c7350' : '#314a34'}
                        stroke={isHovered ? '#a6e26e' : '#4a6b4e'}
                        strokeWidth="1.2"
                      />

                      {/* 3D Right Depth Face of Cartridge Inside the Cubby (dx=+24, dy=-13.5) */}
                      <polygon
                        points={`${cartRightX},${cartTopY} ${cartRightX + 24},${cartTopY - 13.5} ${cartRightX + 24},${cartBottomY - 13.5} ${cartRightX},${cartBottomY}`}
                        fill="#0d110e"
                        stroke="#253027"
                        strokeWidth="1"
                      />

                      {/* Main Cartridge Side Spine Face Resting Flush on the Plank */}
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

                      {/* Bright Green Ray-Traced Specular Left Edge */}
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
                        width={490}
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
                        fontFamily="var(--font-pixel)"
                        fontSize="16"
                        letterSpacing="0.5"
                      >
                        {project.name}
                      </text>

                      {/* Molded Grip Ribs on the Right End of the Cartridge Spine */}
                      {[522, 536, 550, 564, 578].map((offset) => (
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

            {/* Front-Left Vertical Wooden Frame Post of Shelf (Rim-Lit Green on Left Edge Facing the TV) */}
            <rect
              x="0"
              y="204"
              width="14"
              height="636"
              fill="#423822"
              stroke="#2e2214"
              strokeWidth="1"
            />
            <line
              x1="1"
              y1="204"
              x2="1"
              y2="840"
              stroke="#b8f284"
              strokeOpacity="0.92"
              strokeWidth="2.5"
            />

            {/* Front-Right Vertical Wooden Frame Post of Shelf */}
            <rect
              x="666"
              y="204"
              width="14"
              height="636"
              fill="#382214"
              stroke="#1c1008"
              strokeWidth="1"
            />

            {/* Exterior 3D Right Side Wooden Wall of Shelf (Receding by dx=+32, dy=-18 in dark brown shadow) */}
            <polygon
              points="680,204 712,186 712,822 680,840"
              fill="url(#shelfBrownRightWallDark)"
              stroke="#26160c"
              strokeWidth="1.5"
            />
          </g>

          {/* ================================================================ */}
          {/* 6. VOLUMETRIC RAY-TRACED CRT LIGHT BEAMS & GOD-RAYS              */}
          {/* ================================================================ */}
          <g className="animate-tv-tingle pointer-events-none" style={{ mixBlendMode: 'screen' }}>
            {/* Soft Phosphor Halo Around the Angled CRT Screen */}
            <ellipse
              cx="368"
              cy="455"
              rx="235"
              ry="195"
              fill="url(#rtScreenHalo)"
              filter="url(#rtSoftBlur)"
            />

            {/* Primary Volumetric Frustum Cone Shining Diagonally from TV Screen Into the Angled Shelf */}
            <polygon
              points="206,314 512,304 1680,224 1680,860 512,601 206,611"
              fill="url(#rtPrimaryBeam)"
              filter="url(#rtSoftBlur)"
            />

            {/* Individual Ray-Traced Scanline Light Shafts Hitting Each Shelf Cubby */}
            <polygon
              points="512,315 1002,215 1665,310 512,365"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />
            <polygon
              points="512,385 1002,355 1665,465 512,435"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />
            <polygon
              points="512,455 1002,505 1665,630 512,505"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />
            <polygon
              points="512,525 1002,655 1665,815 512,585"
              fill="url(#rtGodRayShaft)"
              filter="url(#rtFineBlur)"
            />

            {/* Downward Volumetric Ray Cone Illuminating the Front Deck of the White Console */}
            <polygon
              points="206,611 512,601 650,668 198,682"
              fill="url(#rtDownwardCone)"
              filter="url(#rtFineBlur)"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
