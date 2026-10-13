import { useState, useEffect, useMemo } from 'react';
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
  isRomLoading?: boolean;
  isRomReady?: boolean;
  onLaunchRom?: () => void;
  isLightMode?: boolean;
  onToggleLightMode?: () => void;
}

const TABS: ScreenTab[] = ['status', 'cartridges', 'github', 'pings', 'hire'];

export const HandheldScene: React.FC<HandheldSceneProps> = ({
  projects,
  cameraMode: _cameraMode,
  onSelectProject,
  activeCartridgeId,
  isRomLoading = false,
  isRomReady = false,
  onLaunchRom,
  isLightMode = false,
  onToggleLightMode,
}) => {
  const [screenTab, setScreenTab] = useState<ScreenTab>('cartridges');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [optionIndex, setOptionIndex] = useState<number>(0);
  const [pingRefreshKey, setPingRefreshKey] = useState<number>(0);

  const handleToggleBacklight = () => {
    onToggleLightMode?.();
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
      className="w-screen h-screen flex flex-col overflow-hidden select-none bg-[#080706]"
    >
      {/* ==================================================================== */}
      {/* TOP 50%: DIMENSIONAL RECESSED SCREEN HOUSING                         */}
      {/* ==================================================================== */}
      <div
        className="w-full h-1/2 p-2.5 sm:p-4 flex flex-col relative"
        style={{
          background: 'linear-gradient(165deg, #2b2624 0%, #1c1817 55%, #100e0d 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -8px 20px rgba(0,0,0,0.85)',
          borderBottom: '4px solid #080605',
        }}
      >
        {/* Top Lens Bezel Header: Power LED + Backlight Status */}
        <div className="flex items-center justify-between px-2 mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: isLightMode ? '#39e89b' : '#3f3f46',
                boxShadow: isLightMode ? '0 0 12px #39e89b' : 'none',
              }}
            />
            <span
              className={`text-[7px] tracking-wider uppercase font-bold ${
                isLightMode ? 'text-emerald-400' : 'text-[#71717a]'
              }`}
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {isLightMode ? 'BACKLIGHT: ON' : 'BACKLIGHT: OFF'}
            </span>
          </div>

          <span
            className="text-[7px] tracking-wider uppercase text-[#a1a1aa]"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            legally distinct handheld
          </span>
        </div>

        {/* Deep Recessed Screen Cavity (Illuminated by Backlight) */}
        <div
          className={`relative flex-1 w-full rounded-[14px] overflow-hidden crt-screen-container ${
            isLightMode ? 'bg-[#edf5eb]' : 'bg-[#040805]'
          }`}
          style={{
            boxShadow: isLightMode
              ? 'inset 0 4px 12px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.5), 0 0 35px rgba(166,226,110,0.35)'
              : 'inset 0 8px 28px rgba(0,0,0,0.98), 0 2px 0 rgba(255,255,255,0.06), 0 0 20px rgba(0,0,0,0.8)',
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
            insertingProject={isRomLoading || isRomReady ? activeCartridge : null}
            isRomReady={isRomReady}
            onLaunchRom={onLaunchRom}
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
          background: 'linear-gradient(155deg, #3d3532 0%, #292321 48%, #1c1715 88%, #120e0d 100%)',
          boxShadow:
            'inset 0 4px 6px rgba(255,255,255,0.15), inset 0 -12px 24px rgba(0,0,0,0.9), inset 6px 0 12px rgba(255,255,255,0.08), inset -6px 0 14px rgba(0,0,0,0.7)',
        }}
      >
        {/* Subtle Baked Plastic Texture Overlay from handheld-body.webp */}
        <img
          src="/img/handheld-body.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-bottom opacity-15 mix-blend-multiply pointer-events-none"
        />

        {/* Top Molded Seam Groove */}
        <div className="relative z-10 flex items-center justify-center px-2 py-1 rounded-md bg-[#241f1c] border border-[#3d3530] shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.08)]">
          <span
            className="text-[7px] sm:text-[8px] text-[#b8aba0] font-bold tracking-wider"
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
                background: 'radial-gradient(circle at 35% 35%, #221d1b 0%, #181413 70%, #100d0c 100%)',
                boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.65), 0 2px 3px rgba(255,255,255,0.08)',
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

          {/* RIGHT: Single Recessed Circular 3D SELECT Action Button */}
          <div
            className="p-3 sm:p-4 rounded-full flex items-center justify-center -rotate-12"
            style={{
              background: 'linear-gradient(180deg, #241f1d 0%, #171312 100%)',
              boxShadow:
                'inset 0 4px 8px rgba(0,0,0,0.7), 0 2px 2px rgba(255,255,255,0.08)',
              border: '1px solid #362e2a',
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
          <div className="flex items-center gap-2 -rotate-24 origin-center pb-2 pl-1">
            <div
              className="p-1 rounded-full shrink-0"
              style={{
                background: '#241f1d',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <button
                type="button"
                onClick={handleToggleBacklight}
                className="w-12 h-3.5 sm:w-14 sm:h-4 rounded-full cursor-pointer active:translate-y-0.5 block transition-transform"
                style={{
                  background: isLightMode
                    ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(180deg, #5c534d 0%, #38322e 100%)',
                  boxShadow: isLightMode
                    ? '0 0 10px rgba(16,185,129,0.7), inset 0 1px 1px rgba(255,255,255,0.6)'
                    : '0 2px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.2)',
                }}
                title="Toggle Backlight"
              />
            </div>
            <span
              className={`text-[8px] sm:text-[9px] font-bold tracking-wider leading-none select-none ${
                isLightMode ? 'text-emerald-400' : 'text-[#8c7f72]'
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
                  background: 'linear-gradient(90deg, #1a1614 0%, #382e27 100%)',
                  boxShadow:
                    'inset 0 2px 3px rgba(0,0,0,0.85), 1px 1px 0 rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

