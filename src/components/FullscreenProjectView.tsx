import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Layers,
  ShieldCheck,
  FileCode2,
  ChevronDown,
  Terminal,
} from 'lucide-react';
import type { Project } from '../data/projects';
import { MurcesTuiDemo } from './MurcesTuiDemo';
import { CfPLinkDemo } from './CfPLinkDemo';

interface FullscreenProjectViewProps {
  project: Project;
  onEject: () => void;
}

const GITINGEST_TREES: Record<
  string,
  {
    stats: string;
    tree: string;
    keyFiles: { path: string; role: string }[];
  }
> = {
  murces: {
    stats: 'Files analyzed: 38 | Java 21 + GraalVM Native AOT | Target: Linux x86_64 & aarch64',
    tree: `Directory structure:
└── deployedreject-murces/
    ├── pom.xml                           # Maven + native-maven-plugin (0.10.1, --no-fallback, -H:+AddAllCharsets)
    ├── install.sh / uninstall.sh         # POSIX curl installer & SHA256 verifier
    ├── API_SPEC.md                       # Daemon & CLI interface specification
    └── src/main/java/com/usedura/manager/
        ├── Main.java                     # Entrypoint: routes headless CLI flags vs Lanterna TUI
        ├── cli/
        │   ├── CliHandler.java           # Subcommands: start, stop, status, backup, tunnel, update-mods
        │   └── CommandResult.java        # Exit codes & structured stdout formatting
        ├── core/
        │   ├── ServerOrchestrator.java   # Detached tmux session lifecycle & RCON/stdin dispatch
        │   ├── BackupManager.java        # Atomic save-off -> save-all -> tar.zst -> save-on + rclone
        │   ├── JdkProvisioner.java       # Adoptium/Temurin API client (JDK 8, 17, 21 auto-extractor)
        │   ├── ModManager.java           # Modrinth v2 & CurseForge REST dependency resolver
        │   └── PlayitTunnelManager.java  # Native playit-linux-amd64 daemon supervisor & claim parser
        └── tui/
            ├── ServerManagerTui.java     # Lanterna 3 multi-pane layout, live log tailer & modals
            └── Themes.java               # 6 TrueColor 24-bit palettes + 0% ANSI transparent passthrough`,
    keyFiles: [
      {
        path: 'src/main/java/com/usedura/manager/tui/ServerManagerTui.java',
        role: 'Lanterna 3 split-pane TUI with 500ms background telemetry refresh, 300-line ring buffer log viewer, and modal dialogs.',
      },
      {
        path: 'src/main/java/com/usedura/manager/core/BackupManager.java',
        role: 'Executes atomic world flush over tmux before archiving and syncing to Google Drive via rclone.',
      },
      {
        path: 'src/main/java/com/usedura/manager/core/ModManager.java',
        role: 'Queries Modrinth & CurseForge REST APIs with SHA-1 hash verification for 1-key mod updates.',
      },
    ],
  },
  sentric: {
    stats: 'Files analyzed: 64 | React 19 + MapLibre GL + Uber H3 + Python FastAPI + Mosquitto MQTT',
    tree: `Directory structure:
└── SentricTechnologies/
    ├── sentric-web/                      # Cloudflare Pages Frontend + Edge Middleware
    │   ├── functions/_middleware.ts      # Edge JWT verification & role routing
    │   ├── public/data/
    │   │   ├── ap-boundary.geojson       # Andhra Pradesh state & district vector boundaries
    │   │   └── ap-h3-res8.json           # 210,000+ Uber H3 resolution-8 spatial hexagons
    │   └── src/
    │       ├── App.tsx                   # HashRouter: Landing (#/), VitalLink (#/vital), Docs (#/docs)
    │       ├── pages/VitalLinkApp.tsx    # Real-time epidemiological command center & ALS/BLS dispatch
    │       ├── components/MapEngine.tsx  # MapLibre GL vector renderer + H3 Poisson anomaly overlay
    │       └── services/mqttClient.ts    # WebSocket MQTT telemetry subscriber
    └── sentric-backend/                  # Python VPS Docker Stack
        ├── docker-compose.yml            # FastAPI + Mosquitto TLS Broker + PostgreSQL/PostGIS
        └── app/routers/
            ├── disease.py                # Spatio-temporal outbreak cluster detection
            ├── dispatch.py               # Ambulance state machine & 10s confirmation lock
            └── auth.py                   # Clinic node certificate & JWT provisioning`,
    keyFiles: [
      {
        path: 'sentric-web/src/pages/VitalLinkApp.tsx',
        role: 'Unified command console combining Andhra Pradesh H3 vector heatmaps, live symptom telemetry, and ambulance fleet dispatch.',
      },
      {
        path: 'sentric-backend/app/routers/disease.py',
        role: 'Aggregates clinic MQTT reports into H3 spatial buckets to flag statistically significant outbreak anomalies.',
      },
      {
        path: 'sentric-web/functions/_middleware.ts',
        role: 'Cloudflare Pages edge middleware enforcing role-based access before static or API execution.',
      },
    ],
  },
  cireu: {
    stats: 'Files analyzed: 19 | React 19 + TypeScript + Vite + Tailwind CSS | Zero Backend Dependencies',
    tree: `Directory structure:
└── Cireu/
    ├── package.json                      # Vite + React 19 + Tailwind CSS + Lucide icons
    └── src/
        ├── App.tsx                       # Dual-pane Graph Studio: Interactive SVG Canvas + Matrix Inspector
        ├── algorithms/
        │   ├── eulerian.ts               # Degree parity verifier + Fleury's algorithm + Tarjan bridge detector
        │   └── hamiltonian.ts            # Recursive backtracking cycle & path solver with step recorder
        ├── components/
        │   ├── GraphCanvas.tsx           # Force/drag SVG node & curved multi-edge interactive editor
        │   ├── MatrixEditor.tsx          # Bidirectional Adjacency Matrix & Incidence Table editor
        │   └── PlaybackControls.tsx      # Step-by-step edge traversal timeline & speed controller
        └── storage/
            └── presetGraphs.ts           # Königsberg Bridges, Petersen Graph, Dodecahedron & local storage`,
    keyFiles: [
      {
        path: 'src/algorithms/eulerian.ts',
        role: "Implements Fleury's algorithm with Tarjan's DFS bridge detection so bridges are only crossed as a last resort.",
      },
      {
        path: 'src/algorithms/hamiltonian.ts',
        role: 'Backtracking search recording intermediate vertex visits and dead-end rollbacks for visual playback.',
      },
      {
        path: 'src/components/MatrixEditor.tsx',
        role: 'Synchronizes direct cell edits in the Adjacency Matrix immediately with the SVG graph topology.',
      },
    ],
  },
  'cf-p-link': {
    stats: 'Files analyzed: 16 | Java 21 + GraalVM Native Image | Cloudflare v4 REST API + Systemd',
    tree: `Directory structure:
└── cf-p-link/
    ├── pom.xml                           # Multi-profile GraalVM Native Image build (setup-cli & tunnel-daemon)
    └── src/main/java/com/cfplink/
        ├── SetupCli.java                 # Interactive wizard: validates CF token, writes config.json & systemd unit
        ├── TunnelDaemon.java             # Main supervisor loop: spawns cloudflared & triggers Worker redeploys
        ├── ProcessHandler.java           # Scrapes cloudflared stderr for *.trycloudflare.com URLs & detects crashes
        ├── WorkerManager.java            # Generates ES-module reverse proxy & PUTs to Cloudflare Workers v4 API
        ├── CloudflareApi.java            # Native HttpClient wrapper for Account ID lookup & Worker script upload
        └── Config.java                   # Gson model for apiToken, accountId, workerName & ServiceRoute[]`,
    keyFiles: [
      {
        path: 'src/main/java/com/cfplink/TunnelDaemon.java',
        role: 'Coordinates child process supervision and schedules 5-second self-healing restarts whenever a tunnel exits.',
      },
      {
        path: 'src/main/java/com/cfplink/WorkerManager.java',
        role: 'Dynamically compiles the Cloudflare Worker JS router + dark-mode landing portal and deploys it via REST API.',
      },
      {
        path: 'src/main/java/com/cfplink/SetupCli.java',
        role: 'Generates /etc/systemd/system/cf-p-link.service and verifies Cloudflare API permissions.',
      },
    ],
  },
  aggregator: {
    stats: 'Files analyzed: 52 | WebExtension (MV3) + React + Spring Boot 3 + PostgreSQL + JGit',
    tree: `Directory structure:
└── Aggregator-FUll-Stack/
    ├── Aggregator-Website/super-website/ # React Plugin Hub & Live In-Browser Sandbox
    │   ├── public/generator/
    │   │   ├── sandbox.html              # Hermetic CSP iframe executing untrusted plugin JS via postMessage
    │   │   └── proxy-gateway.js          # CORS & header-rewriting fetch relay for sandboxed plugins
    │   ├── public/plugins/
    │   │   └── internet-archive.js       # Public-domain feature film & audio plugin querying archive.org
    │   └── src/App.tsx                   # Marketplace UI, live sandboxed media runner & plugin test suite
    ├── Aggregator-Extension/             # Chromium & Firefox WebExtension
    │   ├── manifest.json                 # DeclarativeNetRequest rules + background service worker
    │   └── background.js                 # Cross-origin stream relay & sandbox message broker
    └── Aggregator-Backend/               # Spring Boot 3 + Java 21 + PostgreSQL Registry
        └── src/main/java/com/aggregator/
            ├── service/GitSyncService.java   # JGit automated plugin repository cloner & SHA verifier
            ├── service/VoteService.java      # Salted SHA-256 IP reputation & auto-quarantine engine
            └── tui/AdminConsoleTui.java      # Lanterna server administration console`,
    keyFiles: [
      {
        path: 'Aggregator-Website/super-website/public/generator/sandbox.html',
        role: 'Executes third-party plugin scripts inside an isolated iframe with zero parent DOM or storage access.',
      },
      {
        path: 'Aggregator-Website/super-website/public/plugins/internet-archive.js',
        role: 'Reference plugin querying the Internet Archive Advanced Search API and resolving playable MP4 streams.',
      },
      {
        path: 'Aggregator-Backend/src/main/java/com/aggregator/service/VoteService.java',
        role: 'Privacy-preserving salted SHA-256 IP voting that automatically disables broken or flagged plugins.',
      },
    ],
  },
};

export const FullscreenProjectView: React.FC<FullscreenProjectViewProps> = ({
  project,
  onEject,
}) => {
  // Show CRT vanish effect for the first 500ms as it transitions from the zoomed-in TV screen
  const [crtVanishing, setCrtVanishing] = useState(true);
  // Show the top details/eject bar initially for 3.8s, then hide until mouse enters top/left corner
  const [headerPinnedOpen, setHeaderPinnedOpen] = useState(true);
  const [cornerHovered, setCornerHovered] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  // For Sentric: allow switching between VitalLink (#/vital), Landing (#/), and Docs (#/docs)
  const [sentricSubRoute, setSentricSubRoute] = useState<'/vital' | '/' | '/docs'>('/vital');

  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const crtTimer = setTimeout(() => setCrtVanishing(false), 550);
    const headerTimer = setTimeout(() => setHeaderPinnedOpen(false), 3800);
    return () => {
      clearTimeout(crtTimer);
      clearTimeout(headerTimer);
    };
  }, [project.id]);

  // Also allow Escape key to eject cartridge if focus is on the outer document
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEject();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onEject]);

  const isHeaderVisible = headerPinnedOpen || cornerHovered;
  const gitingest = GITINGEST_TREES[project.id] || GITINGEST_TREES.murces;

  const toggleSummary = () => {
    if (!showSummary) {
      setShowSummary(true);
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      setShowSummary(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen w-full bg-[#090a0f] text-stone-100 flex flex-col relative selection:bg-emerald-500 selection:text-black ${
      showSummary ? 'overflow-y-auto' : 'h-screen overflow-hidden'
    }`}>
      {/* CRT-to-Clean Vanish Overlay (fades out over 550ms when entering fullscreen) */}
      <div
        className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-500 ${
          crtVanishing ? 'opacity-90' : 'opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), radial-gradient(circle, transparent 55%, rgba(0,0,0,0.85) 100%)',
          backgroundSize: '100% 4px, 100% 100%',
        }}
      />

      {/* Hot-Corner Trigger Zone (Top-Left Corner & Top 16px Edge) */}
      <div
        onMouseEnter={() => setCornerHovered(true)}
        className="fixed top-0 left-0 right-0 h-4 z-50"
      />
      <div
        onMouseEnter={() => setCornerHovered(true)}
        className="fixed top-0 left-0 w-44 h-12 z-50 pointer-events-auto"
      >
        {/* Subtle Corner Tab when header is hidden so user always knows where the hot corner is (and can tap on mobile) */}
        {!isHeaderVisible && (
          <button
            type="button"
            onClick={() => setCornerHovered(true)}
            className="m-2 px-2.5 py-1 bg-[#141914]/90 hover:bg-[#1e281e] text-[#a6e26e] border border-[#a6e26e]/60 text-[10px] shadow-lg flex items-center gap-1.5 cursor-pointer transition-opacity opacity-75 hover:opacity-100"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
            title="Move mouse to corner or click to reveal Eject & Project Details"
          >
            <span>⏏ EJECT / INFO</span>
          </button>
        )}
      </div>

      {/* Auto-Hiding Top Details & Eject Bar (Appears at start and when mouse enters corner) */}
      <header
        onMouseEnter={() => setCornerHovered(true)}
        onMouseLeave={() => setCornerHovered(false)}
        className={`fixed top-0 left-0 right-0 z-50 bg-[#121417]/95 backdrop-blur-md border-b-2 border-[#333942] px-4 sm:px-6 py-3 transition-transform duration-300 shadow-2xl ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Eject Cartridge Button & Project Title */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onEject}
              className="flex items-center gap-2 px-3 py-2 bg-[#7c2d38] hover:bg-[#993846] text-[#f5e4d7] border-2 border-[#f5e4d7]/80 shadow-[3px_3px_0px_#000] active:translate-y-0.5 transition-all text-[10px] sm:text-xs cursor-pointer"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>⏏ EJECT CARTRIDGE</span>
            </button>

            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-white">
                  {project.title}
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border"
                  style={{
                    borderColor: project.accentColor,
                    backgroundColor: project.accentBg,
                    color: project.accentColor,
                  }}
                >
                  {project.badge}
                </span>
              </div>
              <span className="text-[11px] text-stone-400 font-mono line-clamp-1">
                {project.tagline}
              </span>
            </div>
          </div>

          {/* Right: Sub-route Switcher (for Sentric), Summary Jump, Repo & Live Links */}
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            {project.id === 'sentric' && (
              <div className="flex items-center bg-stone-900 border border-stone-700 rounded p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setSentricSubRoute('/vital')}
                  className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                    sentricSubRoute === '/vital'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  VitalLink Console
                </button>
                <button
                  type="button"
                  onClick={() => setSentricSubRoute('/')}
                  className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                    sentricSubRoute === '/'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Sentric Landing
                </button>
                <button
                  type="button"
                  onClick={() => setSentricSubRoute('/docs')}
                  className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                    sentricSubRoute === '/docs'
                      ? 'bg-red-600 text-white font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Architecture Docs
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={toggleSummary}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 cursor-pointer transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Gitingest + LLM Summary</span>
            </button>

            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-stone-400" />
              <span>Source Repo</span>
              <ExternalLink className="w-3 h-3 text-stone-500" />
            </a>

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70 transition-colors"
              >
                <span>Live Deployment</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* FULLSCREEN INTERACTIVE PROJECT DEMO AREA */}
      <section className="w-full h-screen flex flex-col bg-[#090a0f] relative">
        {project.id === 'murces' && (
          <div className="w-full h-full overflow-y-auto p-3 sm:p-6">
            <MurcesTuiDemo
              initialLogs={project.initialTerminalLogs || []}
              commands={project.terminalCommands || {}}
            />
          </div>
        )}

        {project.id === 'sentric' && (
          <iframe
            key={sentricSubRoute}
            src={`/demos/sentric/index.html#${sentricSubRoute}`}
            title="Sentric Technologies & VitalLink Interactive Demo"
            className="w-full h-full border-0 bg-[#09090b]"
          />
        )}

        {project.id === 'cireu' && (
          <iframe
            src="/demos/cireu/index.html"
            title="cireu Eulerian & Hamiltonian Graph Studio"
            className="w-full h-full border-0 bg-[#09090b]"
          />
        )}

        {project.id === 'cf-p-link' && (
          <div className="w-full h-full overflow-y-auto p-3 sm:p-6">
            <CfPLinkDemo
              initialLogs={project.initialTerminalLogs || []}
              commands={project.terminalCommands || {}}
            />
          </div>
        )}

        {project.id === 'aggregator' && (
          <iframe
            src="/demos/aggregator/index.html"
            title="Aggregator Sandboxed Media & Plugin Hub"
            className="w-full h-full border-0 bg-[#0b0f17]"
          />
        )}

        {/* Bottom Floating Toggle Pill for Architecture & Digest Summary */}
        <button
          type="button"
          onClick={toggleSummary}
          className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-900/95 hover:bg-stone-800 text-stone-200 border border-stone-600 text-xs font-mono shadow-2xl cursor-pointer hover:border-emerald-500 transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${showSummary ? 'rotate-180' : 'animate-bounce'}`} />
          <span>{showSummary ? 'Return to Live Demo ↑' : 'Gitingest + Architecture Summary ↓'}</span>
        </button>
      </section>

      {/* GITINGEST + LLM ARCHITECTURAL SUMMARY SECTION AT THE BOTTOM */}
      {showSummary && (
        <section
          ref={summaryRef}
          className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 space-y-8 border-t border-stone-800 bg-[#0c0d12]"
        >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
              <Terminal className="w-4 h-4" />
              <span>Gitingest Repository Digest + LLM Architectural Summary</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {project.title}
            </h2>
            <p className="text-stone-400 text-sm mt-1">{project.tagline}</p>
          </div>

          <button
            type="button"
            onClick={onEject}
            className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 bg-[#7c2d38] hover:bg-[#993846] text-[#f5e4d7] border-2 border-[#f5e4d7]/80 shadow-[3px_3px_0px_#000] text-xs cursor-pointer shrink-0"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>⏏ EJECT CARTRIDGE</span>
          </button>
        </div>

        {/* Two-Column Grid: Gitingest Tree + Architectural Synthesis */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 5 Cols: Gitingest Directory Structure & Key Source Files */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-lg border border-stone-800 bg-[#08090c] overflow-hidden">
              <div className="px-4 py-2.5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between text-xs font-mono">
                <span className="flex items-center gap-2 text-amber-300 font-semibold">
                  <FileCode2 className="w-4 h-4" />
                  gitingest://{project.id}/digest.txt
                </span>
                <span className="text-[11px] text-stone-400">UTF-8</span>
              </div>
              <div className="px-4 py-2 bg-stone-950/60 border-b border-stone-900 text-[11px] font-mono text-emerald-400">
                {gitingest.stats}
              </div>
              <pre className="p-4 text-[11px] sm:text-xs font-mono text-stone-300 overflow-x-auto leading-relaxed">
                {gitingest.tree}
              </pre>
            </div>

            {/* Key Files Highlight */}
            <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-4 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-stone-400">
                Primary Entrypoints & Core Modules:
              </div>
              <div className="space-y-2.5">
                {gitingest.keyFiles.map((file) => (
                  <div
                    key={file.path}
                    className="p-2.5 rounded bg-stone-950/80 border border-stone-800/90 font-mono"
                  >
                    <div className="text-xs text-emerald-400 font-semibold break-all">
                      {file.path}
                    </div>
                    <div className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {file.role}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 7 Cols: LLM Architectural Breakdown, Engineering Highlights & Client Value */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-semibold">
                <Layers className="w-4 h-4" />
                <span>LLM System Synthesis & Engineering Overview</span>
              </div>
              <p className="text-stone-200 text-sm sm:text-base leading-relaxed">
                {project.summary.overview}
              </p>

              <div className="pt-3 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-stone-400">
                  Core Architectural Pillars:
                </div>
                <ul className="space-y-2.5 text-sm text-stone-300">
                  {project.summary.architecture.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded bg-stone-950/60 border border-stone-800/80"
                    >
                      <span className="text-emerald-400 font-mono font-bold shrink-0 mt-0.5">
                        0{idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tech Stack & Freelance Client Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-5">
                <div className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-3">
                  Production Stack & Tooling:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.summary.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-stone-950 text-stone-200 border border-stone-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-5">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Client & Production Impact</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-mono">
                  {project.summary.clientValue}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
};
