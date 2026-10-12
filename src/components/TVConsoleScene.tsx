import { useState, useEffect, useRef, useMemo } from 'react';
import { flushSync } from 'react-dom';
import type { Project } from '../data/projects';
import {
  ConsoleScreenContent,
  getChannelOptions,
  type ScreenTab,
  type ChannelOption,
} from './ConsoleScreenContent';
import {
  fetchDeveloperStats,
  getCachedDeveloperStats,
  type DeveloperStats,
} from '../services/gitrepositorystatistics';

export type SceneCameraMode = 'closeup' | 'table' | 'inserting' | 'zooming-in' | 'ejecting';

interface TVConsoleSceneProps {
  projects: Project[];
  cameraMode: SceneCameraMode;
  setCameraMode: (mode: SceneCameraMode) => void;
  onSelectProject: (projectId: string) => void;
  activeCartridgeId: string | null;
  isRomLoading?: boolean;
  isRomReady?: boolean;
  onLaunchRom?: () => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
}

// Desktop Fullscreen TV does NOT include the ROMs menu
const TV_TABS: ScreenTab[] = ['status', 'github', 'pings', 'hire'];

/**
 * Pure SVG Rotary Dial used in Fullscreen TV View — matches the exact SVG look
 * of the rotary dials on the zoomed-out Blue TV.
 */
const MatchingSvgRotaryKnob: React.FC<{
  angle: number;
  onTurnClockwise: () => void;
  onTurnCounterClockwise: () => void;
  label: string;
  accentColor: string;
  isLightMode?: boolean;
  isWiggling?: boolean;
}> = ({
  angle,
  onTurnClockwise,
  onTurnCounterClockwise,
  label,
  accentColor,
  isLightMode = false,
  isWiggling = false,
}) => {
  const [isKnobHovered, setIsKnobHovered] = useState<boolean>(false);
  const isChannel = label.toUpperCase().includes('CHANNEL');

  return (
    <div
      onMouseEnter={() => setIsKnobHovered(true)}
      onMouseLeave={() => setIsKnobHovered(false)}
      className="flex flex-col items-center select-none w-full gap-1.5 relative"
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`text-[8px] tracking-wider uppercase font-bold ${
            isLightMode ? 'text-[#e2e8f0]' : 'text-[#b4beb4]'
          }`}
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          {label}
        </span>
      </div>

      {/* Directed Knob Navigation Tooltip */}
      <div
        className={`transition-all duration-200 pointer-events-none flex flex-col items-center gap-0.5 ${
          isKnobHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
        }`}
      >
        <div className="px-2 py-0.5 rounded bg-[#070d14]/95 border border-[#60a5fa]/60 shadow-[0_2px_8px_rgba(0,0,0,0.8)] text-[8px] font-mono whitespace-nowrap text-cyan-200 flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">&larr; Left: {isChannel ? 'Prev Tab' : 'Prev Opt'}</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">Right: {isChannel ? 'Next Tab' : 'Next Opt'} &rarr;</span>
        </div>
      </div>

      <div
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const clickedLeftHalf = e.clientX - rect.left < rect.width / 2;
          if (clickedLeftHalf) {
            onTurnCounterClockwise();
          } else {
            onTurnClockwise();
          }
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
        title={`Click Left half: Prev ${isChannel ? 'Channel' : 'Option'} | Click Right half: Next ${isChannel ? 'Channel' : 'Option'}`}
        className={`relative w-22 h-22 xl:w-24 xl:h-24 rounded-full cursor-pointer group flex items-center justify-center transition-transform active:scale-95 ${
          isWiggling ? 'animate-knobWiggle' : ''
        }`}
      >
        {/* Left / Right Click Zone Visual Guides on Hover */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none flex opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1/2 h-full bg-cyan-500/10 hover:bg-cyan-500/20 flex items-center justify-start pl-1 text-[9px] text-cyan-300 font-bold font-mono">
            &#9664;
          </div>
          <div className="w-1/2 h-full bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-end pr-1 text-[9px] text-emerald-300 font-bold font-mono">
            &#9654;
          </div>
        </div>

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
              stroke={deg % 72 === 0 ? accentColor : isLightMode ? '#93c5fd' : '#3e5c82'}
              strokeWidth={deg % 72 === 0 ? '2.5' : '1.5'}
              strokeLinecap="round"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}

          {/* Outer Ring */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill={isLightMode ? '#1e3a5f' : '#111f30'}
            stroke={isLightMode ? '#60a5fa' : '#3b5e87'}
            strokeWidth="3"
          />
          {/* Subtle Green Ray-Traced Rim Highlight on Left Arc (Dark Mode only) */}
          {!isLightMode && (
            <path
              d="M 22,24 A 38,38 0 0,0 22,76"
              fill="none"
              stroke="#a6e26e"
              strokeWidth="2"
              strokeOpacity="0.55"
            />
          )}

          {/* Inner Cap */}
          <circle
            cx="50"
            cy="50"
            r="27"
            fill={isLightMode ? '#2b5282' : '#1b2f48'}
            stroke={isLightMode ? '#60a5fa' : '#2a4669'}
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
    </div>
  );
};

export const TVConsoleScene: React.FC<TVConsoleSceneProps> = ({
  projects,
  cameraMode,
  setCameraMode,
  onSelectProject,
  activeCartridgeId,
  isRomLoading = false,
  isRomReady = false,
  onLaunchRom,
  isLightMode = false,
  onToggleLightMode,
}) => {
  const [screenTab, setScreenTab] = useState<ScreenTab>('status');
  const [optionIndex, setOptionIndex] = useState<number>(0);
  const [pingRefreshKey, setPingRefreshKey] = useState<number>(0);
  const [channelKnobAngle, setChannelKnobAngle] = useState<number>(0);
  const [scrollKnobAngle, setScrollKnobAngle] = useState<number>(35);
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);
  const [knobToast, setKnobToast] = useState<string | null>(null);
  const [knobWiggleChannel, setKnobWiggleChannel] = useState<boolean>(false);
  const [knobWiggleScroll, setKnobWiggleScroll] = useState<boolean>(false);
  const [isTvPoweredOff, setIsTvPoweredOff] = useState<boolean>(false);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [hoveredConsole, setHoveredConsole] = useState<boolean>(false);
  const [hoveredBulb, setHoveredBulb] = useState<boolean>(false);
  const [isYankingChain, setIsYankingChain] = useState<boolean>(false);
  const [staticBurst, setStaticBurst] = useState<boolean>(false);
  const [showGuideTooltip, setShowGuideTooltip] = useState<boolean>(true);
  const [edgeProximity, setEdgeProximity] = useState<number>(0);
  const [stats, setStats] = useState<DeveloperStats | null>(() => getCachedDeveloperStats());

  const bulbRef = useRef<SVGGElement | null>(null);
  const zoomCooldownRef = useRef<number>(0);
  const bulbCooldownRef = useRef<number>(0);

  // Track cursor distance to viewport edges when in closeup TV mode
  useEffect(() => {
    if (cameraMode !== 'closeup') {
      setEdgeProximity(0);
      return;
    }

    const handlePointerMove = (e: MouseEvent) => {
      const edgeThreshold = 80; // Distance in px where edge glow begins
      const minDistance = Math.min(
        e.clientX,
        e.clientY,
        window.innerWidth - e.clientX,
        window.innerHeight - e.clientY
      );

      if (minDistance < edgeThreshold) {
        // 0 at edgeThreshold, 1 at the extreme edge (0px)
        const intensity = Math.max(0, Math.min(1, (edgeThreshold - minDistance) / edgeThreshold));
        setEdgeProximity(intensity);
      } else {
        setEdgeProximity(0);
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, [cameraMode]);

  useEffect(() => {
    fetchDeveloperStats().then(setStats);
  }, []);

  // Show navigation guide tooltip whenever entering closeup TV mode
  useEffect(() => {
    if (cameraMode === 'closeup') {
      setShowGuideTooltip(true);
      const timer = window.setTimeout(() => {
        setShowGuideTooltip(false);
      }, 5500);
      return () => window.clearTimeout(timer);
    } else {
      setShowGuideTooltip(false);
    }
  }, [cameraMode]);

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

  const isCartridgeActive = Boolean(activeCartridge || isRomLoading || isRomReady);

  const showCartridgeLockedToast = (type: 'channel' | 'scroll') => {
    setKnobToast("CAN'T CHANGE CHANNEL: CARTRIDGE LOADED");
    if (type === 'channel') {
      setKnobWiggleChannel(true);
      window.setTimeout(() => setKnobWiggleChannel(false), 420);
    } else {
      setKnobWiggleScroll(true);
      window.setTimeout(() => setKnobWiggleScroll(false), 420);
    }
    window.setTimeout(() => setKnobToast(null), 2500);
  };

  const turnChannel = (dir: 'next' | 'prev') => {
    if (isCartridgeActive) {
      showCartridgeLockedToast('channel');
      return;
    }
    const idx = TV_TABS.indexOf(screenTab);
    const safeIdx = idx === -1 ? 0 : idx;
    const nextIdx =
      dir === 'next' ? (safeIdx + 1) % TV_TABS.length : (safeIdx - 1 + TV_TABS.length) % TV_TABS.length;
    setScreenTab(TV_TABS[nextIdx]);
    setOptionIndex(0);
    setChannelKnobAngle((prev) => (dir === 'next' ? prev + 45 : prev - 45));
  };

  const turnScroll = (dir: 'next' | 'prev') => {
    if (isCartridgeActive) {
      showCartridgeLockedToast('scroll');
      return;
    }
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

  const handleTouchBulb = async () => {
    if (Date.now() < bulbCooldownRef.current) return;
    
    // Tactile pull-chain spring bounce
    setIsYankingChain(true);
    window.setTimeout(() => setIsYankingChain(false), 460);

    const willBeLight = !isLightMode;
    bulbCooldownRef.current = Date.now() + (willBeLight ? 750 : 450);

    /**
     * Return early if View Transition API is not supported
     * or user prefers reduced motion
     */
    if (
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      onToggleLightMode?.();
      return;
    }

    // Get origin coordinates from bulbRef or calculate from SVG coordinates
    let x = window.innerWidth * 0.435;
    let y = window.innerHeight * 0.287;
    let left = x;
    let top = y;

    if (bulbRef.current) {
      const rect = bulbRef.current.getBoundingClientRect();
      left = rect.left;
      top = rect.top;
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const right = window.innerWidth - left;
    const bottom = window.innerHeight - top;
    const maxRadius = Math.hypot(
      Math.max(left, right),
      Math.max(top, bottom),
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        onToggleLightMode?.();
      });
    });

    await transition.ready;

    if (willBeLight) {
      // Turning ON: Expanding circle of light
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    } else {
      // Turning OFF: Quick reverse animation (contracting light / expanding dark)
      document.documentElement.animate(
        {
          clipPath: [
            `circle(${maxRadius}px at ${x}px ${y}px)`,
            `circle(0px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 380,
          easing: 'cubic-bezier(0.4, 0, 1, 1)',
          pseudoElement: '::view-transition-old(root)',
        }
      );
    }
  };

  const zoomInTimerRef = useRef<number | null>(null);
  const zoomOutTimerRef = useRef<number | null>(null);

  // Clear pending hover timers
  const clearZoomTimers = () => {
    if (zoomInTimerRef.current !== null) {
      window.clearTimeout(zoomInTimerRef.current);
      zoomInTimerRef.current = null;
    }
    if (zoomOutTimerRef.current !== null) {
      window.clearTimeout(zoomOutTimerRef.current);
      zoomOutTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearZoomTimers();
  }, []);

  // Trigger zoom out to table/room view
  const triggerZoomOut = () => {
    clearZoomTimers();
    if (cameraMode !== 'closeup') return;
    if (Date.now() < zoomCooldownRef.current) return;
    zoomCooldownRef.current = Date.now() + 500;
    setStaticBurst(true);
    setCameraMode('table');
    window.setTimeout(() => setStaticBurst(false), 320);
  };

  // Trigger zoom in to fullscreen closeup TV view (instant on click or after 2s dwell)
  const triggerZoomIn = () => {
    clearZoomTimers();
    if (cameraMode !== 'table') return;
    setIsTvPoweredOff(false);
    setStaticBurst(true);
    setCameraMode('closeup');
    window.setTimeout(() => setStaticBurst(false), 320);
  };

  // Hover 2s over the outer screen edges to zoom out to table view
  const handleEdgeMouseEnter = () => {
    if (cameraMode !== 'closeup') return;
    if (zoomOutTimerRef.current !== null) return;
    zoomOutTimerRef.current = window.setTimeout(() => {
      zoomOutTimerRef.current = null;
      triggerZoomOut();
    }, 2000);
  };

  const handleEdgeMouseLeave = () => {
    if (zoomOutTimerRef.current !== null) {
      window.clearTimeout(zoomOutTimerRef.current);
      zoomOutTimerRef.current = null;
    }
  };

  // Hover 2s over the TV in room view to zoom into fullscreen TV view (or instant on click)
  const handleTvMouseEnter = () => {
    if (cameraMode !== 'table') return;
    if (zoomInTimerRef.current !== null) return;
    zoomInTimerRef.current = window.setTimeout(() => {
      zoomInTimerRef.current = null;
      triggerZoomIn();
    }, 2000);
  };

  const handleTvMouseLeave = () => {
    if (zoomInTimerRef.current !== null) {
      window.clearTimeout(zoomInTimerRef.current);
      zoomInTimerRef.current = null;
    }
  };

  // Arrow key navigation in TV mode: Left/Right turns Channel knob, Up/Down turns Scroll knob
  useEffect(() => {
    if (cameraMode !== 'closeup') return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept arrow keys if user is typing in form inputs or textareas
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        triggerZoomOut();
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        turnChannel('next');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        turnChannel('prev');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        turnScroll('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        turnScroll('prev');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handlePressSelectButton();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cameraMode, screenTab, currentChannelOptions, safeOptionIndex]);

  // ============================================================================
  // MODE 1: FULLSCREEN CRT VIEW (cameraMode === 'closeup')
  // - Retro Blue TV Casing matching the zoomed-out SVG TV
  // - Knob 1: CHANNEL | Knob 2: SCROLL | Button: SELECT
  // ============================================================================
  if (cameraMode === 'closeup') {
    return (
      <div
        className={`relative w-screen h-screen overflow-hidden select-none flex items-stretch ${
          isLightMode ? 'bg-[#e6decb]' : 'bg-black'
        }`}
      >
        {/* TV Static Transition Burst when entering closeup TV view */}
        {staticBurst && (
          <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden animate-tvStaticBurst">
            <img
              src="/img/tv-static.gif"
              alt="TV Static"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        )}

        {/* Directed Navigation Tooltip on Entering TV Closeup Mode */}
        {showGuideTooltip && (
          <div
            onClick={() => setShowGuideTooltip(false)}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] cursor-pointer animate-fadeIn"
          >
            <div className="relative max-w-xl w-full p-6 sm:p-7 rounded-2xl bg-[#09130b]/98 border-3 border-[#a6e26e] text-[#a6e26e] shadow-[0_0_50px_rgba(166,226,110,0.6)] flex flex-col items-center gap-4 text-center font-mono">
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold tracking-wider">
                <span className="inline-block w-3 h-3 rounded-full bg-[#a6e26e] animate-ping shrink-0" />
                <span className="text-white text-base sm:text-lg uppercase" style={{ fontFamily: 'var(--font-pixel)' }}>
                  TV CONTROLS & NAVIGATION
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                Click tabs or items on the screen directly, turn knobs, or use keyboard navigation:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full py-2">
                <div className="p-2.5 rounded-lg bg-[#142618] border border-[#a6e26e]/60 flex flex-col items-center gap-1.5">
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 rounded bg-[#09120a] border border-[#a6e26e] text-[#a6e26e] font-bold text-xs sm:text-sm shadow">←</kbd>
                    <kbd className="px-2 py-1 rounded bg-[#09120a] border border-[#a6e26e] text-[#a6e26e] font-bold text-xs sm:text-sm shadow">→</kbd>
                  </div>
                  <span className="text-[11px] sm:text-xs text-white font-bold">Channels</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#142618] border border-[#a6e26e]/60 flex flex-col items-center gap-1.5">
                  <div className="flex gap-1">
                    <kbd className="px-2 py-1 rounded bg-[#09120a] border border-[#a6e26e] text-[#a6e26e] font-bold text-xs sm:text-sm shadow">↑</kbd>
                    <kbd className="px-2 py-1 rounded bg-[#09120a] border border-[#a6e26e] text-[#a6e26e] font-bold text-xs sm:text-sm shadow">↓</kbd>
                  </div>
                  <span className="text-[11px] sm:text-xs text-white font-bold">Scroll</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#142618] border border-[#a6e26e]/60 flex flex-col items-center gap-1.5">
                  <kbd className="px-2.5 py-1 rounded bg-[#09120a] border border-[#a6e26e] text-[#a6e26e] font-bold text-xs sm:text-sm shadow">Enter</kbd>
                  <span className="text-[11px] sm:text-xs text-white font-bold">Select</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#142618] border border-[#a6e26e]/60 flex flex-col items-center gap-1.5">
                  <kbd className="px-2.5 py-1 rounded bg-[#09120a] border border-[#a6e26e] text-[#a6e26e] font-bold text-xs sm:text-sm shadow">Esc</kbd>
                  <span className="text-[11px] sm:text-xs text-white font-bold">Exit / Zoom Out</span>
                </div>
              </div>

              <div className="w-full pt-1 flex items-center justify-between text-[10px] sm:text-xs text-[#a6e26e]/80 border-t border-[#2d4d24]">
                <span>Mouse clicks on screen & tabs enabled</span>
                <span className="text-white font-bold px-2 py-0.5 rounded bg-[#1c3b22] border border-[#a6e26e]">CLICK ANYWHERE TO DISMISS</span>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Edge Proximity Glow: Illuminates as cursor approaches the screen border */}
        {edgeProximity > 0 && (
          <div
            className="fixed inset-0 z-[45] pointer-events-none transition-opacity duration-150"
            style={{
              opacity: edgeProximity,
              boxShadow: `inset 0 0 ${Math.round(20 + edgeProximity * 50)}px ${Math.round(4 + edgeProximity * 12)}px rgba(166, 226, 110, ${0.35 + edgeProximity * 0.45})`,
              border: `${Math.round(2 + edgeProximity * 4)}px solid rgba(166, 226, 110, ${0.4 + edgeProximity * 0.6})`,
            }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-[#0a120d]/90 border border-[#a6e26e] text-[#a6e26e] text-[9px] font-mono tracking-wider uppercase font-bold shadow-lg animate-pulse">
              &bull; Approaching Exit Zone &mdash; Dwell 2s to Return to Room &bull;
            </div>
          </div>
        )}

        {/* Invisible Screen-Edge Sensors: Hovering 2s at the edge returns to room view */}
        <div
          onMouseEnter={handleEdgeMouseEnter}
          onMouseLeave={handleEdgeMouseLeave}
          className="fixed top-0 bottom-0 left-0 w-4 z-50 cursor-zoom-out"
          title="Hold 2s to return to room view"
        />
        <div
          onMouseEnter={handleEdgeMouseEnter}
          onMouseLeave={handleEdgeMouseLeave}
          className="fixed top-0 bottom-0 right-0 w-4 z-50 cursor-zoom-out"
          title="Hold 2s to return to room view"
        />
        <div
          onMouseEnter={handleEdgeMouseEnter}
          onMouseLeave={handleEdgeMouseLeave}
          className="fixed bottom-0 left-0 right-0 h-4 z-50 cursor-zoom-out"
          title="Hold 2s to return to room view"
        />
        <div
          onMouseEnter={handleEdgeMouseEnter}
          onMouseLeave={handleEdgeMouseLeave}
          className="fixed top-0 left-0 right-0 h-3 z-50 cursor-zoom-out"
          title="Hold 2s to return to room view"
        />

        {/* Outer 3D Moulded Blue CRT Television Cabinet */}
        <div
          className="relative w-full h-full p-3 sm:p-5 md:p-6 flex items-stretch transition-colors duration-300"
          style={{
            background: isLightMode
              ? 'linear-gradient(145deg, #3b76b8 0%, #2b5c94 52%, #1d426e 100%)'
              : 'linear-gradient(145deg, #1e3a5f 0%, #152945 52%, #0b1626 100%)',
            boxShadow: isLightMode
              ? 'inset 0 2px 8px rgba(255,255,255,0.45), inset 0 -10px 25px rgba(15,35,60,0.65)'
              : 'inset 0 2px 6px rgba(140,185,240,0.22), inset 0 -10px 30px rgba(0,0,0,0.95)',
          }}
        >
          {/* Inner Recessed Blue CRT Bezel Well */}
          <div
            className="relative flex-1 h-full rounded-[26px] p-3 sm:p-4 md:p-5 flex gap-4 sm:gap-5 items-stretch overflow-hidden transition-colors duration-300"
            style={{
              background: isLightMode
                ? 'linear-gradient(180deg, #254f80 0%, #2f629c 50%, #3a74b5 100%)'
                : 'linear-gradient(180deg, #0f1e33 0%, #162b46 50%, #1c3557 100%)',
              boxShadow: isLightMode
                ? 'inset 0 8px 24px rgba(10,25,45,0.55), 0 2px 6px rgba(255,255,255,0.35)'
                : 'inset 0 12px 35px rgba(0,0,0,0.92), inset 0 0 24px rgba(166,226,110,0.22), 0 2px 4px rgba(140,190,255,0.12)',
              border: isLightMode ? '3px solid #60a5fa' : '3px solid #2e5077',
            }}
          >
            {/* FULLSCREEN CRT TUBE DISPLAY */}
            <div
              className={`relative flex-1 h-full rounded-[20px] overflow-hidden crt-screen-container border-4 ${
                isLightMode
                  ? 'bg-[#e6f0e2] border-[#5c8754] shadow-[inset_0_0_30px_rgba(20,45,25,0.18)]'
                  : 'bg-[#070c08] border-[#3a6b4c] shadow-[0_0_55px_rgba(166,226,110,0.24),inset_0_0_60px_rgba(0,0,0,0.95)]'
              }`}
            >
              <ConsoleScreenContent
                projects={projects}
                activeTab={screenTab}
                onSelectTab={(tab) => {
                  if (isCartridgeActive) {
                    showCartridgeLockedToast('channel');
                    return;
                  }
                  setScreenTab(tab);
                  setOptionIndex(0);
                }}
                optionIndex={safeOptionIndex}
                onSelectOption={(idx) => setOptionIndex(idx)}
                onTriggerOption={(opt) => triggerOption(opt)}
                pingRefreshKey={pingRefreshKey}
                isTableZoomedOut={false}
                insertingProject={isRomLoading || isRomReady ? activeCartridge : null}
                isRomReady={isRomReady}
                onLaunchRom={onLaunchRom}
                hideRomsTab={true}
                isLightMode={isLightMode}
              />

              {copiedBanner && (
                <div
                  className="absolute top-14 right-6 z-40 px-3 py-1.5 bg-[#a6e26e] text-[#071008] border-2 border-[#e2f9c8] text-[10px] font-bold shadow-lg"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  {'\uf00c'} {copiedBanner}
                </div>
              )}

              {knobToast && (
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#2d0f0f] border-2 border-[#ff5555] text-[#ff7777] text-xs font-mono font-bold shadow-[0_0_20px_rgba(255,85,85,0.6)] animate-pulse rounded-lg flex items-center gap-2"
                >
                  <span>⚠️</span>
                  <span>{knobToast}</span>
                </div>
              )}

              <img
                src="/svg/glass-overlay.svg"
                alt=""
                className={`absolute inset-0 w-full h-full object-fill pointer-events-none ${
                  isLightMode ? 'opacity-25' : 'opacity-60'
                }`}
              />
              {!isLightMode && <div className="crt-vignette" />}
            </div>

            {/* RIGHT CONTROL PANEL (Matches the Zoomed-Out Blue SVG TV Panel) */}
            <div
              className="w-60 xl:w-66 shrink-0 h-full rounded-[18px] p-3.5 xl:p-4 flex flex-col justify-between relative z-30 transition-colors duration-300"
              style={{
                background: isLightMode
                  ? 'linear-gradient(160deg, #2b588c 0%, #214670 58%, #183557 100%)'
                  : 'linear-gradient(160deg, #162840 0%, #101e30 58%, #0a1420 100%)',
                boxShadow: isLightMode
                  ? '-4px 0 18px rgba(10,25,45,0.45), inset 0 2px 4px rgba(255,255,255,0.28)'
                  : '-8px 0 26px rgba(0,0,0,0.8), inset 2px 0 8px rgba(166,226,110,0.18), inset 0 2px 3px rgba(140,190,255,0.16)',
                border: isLightMode ? '2px solid #60a5fa' : '2px solid #2b4a6f',
              }}
            >
              {/* Top Section: Power LED & Prominent Power Switch Button */}
              <div className="flex flex-col gap-2">
                <div
                  className={`rounded-xl p-2.5 border flex items-center justify-between ${
                    isLightMode
                      ? 'border-[#60a5fa] bg-[#1a385c]'
                      : 'border-[#2b4a6f] bg-[#0c1726]'
                  }`}
                  style={{
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.55)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full animate-pulse"
                      style={{
                        backgroundColor: isTvPoweredOff ? '#ef4444' : '#a6e26e',
                        boxShadow: isTvPoweredOff ? '0 0 10px #ef4444' : '0 0 10px #a6e26e',
                      }}
                    />
                    <span
                      className={`text-[8px] font-bold tracking-wider ${
                        isLightMode ? 'text-[#e2e8f0]' : 'text-[#b4beb4]'
                      }`}
                      style={{ fontFamily: 'var(--font-pixel)' }}
                    >
                      {isTvPoweredOff ? 'POWER: OFF' : 'POWER: ON'}
                    </span>
                  </div>

                  <span className="text-[8px] opacity-75 font-mono text-slate-300">
                    CRT 60Hz
                  </span>
                </div>

                {/* OBVIOUS POWER SWITCH BUTTON TO TURN OFF & EXIT TV */}
                <button
                  type="button"
                  onClick={() => {
                    setIsTvPoweredOff(true);
                    triggerZoomOut();
                  }}
                  title="Turn off TV and zoom out to room"
                  className="w-full py-2.5 px-3 rounded-xl cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg border-2 border-red-500/80 bg-gradient-to-b from-red-600 via-red-700 to-red-900 text-white font-bold group"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-200 group-hover:bg-white animate-pulse" />
                  <span
                    className="text-[10px] xl:text-[11px] uppercase tracking-wider font-mono text-red-100 group-hover:text-white"
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    ⏻ POWER OFF (EXIT)
                  </span>
                </button>
              </div>

              {/* MATCHING SVG DUAL ROTARY KNOBS: 1. CHANNEL | 2. SCROLL */}
              <div
                className={`rounded-2xl p-3 flex flex-col items-center justify-around gap-3 border ${
                  isLightMode
                    ? 'border-[#5288c4] bg-[#173252]'
                    : 'border-[#274466] bg-[#0b1524]'
                }`}
                style={{
                  boxShadow: 'inset 0 6px 16px rgba(0,0,0,0.65)',
                }}
              >
                {/* Knob 1: Channel Selector */}
                <MatchingSvgRotaryKnob
                  angle={channelKnobAngle}
                  onTurnClockwise={() => turnChannel('next')}
                  onTurnCounterClockwise={() => turnChannel('prev')}
                  label="CHANNEL"
                  accentColor="#a6e26e"
                  isLightMode={isLightMode}
                  isWiggling={knobWiggleChannel}
                />

                <div className={`w-full h-[1px] ${isLightMode ? 'bg-[#3b699e]' : 'bg-[#213a57]'}`} />

                {/* Knob 2: Scroll Selector (Scrolls options on active channel) */}
                <MatchingSvgRotaryKnob
                  angle={scrollKnobAngle}
                  onTurnClockwise={() => turnScroll('next')}
                  onTurnCounterClockwise={() => turnScroll('prev')}
                  label="SCROLL"
                  accentColor="#e6cf65"
                  isLightMode={isLightMode}
                  isWiggling={knobWiggleScroll}
                />
              </div>

              {/* SINGLE SELECT BUTTON TO OPEN SELECTED OPTION */}
              <button
                type="button"
                onClick={handlePressSelectButton}
                className="w-full py-3 px-3 rounded-xl cursor-pointer active:translate-y-1 transition-all flex items-center justify-center gap-2 group"
                style={{
                  background: 'linear-gradient(180deg, #2b6e48 0%, #1e5235 65%, #143824 100%)',
                  boxShadow:
                    '0 5px 0 #0c2416, 0 8px 14px rgba(0,0,0,0.6), inset 0 1px 2px rgba(166,226,110,0.55)',
                  border: '2px solid #a6e26e',
                }}
              >
                <span
                  className="text-[9px] xl:text-[10px] text-[#e2f9c8] font-bold tracking-wider uppercase group-hover:text-white transition-colors"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                >
                  {'\uf061'} SELECT
                </span>
              </button>

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
  // MODE 2: ROOM VIEW WITH INTERACTIVE HANGING LIGHT BULB IN THE MIDDLE
  // - Default (isLightMode === false): Pitch-black room with green CRT ray-traced
  //   lighting and an OFF light bulb hanging in the middle of the room.
  // - Touching the light bulb turns it ON and switches the entire room, TV,
  //   Console, Shelf, Cartridges, and Screen to Light Mode accordingly!
  // ============================================================================

  // Subtitle text when hovering a cartridge, the console, or the room light bulb
  const hoverSubtitle = hoveredBulb
    ? isLightMode
      ? '"Ahhh my eyes! Click the bulb to turn it back off (>_<)"'
      : '"It\'s dark in here... click the bulb to turn the light on (•‿•)"'
    : hoveredProject
    ? `"${hoveredProject.originNote || hoveredProject.tagline}"`
    : hoveredConsole
    ? '"This doesn\'t really do much ¯\\_(ツ)_/¯"'
    : '';

  // Shelf cubby floor Y-coordinates in local shelf coordinates
  const cubbyFloorYs = [326, 446, 566, 686, 806];

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${
        isLightMode ? 'bg-[#ded3be]' : 'bg-[#020302]'
      }`}
    >
      <div className="relative w-screen h-screen">
        {/* TV Static Transition Burst when switching camera view modes */}
        {staticBurst && (
          <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden animate-tvStaticBurst">
            <img
              src="/img/tv-static.gif"
              alt="TV Static"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        )}

        {/* ================================================================== */}
        {/* TOP HEADLINE & HOVER NOTE (ADAPTS TO DARK/LIGHT MODE)              */}
        {/* ================================================================== */}
        <div className="absolute top-[4%] inset-x-0 z-40 flex flex-col items-center px-6 text-center pointer-events-none">
          <h1
            className={`text-xs sm:text-sm md:text-base lg:text-xl tracking-wider leading-relaxed transition-colors duration-300 ${
              isLightMode ? 'text-[#241f19]' : 'pixel-dull-white'
            }`}
            style={{
              fontFamily: 'var(--font-pixel)',
              textShadow: isLightMode ? '0 2px 0 rgba(255,255,255,0.75)' : undefined,
            }}
          >
            Projects that I made based on my needs, not for showcases (｡•̀ᴗ-)✧
          </h1>

          <div className="h-14 sm:h-16 mt-2.5 flex items-center justify-center max-w-4xl">
            <p
              className={`text-[10px] sm:text-xs md:text-sm leading-relaxed transition-all duration-200 ${
                hoverSubtitle ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
              } ${isLightMode ? 'text-[#3b3228]' : 'pixel-dull-white'}`}
              style={{
                fontFamily: 'var(--font-pixel)',
                textShadow: isLightMode ? '0 1px 0 rgba(255,255,255,0.7)' : undefined,
              }}
            >
              {hoverSubtitle}
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* UNIFIED 1920x1080 SVG SCENE (overflow-visible to fill ultrawide)   */}
        {/* ================================================================== */}
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid meet"
          className="relative z-20 w-full h-full overflow-visible"
        >
          <defs>
            {/* ---------------- RAY-TRACED LIGHTING GRADIENTS (DARK MODE) ---------------- */}
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

            {/* ---------------- LIGHT MODE ROOM & BULB GRADIENTS ---------------- */}
            <radialGradient id="lightModeWall" cx="0.435" cy="0.28" r="0.75">
              <stop offset="0%" stopColor="#fffdf5" />
              <stop offset="35%" stopColor="#f5eedc" />
              <stop offset="100%" stopColor="#ded3be" />
            </radialGradient>
            <linearGradient id="lightModeFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4c5ac" />
              <stop offset="100%" stopColor="#bca98c" />
            </linearGradient>
            <radialGradient id="bulbWarmAura" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.7" />
              <stop offset="35%" stopColor="#fde047" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="bulbGlassOn" cx="0.45" cy="0.42" r="0.55">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="85%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </radialGradient>
            <radialGradient id="bulbGlassOff" cx="0.38" cy="0.38" r="0.6">
              <stop offset="0%" stopColor="#263629" />
              <stop offset="60%" stopColor="#121a14" />
              <stop offset="100%" stopColor="#090d0a" />
            </radialGradient>

            <filter id="rtSoftBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <filter id="rtFineBlur" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="6" />
            </filter>

            {/* ---------------- BLUE TV CASING GRADIENTS (DARK & LIGHT) ---------------- */}
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

            <linearGradient id="tvBlueFrontLight" x1="0" y1="0" x2="1" y2="0.2">
              <stop offset="0%" stopColor="#3e7ec4" />
              <stop offset="55%" stopColor="#2f66a3" />
              <stop offset="100%" stopColor="#224c7d" />
            </linearGradient>
            <linearGradient id="tvBlueLeftSideLight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#214978" />
              <stop offset="100%" stopColor="#326aa8" />
            </linearGradient>
            <linearGradient id="tvBlueTopLight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#589be3" />
              <stop offset="100%" stopColor="#3b78bd" />
            </linearGradient>

            {/* Clip Path for Live CRT Screen Inside the Angled Blue TV */}
            <clipPath id="angledTvScreenClip">
              <polygon points="206,314 512,304 512,601 206,611" />
            </clipPath>

            {/* ---------------- WHITE CONSOLE GRADIENTS (DARK & LIGHT) ---------------- */}
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

            <linearGradient id="consoleLightTop" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="consoleLightFront" x1="0" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="65%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="consoleLightLeftSide" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>

            {/* Clip Path at the Exact Front Lip of the Console's Front-Deck Cartridge Slot */}
            <clipPath id="consoleSlotMouthClip">
              <polygon points="300,498 550,488 550,664 300,672" />
            </clipPath>

            {/* ---------------- BROWN WOODEN SHELF GRADIENTS (DARK & LIGHT) ---------------- */}
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

            <linearGradient id="shelfLightLeftWall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a66c42" />
              <stop offset="100%" stopColor="#85522d" />
            </linearGradient>
            <linearGradient id="shelfLightRightWall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#784827" />
              <stop offset="100%" stopColor="#593319" />
            </linearGradient>
            <linearGradient id="shelfLightBackWall" x1="0" y1="0" x2="1" y2="0.8">
              <stop offset="0%" stopColor="#6e4224" />
              <stop offset="100%" stopColor="#4f2d16" />
            </linearGradient>
            <linearGradient id="shelfLightPlankTop" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#b07548" />
              <stop offset="100%" stopColor="#8c5832" />
            </linearGradient>
            <linearGradient id="shelfLightPlankFront" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#c48554" />
              <stop offset="100%" stopColor="#966138" />
            </linearGradient>

          </defs>

          {/* ================================================================ */}
          {/* 1. ROOM BACKDROP, BASEBOARD & FLOOR (DARK VS LIGHT MODE)         */}
          {/* Extended from x=-3000 to 8000 to seamlessly fill ultrawide sides */}
          {/* ================================================================ */}
          {isLightMode ? (
            <>
              {/* Warm Cream Wall */}
              <rect x="-3000" y="-1000" width="8000" height="1748" fill="url(#lightModeWall)" />
              {/* Architectural Baseboard / Skirting Trim at y=746..756 */}
              <rect x="-3000" y="746" width="8000" height="12" fill="#d4c5ac" />
              <line x1="-3000" y1="746" x2="5000" y2="746" stroke="#a39074" strokeWidth="2" />
              <line x1="-3000" y1="758" x2="5000" y2="758" stroke="#8c7960" strokeWidth="1.5" />
              {/* Solid Tan Floor extending from y=758 downward */}
              <rect x="-3000" y="758" width="8000" height="1400" fill="url(#lightModeFloor)" />
              {/* Warm Ambient Overhead Glow from the Lit Bulb */}
              <ellipse
                cx="835"
                cy="305"
                rx="780"
                ry="540"
                fill="url(#bulbWarmAura)"
                filter="url(#rtSoftBlur)"
              />
            </>
          ) : (
            <>
              {/* Dark Room Back Wall */}
              <rect x="-3000" y="-1000" width="8000" height="1748" fill="#020302" />
              {/* Architectural Baseboard Trim */}
              <rect x="-3000" y="746" width="8000" height="12" fill="#0a120c" />
              <line x1="-3000" y1="746" x2="5000" y2="746" stroke="#162919" strokeWidth="1.5" opacity="0.6" />
              <line x1="-3000" y1="758" x2="5000" y2="758" stroke="#060a07" strokeWidth="1" />
              {/* Dark Room Floor */}
              <rect x="-3000" y="758" width="8000" height="1400" fill="#040605" />
              <ellipse
                cx="780"
                cy="920"
                rx="720"
                ry="135"
                fill="url(#rtFloorBounce)"
                filter="url(#rtSoftBlur)"
              />
            </>
          )}

          {/* Ground Cast Shadow Attached Seamlessly to the Bottom of the Shelf */}
          <polygon
            points="1000,870 1680,890 1860,945 1080,915"
            fill={isLightMode ? '#8c7960' : '#000000'}
            opacity={isLightMode ? '0.40' : '0.88'}
          />
          {/* Contact Ambient Occlusion Strip directly touching the Shelf base plinth */}
          <polygon
            points="996,868 1684,888 1716,870 1028,850"
            fill={isLightMode ? '#3d2b1f' : '#000000'}
            opacity={isLightMode ? '0.55' : '0.96'}
          />

          {/* ================================================================ */}
          {/* 1B. DIRECT FLOOR CONTACT SHADOW UNDER THE TV & CONSOLE           */}
          {/* ================================================================ */}
          {/* Soft Ground Contact Shadow Directly Grounding the Console Base on the Floor */}
          <polygon
            points="100,776 182,826 676,810 594,760"
            fill={isLightMode ? '#786550' : '#000000'}
            opacity={isLightMode ? '0.50' : '0.92'}
            filter="url(#rtFineBlur)"
          />
          {/* Deep Ambient Occlusion Contact Line Grounding the Front Base */}
          <polygon
            points="186,825 674,809 676,815 188,831"
            fill={isLightMode ? '#4a3b2c' : '#000000'}
            opacity={isLightMode ? '0.72' : '0.98'}
          />

          {/* ================================================================ */}
          {/* 1C. INTERACTIVE HANGING LIGHT BULB IN THE MIDDLE OF THE ROOM     */}
          {/*     Touching toggles Light Mode with an expanding ball of light! */}
          {/* ================================================================ */}
          <g
            ref={bulbRef}
            onMouseEnter={() => setHoveredBulb(true)}
            onMouseLeave={() => setHoveredBulb(false)}
            onClick={handleTouchBulb}
            className="cursor-pointer"
          >
            {/* Invisible Hit Target Around Bulb & Pull Chain for Easy Touching */}
            <rect x="780" y="0" width="110" height="390" fill="transparent" />

            {/* Ceiling Canopy Rose */}
            <polygon
              points="815,0 855,0 849,14 821,14"
              fill={isLightMode ? '#475569' : '#18241b'}
              stroke={isLightMode ? '#334155' : '#334d38'}
              strokeWidth="1.5"
            />

            {/* Hanging Electrical Cord down to the middle of the room */}
            <line
              x1="835"
              y1="14"
              x2="835"
              y2="250"
              stroke={isLightMode ? '#334155' : '#243628'}
              strokeWidth="4"
            />

            {/* Pull-Chain Hanging from the Socket Side with Tactile Spring Yank */}
            <g
              className={isYankingChain ? 'animate-pullChainYank' : ''}
              style={{ transformOrigin: '853px 268px' }}
            >
              <line
                x1="853"
                y1="268"
                x2="853"
                y2="352"
                stroke={isLightMode ? '#b45309' : '#526b56'}
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              <circle
                cx="853"
                cy="357"
                r="5"
                fill={isLightMode ? '#f59e0b' : '#6ca144'}
                stroke={isLightMode ? '#78350f' : '#203322'}
                strokeWidth="1.5"
              />
            </g>

            {/* Brass / Ceramic Bulb Socket */}
            <rect
              x="822"
              y="248"
              width="26"
              height="18"
              rx="3"
              fill={isLightMode ? '#d97706' : '#28382b'}
              stroke={isLightMode ? '#92400e' : '#537558'}
              strokeWidth="1.5"
            />
            <rect
              x="825"
              y="266"
              width="20"
              height="10"
              rx="2"
              fill={isLightMode ? '#b45309' : '#1d2920'}
              stroke={isLightMode ? '#78350f' : '#436147'}
              strokeWidth="1.2"
            />

            {/* Outer Warm Halo When Bulb is ON */}
            {isLightMode && (
              <circle
                cx="835"
                cy="310"
                r="64"
                fill="url(#bulbWarmAura)"
                filter="url(#rtFineBlur)"
              />
            )}

            {/* Glass Bulb Envelope */}
            <path
              d="M 825,275 C 823,286 803,294 803,314 A 32,32 0 1,0 867,314 C 867,294 847,286 845,275 Z"
              fill={isLightMode ? 'url(#bulbGlassOn)' : 'url(#bulbGlassOff)'}
              stroke={hoveredBulb ? '#fde047' : isLightMode ? '#f59e0b' : '#4f7555'}
              strokeWidth={hoveredBulb ? '2.5' : '1.8'}
            />

            {/* Subtle Green CRT Ray-Traced Rim Reflection on Left Side of Unlit Bulb */}
            {!isLightMode && (
              <path
                d="M 807,304 A 29,29 0 0,0 816,336"
                fill="none"
                stroke="#a6e26e"
                strokeWidth="2"
                strokeOpacity="0.7"
              />
            )}

            {/* Internal Tungsten Filament */}
            <path
              d="M 829,276 L 829,304 L 823,316 L 835,308 L 847,316 L 841,304 L 841,276"
              fill="none"
              stroke={isLightMode ? '#ffffff' : hoveredBulb ? '#a6e26e' : '#465949'}
              strokeWidth={isLightMode ? '2.4' : '1.6'}
              strokeLinejoin="round"
            />
          </g>

          {/* ================================================================ */}
          {/* 2. WHITE CONSOLE DECK ("Definitely Legally Distinct Console")    */}
          {/* ================================================================ */}
          <g
            onMouseEnter={() => setHoveredConsole(true)}
            onMouseLeave={() => setHoveredConsole(false)}
            className="cursor-pointer"
          >
            {/* Console 3D Left Side Wall */}
            <polygon
              points="110,632 190,680 190,826 110,778"
              fill={isLightMode ? 'url(#consoleLightLeftSide)' : 'url(#consoleWhiteLeftSide)'}
              stroke={isLightMode ? '#94a3b8' : '#5c646e'}
              strokeWidth="1.5"
            />

            {/* Console 3D Deep Top Deck */}
            <polygon
              points="190,680 110,632 590,616 670,664"
              fill={isLightMode ? 'url(#consoleLightTop)' : 'url(#consoleWhiteTopRay)'}
              stroke={isLightMode ? '#cbd5e1' : '#85b87e'}
              strokeWidth="2"
            />

            {/* Contact Shadow on Rear Half of Console Top Deck Where the Blue TV Sits */}
            <polygon
              points="164,658 122,633 580,618 622,643"
              fill={isLightMode ? '#94a3b8' : '#0a120d'}
              opacity={isLightMode ? '0.45' : '0.78'}
            />
          </g>

          {/* ================================================================ */}
          {/* 3. BLUE CRT TV SITTING 100% INSIDE THE REAR CONSOLE DECK         */}
          {/* ================================================================ */}
          <g
            onMouseEnter={handleTvMouseEnter}
            onMouseLeave={handleTvMouseLeave}
            onClick={triggerZoomIn}
            className="cursor-zoom-in"
          >
            {/* 3D Top Roof of Blue TV */}
            <polygon
              points="168,286 126,261 576,246 618,271"
              fill={isLightMode ? 'url(#tvBlueTopLight)' : 'url(#tvBlueTop)'}
              stroke={isLightMode ? '#60a5fa' : '#3b699e'}
              strokeWidth="2"
            />

            {/* 3D Left Side Depth Wall of Blue TV */}
            <polygon
              points="126,261 168,286 168,656 126,631"
              fill={isLightMode ? 'url(#tvBlueLeftSideLight)' : 'url(#tvBlueLeftSide)'}
              stroke={isLightMode ? '#3b82f6' : '#2c4f7c'}
              strokeWidth="2"
            />

            {/* Ventilation Slots on Left Side Wall */}
            {[332, 354, 376, 398, 420, 442].map((vy) => (
              <line
                key={vy}
                x1="134"
                y1={vy}
                x2="160"
                y2={vy + 15}
                stroke={isLightMode ? '#173457' : '#08111f'}
                strokeWidth="4"
                strokeLinecap="round"
              />
            ))}

            {/* Main Blue TV Front Face */}
            <polygon
              points="168,286 618,271 618,641 168,656"
              fill={isLightMode ? 'url(#tvBlueFrontLight)' : 'url(#tvBlueFront)'}
              stroke={isLightMode ? '#60a5fa' : '#38669c'}
              strokeWidth="2.5"
            />

            {/* Live CRT Screen Embedded Directly Inside the SVG TV Bezel */}
            <g clipPath="url(#angledTvScreenClip)">
              <polygon
                points="206,314 512,304 512,601 206,611"
                fill={isLightMode ? '#e6f0e2' : '#070c08'}
              />
              <foreignObject x="204" y="302" width="310" height="310" className="pointer-events-none">
                <div
                  className="w-full h-full crt-screen-container overflow-hidden pointer-events-none relative"
                  style={{
                    transform: 'skewY(-1.9deg)',
                    transformOrigin: 'left center',
                  }}
                >
                  {isTvPoweredOff ? (
                    <div className="w-full h-full bg-[#050805] flex items-center justify-center relative overflow-hidden">
                      <img
                        src="/img/tv-static.gif"
                        alt="White Noise Static"
                        className="w-full h-full object-cover opacity-90 mix-blend-screen"
                      />
                      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                      <div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-black/80 border border-red-500/80 text-red-400 text-[10px] font-bold font-mono tracking-wider animate-pulse whitespace-nowrap shadow-lg"
                        style={{ fontFamily: 'var(--font-pixel)' }}
                      >
                        [ TV STANDBY - CLICK TO POWER ON ]
                      </div>
                    </div>
                  ) : (
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
                      isLightMode={isLightMode}
                    />
                  )}
                </div>
              </foreignObject>
            </g>

            {/* Inner Chamfered Screen Bezel */}
            <polygon
              points="202,310 516,300 516,605 202,615"
              fill="none"
              stroke={isLightMode ? '#60a5fa' : 'url(#tvBezelGreenRay)'}
              strokeWidth="5"
            />
            <polygon
              points="206,314 512,304 512,601 206,611"
              fill="none"
              stroke={isLightMode ? '#93c5fd' : '#a6e26e'}
              strokeOpacity="0.7"
              strokeWidth="2"
            />

            {/* Right-Side Control Panel on the Angled Blue SVG TV */}
            <polygon
              points="528,299 604,296 604,601 528,604"
              fill={isLightMode ? '#1d4470' : '#0e1d30'}
              stroke={isLightMode ? '#60a5fa' : '#2d527d'}
              strokeWidth="1.5"
            />
            {!isLightMode && (
              <line
                x1="528"
                y1="301"
                x2="528"
                y2="602"
                stroke="#8ce072"
                strokeOpacity="0.75"
                strokeWidth="2"
              />
            )}

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

            {/* Directed Tooltip & TV Highlight on Load (Active for 5s in Room View) */}
            {showGuideTooltip && (
              <g className="pointer-events-none">
                {/* Pulsing highlight around the TV cabinet */}
                <polygon
                  points="164,282 622,267 622,645 164,660"
                  fill="none"
                  stroke="#a6e26e"
                  strokeWidth="3.5"
                  strokeDasharray="8,6"
                  className="animate-pulse"
                  filter="url(#rtGlow)"
                />
                {/* Floating directed speech bubble pointing to TV */}
                <g transform="translate(393, 220)" className="animate-bounce">
                  {/* Tooltip background pill */}
                  <rect
                    x="-140"
                    y="-38"
                    width="280"
                    height="32"
                    rx="6"
                    fill="#0a120d"
                    fillOpacity="0.95"
                    stroke="#a6e26e"
                    strokeWidth="1.5"
                    filter="url(#rtFineBlur)"
                  />
                  {/* Speech bubble pointer arrow pointing down to TV */}
                  <polygon
                    points="-8,-6 8,-6 0,4"
                    fill="#0a120d"
                    stroke="#a6e26e"
                    strokeWidth="1.5"
                  />
                  <line x1="-7" y1="-6" x2="7" y2="-6" stroke="#0a120d" strokeWidth="2.5" />
                  {/* Tooltip text */}
                  <text
                    x="0"
                    y="-18"
                    fill="#a6e26e"
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    letterSpacing="0.05em"
                  >
                    HOVER 2s (OR CLICK) TO ENTER TV
                  </text>
                </g>
              </g>
            )}
          </g>

          {/* ================================================================ */}
          {/* 4. FRONT DECK SLOT & FRONT FACE OF THE WHITE CONSOLE             */}
          {/* ================================================================ */}
          <g
            onMouseEnter={() => setHoveredConsole(true)}
            onMouseLeave={() => setHoveredConsole(false)}
            className="cursor-pointer"
          >
            {/* Specular Green Ray-Traced Reflection Pool on the Front Deck (Dark Mode only) */}
            {!isLightMode && (
              <ellipse
                cx="415"
                cy="656"
                rx="155"
                ry="12"
                fill="#a6e26e"
                opacity="0.38"
                filter="url(#rtFineBlur)"
              />
            )}

            {/* Top-Loading Cartridge Slot Recessed Well on the Front Console Deck */}
            <polygon
              points="314,654 518,647 530,663 326,670"
              fill={isLightMode ? '#334155' : '#0a120c'}
              stroke={isLightMode ? '#94a3b8' : '#6cbf5e'}
              strokeWidth="2"
            />
            {!isLightMode && (
              <line x1="316" y1="656" x2="516" y2="649" stroke="#a6e26e" strokeWidth="1.5" strokeOpacity="0.85" />
            )}

            {/* SLIDING CARTRIDGE ENTERING THE CONSOLE SLOT MOUTH */}
            {activeCartridge &&
              (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting') && (
                <g clipPath="url(#consoleSlotMouthClip)">
                  <g
                    className={
                      cameraMode === 'ejecting' ? 'animate-ejectCartridge' : 'animate-insertCartridge'
                    }
                  >
                    <polygon
                      points="340,564 328,556 498,550 510,558"
                      fill={isLightMode ? '#cbd5e1' : '#35523a'}
                      stroke={isLightMode ? '#64748b' : '#a6e26e'}
                      strokeWidth="1.5"
                    />
                    <polygon
                      points="340,564 510,558 510,694 340,700"
                      fill={isLightMode ? '#e2e8f0' : '#1d2b20'}
                      stroke={isLightMode ? '#64748b' : '#a6e26e'}
                      strokeWidth="2"
                    />
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
                      fill={isLightMode ? '#1e293b' : '#b4beb4'}
                      fontSize="11"
                      fontFamily="var(--font-pixel)"
                    >
                      {activeCartridge.name}
                    </text>
                  </g>
                </g>
              )}

            {/* Front Lip of the Console Slot */}
            <polygon
              points="324,668 532,661 536,667 328,674"
              fill={isLightMode ? '#e2e8f0' : '#b8d4b4'}
              stroke={isLightMode ? '#94a3b8' : '#76bd68'}
              strokeWidth="1"
            />

            {/* WHITE CONSOLE: Front Body Panel */}
            <polygon
              points="190,680 670,664 670,810 190,826"
              fill={isLightMode ? 'url(#consoleLightFront)' : 'url(#consoleWhiteFront)'}
              stroke={isLightMode ? '#94a3b8' : '#8c9ba6'}
              strokeWidth="2"
            />

            {/* Upper Front Lip Highlight */}
            <line
              x1="192"
              y1="680"
              x2="668"
              y2="664"
              stroke={isLightMode ? '#ffffff' : '#a6e26e'}
              strokeOpacity="0.9"
              strokeWidth="2.5"
            />

            {/* Console Recessed Control Strip & Controller Ports */}
            <polygon
              points="214,704 646,690 646,748 214,762"
              fill={isLightMode ? '#cbd5e1' : '#9ba4ad'}
              stroke={isLightMode ? '#94a3b8' : '#747d87'}
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
              fill={isLightMode ? '#64748b' : '#5a636e'}
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

            {/* Console Front Nameplate: Fits 100% inside [214..646] with zero overlap on LED at cx=228 */}
            <polygon
              points="214,776 646,762 646,792 214,806"
              fill="#182026"
              stroke={isLightMode ? '#64748b' : '#5b7a5e'}
              strokeWidth="1.5"
            />
            <circle cx="228" cy="791" r="4.5" fill="#a6e26e" />
            <text
              x="444"
              y="787"
              textAnchor="middle"
              fill="#b4beb4"
              fontSize="8.5"
              fontFamily="var(--font-pixel)"
              textLength="348"
              lengthAdjust="spacingAndGlyphs"
              transform="rotate(-1.86 444 787)"
            >
              Definitely Legally Distinct Console
            </text>
          </g>

          {/* ================================================================ */}
          {/* 5. FOREGROUND BROWN WOODEN SHELF TILTED TOWARD THE TV            */}
          {/* ================================================================ */}
          <g transform="translate(1000, 0) skewY(1.68)">
            {/* Recessed Interior Back Wooden Wall of Shelf */}
            <rect
              x="32"
              y="186"
              width="680"
              height="684"
              fill={isLightMode ? 'url(#shelfLightBackWall)' : 'url(#shelfBrownBackWall)'}
              stroke={isLightMode ? '#593319' : '#3b2416'}
              strokeWidth="2"
            />

            {/* 3D Interior Left Wooden Wall of Shelf */}
            <polygon
              points="0,204 32,186 32,852 0,870"
              fill={isLightMode ? 'url(#shelfLightLeftWall)' : 'url(#shelfBrownLeftWallRay)'}
              stroke={isLightMode ? '#784827' : '#658c4a'}
              strokeOpacity="0.8"
              strokeWidth="1.5"
            />

            {/* 3D Top Wooden Roof Plank of Brown Shelf */}
            <polygon
              points="0,204 32,186 712,186 680,204"
              fill={isLightMode ? 'url(#shelfLightPlankTop)' : 'url(#shelfBrownPlankTop)'}
              stroke={isLightMode ? '#85522d' : '#658c4a'}
              strokeWidth="1.5"
            />

            {/* Retro Carved Wooden Signboard: "PROJECTS" on top of the Shelf */}
            <g transform="translate(180, 118)">
              {/* Wooden Sign Stand Left & Right Brackets */}
              <polygon points="40,68 52,68 50,78 38,78" fill="#1b120c" stroke="#3d2719" strokeWidth="1" />
              <polygon points="268,68 280,68 278,78 266,78" fill="#1b120c" stroke="#3d2719" strokeWidth="1" />

              {/* Wooden Plaque Body */}
              <polygon
                points="16,24 304,24 296,68 8,68"
                fill={isLightMode ? '#8f6443' : '#2b1b12'}
                stroke={isLightMode ? '#d99763' : '#4a2f20'}
                strokeWidth="2"
              />
              {/* Inner Inset Rim Border */}
              <polygon
                points="22,28 298,28 290,64 16,64"
                fill={isLightMode ? '#a3724c' : '#1f130d'}
                stroke={isLightMode ? '#6e4427' : '#573826'}
                strokeWidth="1.2"
              />
              {/* Brass Screw Rivets */}
              <circle cx="28" cy="46" r="2.5" fill={isLightMode ? '#d97706' : '#7a5a3a'} stroke="#1f130d" strokeWidth="0.8" />
              <circle cx="286" cy="46" r="2.5" fill={isLightMode ? '#d97706' : '#7a5a3a'} stroke="#1f130d" strokeWidth="0.8" />

              {/* Glowing / Engraved "PROJECTS" Sign Text */}
              <text
                x="157"
                y="52"
                textAnchor="middle"
                fill={isLightMode ? '#fef3c7' : '#a6e26e'}
                fontSize="18"
                fontWeight="900"
                letterSpacing="0.25em"
                style={{
                  fontFamily: 'var(--font-pixel)',
                  textShadow: isLightMode
                    ? '1px 1px 0px #451a03'
                    : '0 0 10px rgba(166,226,110,0.6), 2px 2px 0px #0c140d',
                }}
              >
                PROJECTS
              </text>
            </g>

            {/* Top Frame Front Lip of Brown Shelf */}
            <rect
              x="0"
              y="204"
              width="680"
              height="14"
              fill={isLightMode ? 'url(#shelfLightPlankFront)' : 'url(#shelfBrownPlankFront)'}
            />
            <line
              x1="0"
              y1="205"
              x2="680"
              y2="205"
              stroke={isLightMode ? '#e6b38a' : '#a6e26e'}
              strokeOpacity="0.7"
              strokeWidth="2"
            />

            {/* 5 SHELF CUBBIES WITH PROPERLY SEATED 3D SIDE-VIEW CARTRIDGES */}
            {cubbyFloorYs.map((floorY, idx) => {
              const project = projects[idx];
              const isHovered = project ? hoveredProjectId === project.id : false;
              const isCurrentlyInSlot =
                project &&
                activeCartridgeId === project.id &&
                (cameraMode === 'inserting' || cameraMode === 'zooming-in' || cameraMode === 'ejecting');

              const cartBottomY = floorY - 3;
              const cartTopY = cartBottomY - 72;
              const cartLeftX = 36;
              const cartRightX = 640;

              return (
                <g key={floorY}>
                  {/* 3D Top Surface of the Wooden Cubby Plank */}
                  <polygon
                    points={`0,${floorY} 32,${floorY - 18} 712,${floorY - 18} 680,${floorY}`}
                    fill={isLightMode ? 'url(#shelfLightPlankTop)' : 'url(#shelfBrownPlankTop)'}
                  />

                  {/* Interior Left Cubby Corner Crease */}
                  <line
                    x1="0"
                    y1={floorY}
                    x2="32"
                    y2={floorY - 18}
                    stroke={isLightMode ? '#784827' : '#6ea654'}
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                  />

                  {/* Contact Shadow on the Plank Directly Under the Cartridge */}
                  {!isCurrentlyInSlot && (
                    <polygon
                      points={`${cartLeftX - 4},${floorY - 2} ${cartLeftX + 22},${floorY - 17} ${cartRightX + 26},${floorY - 17} ${cartRightX + 2},${floorY - 2}`}
                      fill={isLightMode ? '#3b2110' : '#050302'}
                      opacity={isLightMode ? '0.4' : isHovered ? '0.52' : '0.84'}
                    />
                  )}

                  {/* Front Thickness Face of the Wooden Shelf Plank */}
                  <rect
                    x="0"
                    y={floorY}
                    width="680"
                    height="14"
                    fill={isLightMode ? 'url(#shelfLightPlankFront)' : 'url(#shelfBrownPlankFront)'}
                  />
                  <line
                    x1="0"
                    y1={floorY + 1}
                    x2="520"
                    y2={floorY + 1}
                    stroke={isLightMode ? '#e6b38a' : '#a6e26e'}
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
                            stopColor={
                              isLightMode
                                ? isHovered
                                  ? '#ffffff'
                                  : '#e2e8f0'
                                : isHovered
                                ? '#3b5e3e'
                                : '#2b452e'
                            }
                          />
                          <stop
                            offset="26%"
                            stopColor={
                              isLightMode
                                ? isHovered
                                  ? '#f1f5f9'
                                  : '#cbd5e1'
                                : isHovered
                                ? '#29382c'
                                : '#1e2820'
                            }
                          />
                          <stop offset="100%" stopColor={isLightMode ? '#94a3b8' : '#141816'} />
                        </linearGradient>
                      </defs>

                      {/* 3D Top Face of Cartridge */}
                      <polygon
                        points={`${cartLeftX},${cartTopY} ${cartLeftX + 24},${cartTopY - 13.5} ${cartRightX + 24},${cartTopY - 13.5} ${cartRightX},${cartTopY}`}
                        fill={
                          isLightMode
                            ? isHovered
                              ? '#ffffff'
                              : '#f1f5f9'
                            : isHovered
                            ? '#4c7350'
                            : '#314a34'
                        }
                        stroke={
                          isLightMode
                            ? isHovered
                              ? '#3b82f6'
                              : '#94a3b8'
                            : isHovered
                            ? '#a6e26e'
                            : '#4a6b4e'
                        }
                        strokeWidth="1.2"
                      />

                      {/* 3D Right Depth Face of Cartridge Inside the Cubby */}
                      <polygon
                        points={`${cartRightX},${cartTopY} ${cartRightX + 24},${cartTopY - 13.5} ${cartRightX + 24},${cartBottomY - 13.5} ${cartRightX},${cartBottomY}`}
                        fill={isLightMode ? '#64748b' : '#0d110e'}
                        stroke={isLightMode ? '#475569' : '#253027'}
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
                        stroke={
                          isLightMode
                            ? isHovered
                              ? '#2563eb'
                              : '#64748b'
                            : isHovered
                            ? '#a6e26e'
                            : '#436147'
                        }
                        strokeWidth={isHovered ? '2.2' : '1.5'}
                      />

                      {/* Specular Left Edge */}
                      <line
                        x1={cartLeftX + 1}
                        y1={cartTopY + 3}
                        x2={cartLeftX + 1}
                        y2={cartBottomY - 3}
                        stroke={isLightMode ? '#ffffff' : '#b8f284'}
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
                        fill={isLightMode ? '#1e293b' : '#0c100d'}
                        stroke={isLightMode ? '#475569' : isHovered ? '#6ca144' : '#28382a'}
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

                      {/* Project Name on Spine */}
                      <text
                        x={cartLeftX + 100}
                        y={cartTopY + 43}
                        fill={isLightMode ? '#f8fafc' : isHovered ? '#d2dcd2' : '#b4beb4'}
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
                            stroke={isLightMode ? '#64748b' : '#090c0a'}
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          <line
                            x1={cartLeftX + offset + 2}
                            y1={cartTopY + 12}
                            x2={cartLeftX + offset + 2}
                            y2={cartBottomY - 12}
                            stroke={isLightMode ? '#cbd5e1' : '#3b523e'}
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

            {/* Bottom Base Plinth / Kickplate of Shelf */}
            <rect
              x="0"
              y="854"
              width="680"
              height="16"
              fill={isLightMode ? 'url(#shelfLightPlankFront)' : 'url(#shelfBrownPlankFront)'}
              stroke={isLightMode ? '#784827' : '#382214'}
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="855"
              x2="680"
              y2="855"
              stroke={isLightMode ? '#e6b38a' : '#a6e26e'}
              strokeOpacity="0.75"
              strokeWidth="1.5"
            />

            {/* Front-Left Vertical Wooden Frame Post of Shelf */}
            <rect
              x="0"
              y="204"
              width="14"
              height="666"
              fill={isLightMode ? '#8c5832' : '#423822'}
              stroke={isLightMode ? '#593319' : '#2e2214'}
              strokeWidth="1"
            />
            <line
              x1="1"
              y1="204"
              x2="1"
              y2="870"
              stroke={isLightMode ? '#e6b38a' : '#b8f284'}
              strokeOpacity="0.92"
              strokeWidth="2.5"
            />

            {/* Front-Right Vertical Wooden Frame Post of Shelf */}
            <rect
              x="666"
              y="204"
              width="14"
              height="666"
              fill={isLightMode ? '#784827' : '#382214'}
              stroke={isLightMode ? '#4a2a14' : '#1c1008'}
              strokeWidth="1"
            />

            {/* Exterior 3D Right Side Wooden Wall of Shelf */}
            <polygon
              points="680,204 712,186 712,852 680,870"
              fill={isLightMode ? 'url(#shelfLightRightWall)' : 'url(#shelfBrownRightWallDark)'}
              stroke={isLightMode ? '#4a2a14' : '#26160c'}
              strokeWidth="1.5"
            />
          </g>

          {/* ================================================================ */}
          {/* 6. VOLUMETRIC RAY-TRACED CRT LIGHT BEAMS (DARK MODE ONLY)        */}
          {/* ================================================================ */}
          {!isLightMode && (
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
          )}
        </svg>
      </div>
    </div>
  );
};
