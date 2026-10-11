import { useState } from 'react';
import type { Project } from '../data/projects';


import { ConsoleScreenContent } from './ConsoleScreenContent';
import { Cartridge } from './Cartridge';
import { Sparkles } from 'lucide-react';

interface HandheldSceneProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  insertingProjectId: string | null;
}

export const HandheldScene: React.FC<HandheldSceneProps> = ({
  projects,
  onSelectProject,
  insertingProjectId,
}) => {
  const [screenTab, setScreenTab] = useState<'status' | 'infra' | 'services' | 'projects'>('status');

  const insertingProject = projects.find((p) => p.id === insertingProjectId);

  const tabs: Array<'status' | 'infra' | 'services' | 'projects'> = ['status', 'infra', 'services', 'projects'];

  const cycleTab = (direction: 'prev' | 'next') => {
    const curIdx = tabs.indexOf(screenTab);
    if (direction === 'next') {
      setScreenTab(tabs[(curIdx + 1) % tabs.length]);
    } else {
      setScreenTab(tabs[(curIdx - 1 + tabs.length) % tabs.length]);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-stone-950 flex flex-col items-center justify-center p-3 select-none overflow-x-hidden">
      {/* Top-down desk surface background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70 filter brightness-90"
        style={{ backgroundImage: `url('/img/desk-top-portrait.webp')` }}
      />
      <div className="absolute inset-0 bg-stone-950/40 pointer-events-none" />

      {/* Main Handheld Container */}
      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center gap-4 py-4">
        {/* Title badge */}
        <div className="px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300 font-mono text-xs backdrop-blur-md shadow-md text-center">
          PORTABLE DEV CONSOLE // POCKET EDITION
        </div>

        {/* Handheld Unit Body */}
        {/* Dimensions according to measurements.json: 790 x 1290, Screen hole at x175, y210, w440, h396 */}
        <div className="relative w-full aspect-[790/1290] drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]">
          {/* Inserting cartridge sliding into top edge slot */}
          {insertingProject && (
            <div
              className="absolute -top-16 left-1/2 -translate-x-1/2 z-0 animate-insertHandheld"
              style={{ width: '120px', height: '135px' }}
            >
              <Cartridge project={insertingProject} />
            </div>
          )}

          {/* 1. Live Screen (Positioned behind hole) */}
          <div
            className="absolute rounded-md overflow-hidden z-0 bg-[#07130f] crt-screen-container shadow-[inset_0_0_25px_rgba(0,0,0,0.9)]"
            style={{
              left: `${(175 / 790) * 100}%`,
              top: `${(210 / 1290) * 100}%`,
              width: `${(440 / 790) * 100}%`,
              height: `${(396 / 1290) * 100}%`,
            }}
          >
            <ConsoleScreenContent
              projects={projects}
              onSelectProject={onSelectProject}
              activeTab={screenTab}
              setActiveTab={setScreenTab}
            />

            {/* CRT Overlay */}
            <img
              src="/svg/glass-overlay.svg"
              alt="Glass Reflection"
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen"
            />
            <div className="crt-vignette" />
          </div>

          {/* 2. Handheld Shell PNG */}
          <img
            src="/img/handheld-body.webp"
            alt="Handheld Retro Console"
            className="relative z-10 w-full h-full object-contain pointer-events-none"
          />

          {/* 3. Interactive D-Pad and Buttons mapped over the baked recesses */}
          {/* D-Pad controls (left side of bottom half) */}
          <div
            className="absolute z-20"
            style={{
              left: '18%',
              bottom: '22%',
              width: '90px',
              height: '90px',
            }}
          >
            {/* Up */}
            <button
              onClick={() => cycleTab('prev')}
              className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-transparent hover:bg-white/10 active:bg-black/30 rounded cursor-pointer"
              title="Prev Tab"
            />
            {/* Down */}
            <button
              onClick={() => cycleTab('next')}
              className="absolute bottom-0 left-1/3 w-1/3 h-1/3 bg-transparent hover:bg-white/10 active:bg-black/30 rounded cursor-pointer"
              title="Next Tab"
            />
            {/* Left */}
            <button
              onClick={() => cycleTab('prev')}
              className="absolute top-1/3 left-0 w-1/3 h-1/3 bg-transparent hover:bg-white/10 active:bg-black/30 rounded cursor-pointer"
              title="Prev Tab"
            />
            {/* Right */}
            <button
              onClick={() => cycleTab('next')}
              className="absolute top-1/3 right-0 w-1/3 h-1/3 bg-transparent hover:bg-white/10 active:bg-black/30 rounded cursor-pointer"
              title="Next Tab"
            />
          </div>

          {/* A & B Action Buttons (right side of bottom half) */}
          <div
            className="absolute z-20 flex gap-3 transform -rotate-25"
            style={{
              right: '16%',
              bottom: '24%',
            }}
          >
            {/* B Button */}
            <button
              onClick={() => cycleTab('prev')}
              className="w-10 h-10 rounded-full bg-stone-800/40 hover:bg-stone-700/60 active:scale-95 border border-stone-600/50 flex items-center justify-center text-[10px] font-bold text-stone-300 font-mono cursor-pointer shadow-md"
            >
              B
            </button>
            {/* A Button */}
            <button
              onClick={() => cycleTab('next')}
              className="w-10 h-10 rounded-full bg-stone-800/40 hover:bg-stone-700/60 active:scale-95 border border-stone-600/50 flex items-center justify-center text-[10px] font-bold text-stone-300 font-mono cursor-pointer shadow-md"
            >
              A
            </button>
          </div>
        </div>

        {/* Cartridge Tray on Desk */}
        <div className="w-full bg-stone-900/80 border border-stone-800 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-[11px] font-mono text-stone-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-stone-200">
              <Sparkles className="w-3 h-3 text-amber-400" /> TAP TO INSERT CARTRIDGE:
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 px-1">
            {projects.map((proj) => (
              <div key={proj.id} className="shrink-0">
                <Cartridge
                  project={proj}
                  onClick={() => onSelectProject(proj.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
