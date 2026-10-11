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
          {/* Left: TunnelDaemon Process Supervisor */}
          <div className="lg:col-span-6 p-4 border-b lg:border-b-0 lg:border-r border-[#334155] flex flex-col justify-between gap-4 bg-[#090d16]">
            <div className="space-y-3">
              <div className="text-amber-400 font-bold uppercase tracking-wider">
                1. tunnel-daemon-native ProcessHandler Supervisor
              </div>
              <p className="text-slate-400 text-[11px]">
                Click &quot;Kill Process (SIGKILL)&quot; on any local tunnel below to watch <code className="text-amber-300">TunnelDaemon.java</code> detect process death, prune the route, respawn <code className="text-amber-300">cloudflared</code>, and redeploy the Cloudflare Edge Worker automatically:
              </p>

              <div className="space-y-2">
                {services.map((svc) => (
                  <div
                    key={svc.name}
                    className="p-2.5 rounded bg-[#1e293b]/90 border border-[#334155] flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>
                          {svc.name} (localhost:{svc.port} &rarr; {svc.path})
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            svc.status === 'RUNNING'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                              : svc.status === 'RESTARTING'
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : 'bg-red-950 text-red-400 border border-red-700'
                          }`}
                        >
                          {svc.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        PID: {svc.pid} • Edge: {svc.status === 'RUNNING' ? svc.tunnelUrl : 'Reconnecting...'}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={svc.status !== 'RUNNING'}
                      onClick={() => simulateCrashAndHeal(svc.name)}
                      className="px-2.5 py-1 rounded bg-red-900/70 hover:bg-red-800 disabled:opacity-40 text-red-100 border border-red-700 text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      Kill Process
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live stdout stream of TunnelDaemon.java */}
            <div className="bg-black/80 border border-[#334155] rounded p-2.5 h-44 overflow-y-auto space-y-1 text-[11px]">
              <div className="text-slate-500 border-b border-slate-800 pb-1 mb-1">
                journalctl -u cf-p-link.service -f
              </div>
              {daemonFeed.slice(-9).map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes('crash') || line.includes('exited')
                      ? 'text-red-400 font-bold'
                      : line.includes('Successfully') || line.includes('generated:')
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }
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
