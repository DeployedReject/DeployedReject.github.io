import { useState, useEffect } from 'react';
import type { Project } from '../data/projects';
import { MurcesTuiDemo } from './MurcesTuiDemo';
import { CfPLinkDemo } from './CfPLinkDemo';

interface FullscreenProjectViewProps {
  project: Project;
  onEject: () => void;
  isLightMode?: boolean;
}

const GITINGEST_TREES: Record<
  string,
  {
    stats: string;
    tree: string;
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
            └── presetGraphs.ts           # Example graphs (Konigsberg Bridges, Petersen, etc.)`,
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
  },
};

export const FullscreenProjectView: React.FC<FullscreenProjectViewProps> = ({
  project,
  onEject,
  isLightMode = false,
}) => {
  // Exclusively switch between Demo (false) and Gitingest Summary (true) via top bar button
  const [showSummary, setShowSummary] = useState(false);
  // For Sentric: allow switching between VitalLink (#/vital), Landing (#/), and Docs (#/docs)
  const [sentricSubRoute, setSentricSubRoute] = useState<'/vital' | '/' | '/docs'>('/vital');

  const handleToggleSummary = () => {
    setShowSummary((prev) => !prev);
  };

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

  const gitingest = GITINGEST_TREES[project.id] || GITINGEST_TREES.murces;

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col relative selection:bg-emerald-500 selection:text-black transition-colors duration-300 ${
        isLightMode ? 'bg-[#f5f0e6] text-stone-900' : 'bg-[#090a0f] text-stone-100'
      }`}
    >

      {/* Single Top Bar (Only place with Eject, Title/Tagline, and Summary toggle) */}
      <header
        className={`shrink-0 z-50 border-b-2 px-4 sm:px-6 py-2.5 transition-colors duration-300 ${
          isLightMode
            ? 'bg-[#ebe4d5] border-[#c8bda8] text-stone-900 shadow-sm'
            : 'bg-[#121417] border-[#333942] text-stone-100 shadow-xl'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Single Eject Button & Project Identity */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={onEject}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#7c2d38] hover:bg-[#993846] text-[#f5e4d7] border-2 border-[#f5e4d7]/80 shadow-[2px_2px_0px_#000] active:translate-y-0.5 transition-all text-[10px] sm:text-xs cursor-pointer"
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              <span>{'\uf060 \uf052'} EJECT</span>
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono font-bold text-sm ${
                    isLightMode ? 'text-stone-900' : 'text-white'
                  }`}
                >
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
              <span
                className={`text-[11px] font-mono line-clamp-1 ${
                  isLightMode ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                {project.tagline}
              </span>
            </div>
          </div>

          {/* Right: Sentric Route Switcher, Single Demo/Summary Toggle, Repo & Live Links */}
          <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
            {!showSummary && project.id === 'sentric' && (
              <div
                className={`flex items-center border rounded p-0.5 mr-1 ${
                  isLightMode
                    ? 'bg-stone-200 border-stone-400'
                    : 'bg-stone-900 border-stone-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSentricSubRoute('/vital')}
                  className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors ${
                    sentricSubRoute === '/vital'
                      ? 'bg-red-600 text-white font-semibold'
                      : isLightMode
                      ? 'text-stone-700 hover:text-stone-950'
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
                      : isLightMode
                      ? 'text-stone-700 hover:text-stone-950'
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
                      : isLightMode
                      ? 'text-stone-700 hover:text-stone-950'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Docs
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleToggleSummary}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border cursor-pointer transition-colors font-semibold ${
                isLightMode
                  ? 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700'
                  : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-600'
              }`}
            >
              {showSummary ? (
                <>
                  <span className="nf-glyph text-emerald-400">{'\uf04b'}</span>
                  <span>Back to Demo</span>
                </>
              ) : (
                <>
                  <span className="nf-glyph text-amber-300">{'\uf15c'}</span>
                  <span>Gitingest Summary</span>
                </>
              )}
            </button>

            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors ${
                isLightMode
                  ? 'bg-stone-200 hover:bg-stone-300 text-stone-900 border-stone-400'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
              }`}
            >
              <span className="nf-glyph text-stone-500">{'\uf126'}</span>
              <span>Repo</span>
              <span className="nf-glyph text-stone-500 text-[10px]">{'\uf08e'}</span>
            </a>

            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70 transition-colors"
              >
                <span>Live Site</span>
                <span className="nf-glyph text-emerald-400 text-[10px]">{'\uf08e'}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* EXCLUSIVELY RENDER EITHER THE DEMO OR THE GITINGEST SUMMARY */}
      {!showSummary ? (
        <section className="flex-1 min-h-0 w-full flex flex-col relative overflow-hidden">
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
        </section>
      ) : (
        <section
          className={`flex-1 min-h-0 w-full overflow-y-auto py-8 px-4 sm:px-8 animate-fadeIn ${
            isLightMode ? 'bg-[#f5f0e6]' : 'bg-[#0c0d12]'
          }`}
        >
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 6 Cols: Gitingest Directory Structure */}
            <div className="lg:col-span-6">
              <div
                className={`rounded-lg border overflow-hidden ${
                  isLightMode
                    ? 'border-stone-300 bg-white shadow-sm'
                    : 'border-stone-800 bg-[#08090c]'
                }`}
              >
                <div
                  className={`px-4 py-2.5 border-b flex items-center justify-between text-xs font-mono ${
                    isLightMode
                      ? 'bg-stone-100 border-stone-300 text-stone-800'
                      : 'bg-stone-900/90 border-stone-800 text-amber-300'
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="nf-glyph">{'\uf15c'}</span>
                    gitingest://{project.id}/digest.txt
                  </span>
                  <span className="text-[11px] opacity-70">(•‿•) UTF-8</span>
                </div>
                <div
                  className={`px-4 py-2 border-b text-[11px] font-mono ${
                    isLightMode
                      ? 'bg-emerald-50 border-stone-200 text-emerald-800'
                      : 'bg-stone-950/60 border-stone-900 text-emerald-400'
                  }`}
                >
                  {gitingest.stats}
                </div>
                <pre
                  className={`p-4 text-[11px] sm:text-xs font-mono overflow-x-auto leading-relaxed ${
                    isLightMode ? 'text-stone-800' : 'text-stone-300'
                  }`}
                >
                  {gitingest.tree}
                </pre>
              </div>
            </div>

            {/* Right 6 Cols: How It Works & Built With */}
            <div className="lg:col-span-6 space-y-6">
              <div
                className={`rounded-lg border p-6 space-y-4 ${
                  isLightMode
                    ? 'border-stone-300 bg-white shadow-sm'
                    : 'border-stone-800 bg-stone-900/40'
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-mono text-sm font-semibold ${
                    isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                  }`}
                >
                  <span className="nf-glyph">{'\uf085'}</span>
                  <span>How It Works (｡•̀ᴗ-)✧</span>
                </div>
                <ul
                  className={`space-y-2.5 text-sm ${
                    isLightMode ? 'text-stone-800' : 'text-stone-300'
                  }`}
                >
                  {project.summary.architecture.map((item, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded border ${
                        isLightMode
                          ? 'bg-stone-50 border-stone-200'
                          : 'bg-stone-950/60 border-stone-800/80'
                      }`}
                    >
                      <span
                        className={`font-mono font-bold shrink-0 mt-0.5 ${
                          isLightMode ? 'text-emerald-700' : 'text-emerald-400'
                        }`}
                      >
                        0{idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`rounded-lg border p-5 ${
                  isLightMode
                    ? 'border-stone-300 bg-white shadow-sm'
                    : 'border-stone-800 bg-stone-900/40'
                }`}
              >
                <div
                  className={`text-xs font-mono uppercase tracking-wider mb-3 ${
                    isLightMode ? 'text-stone-600' : 'text-stone-400'
                  }`}
                >
                  Built With :D
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.summary.techStack.map((tech) => (
                    <span
                      key={tech}
                      className={`text-xs font-mono px-2.5 py-1 rounded border ${
                        isLightMode
                          ? 'bg-stone-100 text-stone-800 border-stone-300'
                          : 'bg-stone-950 text-stone-200 border-stone-800'
                      }`}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};


