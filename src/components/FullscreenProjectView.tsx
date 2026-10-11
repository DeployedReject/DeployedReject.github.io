import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Layers,
  FileCode2,
  Terminal,
  Play,
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
    stats: 'Files: 38 | Java 21 + GraalVM Native Image | Linux / WSL',
    tree: `Directory structure:
└── deployedreject-murces/
    ├── pom.xml                           # Maven config and GraalVM native-image build setup
    ├── install.sh / uninstall.sh         # Install and uninstall scripts
    └── src/main/java/com/usedura/manager/
        ├── Main.java                     # Entrypoint: runs CLI commands or opens the terminal UI
        ├── cli/
        │   ├── CliHandler.java           # Handles start, stop, status, backup, tunnel, update-mods
        │   └── CommandResult.java        # Exit codes and console output
        ├── core/
        │   ├── ServerOrchestrator.java   # Starts/stops the server in a background tmux session
        │   ├── BackupManager.java        # Pauses world saving, tars the world folder, uploads via rclone
        │   ├── JdkProvisioner.java       # Downloads OpenJDK 8, 17, or 21 from Adoptium
        │   ├── ModManager.java           # Downloads and updates mods/plugins from Modrinth & CurseForge
        │   └── PlayitTunnelManager.java  # Runs and monitors the playit.gg tunnel process
        └── tui/
            ├── ServerManagerTui.java     # Terminal UI window, log viewer, and menus
            └── Themes.java               # Color themes for the terminal UI`,
    keyFiles: [
      {
        path: 'src/main/java/com/usedura/manager/tui/ServerManagerTui.java',
        role: 'Draws the terminal UI panels, shows live server logs, and handles keyboard shortcuts.',
      },
      {
        path: 'src/main/java/com/usedura/manager/core/BackupManager.java',
        role: 'Sends save-off and save-all to tmux, compresses the world folder into a tar archive, and uploads it with rclone.',
      },
      {
        path: 'src/main/java/com/usedura/manager/core/ModManager.java',
        role: 'Checks Modrinth and CurseForge APIs for newer versions of installed mods and downloads them.',
      },
    ],
  },
  sentric: {
    stats: 'Files: 64 | React + MapLibre GL + Uber H3 + FastAPI + MQTT',
    tree: `Directory structure:
└── SentricTechnologies/
    ├── sentric-web/                      # React frontend
    │   ├── functions/_middleware.ts      # Basic token check for protected pages
    │   ├── public/data/
    │   │   ├── ap-boundary.geojson       # Map boundary coordinates
    │   │   └── ap-h3-res8.json           # H3 hex grid data for the map
    │   └── src/
    │       ├── App.tsx                   # Routes: Landing (#/), VitalLink (#/vital), Docs (#/docs)
    │       ├── pages/VitalLinkApp.tsx    # Main map dashboard and ambulance dispatch view
    │       ├── components/MapEngine.tsx  # Renders the MapLibre map and hex overlays
    │       └── services/mqttClient.ts    # Connects to the MQTT broker over WebSockets
    └── sentric-backend/                  # Python FastAPI backend
        ├── docker-compose.yml            # Runs FastAPI, Mosquitto MQTT, and Postgres
        └── app/routers/
            ├── disease.py                # Groups incoming symptom reports by map region
            ├── dispatch.py               # Tracks ambulance status and assignments
            └── auth.py                   # Login endpoints`,
    keyFiles: [
      {
        path: 'sentric-web/src/pages/VitalLinkApp.tsx',
        role: 'The main dashboard showing incoming sensor reports on the map and the list of ambulances.',
      },
      {
        path: 'sentric-backend/app/routers/disease.py',
        role: 'Receives clinic reports from the hardware nodes and counts cases per hex area.',
      },
      {
        path: 'sentric-backend/app/routers/dispatch.py',
        role: 'Assigns an available ambulance to an alert and updates its status.',
      },
    ],
  },
  cireu: {
    stats: 'Files: 19 | React + TypeScript + Vite + Tailwind CSS',
    tree: `Directory structure:
└── Cireu/
    ├── package.json                      # Vite + React + TypeScript setup
    └── src/
        ├── App.tsx                       # Main layout with the graph canvas and matrix tables
        ├── algorithms/
        │   ├── eulerian.ts               # Checks vertex degrees and runs Fleury's algorithm
        │   └── hamiltonian.ts            # Backtracking search for Hamiltonian paths and cycles
        ├── components/
        │   ├── GraphCanvas.tsx           # SVG canvas for adding/dragging nodes and edges
        │   ├── MatrixEditor.tsx          # Editable Adjacency Matrix and Incidence Table
        │   └── PlaybackControls.tsx      # Play, pause, and step buttons for viewing the path
        └── storage/
            └── presetGraphs.ts           # Example graphs (Königsberg Bridges, Petersen, etc.)`,
    keyFiles: [
      {
        path: 'src/algorithms/eulerian.ts',
        role: "Finds an Eulerian path or circuit using Fleury's algorithm and checks for bridge edges.",
      },
      {
        path: 'src/algorithms/hamiltonian.ts',
        role: 'Uses backtracking to search for a path or cycle that visits every vertex once.',
      },
      {
        path: 'src/components/MatrixEditor.tsx',
        role: 'Lets you edit the adjacency matrix numbers directly and updates the drawn graph.',
      },
    ],
  },
  'cf-p-link': {
    stats: 'Files: 16 | Java 21 + GraalVM Native Image | Cloudflare API',
    tree: `Directory structure:
└── cf-p-link/
    ├── pom.xml                           # Maven build config for the setup CLI and daemon
    └── src/main/java/com/cfplink/
        ├── SetupCli.java                 # Prompts for Cloudflare token, ports, and writes config.json
        ├── TunnelDaemon.java             # Main loop that keeps cloudflared processes running
        ├── ProcessHandler.java           # Starts cloudflared and reads the *.trycloudflare.com URL from logs
        ├── WorkerManager.java            # Builds the Worker router script and uploads it to Cloudflare
        ├── CloudflareApi.java            # HTTP calls to the Cloudflare API
        └── Config.java                   # Reads and writes config.json`,
    keyFiles: [
      {
        path: 'src/main/java/com/cfplink/TunnelDaemon.java',
        role: 'Starts a cloudflared tunnel for each configured local port and restarts it if it exits.',
      },
      {
        path: 'src/main/java/com/cfplink/WorkerManager.java',
        role: 'Takes the current random tunnel URLs and updates a Cloudflare Worker so your main URL forwards to them.',
      },
      {
        path: 'src/main/java/com/cfplink/SetupCli.java',
        role: 'Saves your Cloudflare API token and local port list to config.json and sets up the systemd service.',
      },
    ],
  },
  aggregator: {
    stats: 'Files: 52 | Browser Extension + React + Spring Boot + PostgreSQL',
    tree: `Directory structure:
└── Aggregator-FUll-Stack/
    ├── Aggregator-Website/super-website/ # React web app
    │   ├── public/generator/
    │   │   ├── sandbox.html              # Sandboxed iframe that runs plugin JavaScript files
    │   │   └── proxy-gateway.js          # Forwards fetch requests from the iframe to the extension
    │   ├── public/plugins/
    │   │   └── internet-archive.js       # Example plugin that searches and plays from archive.org
    │   └── src/App.tsx                   # Main UI for browsing plugins, searching, and playing media
    ├── Aggregator-Extension/             # Chrome & Firefox extension
    │   ├── manifest.json                 # Extension permissions and background worker config
    │   └── background.js                 # Makes cross-origin requests on behalf of plugins
    └── Aggregator-Backend/               # Spring Boot backend
        └── src/main/java/com/aggregator/
            ├── service/GitSyncService.java   # Clones plugin repos from Git
            ├── service/VoteService.java      # Tracks upvotes/downvotes on plugins
            └── tui/AdminConsoleTui.java      # Terminal UI for managing the backend server`,
    keyFiles: [
      {
        path: 'Aggregator-Website/super-website/public/generator/sandbox.html',
        role: 'Runs plugin scripts inside an isolated iframe and passes search results back via postMessage.',
      },
      {
        path: 'Aggregator-Extension/background.js',
        role: 'Fetches external pages and streams from the browser extension so CORS does not block them.',
      },
      {
        path: 'Aggregator-Backend/src/main/java/com/aggregator/service/GitSyncService.java',
        role: 'Pulls plugin files from Git repositories and serves the plugin list to the frontend.',
      },
    ],
  },
};

export const FullscreenProjectView: React.FC<FullscreenProjectViewProps> = ({
  project,
  onEject,
}) => {
  // Brief ROM boot animation showing the ROM's logo and description before the demo starts
  const [romBooting, setRomBooting] = useState(true);
  // Show CRT vanish effect for the first 500ms after boot completes
  const [crtVanishing, setCrtVanishing] = useState(true);
  // Show the top details/eject bar initially for 4.5s, then hide until mouse enters top/left corner
  const [headerPinnedOpen, setHeaderPinnedOpen] = useState(true);
  const [cornerHovered, setCornerHovered] = useState(false);
  // Exclusively switch between Demo (false) and Gitingest Summary (true) via button only
  const [showSummary, setShowSummary] = useState(false);
  // For Sentric: allow switching between VitalLink (#/vital), Landing (#/), and Docs (#/docs)
  const [sentricSubRoute, setSentricSubRoute] = useState<'/vital' | '/' | '/docs'>('/vital');

  useEffect(() => {
    setRomBooting(true);
    setCrtVanishing(true);
    const bootTimer = setTimeout(() => setRomBooting(false), 1350);
    const crtTimer = setTimeout(() => setCrtVanishing(false), 1850);
    const headerTimer = setTimeout(() => setHeaderPinnedOpen(false), 4800);
    return () => {
      clearTimeout(bootTimer);
      clearTimeout(crtTimer);
      clearTimeout(headerTimer);
    };
  }, [project.id]);

  // Allow Escape key to eject cartridge if focus is on the outer document
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEject();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onEject]);

  const isHeaderVisible = !romBooting && (headerPinnedOpen || cornerHovered || showSummary);
  const gitingest = GITINGEST_TREES[project.id] || GITINGEST_TREES.murces;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090a0f] text-stone-100 flex flex-col relative selection:bg-emerald-500 selection:text-black">
      {/* BRIEF ROM LOADING SCREEN WITH LOGO & DESCRIPTION */}
      {romBooting && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
          {/* Subtle Green Phosphor Glow Behind Logo */}
          <div className="relative mb-6">
            <div className="absolute -inset-6 bg-[#a6e26e]/20 rounded-full blur-2xl animate-tv-tingle" />
            <img
              src={project.labelSvg}
              alt={project.name}
              className="relative w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-2xl border-2 border-[#a6e26e]/80 shadow-[0_0_35px_rgba(166,226,110,0.4)]"
            />
          </div>

          <h1 className="text-white font-bold text-2xl sm:text-3xl tracking-tight mb-2">
            {project.name}
          </h1>

          <p className="text-white font-bold text-base sm:text-xl max-w-xl leading-snug mb-2">
            "{project.originNote || project.tagline}"
          </p>

          <p className="text-stone-400 text-xs sm:text-sm max-w-lg font-mono mb-6">
            {project.tagline}
          </p>

          {/* Animated ROM Loading Progress Bar */}
          <div className="w-56 sm:w-72 h-2 bg-stone-900 border border-[#a6e26e]/50 rounded-full overflow-hidden">
            <div className="h-full bg-[#a6e26e] shadow-[0_0_12px_#a6e26e] animate-romLoadBar" />
          </div>
          <span
            className="text-[9px] text-[#a6e26e] tracking-widest uppercase mt-2.5"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            LOADING ROM...
          </span>
        </div>
      )}

      {/* CRT-to-Clean Vanish Overlay (fades out after ROM boot completes) */}
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
        {!isHeaderVisible && (
          <button
            type="button"
            onClick={() => setCornerHovered(true)}
            className="m-2 px-2.5 py-1 bg-[#141914]/90 hover:bg-[#1e281e] text-[#a6e26e] border border-[#a6e26e]/60 text-[10px] shadow-lg flex items-center gap-1.5 cursor-pointer transition-opacity opacity-75 hover:opacity-100"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
            title="Reveal Eject & Project Info"
          >
            <span>⏏ EJECT / INFO</span>
          </button>
        )}
      </div>

      {/* Auto-Hiding Top Details & Eject Bar */}
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
              <span>⏏ EJECT</span>
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

          {/* Right: Sub-route Switcher (for Sentric), Exclusive Demo/Summary Toggle Button, Repo & Live Links */}
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            {!showSummary && project.id === 'sentric' && (
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
                  VitalLink
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
                  Landing
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
                  Docs
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSummary((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 cursor-pointer transition-colors font-semibold"
            >
              {showSummary ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Back to Demo</span>
                </>
              ) : (
                <>
                  <FileCode2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Gitingest Summary</span>
                </>
              )}
            </button>

            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-stone-400" />
              <span>Repo</span>
              <ExternalLink className="w-3 h-3 text-stone-500" />
            </a>

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70 transition-colors"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* EXCLUSIVELY RENDER EITHER THE DEMO OR THE GITINGEST SUMMARY */}
      {!showSummary ? (
        <section className="w-full h-full flex flex-col bg-[#090a0f] relative overflow-hidden">
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
              title="Sentric Technologies & VitalLink Demo"
              className="w-full h-full border-0 bg-[#09090b]"
            />
          )}

          {project.id === 'cireu' && (
            <iframe
              src="/demos/cireu/index.html"
              title="Cireu Graph Studio"
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
              title="Aggregator Demo"
              className="w-full h-full border-0 bg-[#0b0f17]"
            />
          )}

          {/* Dedicated Button to Switch to Gitingest Summary */}
          <button
            type="button"
            onClick={() => setShowSummary(true)}
            className="absolute bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/95 hover:bg-stone-800 text-stone-100 border border-stone-600 text-xs font-mono shadow-2xl cursor-pointer hover:border-emerald-500 transition-colors"
          >
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Read Gitingest Summary</span>
          </button>
        </section>
      ) : (
        <section className="w-full h-full overflow-y-auto bg-[#0c0d12] pt-20 pb-16 px-4 sm:px-8 animate-fadeIn">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Section Header with Exclusive Back-to-Demo Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1">
                  <Terminal className="w-4 h-4" />
                  <span>Gitingest Summary</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">
                  {project.title}
                </h2>
                <p className="text-stone-400 text-sm mt-1">{project.tagline}</p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSummary(false)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-300/80 shadow-[3px_3px_0px_#000] text-xs font-mono font-bold cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>BACK TO DEMO</span>
                </button>

                <button
                  type="button"
                  onClick={onEject}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#7c2d38] hover:bg-[#993846] text-[#f5e4d7] border-2 border-[#f5e4d7]/80 shadow-[3px_3px_0px_#000] text-xs cursor-pointer"
                  style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>⏏ EJECT</span>
                </button>
              </div>
            </div>

            {/* Two-Column Grid: Gitingest Tree + Plain Function Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left 5 Cols: Gitingest Directory Structure & Main Files */}
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

                {/* Main Files */}
                <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-4 space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-stone-400">
                    Main Files:
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

              {/* Right 7 Cols: What It Does, Why I Made It, and Tech Stack */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-6 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-semibold">
                    <Layers className="w-4 h-4" />
                    <span>What It Does</span>
                  </div>
                  <p className="text-stone-200 text-sm sm:text-base leading-relaxed">
                    {project.summary.overview}
                  </p>

                  <div className="pt-3 space-y-3">
                    <div className="text-xs font-mono uppercase tracking-wider text-stone-400">
                      How It Works:
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

                {/* Why I Made It & Tech Stack */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-5">
                    <div className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-2">
                      Why I Made It:
                    </div>
                    <p className="text-sm text-white font-semibold leading-relaxed">
                      "{project.originNote || project.summary.clientValue}"
                    </p>
                  </div>

                  <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-5">
                    <div className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-3">
                      Built With:
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
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
