export interface ProjectSummary {
  overview: string;
  architecture: string[];
  techStack: string[];
  clientValue: string;
}

export interface Project {
  id: string;
  name: string;
  title: string;
  tagline: string;
  badge: string;
  accentColor: string;
  accentBg: string;
  labelSvg: string;
  demoType: 'terminal' | 'interactive' | 'visualizer';
  stars?: string;
  repoUrl: string;
  liveUrl?: string;
  summary: ProjectSummary;
  terminalCommands?: Record<string, string>;
  initialTerminalLogs?: string[];
}

export const PROJECTS: Project[] = [
  {
    id: 'murces',
    name: 'murces',
    title: 'MurCes: High-Performance Minecraft Server TUI & CLI Orchestrator',
    tagline: 'Zero-overhead GraalVM Native AOT manager with Lanterna TrueColor TUI, decoupled IPC architecture, Playit.gg tunnels, Modrinth/CurseForge 1-key updates, and safe memory-flushed tar backups.',
    badge: 'GraalVM Native Binary • Linux/WSL2 TUI • Live on Codeberg & GitHub',
    accentColor: '#14b8a6', // Teal
    accentBg: 'rgba(20, 184, 166, 0.15)',
    labelSvg: '/svg/label-murces.svg',
    demoType: 'terminal',
    stars: 'Active Releases (x86_64 & arm64)',
    repoUrl: 'https://codeberg.org/DeployedReject/murces',
    summary: {
      overview: 'Compiled ahead-of-time (AOT) with GraalVM Native Image into a standalone ~30MB Linux executable that cold-boots in <20ms using <40MB resident memory (eliminating the 500MB-1.5GB overhead of bloated Docker/Node web panels). Supervises Minecraft instances in detached tmux sessions, orchestrates Playit.gg tunnels, provisions portable Eclipse Temurin OpenJDKs on demand, and resolves mod dependencies directly over REST APIs.',
      architecture: [
        'Decoupled Orchestrator-TUI Architecture: Headless CLI core communicating over UNIX domain sockets & tmux detachment',
        'Ahead-Of-Time Native Image: Zero JVM warmup, SubstrateVM runtime, instant CLI execution',
        'Multi-Provider Mod Ecosystem: Synchronous & async resolution across Modrinth & CurseForge REST endpoints with SHA-1 validation',
        'Memory-Safe Backup Pipeline: Atomic flush (save-off -> save-all -> tar.zst archive -> save-on) preventing chunk corruption, with automated retention rotation & rclone Google Drive syncing',
        'Dynamic OpenJDK Provisioner: Auto-detects Minecraft version requirements and bundles isolated Temurin JDK 8, 17, or 21 environments'
      ],
      techStack: ['Java 21', 'GraalVM Native Image', 'Lanterna 3', 'tmux / PTY', 'Playit.gg Native API', 'Modrinth REST', 'CurseForge API', 'Bash', 'Systemd'],
      clientValue: 'Proves high-level mastery over native systems compilation, POSIX process detachment, high-performance TUI ergonomics, and mission-critical automated infrastructure.'
    },
    initialTerminalLogs: [
      '[MurCes] MurCes v1.6.0 (production native x86_64) initialized in 18ms',
      '[SESSION] Target server: "paper-1.21" | Background multiplexer: tmux session "mcsv"',
      '[JDK] Active runtime: Eclipse Temurin OpenJDK 21.0.4 (/opt/murces/jdks/temurin-21)',
      '[THEME] Applied Lanterna 24-bit TrueColor palette: Tokyo Night (0% opacity passthrough)',
      'Type "./murces --help" or run any CLI command below to interact.'
    ],
    terminalCommands: {
      './murces --help': `Murces - Minecraft Server Manager TUI & CLI
Usage:
  murces                             Launch interactive Lanterna TUI dashboard
  murces start [-p] [--session <s>]  Start server (-p for Playit.gg tunnel, custom tmux session)
  murces stop [--session <s>]        Stop server with graceful world flush
  murces status [--session <s>]      Check server daemon and session status
  murces server-name [name]          View or set server name & synchronized tmux session
  murces tunnel <setup|status|reset> Playit.gg tunnel native lifecycle management
  murces backup                      Atomic world memory flush + tar snapshot + rclone sync
  murces search-modpacks <query>     Search modpacks on Modrinth
  murces install-modpack <slug>      Download & install modpack with dependency graph
  murces search-plugins <query>      Search Paper/Bukkit plugins on Modrinth/CurseForge
  murces install-plugin <slug>       Install plugin jar into plugins/
  murces update-mods                 1-key update of all installed mods to latest compatible versions
  murces install-jdk [version]       Download portable OpenJDK (8/17/21)
  murces --version                   Show version`,
      './murces status': `[STATUS] Server Name: paper-1.21
[STATUS] Daemon: RUNNING (PID 8412, Session: mcsv)
[STATUS] Memory: Allocated 4096M / Max 8192M (Resident MurCes CLI: 26.4MB)
[STATUS] Port: 25565 | TPS: 20.00 (100% tick rate)
[STATUS] Players: 9/30 online
[STATUS] Playit.gg Tunnel: ACTIVE (endpoint: mc-paper-sea.playit.gg:25565, ping: 14ms)`,
      './murces backup': `[BACKUP] Executing atomic world flush sequence...
[CMD] Dispatching 'save-off' to tmux session 'mcsv'... [OK]
[CMD] Dispatching 'save-all flush' to world memory... [FLUSHED]
[TAR] Packaging ./world into ./backup/world-2026-10-11_21-45.tar.zst...
[TAR] Compression complete: 1.84 GB -> 488 MB (Ratio: 73.5%)
[CMD] Dispatching 'save-on' to tmux session... [RESTORED]
[ROTATION] Checked backup quota: retaining last 3 snapshots (purged 1 expired archive)
[RCLONE] Replicating snapshot to remote "minecraftdrive:backups/"...
[RCLONE] Upload verified with SHA-256 integrity hash: 8f31b8... [DONE in 2.1s]`,
      './murces update-mods': `[MODS] Scanning installed mods in ./mods/... (Found 32 active jars)
[API] Querying Modrinth & CurseForge REST endpoints for Minecraft 1.21.1 (Fabric)...
[FOUND] 3 compatible updates available:
  - Sodium:        0.5.11 -> 0.6.2 (Performance optimization)
  - Lithium:       0.12.7 -> 0.13.0 (Tick optimization)
  - FerriteCore:   6.0.1  -> 6.0.3 (Memory reduction)
[DOWNLOAD] Fetching jars and validating SHA-1 digests...
[CLEANUP] Pruned 3 deprecated legacy jars from ./mods/
[HOT-PATCH] All 3 mods updated successfully.`,
      './murces tunnel status': `[TUNNEL] Playit.gg Native Integration:
  Tunnel ID: pl-79401-ord
  Status: CONNECTED (Protocol: UDP / Zero-NAT)
  Assigned IP: 147.185.221.19
  Port: 25565
  External Address: paper-prod.playit.gg:25565
  Edge PoP: Chicago (ORD-01) | Ping: 12ms`,
      './murces install-jdk 21': `[JDK] Checking Eclipse Temurin API for Linux x86_64...
[FOUND] OpenJDK 21.0.4+7 Temurin GA archive
[DOWNLOAD] Downloading jdk-21.0.4+7.tar.gz [192 MB]... [DONE]
[EXTRACT] Unpacking to ./jdks/temurin-21/
[VERIFY] Testing runtime: openjdk version "21.0.4" 2024-07-16 LTS
[CONFIG] Saved active JDK path to murces.json. Zero host dependencies required.`,
      './murces --version': 'murces v1.6.0 (production release) - GraalVM Native AOT'
    }
  },
  {
    id: 'sentric',
    name: 'Sentric Technologies / VitalLink',
    title: 'Sentric Technologies & VitalLink: Geospatial Disease Surveillance',
    tagline: 'Production real-time epidemiological intelligence, H3 vector spatial hexagonal mapping, MQTT telemetry pipeline, and automated emergency ambulance dispatch.',
    badge: 'Enterprise Healthcare Platform • Python VPS + Cloudflare Edge',
    accentColor: '#ef4444', // Red
    accentBg: 'rgba(239, 68, 68, 0.15)',
    labelSvg: '/svg/label-sentric.svg',
    demoType: 'interactive',
    repoUrl: 'https://github.com/deployedreject/sentrictechnologies',
    summary: {
      overview: 'Real-world healthcare surveillance platform architected for state-level monitoring (with dedicated Andhra Pradesh boundary vector polygons & Uber H3 resolution-8 spatial indexing of 210,000+ cached hexagons). Bridges remote clinic IoT nodes via high-throughput MQTT brokers to a FastAPI/Python backend on VPS, fronted by Cloudflare Pages with zero-trust token authentication.',
      architecture: [
        'Geospatial Vector Engine: MapLibre GL & H3 spatial hexagons calculating Poisson statistical anomaly spikes across Indian states',
        'Real-time MQTT Broker Network: Mosquitto broker cluster with TLS client certificates connecting rural clinic nodes',
        'State-Machine Emergency Dispatch: Live ambulance fleet management (ALS, BLS, Neonatal) with real-time GPS tracking and 10s yellow-to-green confirmation locks',
        'Cloudflare Pages & Edge Middleware: Intercepts and validates JWTs and clinic roles (Institution, Admin, Standard) with zero origin server load'
      ],
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'MapLibre GL', 'Uber H3', 'FastAPI (Python)', 'Mosquitto MQTT', 'Docker', 'PostgreSQL/PostGIS', 'Cloudflare Pages'],
      clientValue: 'Demonstrates enterprise GIS dashboard capabilities, mission-critical asynchronous telemetry, and large-scale public health and logistics workflows.'
    }
  },
  {
    id: 'cireu',
    name: 'cireu',
    title: 'cireu: Eulerian & Hamiltonian Graph Studio',
    tagline: 'Interactive graph algorithms studio with dual SVG canvas/table sync, Fleury\'s algorithm with bridge detection, Hamiltonian cycle backtracker, and step-by-step playback.',
    badge: 'Algorithmic Visualizer • Deployed on GitHub Pages',
    accentColor: '#8b5cf6', // Violet
    accentBg: 'rgba(139, 92, 246, 0.15)',
    labelSvg: '/svg/label-cireu.svg',
    demoType: 'visualizer',
    repoUrl: 'https://github.com/deployedreject/cireu',
    liveUrl: 'https://deployedreject.github.io/cireu/',
    summary: {
      overview: 'A zero-dependency algorithmic visualizer and graph studio built in React + TypeScript. Implements interactive canvas node and edge manipulation, real-time recalculation of Adjacency Matrices and Incidence Tables, Eulerian path/cycle detection via Fleury\'s algorithm with Tarjan bridge detection, and Hamiltonian cycle backtracking with full step-by-step playback.',
      architecture: [
        'Dual-Way Matrix & Canvas Synchronization: Bidirectional live state synchronizing SVG canvas coordinates, degree parity, and adjacency matrix editing',
        'Fleury\'s Algorithm with Bridge Detection: Computes valid Eulerian tours while preventing bridge traversal until necessary',
        'Hamiltonian Backtracking Engine: Recursive DFS exploration with prune heuristics for small-to-medium graphs',
        'Zero-Backend Client Architecture: Fully client-side storage with JSON export/import and GitHub Pages static hosting'
      ],
      techStack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'SVG Canvas', 'Graph Theory', 'Fleury Algorithm', 'Tarjan Bridges'],
      clientValue: 'Highlights deep computer science fundamentals, complex reactive state synchronization, and clean educational UI/UX design.'
    }
  },
  {
    id: 'cf-p-link',
    name: 'cf-p-link',
    title: 'cf-p-link: Cloudflare Persistent Link Daemon',
    tagline: 'Self-healing native Java GraalVM daemon managing automated Cloudflare Tunnels and reverse-proxying Cloudflare Workers with systemd supervision.',
    badge: 'GraalVM Native Executable • Systemd Service • Cloudflare REST API',
    accentColor: '#f59e0b', // Amber
    accentBg: 'rgba(245, 158, 11, 0.15)',
    labelSvg: '/svg/label-cfplink.svg',
    demoType: 'terminal',
    repoUrl: 'https://github.com/deployedreject/cf-p-link',
    summary: {
      overview: 'A self-healing, native-compiled Java toolchain (`setup-cli-native` and `tunnel-daemon-native`) that automates persistent Cloudflare Tunnels and reverse-proxying Cloudflare Workers for multiple local microservices. Automatically fetches Cloudflare Account IDs via API tokens, continuously monitors cloudflared child process health, and instantaneously recompiles and deploys edge Workers whenever tunnels reconnect or crash.',
      architecture: [
        'GraalVM Ahead-Of-Time Binaries: Compiles to sub-20MB standalone Linux executables with negligible CPU and RAM overhead',
        'Child Process Supervision: Spawns and supervises multiple background cloudflared processes with asynchronous thread pools and stdout log scraping',
        'Automatic Worker Ingress Deployment: Generates and uploads custom Cloudflare Edge Worker reverse-proxy scripts via Cloudflare REST v4 API on URL changes',
        'Systemd Watchdog Integration: Generates native Linux systemd unit files (`cf-p-link.service`) with auto-restart on network reconnection'
      ],
      techStack: ['Java 21', 'GraalVM Native Image', 'Maven', 'Cloudflare v4 REST API', 'Cloudflare Workers', 'Systemd', 'Gson'],
      clientValue: 'Exhibits robust DevOps automation, zero-trust cloud networking, edge serverless programming, and native daemon resilience.'
    },
    initialTerminalLogs: [
      '[Daemon] Loaded config successfully with 3 services from /opt/cf-p-link/config.json',
      '[Daemon] Starting tunnel processes...',
      '[ProcessHandler] Spawning cloudflared tunnel for "api-service" (127.0.0.1:8080)...',
      '[ProcessHandler] Spawning cloudflared tunnel for "metrics" (127.0.0.1:9090)...',
      '[ProcessHandler] Spawning cloudflared tunnel for "grafana" (127.0.0.1:3000)...',
      '[WorkerManager] Pushing route table updates to Cloudflare Edge API...',
      'Type "help" or run any native CLI commands below.'
    ],
    terminalCommands: {
      help: `cf-p-link commands:
  status               Display active tunnels, PID telemetry, and edge URLs
  simulate-crash       Simulate cloudflared process termination to test auto-restart
  deploy-worker        Force compilation and redeployment of Cloudflare Worker router
  show-config          Print active config.json service route bindings
  systemd-status       Check systemd unit cf-p-link.service status`,
      status: `[STATUS] Active Service Tunnels:
  - api-service:  http://127.0.0.1:8080 -> https://api-link-94b1.trycloudflare.com (PID 14201, Health: OK)
  - metrics:      http://127.0.0.1:9090 -> https://metrics-link-20a8.trycloudflare.com (PID 14202, Health: OK)
  - grafana:      http://127.0.0.1:3000 -> https://dash-link-77f2.trycloudflare.com (PID 14203, Health: OK)
[EDGE] Cloudflare Worker: worker.deployedreject.dev (All 3 paths routed to active edge tunnels)`,
      'simulate-crash': `[TEST] Simulating abrupt crash: Sending SIGKILL to PID 14201 ("api-service")...
[ProcessHandler] [api-service] Process terminated with exit code 137!
[Daemon] Detected crash for api-service tunnel. Scheduling restart in 5 seconds.
[WorkerManager] Immediate edge notification: removed temporary route for /api/*
[Daemon] Restart timer expired. Spawning new cloudflared tunnel...
[ProcessHandler] [api-service] Tunnel established: https://api-link-fresh99.trycloudflare.com
[WorkerManager] Deploying updated route map to Cloudflare Workers API...
[✓] Worker deployed successfully in 320ms. Recovery complete with zero manual intervention!`,
      'deploy-worker': `[WorkerManager] Packaging JavaScript Worker reverse-proxy payload...
[WorkerManager] Authenticating with Cloudflare API Token (Account: 8a5edab282632443)...
[WorkerManager] PUT /client/v4/accounts/{id}/workers/scripts/cf-p-link-router
[WorkerManager] Cloudflare Edge API response: 200 OK (Deployment active globally across 300+ PoPs).`,
      'show-config': `{
  "apiToken": "Bearer cf_tok_********************",
  "accountId": "8a5edab282632443",
  "workerName": "cf-p-link-router",
  "services": [
    { "name": "api-service", "localPort": 8080, "path": "/api/*" },
    { "name": "metrics", "localPort": 9090, "path": "/metrics/*" },
    { "name": "grafana", "localPort": 3000, "path": "/grafana/*" }
  ]
}`,
      'systemd-status': `● cf-p-link.service - Cloudflare Persistent Tunnel Manager
     Loaded: loaded (/etc/systemd/system/cf-p-link.service; enabled; preset: enabled)
     Active: active (running) since Sun 2026-10-11 18:20:14 UTC; 3h 25min ago
   Main PID: 9284 (tunnel-daemon-n)
      Tasks: 4 (limit: 9482)
     Memory: 18.2M (Peak: 22.1M)
        CPU: 1.284s
     CGroup: /system.slice/cf-p-link.service
             ├─9284 /usr/local/bin/tunnel-daemon-native
             └─9301 cloudflared tunnel --url http://127.0.0.1:8080`
    }
  },
  {
    id: 'aggregator',
    name: 'Aggregator Ecosystem',
    title: 'Aggregator: Extensible Sandboxed Media & Plugin Architecture',
    tagline: 'Modular browser extension (Firefox & Chromium), Spring Boot + PostgreSQL registry backend, and isolated in-browser iframe sandbox gateway with legal open-source plugins.',
    badge: 'Browser Extension • Spring Boot • Sandbox Isolation',
    accentColor: '#84cc16', // Lime
    accentBg: 'rgba(132, 204, 22, 0.15)',
    labelSvg: '/svg/label-aggregator.svg',
    demoType: 'interactive',
    repoUrl: 'https://github.com/deployedreject/aggregator',
    summary: {
      overview: 'Modular cross-browser media aggregation suite (Firefox & Chrome extension + web frontend + Spring Boot registry backend). Designed around an extensible sandboxed plugin runtime where untrusted JavaScript modules execute inside isolated iframes communicating via window.postMessage with zero direct DOM access, paired with an in-browser proxy gateway that bypasses CORS and hotlink protections.',
      architecture: [
        'Isolated Iframe Sandbox Engine: Executes third-party source plugins in a hermetic iframe with strict Content Security Policy, dispatching PROXY_FETCH messages to background workers',
        'Legal Reference Plugins: Public-domain media integrations including Internet Archive advanced search API (handling feature films & metadata streams)',
        'Decentralized Registry Backend: Spring Boot 3 + PostgreSQL server with JGit repository synchronization, dual-state persistence, and Lanterna operations TUI',
        'Privacy-Preserving IP Voting: Salted SHA-256 IP rating engine for community plugins with automatic threshold-based deactivation triggers'
      ],
      techStack: ['JavaScript / WebExtension API', 'React', 'Spring Boot 3', 'Java 21', 'PostgreSQL', 'JGit', 'Iframe Sandbox', 'Docker', 'Cloudflare Workers'],
      clientValue: 'Proves advanced frontend security architecture (sandboxing, CSP, postMessage IPC), browser extension mastery, and robust enterprise backend design.'
    }
  }
];
