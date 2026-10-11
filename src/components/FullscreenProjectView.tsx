import { ArrowLeft, ExternalLink, GitBranch, Layers, ShieldCheck, Cpu } from 'lucide-react';
import type { Project } from '../data/projects';


import { FakeTerminal } from './FakeTerminal';
import { VitalLinkDemo } from './VitalLinkDemo';
import { CireuGraphDemo } from './CireuGraphDemo';
import { AggregatorDemo } from './AggregatorDemo';

interface FullscreenProjectViewProps {
  project: Project;
  onEject: () => void;
}

export const FullscreenProjectView: React.FC<FullscreenProjectViewProps> = ({
  project,
  onEject,
}) => {
  return (
    <div className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col relative selection:bg-emerald-500 selection:text-black animate-fadeIn">
      {/* Top Floating Glass Header / Navigation */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onEject}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white border border-stone-700 hover:border-stone-500 transition-all text-xs font-mono cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>⏏ EJECT CARTRIDGE (BACK TO CONSOLE)</span>
          </button>

          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded border hidden md:inline-flex"
            style={{
              borderColor: project.accentColor,
              backgroundColor: project.accentBg,
              color: project.accentColor,
            }}
          >
            {project.badge}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 hover:border-stone-500 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-stone-400" />
            <span>Repository</span>
            <ExternalLink className="w-3 h-3 text-stone-500" />
          </a>

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors"
            >
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 flex flex-col gap-8 w-full">
        {/* Project Header Blurb */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: project.accentColor }}
            />
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white font-mono">
              {project.title}
            </h1>
          </div>
          <p className="text-stone-300 text-base sm:text-lg max-w-3xl leading-relaxed">
            {project.tagline}
          </p>
        </section>

        {/* Live Interactive Demo Box */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400 px-1">
            <span className="flex items-center gap-1.5 uppercase font-semibold text-stone-300">
              <Cpu className="w-4 h-4 text-emerald-400" /> Live Interactive Showcase
            </span>
            <span>All mock engines run fully client-side</span>
          </div>

          <div className="rounded-xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-900/50">
            {project.id === 'murces' && (
              <div className="h-[460px]">
                <FakeTerminal
                  initialLogs={project.initialTerminalLogs || []}
                  commands={project.terminalCommands || {}}
                  accentColor={project.accentColor}
                />
              </div>
            )}

            {project.id === 'sentric' && (
              <div className="p-3 sm:p-5">
                <VitalLinkDemo />
              </div>
            )}

            {project.id === 'cireu' && (
              <div className="p-3 sm:p-5">
                <CireuGraphDemo />
              </div>
            )}

            {project.id === 'cf-p-link' && (
              <div className="h-[460px]">
                <FakeTerminal
                  initialLogs={project.initialTerminalLogs || []}
                  commands={project.terminalCommands || {}}
                  accentColor={project.accentColor}
                />
              </div>
            )}

            {project.id === 'aggregator' && (
              <div className="p-3 sm:p-5">
                <AggregatorDemo />
              </div>
            )}
          </div>
        </section>

        {/* Technical Architecture & Deep Dive Breakdown */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-800">
          {/* Column 1: System Overview */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-stone-300 font-mono text-sm font-semibold">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Architectural Breakdown & Problem Solved</span>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed">
              {project.summary.overview}
            </p>

            <div className="space-y-2 pt-2">
              <div className="text-xs font-mono text-stone-400 uppercase">Core Engineering Highlights:</div>
              <ul className="space-y-2 text-sm text-stone-300">
                {project.summary.architecture.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">❯</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 2: Tech Stack & Freelance Impact */}
          <div className="space-y-5 bg-stone-900/60 p-5 rounded-lg border border-stone-800 h-fit">
            <div>
              <div className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-2.5">
                Technologies Used:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {project.summary.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="text-xs font-mono px-2.5 py-1 rounded bg-stone-800/90 text-stone-200 border border-stone-700/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-800">
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold mb-1.5">
                <ShieldCheck className="w-4 h-4" /> Why Clients Hire Me For This:
              </div>
              <p className="text-xs text-stone-300 leading-relaxed font-mono">
                {project.summary.clientValue}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Hot Corner & Contact */}
      <footer className="border-t border-stone-800 py-6 px-4 text-center text-xs font-mono text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Need robust systems or full-stack engineering? Let's talk:{' '}
            <a
              href="mailto:deployedreject@gmail.com"
              className="text-emerald-400 hover:underline"
            >
              deployedreject@gmail.com
            </a>
          </div>
          <button
            onClick={onEject}
            className="text-stone-400 hover:text-white underline cursor-pointer"
          >
            Back to Console Deck ↑
          </button>
        </div>
      </footer>
    </div>
  );
};
