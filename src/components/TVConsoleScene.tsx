import { useState } from 'react';
import type { Project } from '../data/projects';

import { ConsoleScreenContent } from './ConsoleScreenContent';
import { Cartridge } from './Cartridge';
import { Sparkles, Terminal } from 'lucide-react';

interface TVConsoleSceneProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  insertingProjectId: string | null;
}

export const TVConsoleScene: React.FC<TVConsoleSceneProps> = ({
  projects,
  onSelectProject,
  insertingProjectId,
}) => {
  const [screenTab, setScreenTab] = useState<'status' | 'infra' | 'services' | 'projects'>('status');

  const insertingProject = projects.find((p) => p.id === insertingProjectId);

  return (
    <div className="relative w-full min-h-screen bg-stone-950 flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Background Room & Shelf Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70 filter brightness-90"
        style={{ backgroundImage: `url('/img/room-backdrop.webp')` }}
      />

      {/* Dim ambient lighting overlay */}
      <div className="absolute inset-0 bg-radial from-transparent via-stone-950/40 to-stone-950/85 pointer-events-none" />

      {/* TV & Console Deck Wrapper (Scaled to fit nicely on desktop & tablet) */}
      <div className="relative z-10 w-full max-w-5xl px-4 py-6 flex flex-col items-center gap-2">
        {/* Top Floating Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300 font-mono text-xs backdrop-blur-md shadow-md mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>DEPLOYEDREJECT // RETRO WORKSTATION</span>
          <span className="text-stone-500">•</span>
          <span className="text-stone-400">Click any cartridge to load project</span>
        </div>

        {/* TV UNIT CONTAINER */}
        <div className="relative w-full max-w-[680px] aspect-[1278/999] drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
          {/* 1. Live Screen (Positioned behind transparent hole) */}
          {/* According to measurements.json: TV size [1278, 999], hole at [154, 152, 798, 661] */}
          <div
            className="absolute rounded-lg overflow-hidden z-0 bg-[#07130f] crt-screen-container shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]"
            style={{
              left: `${(154 / 1278) * 100}%`,
              top: `${(152 / 999) * 100}%`,
              width: `${(798 / 1278) * 100}%`,
              height: `${(661 / 999) * 100}%`,
            }}
          >
            {/* Screen Content */}
            <ConsoleScreenContent
              projects={projects}
              onSelectProject={onSelectProject}
              activeTab={screenTab}
              setActiveTab={setScreenTab}
            />

            {/* CRT Glass Overlay */}
            <img
              src="/svg/glass-overlay.svg"
              alt="Glass Reflection"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen"
            />
            {/* CRT Vignette shadow */}
            <div className="crt-vignette" />
          </div>

          {/* 2. TV Bezel Layer (webp with transparent hole) */}
          <img
            src="/img/tv-crt.webp"
            alt="Retro CRT TV"
            className="relative z-10 w-full h-full object-contain pointer-events-none select-none"
          />
        </div>

        {/* TOP-LOADING CONSOLE UNIT & CARTRIDGE INSERTION SLOT */}
        <div className="relative w-full max-w-[620px] aspect-[2262/1061] -mt-10 sm:-mt-14 z-20 flex justify-center">
          {/* Inserting Cartridge Animation Layer */}
          {/* Console slot is at x456, y127, w1353, h97. Clip line is at y232 */}
          {insertingProject && (
            <div
              className="absolute z-10 animate-insertCartridge"
              style={{
                top: '-40px',
                width: '130px',
                height: '145px',
                clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 70%)',
              }}
            >
              <Cartridge project={insertingProject} />
            </div>
          )}

          {/* Console hardware image */}
          <img
            src="/img/console-topload.webp"
            alt="Top-Loading Retro Console"
            className="w-full h-full object-contain drop-shadow-2xl pointer-events-none select-none"
          />

          {/* Clickable Power / Reset / Channel Buttons */}
          <div className="absolute bottom-6 right-12 flex gap-2 z-30">
            <button
              onClick={() => {
                const tabs: Array<'status' | 'infra' | 'services' | 'projects'> = ['status', 'infra', 'services', 'projects'];
                const nextIdx = (tabs.indexOf(screenTab) + 1) % tabs.length;
                setScreenTab(tabs[nextIdx]);
              }}
              className="px-3 py-1 bg-stone-800 hover:bg-stone-700 active:translate-y-0.5 border border-stone-600 rounded text-[11px] font-mono text-stone-200 cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>CHANNEL / SWITCH TAB</span>
            </button>
          </div>
        </div>

        {/* SHELF CARTRIDGES RACK */}
        <div className="relative z-30 w-full max-w-4xl pt-4 pb-2">
          <div className="flex items-center justify-between px-3 pb-2 text-stone-400 font-mono text-xs border-b border-stone-800/80">
            <span className="flex items-center gap-1.5 text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              AVAILABLE CARTRIDGES (HOVER TO LEVITATE • CLICK TO INSERT)
            </span>
            <span className="hidden sm:inline text-stone-500">
              5 Modular Architectures
            </span>
          </div>

          {/* Cartridges Row */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 pt-5 pb-3 overflow-x-auto px-2">
            {projects.map((project) => (
              <Cartridge
                key={project.id}
                project={project}
                onClick={() => onSelectProject(project.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
