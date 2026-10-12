import { useState, useRef, useEffect, useMemo } from 'react';
import { flushSync } from 'react-dom';
import type { Project } from '../data/projects';
import {
  ConsoleScreenContent,
  getChannelOptions,
  type ScreenTab,
} from './ConsoleScreenContent';
import { fetchDeveloperStats, type DeveloperStats } from '../services/gitrepositorystatistics';
import type { SceneCameraMode } from './TVConsoleScene';

interface HandheldSceneProps {
  projects: Project[];
  cameraMode: SceneCameraMode;
  setCameraMode: (mode: SceneCameraMode) => void;
  onSelectProject: (projectId: string) => void;
  activeCartridgeId: string | null;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
}

const TABS: ScreenTab[] = ['status', 'cartridges', 'github', 'pings', 'hire'];

export const HandheldScene: React.FC<HandheldSceneProps> = ({
  projects,
  cameraMode,
  onSelectProject,
  activeCartridgeId,
  isLightMode = false,
  onToggleLightMode,
}) => {
  const [screenTab, setScreenTab] = useState<ScreenTab>('cartridges');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [optionIndex, setOptionIndex] = useState<number>(0);
  const [pingRefreshKey, setPingRefreshKey] = useState<number>(0);
  const lightButtonRef = useRef<HTMLButtonElement | null>(null);

  const toggleLightModeWithTransition = async (btnEl?: HTMLButtonElement | null) => {
    const willBeLight = !isLightMode;

    if (
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      onToggleLightMode?.();
      return;
    }

    const targetEl = btnEl || lightButtonRef.current;
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.75;
    let left = x;
    let top = y;

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
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

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;
  const highlightedProject =
    projects[((selectedIndex % projects.length) + projects.length) % projects.length] || projects[0];

  const cycleTab = (dir: 'prev' | 'next') => {
    const idx = TABS.indexOf(screenTab);
    setOptionIndex(0);
    if (dir === 'next') {
      setScreenTab(TABS[(idx + 1) % TABS.length]);
    } else {
      setScreenTab(TABS[(idx - 1 + TABS.length) % TABS.length]);
    }
  };

  const cycleItem = (dir: 'prev' | 'next') => {
    if (screenTab === 'cartridges') {
      setSelectedIndex((prev) =>
        dir === 'next'
          ? (prev + 1) % projects.length
          : (prev - 1 + projects.length) % projects.length
      );
    } else {
      setOptionIndex((prev) => (dir === 'next' ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const [stats, setStats] = useState<DeveloperStats | null>(null);

  useEffect(() => {
    fetchDeveloperStats().then(setStats);
  }, []);

  const currentChannelOptions = useMemo(
    () => getChannelOptions(screenTab, stats),
    [screenTab, stats]
  );

  const safeOptionIndex =
    currentChannelOptions.length > 0
      ? ((optionIndex % currentChannelOptions.length) + currentChannelOptions.length) %
        currentChannelOptions.length
      : 0;

  const handleActionA = () => {
    if (screenTab === 'cartridges') {
      onSelectProject(highlightedProject.id);
      return;
    }

    if (currentChannelOptions.length === 0) return;
    const opt = currentChannelOptions[safeOptionIndex];
    if (!opt) return;

    if (opt.action === 'ping') {
      setPingRefreshKey((prev) => prev + 1);
      return;
    }
    if (opt.action === 'copy' && opt.copyText) {
      navigator.clipboard?.writeText(opt.copyText).catch(() => {});
      return;
    }
    if (opt.url) {
      window.open(opt.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden select-none transition-colors duration-300 ${
        isLightMode ? 'bg-[#f5ecdd]' : 'bg-[#080706]'
      }`}
    >
      {/* ==================================================================== */}
      {/* TOP 50%: DIMENSIONAL RECESSED SCREEN HOUSING                         */}
      {/* ==================================================================== */}
      <div
        className="w-full h-1/2 p-2.5 sm:p-4 flex flex-col relative transition-all duration-300"
        style={{
          background: isLightMode
            ? 'linear-gradient(165deg, #e3dacb 0%, #d1c3b0 55%, #b8a692 100%)'
            : 'linear-gradient(165deg, #2b2624 0%, #1c1817 55%, #100e0d 100%)',
          boxShadow: isLightMode
            ? 'inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -8px 20px rgba(80,60,40,0.35)'
            : 'inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -8px 20px rgba(0,0,0,0.85)',
          borderBottom: isLightMode ? '4px solid #8c7d6b' : '4px solid #080605',
        }}
      >
        {/* Top Lens Bezel Header: Power LED + Backlight Status */}
        <div className="flex items-center justify-between px-2 mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: isLightMode ? '#f59e0b' : '#39e89b',
                boxShadow: isLightMode ? '0 0 10px #f59e0b' : '0 0 12px #39e89b',
              }}
            />
            <span
              className={`text-[7px] tracking-wider uppercase font-bold ${
                isLightMode ? 'text-[#3d342c]' : 'text-[#e2deda]'
              }`}
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {isLightMode ? 'DAYLIGHT (•‿•)' : 'BACKLIT (•‿•)'}
            </span>
          </div>

          <span
            className={`text-[7px] tracking-wider ${
              isLightMode ? 'text-[#4f4339]' : 'text-[#b8aba0]'
            }`}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            PORTFOLIO BOY :D
          </span>
        </div>

        {/* Deep Recessed Screen Cavity */}
        <div
          className={`relative flex-1 w-full rounded-[14px] overflow-hidden crt-screen-container transition-all duration-300 ${
            isLightMode ? 'bg-[#edf5eb]' : 'bg-[#040805]'
          }`}
          style={{
            boxShadow: isLightMode
              ? 'inset 0 4px 12px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.5)'
              : 'inset 0 8px 28px rgba(0,0,0,0.98), 0 2px 0 rgba(255,255,255,0.06), 0 0 40px rgba(57,232,155,0.22)',
            border: isLightMode ? '3px solid #738a70' : '3px solid #0e1610',
          }}
        >
          <ConsoleScreenContent
            projects={projects}
            activeTab={screenTab}
            selectedIndex={selectedIndex}
            optionIndex={optionIndex}
            pingRefreshKey={pingRefreshKey}
            isTableZoomedOut={false}
            insertingProject={cameraMode === 'inserting' ? activeCartridge : null}
            isLightMode={isLightMode}
          />

          {/* Curved Glass Reflection Asset */}
          <img
            src="/svg/glass-overlay.svg"
            alt=""
            className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-45"
          />
          {!isLightMode && <div className="crt-vignette" />}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM 50%: 3D MOULDED HANDHELD CONTROL DECK                         */}
      {/* ==================================================================== */}
      <div
        className="w-full h-1/2 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden"
        style={{
          background: isLightMode
            ? 'linear-gradient(155deg, #faf3e8 0%, #ece0ce 48%, #d8c6b2 88%, #c4af98 100%)'
            : 'linear-gradient(155deg, #3d3532 0%, #292321 48%, #1c1715 88%, #120e0d 100%)',
          boxShadow: isLightMode
            ? 'inset 0 4px 6px rgba(255,255,255,0.8), inset 0 -12px 24px rgba(66,50,36,0.65), inset 6px 0 12px rgba(255,255,255,0.4), inset -6px 0 14px rgba(66,50,36,0.45)'
            : 'inset 0 4px 6px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.9), inset 6px 0 12px rgba(255,255,255,0.08), inset -6px 0 14px rgba(0,0,0,0.7)',
        }}
      >
        {/* Subtle Baked Plastic Texture Overlay from handheld-body.webp */}
        <img
          src="/img/handheld-body.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-bottom opacity-15 mix-blend-multiply pointer-events-none"
        />

        {/* Top Molded Seam Groove */}
        <div className="relative z-10 flex items-center justify-center px-2 py-1 rounded-md bg-[#c4b19c]/70 border border-[#a6927c] shadow-[inset_0_2px_4px_rgba(70,54,40,0.35),0_1px_0_rgba(255,255,255,0.6)]">
          <span
            className="text-[7px] sm:text-[8px] text-[#45382d] font-bold tracking-wider"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            {'\uf053\uf054'} CHANNELS  |  {'\uf077\uf078'} SCROLL
          </span>
        </div>

        {/* MAIN CONTROLS ROW: 3D D-PAD (LEFT) + ANGLED B/A WELL (RIGHT) */}
        <div className="relative z-10 flex-1 flex items-center justify-between px-2 sm:px-8 my-1">
          {/* LEFT: Recessed Circular Well + Sculpted 3D Cross D-Pad */}
          <div className="relative flex flex-col items-center">
            <div
              className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(circle at 35% 35%, #c2ae98 0%, #d9c9b6 70%, #e8dacb 100%)',
                boxShadow:
                  'inset 0 4px 10px rgba(70,54,40,0.45), 0 2px 3px rgba(255,255,255,0.65)',
              }}
            >
              {/* D-Pad 3D Cross SVG */}
              <svg
                viewBox="0 0 120 120"
                className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-[0_6px_6px_rgba(0,0,0,0.55)] pointer-events-none"
              >
                <defs>
                  <linearGradient id="dpad-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#3d3835" />
                    <stop offset="0.5" stopColor="#262220" />
                    <stop offset="1" stopColor="#141210" />
                  </linearGradient>
                </defs>
                {/* 3D Extrusion Base */}
                <path
                  d="M41,14 H79 V43 H108 V81 H79 V110 H41 V81 H12 V43 H41 Z"
                  fill="#0d0b0a"
                />
                {/* Main Sculpted Cross */}
                <path
                  d="M41,10 H79 V39 H108 V77 H79 V106 H41 V77 H12 V39 H41 Z"
                  fill="url(#dpad-grad)"
                  stroke="#4f4844"
                  strokeWidth="1.5"
                />
                {/* Center Concave Thumb Pivot */}
                <circle cx="60" cy="58" r="11" fill="#1c1917" stroke="#332e2b" strokeWidth="1" />
                {/* Directional Triangles */}
                <polygon points="60,17 51,31 69,31" fill="#8c8077" />
                <polygon points="60,99 51,85 69,85" fill="#8c8077" />
                <polygon points="19,58 33,49 33,67" fill="#e6cf65" />
                <polygon points="101,58 87,49 87,67" fill="#e6cf65" />
              </svg>

              {/* UP Button (Previous Project/Item) */}
              <button
                type="button"
                onClick={() => cycleItem('prev')}
                className="absolute top-2 left-1/3 w-1/3 h-10 cursor-pointer active:bg-white/10 rounded-t"
                title="Scroll Up"
              />
              {/* DOWN Button (Next Project/Item) */}
              <button
                type="button"
                onClick={() => cycleItem('next')}
                className="absolute bottom-2 left-1/3 w-1/3 h-10 cursor-pointer active:bg-white/10 rounded-b"
                title="Scroll Down"
              />
              {/* LEFT Button (Previous Channel) */}
              <button
                type="button"
                onClick={() => cycleTab('prev')}
                className="absolute left-2 top-1/3 w-10 h-1/3 cursor-pointer active:bg-white/10 rounded-l"
                title="Previous Channel"
              />
              {/* RIGHT Button (Next Channel) */}
              <button
                type="button"
                onClick={() => cycleTab('next')}
                className="absolute right-2 top-1/3 w-10 h-1/3 cursor-pointer active:bg-white/10 rounded-r"
                title="Next Channel"
              />
            </div>
          </div>

          {/* RIGHT: Single Recessed Circular 3D SELECT Action Button (A & B merged) */}
          <div
            className="p-3 sm:p-4 rounded-full flex items-center justify-center -rotate-12"
            style={{
              background: 'linear-gradient(180deg, #bfa992 0%, #d6c5b2 100%)',
              boxShadow:
                'inset 0 4px 8px rgba(66,50,36,0.5), 0 2px 2px rgba(255,255,255,0.65)',
              border: '1px solid #b09a82',
            }}
          >
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleActionA}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full cursor-pointer active:translate-y-1 transition-transform flex flex-col items-center justify-center relative group px-1"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, #c2384a 0%, #8f202e 60%, #571018 100%)',
                  boxShadow:
                    '0 7px 0 #360a0f, 0 10px 16px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,215,220,0.55)',
                  border: '2px solid #6b1420',
                }}
                title="Select / Load Highlighted Option"
              >
                <span
                  className="text-[#fceee0] text-[10px] sm:text-xs font-black tracking-normal uppercase"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  SELECT
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: SINGLE BACKLIGHT PILL + SPEAKER GRILLE */}
        <div className="relative z-10 flex items-end justify-between px-2 pt-2">
          <div className="w-10 hidden sm:block" />

          {/* Center-Left: Single Molded Rubber Pill Button with label beside/parallel to it */}
          <div className="flex items-center gap-2.5 pb-1">
            <div
              className="p-1 rounded-full -rotate-24"
              style={{
                background: '#b8a38c',
                boxShadow: 'inset 0 2px 4px rgba(50,38,28,0.5), 0 1px 0 rgba(255,255,255,0.6)',
              }}
            >
              <button
                ref={lightButtonRef}
                type="button"
                onClick={(e) => toggleLightModeWithTransition(e.currentTarget)}
                className="w-13 h-3.5 sm:w-15 sm:h-4 rounded-full cursor-pointer active:translate-y-0.5 block"
                style={{
                  background: isLightMode
                    ? 'linear-gradient(180deg, #d97706 0%, #b45309 100%)'
                    : 'linear-gradient(180deg, #5c534d 0%, #38322e 100%)',
                  boxShadow: '0 2px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.3)',
                }}
                title="Toggle Backlight (Light / Dark Mode)"
              />
            </div>
            <span
              className={`text-[8px] sm:text-[9px] font-bold tracking-wider -rotate-24 ${
                isLightMode ? 'text-[#3d3228]' : 'text-[#a89b8d]'
              }`}
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              BACKLIGHT
            </span>
          </div>

          {/* Bottom-Right Diagonal Speaker Grille Slots */}
          <div className="flex items-center gap-1.5 -rotate-28 pr-1 pb-1 opacity-85">
            {[0, 1, 2, 3, 4].map((slot) => (
              <div
                key={slot}
                className="w-1.5 h-7 sm:h-8 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #332922 0%, #5c4b3e 100%)',
                  boxShadow:
                    'inset 0 2px 3px rgba(0,0,0,0.85), 1px 1px 0 rgba(255,255,255,0.45)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

