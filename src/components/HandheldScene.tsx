import { useState } from 'react';
import type { Project } from '../data/projects';
import { ConsoleScreenContent, type ScreenTab } from './ConsoleScreenContent';
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

const SCREEN_PALETTES = [
  { name: 'PHOSPHOR', filter: 'none', dot: '#5ec299' },
  { name: 'AMBER', filter: 'hue-rotate(-48deg) saturate(1.35)', dot: '#f59e0b' },
  { name: 'ICE CYAN', filter: 'hue-rotate(72deg) saturate(1.15)', dot: '#38bdf8' },
  { name: 'VIOLET', filter: 'hue-rotate(155deg) saturate(1.2)', dot: '#a855f7' },
  { name: 'MONO', filter: 'grayscale(1) contrast(1.18) brightness(1.08)', dot: '#e5e7eb' },
];

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
  const [paletteIndex, setPaletteIndex] = useState<number>(0);

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;
  const highlightedProject =
    projects[((selectedIndex % projects.length) + projects.length) % projects.length] || projects[0];
  const currentPalette = SCREEN_PALETTES[paletteIndex] || SCREEN_PALETTES[0];

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

  const cyclePalette = () => {
    setPaletteIndex((prev) => (prev + 1) % SCREEN_PALETTES.length);
  };

  const handleActionA = () => {
    if (screenTab === 'pings') {
      setPingRefreshKey((prev) => prev + 1);
      return;
    }
    if (screenTab === 'hire') {
      const urls = [
        'https://github.com/DeployedReject',
        'https://codeberg.org/DeployedReject',
        'mailto:deployedreject@proton.me',
      ];
      window.open(urls[optionIndex % urls.length], '_blank', 'noopener,noreferrer');
      return;
    }
    if (screenTab === 'github') {
      const urls = [
        'https://github.com/DeployedReject',
        'https://codeberg.org/DeployedReject',
      ];
      window.open(urls[optionIndex % urls.length], '_blank', 'noopener,noreferrer');
      return;
    }
    if (screenTab === 'status') {
      const urls = [
        'https://github.com/DeployedReject',
        'https://codeberg.org/DeployedReject',
      ];
      window.open(urls[optionIndex % urls.length], '_blank', 'noopener,noreferrer');
      return;
    }
    onSelectProject(highlightedProject.id);
  };

  return (
    <div
      className={`w-screen h-screen flex flex-col overflow-hidden select-none transition-colors duration-300 ${
        isLightMode ? 'bg-[#ede4d3]' : 'bg-[#1a1614]'
      }`}
    >
      {/* ==================================================================== */}
      {/* TOP 50%: DIMENSIONAL RECESSED SCREEN HOUSING                         */}
      {/* ==================================================================== */}
      <div
        className="w-full h-1/2 p-2.5 sm:p-4 flex flex-col relative transition-all duration-300"
        style={{
          background: isLightMode
            ? 'linear-gradient(165deg, #d8cfc2 0%, #c2b6a6 55%, #ab9e8d 100%)'
            : 'linear-gradient(165deg, #4a4340 0%, #332e2c 55%, #211d1c 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(255,255,255,0.18), inset 0 -8px 20px rgba(0,0,0,0.65)',
          borderBottom: isLightMode ? '4px solid #8c7d6b' : '4px solid #171412',
        }}
      >
        {/* Top Lens Bezel Header: Battery LED + Active Palette */}
        <div className="flex items-center justify-between px-2 mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor: currentPalette.dot,
                boxShadow: `0 0 8px ${currentPalette.dot}`,
              }}
            />
            <span
              className={`text-[7px] tracking-wider uppercase ${
                isLightMode ? 'text-[#3d342c]' : 'text-[#b8aca3]'
              }`}
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {currentPalette.name} (•‿•)
            </span>
          </div>

          <span
            className={`text-[7px] tracking-wider ${
              isLightMode ? 'text-[#4f4339]' : 'text-[#a89c94]'
            }`}
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            PORTFOLIO BOY :D
          </span>
        </div>

        {/* Deep Recessed Screen Cavity */}
        <div
          className={`relative flex-1 w-full rounded-[14px] overflow-hidden crt-screen-container transition-all duration-300 ${
            isLightMode ? 'bg-[#e8f0e6]' : 'bg-[#0c130d]'
          }`}
          style={{
            boxShadow: isLightMode
              ? 'inset 0 4px 12px rgba(0,0,0,0.22), 0 2px 0 rgba(255,255,255,0.5)'
              : 'inset 0 8px 24px rgba(0,0,0,0.95), 0 2px 0 rgba(255,255,255,0.12), 0 0 30px rgba(166,226,110,0.15)',
            border: isLightMode ? '3px solid #6b7869' : '3px solid #181c18',
            filter: currentPalette.filter,
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
            ? 'linear-gradient(155deg, #f7efe4 0%, #eadbc9 48%, #d6c3ad 88%, #bfa890 100%)'
            : 'linear-gradient(155deg, #ebe0d2 0%, #d8c8b5 48%, #bfa992 88%, #a38d76 100%)',
          boxShadow:
            'inset 0 4px 6px rgba(255,255,255,0.7), inset 0 -12px 24px rgba(66,50,36,0.65), inset 6px 0 12px rgba(255,255,255,0.35), inset -6px 0 14px rgba(66,50,36,0.45)',
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

          {/* RIGHT: Angled Recessed Pill Well + 3D Burgundy B (Light Mode) & A (Action) Buttons */}
          <div
            className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-full flex items-center gap-5 sm:gap-7 -rotate-24"
            style={{
              background: 'linear-gradient(180deg, #bfa992 0%, #d6c5b2 100%)',
              boxShadow:
                'inset 0 4px 8px rgba(66,50,36,0.5), 0 2px 2px rgba(255,255,255,0.65)',
              border: '1px solid #b09a82',
            }}
          >
            {/* B Button: Toggle Light Mode (Unique function) */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onToggleLightMode?.()}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full cursor-pointer active:translate-y-1 transition-transform flex items-center justify-center relative"
                style={{
                  background: isLightMode
                    ? 'radial-gradient(circle at 35% 30%, #fbbf24 0%, #d97706 65%, #92400e 100%)'
                    : 'radial-gradient(circle at 35% 30%, #b83b4a 0%, #872330 60%, #57121b 100%)',
                  boxShadow:
                    '0 6px 0 #380a10, 0 8px 12px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,210,215,0.45)',
                  border: '2px solid #6b1823',
                }}
                title="Toggle Light / Dark Mode"
              >
                <span
                  className="text-[#fceee0] text-xs font-bold rotate-24"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  B
                </span>
              </button>
              <span
                className="text-[8px] text-[#45382d] font-bold tracking-wider mt-2 rotate-24"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                LIGHT
              </span>
            </div>

            {/* A Button: Trigger Selected Item / Load ROM */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handleActionA}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full cursor-pointer active:translate-y-1 transition-transform flex items-center justify-center relative"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, #b83b4a 0%, #872330 60%, #57121b 100%)',
                  boxShadow:
                    '0 6px 0 #380a10, 0 8px 12px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,210,215,0.45)',
                  border: '2px solid #6b1823',
                }}
                title="Select / Load Highlighted Item"
              >
                <span
                  className="text-[#fceee0] text-xs font-bold rotate-24"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  A
                </span>
              </button>
              <span
                className="text-[8px] text-[#7c2d38] font-bold tracking-wider mt-2 rotate-24"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                SELECT
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: SINGLE PALETTE PILL + SPEAKER GRILLE */}
        <div className="relative z-10 flex items-end justify-between px-2 pt-1">
          <div className="w-12 hidden sm:block" />

          {/* Center: Single Molded Rubber Pill Button to Cycle Screen Color Palette */}
          <div className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="p-1 rounded-full -rotate-24"
                style={{
                  background: '#b8a38c',
                  boxShadow: 'inset 0 2px 4px rgba(50,38,28,0.5), 0 1px 0 rgba(255,255,255,0.6)',
                }}
              >
                <button
                  type="button"
                  onClick={cyclePalette}
                  className="w-14 h-3.5 sm:w-16 sm:h-4 rounded-full cursor-pointer active:translate-y-0.5 block"
                  style={{
                    background: 'linear-gradient(180deg, #5c534d 0%, #38322e 100%)',
                    boxShadow: '0 2px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.3)',
                  }}
                  title="Cycle Screen Color Palette"
                />
              </div>
              <span
                className="text-[7px] sm:text-[8px] text-[#45382d] font-bold tracking-wider"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                PALETTE
              </span>
            </div>
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

