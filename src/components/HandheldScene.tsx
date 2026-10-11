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

const TABS: ScreenTab[] = ['status', 'cartridges', 'github', 'pings', 'hire'];

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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [pingRefreshKey, setPingRefreshKey] = useState<number>(0);

  const activeCartridge = projects.find((p) => p.id === activeCartridgeId) || null;
  const highlightedProject =
    projects[((selectedIndex % projects.length) + projects.length) % projects.length] || projects[0];

  const cycleTab = (dir: 'prev' | 'next') => {
    const idx = TABS.indexOf(screenTab);
    if (dir === 'next') {
      setScreenTab(TABS[(idx + 1) % TABS.length]);
    } else {
      setScreenTab(TABS[(idx - 1 + TABS.length) % TABS.length]);
    }
  };

  const cycleItem = (dir: 'prev' | 'next') => {
    if (screenTab !== 'cartridges') {
      setScreenTab('cartridges');
    }
    setSelectedIndex((prev) =>
      dir === 'next'
        ? (prev + 1) % projects.length
        : (prev - 1 + projects.length) % projects.length
    );
  };

  const handleActionA = () => {
    if (screenTab === 'pings') {
      setPingRefreshKey((prev) => prev + 1);
      return;
    }
    if (screenTab === 'hire') {
      window.open('https://github.com/DeployedReject', '_blank', 'noopener,noreferrer');
      return;
    }
    setCameraMode('table');
    setTimeout(() => onSelectProject(highlightedProject.id), 450);
  };

  const isTableZoomedOut = cameraMode !== 'closeup';

  // ============================================================================
  // MODE 2: ZOOMED-OUT DARK DESK VIEW (cameraMode !== 'closeup')
  // Shows the handheld shell resting on the dark wooden desk illuminated by the
  // screen glow, with the 5 cartridges laid out below it.
  // ============================================================================
  if (isTableZoomedOut) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#050404] flex items-center justify-center select-none">
        <div className="relative w-screen h-screen max-w-[62vh] max-h-screen">
          <img
            src="/img/desk-top-portrait.webp"
            alt="Wooden Desk"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none filter brightness-[0.16] contrast-[1.25] saturate-[0.55]"
          />

          {/* Deep dark room vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 34%, rgba(166,226,110,0.14) 0%, rgba(8,10,8,0.72) 52%, rgba(3,4,4,0.96) 92%)',
            }}
          />

          {/* Ambient phosphor glow cast from the handheld screen */}
          <div
            className="absolute z-5 pointer-events-none animate-tv-ambient"
            style={{
              left: '10%',
              top: '8%',
              width: '80%',
              height: '48%',
              background:
                'radial-gradient(circle at 50% 42%, rgba(166,226,110,0.22) 0%, transparent 68%)',
              mixBlendMode: 'screen',
            }}
          />

          {/* Top Banner on Desk */}
          <div className="absolute top-[2%] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 bg-[#0e140f]/95 border-2 border-[#a6e26e]/60 px-3 py-2 text-center shadow-[0_0_25px_rgba(166,226,110,0.2),0_6px_20px_#000] w-[92%] rounded">
            <span
              className="text-[#e6cf65] text-[8px] sm:text-[9px] leading-relaxed"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              "Projects that I made based on my needs not for showcases"
            </span>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-[#a6e26e] text-[10px] font-mono">TAP A CARTRIDGE TO INSERT</span>
              <button
                type="button"
                onClick={() => setCameraMode('closeup')}
                className="px-2 py-1 bg-[#a6e26e] text-[#0c140d] font-bold text-[8px] rounded cursor-pointer shadow-[0_0_10px_rgba(166,226,110,0.4)]"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                [▲ FULLSCREEN]
              </button>
            </div>
          </div>

          {/* Handheld Device Unit on Desk (Shell view) */}
          <div
            onClick={() => setCameraMode('closeup')}
            className="absolute z-10 left-[19%] top-[10%] w-[62%] aspect-[790/1290] cursor-pointer group"
          >
            <div className="absolute inset-2 translate-y-3 bg-black/90 rounded-[28px] blur-lg pointer-events-none" />

            {/* Sliding Cartridge in top slot */}
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

            {/* Glowing Screen hole inside shell */}
            <div
              className="absolute z-5 bg-[#111912] crt-screen-container overflow-hidden shadow-[0_0_50px_12px_rgba(166,226,110,0.45)]"
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
                selectedIndex={selectedIndex}
                pingRefreshKey={pingRefreshKey}
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
              className="relative z-10 w-full h-full object-contain pointer-events-none select-none filter brightness-[0.45] contrast-[1.2] saturate-[0.75] group-hover:brightness-[0.6] transition-all"
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
                className="absolute z-20 filter brightness-[0.62] hover:brightness-105 active:brightness-105 transition-all"
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

  // ============================================================================
  // MODE 1: FULLSCREEN 50/50 SPLIT VIEW (cameraMode === 'closeup')
  // Top 50%: Dimensional recessed dark-slate lens bezel & live CRT/LCD screen
  // Bottom 50%: Sculpted 3D warm-putty handheld body with tactile D-Pad, A/B,
  // Select/Start, active ROM preview window, and speaker grille!
  // ============================================================================
  return (
    <div className="w-screen h-screen flex flex-col bg-[#1a1614] overflow-hidden select-none">
      {/* ==================================================================== */}
      {/* TOP 50%: DIMENSIONAL RECESSED SCREEN HOUSING                         */}
      {/* ==================================================================== */}
      <div
        className="w-full h-1/2 p-2.5 sm:p-4 flex flex-col relative"
        style={{
          background: 'linear-gradient(165deg, #4a4340 0%, #332e2c 55%, #211d1c 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(255,255,255,0.18), inset 0 -8px 20px rgba(0,0,0,0.85)',
          borderBottom: '4px solid #171412',
        }}
      >
        {/* Top Lens Bezel Header: Battery LED + Active ROM Preview */}
        <div className="flex items-center justify-between px-2 mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5ec299] shadow-[0_0_8px_#5ec299] border border-[#a8f0d2]/50 animate-pulse" />
            <span
              className="text-[7px] text-[#b8aca3] tracking-wider uppercase"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              BATTERY
            </span>
          </div>

          {/* Mini Cartridge Label Asset Preview Pill */}
          <div className="flex items-center gap-2 bg-[#1a1716] px-2 py-0.5 rounded-full border border-[#524945] shadow-inner">
            <img
              src={highlightedProject.labelSvg}
              alt=""
              className="w-4 h-3 object-cover rounded-[2px] border border-[#a6e26e]/50"
            />
            <span
              className="text-[7px] text-[#e6cf65]"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              ROM: {highlightedProject.id.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Deep Recessed Screen Cavity */}
        <div
          className="relative flex-1 w-full rounded-[14px] overflow-hidden bg-[#0c130d] crt-screen-container"
          style={{
            boxShadow:
              'inset 0 8px 24px rgba(0,0,0,0.95), 0 2px 0 rgba(255,255,255,0.12), 0 0 30px rgba(166,226,110,0.15)',
            border: '3px solid #181c18',
          }}
        >
          <ConsoleScreenContent
            projects={projects}
            activeTab={screenTab}
            selectedIndex={selectedIndex}
            pingRefreshKey={pingRefreshKey}
            isTableZoomedOut={false}
            insertingProjectName={null}
          />

          {/* Curved Glass Reflection Asset */}
          <img
            src="/svg/glass-overlay.svg"
            alt=""
            className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-55"
          />
          <div className="crt-vignette" />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BOTTOM 50%: 3D MOULDED HANDHELD CONTROL DECK                         */}
      {/* ==================================================================== */}
      <div
        className="w-full h-1/2 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, #ebe0d2 0%, #d8c8b5 48%, #bfa992 88%, #a38d76 100%)',
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

        {/* Top Molded Seam Groove & Instruction Strip */}
        <div className="relative z-10 flex items-center justify-between px-2 py-1 rounded-md bg-[#c4b19c]/70 border border-[#a6927c] shadow-[inset_0_2px_4px_rgba(70,54,40,0.35),0_1px_0_rgba(255,255,255,0.6)]">
          <span
            className="text-[7px] sm:text-[8px] text-[#45382d] font-bold tracking-wider"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            ◀▶ CHANNEL  •  ▲▼ PROJECT
          </span>
          <span
            className="text-[7px] sm:text-[8px] text-[#7c2d38] font-bold tracking-wider"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            [A] LOAD
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
                title="Previous Project"
              />
              {/* DOWN Button (Next Project/Item) */}
              <button
                type="button"
                onClick={() => cycleItem('next')}
                className="absolute bottom-2 left-1/3 w-1/3 h-10 cursor-pointer active:bg-white/10 rounded-b"
                title="Next Project"
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

          {/* RIGHT: Angled Recessed Pill Well + 3D Burgundy B & A Buttons */}
          <div
            className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-full flex items-center gap-5 sm:gap-7 -rotate-24"
            style={{
              background: 'linear-gradient(180deg, #bfa992 0%, #d6c5b2 100%)',
              boxShadow:
                'inset 0 4px 8px rgba(66,50,36,0.5), 0 2px 2px rgba(255,255,255,0.65)',
              border: '1px solid #b09a82',
            }}
          >
            {/* B Button: Back / Previous Channel */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => cycleTab('prev')}
                className="w-13 h-13 sm:w-15 sm:h-15 rounded-full cursor-pointer active:translate-y-1 transition-transform flex items-center justify-center relative"
                style={{
                  background:
                    'radial-gradient(circle at 35% 30%, #b83b4a 0%, #872330 60%, #57121b 100%)',
                  boxShadow:
                    '0 6px 0 #380a10, 0 8px 12px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,210,215,0.45)',
                  border: '2px solid #6b1823',
                }}
                title="Back / Previous Channel"
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
                BACK
              </span>
            </div>

            {/* A Button: Load Cartridge / Confirm */}
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
                title="Load Selected Cartridge / Run Action"
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
                LOAD
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: SELECT / START PILLS + SCULPTED SPEAKER GRILLE */}
        <div className="relative z-10 flex items-end justify-between px-2 pt-1">
          <div className="w-12 hidden sm:block" />

          {/* Center: Molded Rubber CHANNEL & DESK VIEW Pill Buttons */}
          <div className="flex items-center gap-8 sm:gap-10">
            {/* CHANNEL Pill */}
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
                  onClick={() => cycleTab('next')}
                  className="w-12 h-3.5 sm:w-14 sm:h-4 rounded-full cursor-pointer active:translate-y-0.5 block"
                  style={{
                    background: 'linear-gradient(180deg, #5c534d 0%, #38322e 100%)',
                    boxShadow: '0 2px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.3)',
                  }}
                  title="Switch Channel"
                />
              </div>
              <span
                className="text-[7px] sm:text-[8px] text-[#45382d] font-bold tracking-wider"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                CHANNEL
              </span>
            </div>

            {/* DESK VIEW Pill */}
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
                  onClick={() => setCameraMode('table')}
                  className="w-12 h-3.5 sm:w-14 sm:h-4 rounded-full cursor-pointer active:translate-y-0.5 block"
                  style={{
                    background: 'linear-gradient(180deg, #5e8f83 0%, #395c53 100%)',
                    boxShadow: '0 2px 3px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.4)',
                  }}
                  title="Zoom Out to Desk & Cartridges"
                />
              </div>
              <span
                className="text-[7px] sm:text-[8px] text-[#28473f] font-bold tracking-wider"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                CARTRIDGES
              </span>
            </div>
          </div>

          {/* Bottom-Right Diagonal Speaker Grille Slots (Matching handheld-body.webp) */}
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
