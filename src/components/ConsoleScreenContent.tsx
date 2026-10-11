import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Project } from '../data/projects';


interface ConsoleScreenContentProps {
  onSelectProject: (projectId: string) => void;
  projects: Project[];
  activeTab: 'status' | 'infra' | 'services' | 'projects';
  setActiveTab: (tab: 'status' | 'infra' | 'services' | 'projects') => void;
}

export const ConsoleScreenContent: React.FC<ConsoleScreenContentProps> = ({
  onSelectProject,
  projects,
  activeTab,
  setActiveTab,
}) => {
  // Simulated stats & typewriter intro
  const [typedHeader, setTypedHeader] = useState('');
  const fullHeader = 'PLAYER 1: DEPLOYEDREJECT // SYS_LEVEL: 99';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedHeader(fullHeader.slice(0, i + 1));
      i++;
      if (i >= fullHeader.length) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#07130f] text-[#34d399] font-mono p-3 sm:p-5 flex flex-col justify-between select-none relative overflow-hidden">
      {/* Top Status Bar */}
      <div className="border-b border-[#0f4d38] pb-2 flex items-center justify-between text-xs tracking-wider">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-emerald-300 tracking-wider">
            {typedHeader}
            <span className="animate-pulse">_</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-[#10b981]/80">
          <span>EDGE: HYD-01 (14ms)</span>
          <span>UPTIME: 99.98%</span>
        </div>
      </div>

      {/* Screen Mode Tabs */}
      <div className="flex border-b border-[#0f4d38]/80 py-1 gap-1 text-[11px] font-bold">
        {[
          { id: 'status', label: '1. STATS' },
          { id: 'infra', label: '2. INFRA_PING' },
          { id: 'services', label: '3. FREELANCE' },
          { id: 'projects', label: '4. CARTRIDGES' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'bg-[#10b981] text-black font-extrabold shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                : 'text-[#10b981]/70 hover:text-emerald-300 hover:bg-[#064e3b]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Center Dynamic Content Area */}
      <div className="flex-1 py-2 overflow-y-auto text-xs space-y-2">
        {activeTab === 'status' && (
          <div className="space-y-2 animate-fadeIn">
            <div className="text-[11px] text-emerald-400/90 font-mono">
              &gt; BIO: Systems & Full-Stack Engineer shipping resilient edge architectures, native binaries & reactive interfaces.
            </div>

            {/* Stat Bars (RPG style) */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">SKILL TREE ATTRIBUTES:</div>
              
              <div>
                <div className="flex justify-between text-[11px]">
                  <span>SYSTEMS (Java / GraalVM / Linux / systemd)</span>
                  <span className="text-emerald-300 font-bold">96 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-[#064e3b] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[96%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span>FRONTEND (React / TypeScript / Vite / Tailwind)</span>
                  <span className="text-emerald-300 font-bold">92 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-[#064e3b] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[92%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span>EDGE & CLOUD (Cloudflare Workers / Tunnels / D1)</span>
                  <span className="text-emerald-300 font-bold">94 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-[#064e3b] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span>BACKEND & TELEMETRY (Python / MQTT / Docker)</span>
                  <span className="text-emerald-300 font-bold">89 / 100</span>
                </div>
                <div className="w-full h-1.5 bg-[#064e3b] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[89%]" />
                </div>
              </div>
            </div>

            <div className="p-2 bg-[#064e3b]/30 rounded border border-[#0f4d38] flex items-center justify-between text-[11px] mt-2">
              <span>Codeberg Stars & Active Releases:</span>
              <span className="font-bold text-white bg-emerald-800/80 px-2 py-0.5 rounded">murces (Traction)</span>
            </div>
          </div>
        )}

        {activeTab === 'infra' && (
          <div className="space-y-2 text-[11px] animate-fadeIn">
            <div className="text-stone-400 text-[10px]">REAL-TIME EDGE TELEMETRY & HEALTH MONITORS:</div>
            
            <div className="p-2 bg-[#064e3b]/20 border border-[#0f4d38] rounded space-y-1">
              <div className="flex justify-between">
                <span className="text-white font-bold">● VitalLink Cluster (VPS + MQTT)</span>
                <span className="text-emerald-400">HEALTHY (18ms)</span>
              </div>
              <div className="text-[10px] text-emerald-400/80">Broker: Mosquitto TLS • Ingest: Python FastAsync • Docker Swarm</div>
            </div>

            <div className="p-2 bg-[#064e3b]/20 border border-[#0f4d38] rounded space-y-1">
              <div className="flex justify-between">
                <span className="text-white font-bold">● cf-p-link Auto-Tunnels</span>
                <span className="text-emerald-400">ONLINE (11ms)</span>
              </div>
              <div className="text-[10px] text-emerald-400/80">Edge Workers synced • Watchdog active • Zero public open ports</div>
            </div>

            <div className="p-2 bg-[#064e3b]/20 border border-[#0f4d38] rounded space-y-1">
              <div className="flex justify-between">
                <span className="text-white font-bold">● murces Orchestration Daemon</span>
                <span className="text-emerald-400">RUNNING (Native x64)</span>
              </div>
              <div className="text-[10px] text-emerald-400/80">GraalVM Substrate • CurseForge sync OK • RAM RSS: 28MB</div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-2 text-[11px] animate-fadeIn">
            <div className="text-emerald-400 font-bold">FREELANCE CLIENT OFFERINGS:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-[#064e3b]/30 rounded border border-[#0f4d38]">
                <div className="font-bold text-white">1. End-to-End Web Apps</div>
                <div className="text-emerald-400/80 text-[10px]">React, TypeScript, Vite, Tailwind & Cloudflare edge deployments.</div>
              </div>
              <div className="p-2 bg-[#064e3b]/30 rounded border border-[#0f4d38]">
                <div className="font-bold text-white">2. High-Performance Daemons</div>
                <div className="text-emerald-400/80 text-[10px]">Java GraalVM Native Image, Linux systemd, CLI tooling & IPC sockets.</div>
              </div>
              <div className="p-2 bg-[#064e3b]/30 rounded border border-[#0f4d38]">
                <div className="font-bold text-white">3. Distributed Telemetry & MQTT</div>
                <div className="text-emerald-400/80 text-[10px]">Python backends, real-time message brokers & live dashboards.</div>
              </div>
              <div className="p-2 bg-[#064e3b]/30 rounded border border-[#0f4d38]">
                <div className="font-bold text-white">4. Cloudflare Edge Automation</div>
                <div className="text-emerald-400/80 text-[10px]">Workers, Tunnels, D1 SQL, Pages middleware & Zero-Trust networks.</div>
              </div>
            </div>
            <div className="pt-1 text-center">
              <span className="text-emerald-300 font-bold bg-[#064e3b] px-3 py-1 rounded border border-emerald-500/50">
                Contact: github.com/deployedreject • Open for contracts
              </span>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-1.5 animate-fadeIn">
            <div className="text-[10px] text-emerald-400/90 mb-1">
              SELECT CARTRIDGE OR CLICK FROM DESK TO LOAD DEMO:
            </div>
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className="p-1.5 bg-[#064e3b]/30 hover:bg-[#10b981] hover:text-black rounded border border-[#0f4d38] hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold">{proj.name}</span>
                  <span className="text-[9px] opacity-80 truncate hidden sm:inline">{proj.badge}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold shrink-0">
                  <span>LOAD</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen Bottom Prompt */}
      <div className="border-t border-[#0f4d38] pt-1.5 flex items-center justify-between text-[10px] text-emerald-400/80">
        <span>PRESS D-PAD OR CLICK BUTTONS</span>
        <span className="text-emerald-300 font-bold">READY TO PLAY</span>
      </div>
    </div>
  );
};
