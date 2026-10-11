import { useState } from 'react';
import type { Project } from '../data/projects';

import { FakeTerminal } from './FakeTerminal';
import { VitalLinkDemo } from './VitalLinkDemo';
import { CireuGraphDemo } from './CireuGraphDemo';
import { AggregatorDemo } from './AggregatorDemo';
import { ExternalLink, GitBranch, ShieldCheck, Mail, ArrowUpRight } from 'lucide-react';

interface PlainPortfolioProps {
  projects: Project[];
  onSwitchToRetro: () => void;
}

export const PlainPortfolio: React.FC<PlainPortfolioProps> = ({
  projects,
  onSwitchToRetro,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0].id);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Bar */}
      <nav className="border-b border-stone-800 bg-stone-900/60 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="font-mono font-bold text-sm tracking-wider">DEPLOYEDREJECT</span>
          <span className="text-xs text-stone-500 hidden sm:inline">Systems & Full-Stack Freelance Engineer</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToRetro}
            className="text-xs font-mono px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 cursor-pointer transition-colors"
          >
            🎮 Launch Interactive Retro Console Mode
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-8 space-y-4">
        <div className="inline-block font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
          AVAILABLE FOR FREELANCE & CONTRACT WORK
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          I build and ship resilient distributed systems, high-performance daemons & reactive web apps.
        </h1>
        <p className="text-stone-300 text-base sm:text-lg max-w-3xl leading-relaxed">
          Specializing in Java (GraalVM native binaries), React + TypeScript, Python IoT/MQTT telemetry, and Cloudflare edge architecture (Workers, Tunnels, D1). I ship real end-to-end products built for extreme uptime and clean maintainability.
        </p>

        {/* Quick Contact & Links */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
          <a
            href="mailto:deployedreject@gmail.com"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> Contact: deployedreject@gmail.com
          </a>
          <a
            href="https://github.com/deployedreject"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 rounded transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-stone-400" /> GitHub Profile
          </a>
          <a
            href="https://codeberg.org/DeployedReject/murces"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 rounded transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-stone-400" /> Codeberg (murces)
          </a>
        </div>
      </header>

      {/* Projects Showcase with Quick Tab Selector */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <span>FEATURED PROJECTS & LIVE DEMOS</span>
          </h2>
          <span className="text-xs text-stone-500 font-mono hidden sm:inline">
            Select a project below to interact with its live engine
          </span>
        </div>

        {/* Project Selector Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className={`px-3 py-2 rounded font-mono text-xs border transition-all cursor-pointer shrink-0 text-left ${
                selectedProjectId === proj.id
                  ? 'bg-stone-800 text-white font-bold border-stone-600 shadow-md'
                  : 'bg-stone-900/60 text-stone-400 border-stone-800/80 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.accentColor }} />
                <span>{proj.name}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Project Card */}
        <div className="bg-stone-900/60 rounded-xl border border-stone-800 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded border mb-2 inline-block"
                style={{
                  borderColor: activeProject.accentColor,
                  backgroundColor: activeProject.accentBg,
                  color: activeProject.accentColor,
                }}
              >
                {activeProject.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-mono">
                {activeProject.title}
              </h3>
              <p className="text-stone-300 text-sm mt-1">{activeProject.tagline}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={activeProject.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-mono"
              >
                <GitBranch className="w-3.5 h-3.5" /> Repo
              </a>
              {activeProject.liveUrl && (
                <a
                  href={activeProject.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-mono"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Live
                </a>
              )}
            </div>
          </div>

          {/* Interactive Demo Container */}
          <div className="rounded-lg overflow-hidden border border-stone-800 bg-stone-950">
            {activeProject.id === 'murces' && (
              <div className="h-[400px]">
                <FakeTerminal
                  initialLogs={activeProject.initialTerminalLogs || []}
                  commands={activeProject.terminalCommands || {}}
                  accentColor={activeProject.accentColor}
                />
              </div>
            )}
            {activeProject.id === 'sentric' && (
              <div className="p-4">
                <VitalLinkDemo />
              </div>
            )}
            {activeProject.id === 'cireu' && (
              <div className="p-4">
                <CireuGraphDemo />
              </div>
            )}
            {activeProject.id === 'cf-p-link' && (
              <div className="h-[400px]">
                <FakeTerminal
                  initialLogs={activeProject.initialTerminalLogs || []}
                  commands={activeProject.terminalCommands || {}}
                  accentColor={activeProject.accentColor}
                />
              </div>
            )}
            {activeProject.id === 'aggregator' && (
              <div className="p-4">
                <AggregatorDemo />
              </div>
            )}
          </div>

          {/* Architecture Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="md:col-span-2 space-y-3">
              <div className="text-xs font-mono text-stone-400 uppercase font-semibold">
                Overview & Engineering Decisions:
              </div>
              <p className="text-stone-300 text-sm leading-relaxed">
                {activeProject.summary.overview}
              </p>
              <ul className="space-y-1.5 text-xs text-stone-300 font-mono">
                {activeProject.summary.architecture.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">❯</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 bg-stone-900/90 p-4 rounded-lg border border-stone-800">
              <div>
                <div className="text-[11px] font-mono text-stone-400 uppercase mb-2">Tech Stack:</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.summary.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-stone-800">
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Client Value:
                </div>
                <p className="text-xs text-stone-300 font-mono">
                  {activeProject.summary.clientValue}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-8 px-4 text-center text-xs font-mono text-stone-500">
        DeployedReject • Freelance Systems & Web Engineer • Built with React, Vite & Tailwind
      </footer>
    </div>
  );
};
