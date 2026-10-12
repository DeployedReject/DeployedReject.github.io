import { useState } from 'react';
import { FakeTerminal } from './FakeTerminal';

interface TunnelService {
  name: string;
  port: number;
  path: string;
  isApi: boolean;
  tunnelUrl: string;
  status: 'RUNNING' | 'CRASHED' | 'RESTARTING';
  pid: number;
}

interface CfPLinkDemoProps {
  initialLogs: string[];
  commands: Record<string, string>;
}

export const CfPLinkDemo: React.FC<CfPLinkDemoProps> = ({ initialLogs, commands }) => {
  const [services, setServices] = useState<TunnelService[]>([
    {
      name: 'WebApp',
      port: 8080,
      path: '/webapp',
      isApi: false,
      tunnelUrl: 'https://bright-maple-48a1.trycloudflare.com',
      status: 'RUNNING',
      pid: 14201,
    },
    {
      name: 'TelemetryAPI',
      port: 9090,
      path: '/api',
      isApi: true,
      tunnelUrl: 'https://silent-brook-91c4.trycloudflare.com',
      status: 'RUNNING',
      pid: 14202,
    },
    {
      name: 'GrafanaDash',
      port: 3000,
      path: '/grafana',
      isApi: false,
      tunnelUrl: 'https://rapid-pine-77d9.trycloudflare.com',
      status: 'RUNNING',
      pid: 14203,
    },
  ]);

  const [daemonFeed, setDaemonFeed] = useState<string[]>([
    '[Daemon] Loaded config successfully with 3 services.',
    '[Daemon] Starting tunnel processes...',
    '[ProcessHandler] Starting tunnel for service WebApp on http://localhost:8080',
    '[ProcessHandler] Starting tunnel for service TelemetryAPI on http://localhost:9090',
    '[ProcessHandler] Starting tunnel for service GrafanaDash on http://localhost:3000',
    '[WorkerManager] Generating Worker script...',
    '[WorkerManager] Deploying Worker to Cloudflare...',
    '[WorkerManager] Successfully uploaded worker script!',
    '[WorkerManager] The services should be accessible at: https://cf-p-link-router.*.workers.dev',
  ]);

  const [activeSubView, setActiveSubView] = useState<'split' | 'worker-code' | 'cli'>('split');

  const simulateCrashAndHeal = (svcName: string) => {
    setServices((prev) =>
      prev.map((s) => (s.name === svcName ? { ...s, status: 'CRASHED' } : s))
    );
    setDaemonFeed((prev) => [
      ...prev,
      `[ProcessHandler] Tunnel for ${svcName} exited.`,
      `[Daemon] Detected crash for ${svcName} tunnel. Scheduling restart in 5 seconds.`,
      `[WorkerManager] Generating Worker script (pruned dead route)...`,
      `[WorkerManager] Successfully uploaded worker script!`,
    ]);

    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) => (s.name === svcName ? { ...s, status: 'RESTARTING' } : s))
      );
      setDaemonFeed((prev) => [
        ...prev,
        `[ProcessHandler] Starting tunnel for service ${svcName}...`,
      ]);
    }, 900);

    setTimeout(() => {
      const randHex = Math.random().toString(16).slice(2, 6);
      const newUrl = `https://healed-node-${randHex}.trycloudflare.com`;
      setServices((prev) =>
        prev.map((s) =>
          s.name === svcName
            ? { ...s, status: 'RUNNING', tunnelUrl: newUrl, pid: s.pid + 17 }
            : s
        )
      );
      setDaemonFeed((prev) => [
        ...prev,
        `[ProcessHandler] New trycloudflare URL generated: ${newUrl}`,
        `[WorkerManager] Generating Worker script...`,
        `[WorkerManager] Deploying Worker to Cloudflare...`,
        `[WorkerManager] Successfully uploaded worker script!`,
      ]);
    }, 1800);
  };

  const healthyServices = services.filter((s) => s.status === 'RUNNING');

  const generatedWorkerJs = `const services = {
${healthyServices
  .map(
    (s) => `  "${s.path}": {
    url: "${s.tunnelUrl}",
    name: "${s.name} (Port ${s.port})",
    isApi: ${s.isApi}
  },`
  )
  .join('\n')}
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});`;

  return (
    <div className="bg-[#0f172a] text-[#f8fafc] border border-[#334155] rounded-lg overflow-hidden font-mono text-xs flex flex-col">
      {/* Top Mode Bar */}
      <div className="bg-[#1e293b] border-b border-[#334155] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="font-bold text-sm">
            cf-p-link // GraalVM Native Tunnel Daemon + WorkerManager
          </span>
        </div>
        <div className="flex gap-1.5">
          {[
            { id: 'split', label: 'Daemon + Live Worker Portal' },
            { id: 'worker-code', label: 'Generated Worker.js' },
            { id: 'cli', label: 'Interactive CLI Shell' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubView(tab.id as any)}
              className={`px-2.5 py-1 rounded cursor-pointer border ${
                activeSubView === tab.id
                  ? 'bg-amber-500 text-black font-bold border-amber-400'
                  : 'bg-[#0f172a] text-slate-300 border-[#334155] hover:border-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubView === 'cli' && (
        <div className="h-[520px]">
          <FakeTerminal initialLogs={initialLogs} commands={commands} accentColor="#f59e0b" />
        </div>
      )}

      {activeSubView === 'worker-code' && (
        <div className="p-4 bg-[#090d16] h-[520px] overflow-y-auto">
          <div className="text-amber-400 mb-2 font-bold">
            // Dynamically generated by com.cfplink.WorkerManager.generateWorkerScript() and pushed via PUT /client/v4/accounts/&#123;id&#125;/workers/scripts/cf-p-link-router
          </div>
          <pre className="text-slate-200 text-xs leading-relaxed">{generatedWorkerJs}</pre>
        </div>
      )}

      {activeSubView === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* Left: Authentic btop-inspired System Process Manager */}
          <div className="lg:col-span-6 p-2.5 bg-[#070b12] border-b lg:border-b-0 lg:border-r border-[#152238] flex flex-col justify-between gap-2.5 text-xs select-none font-mono">
            {/* Top btop Box: CPU & System Overview with Braille Graphs */}
            <div className="border border-[#1e3455] bg-[#090f1a] rounded text-[11px] overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
              {/* btop Box Header Bar: ╭─┐¹cpu┌─────────┐load┌───────────┐0.42 0.38 0.29┌─╮ */}
              <div className="flex items-center justify-between px-2 py-0.5 bg-[#0c1526] border-b border-[#182a44] text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="text-cyan-400 font-bold">╭─┐</span>
                  <span className="text-white font-bold bg-[#142642] px-1 rounded-sm border border-cyan-800 text-[9px]">¹cpu</span>
                  <span className="text-cyan-500/80">┌───────</span>
                  <span className="text-slate-300 font-semibold">cf-p-link supervisor</span>
                  <span className="text-cyan-500/80">─────┐</span>
                </div>
                <div className="flex items-center gap-2 text-[9px]">
                  <span className="text-slate-400">Load: <span className="text-cyan-300 font-bold">0.42 0.38 0.29</span></span>
                  <span className="text-slate-400">Threads: <span className="text-amber-400 font-bold">18</span></span>
                  <span className="text-cyan-400 font-bold">┌─╮</span>
                </div>
              </div>

              {/* Resource meters with authentic Braille graphs & block gradient meters */}
              <div className="p-2 space-y-2">
                {/* CPU Braille Graph & Core Breakdown */}
                <div className="flex items-center justify-between gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-cyan-400 font-bold">CPU</span>
                    <span className="text-emerald-400 font-bold">14.2%</span>
                  </div>
                  {/* Braille sparkline graph */}
                  <div className="flex-1 font-mono text-emerald-400/90 tracking-widest text-[11px] overflow-hidden whitespace-nowrap text-center bg-[#05080e] px-2 py-0.5 rounded border border-[#14233a]">
                    ⣀⣀⡀⢀⣄⡀⣀⢀⣀⡀⢠⣤⣀⣰⣶⣾⣿⣷⣄⣀⣀⢀⣀
                  </div>
                  <div className="text-[9px] text-slate-400 shrink-0">
                    <span className="text-amber-400 font-semibold">44°C</span> / <span className="text-cyan-400">3.2 GHz</span>
                  </div>
                </div>

                {/* Sub-meters: CPU Blocks Bar & MEM RSS Box */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {/* CPU GraalVM Native RSS */}
                  <div className="bg-[#05080e] p-1.5 rounded border border-[#162740]">
                    <div className="flex justify-between text-slate-400 mb-0.5 text-[9px]">
                      <span className="text-slate-300">GraalVM Native</span>
                      <span className="text-emerald-400 font-bold">■■■■■■░░░░░░ 14%</span>
                    </div>
                    <div className="text-[9px] text-slate-500 flex justify-between font-mono">
                      <span>C0: 12% ⣀⣀⣄</span>
                      <span>C1: 16% ⣀⣀⣰</span>
                    </div>
                  </div>

                  {/* MEM Box */}
                  <div className="bg-[#05080e] p-1.5 rounded border border-[#162740]">
                    <div className="flex justify-between text-slate-400 mb-0.5 text-[9px]">
                      <span className="text-slate-300">²mem RSS: 32M</span>
                      <span className="text-cyan-400 font-bold">■■░░░░░░░░░░ 0.2%</span>
                    </div>
                    <div className="text-[9px] text-slate-500 flex justify-between font-mono">
                      <span>Used: 32.4 MiB</span>
                      <span>Free: 15.9 GiB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom btop Box: Process Manager Table */}
            <div className="border border-[#1e3455] bg-[#090f1a] rounded text-[11px] flex-1 flex flex-col overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
              {/* btop Box Header with filter/pause/tree toggles */}
              <div className="flex items-center justify-between px-2 py-0.5 bg-[#0c1526] border-b border-[#182a44] text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-cyan-400 font-bold">╭─┐</span>
                  <span className="text-white font-bold bg-[#142642] px-1 rounded-sm border border-cyan-800 text-[9px]">⁴proc</span>
                  <span className="text-cyan-500/80">┌┐</span>
                  <span className="text-slate-400 hover:text-white cursor-pointer">filter</span>
                  <span className="text-cyan-500/80">┌──────┐</span>
                  <span className="text-slate-400">tree</span>
                  <span className="text-cyan-500/80">┌┐</span>
                  <span className="text-slate-400">reverse</span>
                  <span className="text-cyan-500/80">┌─╮</span>
                </div>
                <div className="text-[9px] text-slate-400 flex items-center gap-1.5">
                  <span>Tasks: <strong className="text-emerald-400">{services.length}</strong></span>
                  <span className="text-cyan-400 font-bold">│</span>
                </div>
              </div>

              {/* Table Column Headers: Pid, Program, Command/Edge, Threads, User, MemB, CPU% */}
              <div className="flex items-center justify-between text-[10px] bg-[#080d17] text-slate-400 border-b border-[#182a44] py-1 px-2 font-bold tracking-wider">
                <span className="w-14 text-cyan-300">Pid:</span>
                <span className="w-24 text-slate-200">Program:</span>
                <span className="flex-1">Command / Tunnel Edge:</span>
                <span className="w-12 text-center text-slate-300">MemB</span>
                <span className="w-12 text-right text-emerald-300">C↑u%</span>
                <span className="w-16 text-right text-slate-300">Action</span>
              </div>

              {/* Process Table Rows with btop selection styling */}
              <div className="divide-y divide-[#152238]/80 my-0.5 overflow-y-auto max-h-[190px]">
                {services.map((svc, idx) => (
                  <div
                    key={svc.name}
                    className={`flex items-center justify-between py-1 px-2 text-[11px] font-mono transition-colors ${
                      svc.status === 'CRASHED'
                        ? 'bg-red-950/50 text-red-300'
                        : svc.status === 'RESTARTING'
                        ? 'bg-amber-950/40 text-amber-300'
                        : idx === 0
                        ? 'bg-[#12233c] text-white'
                        : 'hover:bg-[#0f1d31] text-slate-300'
                    }`}
                  >
                    <span className="w-14 font-mono text-cyan-400 font-semibold text-[10px]">
                      {svc.pid}
                    </span>
                    <span className="w-24 truncate font-bold text-slate-100" title={svc.name}>
                      cloudflared
                    </span>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="truncate text-slate-300 text-[10px]">
                        :{svc.port} &rarr; <span className="text-amber-400">{svc.path}</span>
                      </div>
                      <div className="truncate text-[9px] text-slate-500 font-mono">
                        {svc.status === 'RUNNING' ? svc.tunnelUrl : 'Disconnected [Healing...]'}
                      </div>
                    </div>
                    <span className="w-12 text-center text-[10px] text-cyan-200">
                      12.4M
                    </span>
                    <span className="w-12 text-right text-[10px] font-bold text-emerald-400">
                      {svc.status === 'RUNNING' ? '1.8' : '0.0'}
                    </span>
                    <div className="w-16 text-right">
                      <button
                        type="button"
                        disabled={svc.status !== 'RUNNING'}
                        onClick={() => simulateCrashAndHeal(svc.name)}
                        className="px-1.5 py-0.5 rounded bg-red-950/80 hover:bg-red-800 disabled:opacity-30 text-red-200 border border-red-700 hover:border-red-500 text-[9px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                        title={`Send SIGKILL to PID ${svc.pid}`}
                      >
                        [k] kill
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* btop Box Footer: ╰┘↑ select ↓└┘info ↵└┘terminate└┘kill└┘signals└┘Nice└────────┘0/3└╯ */}
              <div className="text-[9px] text-slate-400 bg-[#0c1526] border-t border-[#182a44] px-2 py-0.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">╰┘</span>
                  <span className="text-slate-300">↑ select ↓</span>
                  <span className="text-cyan-400 font-bold">└┘</span>
                  <span className="text-slate-300">terminate</span>
                  <span className="text-cyan-400 font-bold">└┘</span>
                  <span className="text-red-400 font-bold">kill [k]</span>
                  <span className="text-cyan-400 font-bold">└┘</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">0/{services.length}</span>
                  <span className="text-cyan-400 font-bold">└╯</span>
                </div>
              </div>
            </div>

            {/* Live systemd supervisor log output */}
            <div className="border border-[#1e3455] bg-[#05080e] rounded p-2 text-[10px] font-mono h-28 overflow-y-auto space-y-0.5 shadow-inner">
              <div className="text-slate-400 border-b border-[#182a44] pb-0.5 mb-1 flex items-center justify-between text-[9px]">
                <span className="text-cyan-400">&bull; journalctl -u cf-p-link.service -f</span>
                <span className="text-slate-500">LIVE SUPERVISOR LOGS</span>
              </div>
              {daemonFeed.slice(-6).map((line, i) => (
                <div
                  key={i}
                  className={`leading-tight ${
                    line.includes('crash') || line.includes('exited')
                      ? 'text-red-400 font-bold'
                      : line.includes('Successfully') || line.includes('generated:')
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Exact HTML Portal Rendered by WorkerManager.java at '/' */}
          <div className="lg:col-span-6 p-6 bg-[#0f172a] flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 mb-3 flex items-center justify-between">
                <span>2. Live Cloudflare Worker Output (WorkerManager.java:99)</span>
                <span className="text-[#38bdf8]">https://cf-p-link-router.workers.dev/</span>
              </div>

              {/* Exact HTML/CSS structure from WorkerManager.java lines 101-116 */}
              <div
                style={{
                  background: '#1e293b',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.25)',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                }}
              >
                <h2
                  style={{
                    borderBottom: '2px solid #334155',
                    paddingBottom: '0.75rem',
                    marginBottom: '1.25rem',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    color: '#f8fafc',
                  }}
                >
                  Available Hosted Services
                </h2>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-2.5">
                  {healthyServices.map((s) => (
                    <li
                      key={s.path}
                      style={{
                        padding: '0.9rem 1rem',
                        background: '#0f172a',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ color: '#38bdf8', fontSize: '1.05rem', fontWeight: 600 }}>
                        {s.name} (Port {s.port}) <span>&rarr;</span>{' '}
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">{s.path}</code>
                      </div>
                      <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                        Proxies to {s.tunnelUrl} ({s.isApi ? 'API' : 'User Redirect'})
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-[#334155] pt-3 mt-4">
              Notice how killing a tunnel on the left immediately removes its dead route from the Cloudflare Worker portal above, spawns a fresh <code className="text-slate-200">trycloudflare.com</code> tunnel, and hot-patches the Worker within 2 seconds.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
