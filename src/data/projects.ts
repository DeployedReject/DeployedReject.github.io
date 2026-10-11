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
  originNote?: string;
  terminalCommands?: Record<string, string>;
  initialTerminalLogs?: string[];
}

export const PROJECTS: Project[] = [
  {
    id: 'murces',
    name: 'MurCes',
    title: 'MurCes',
    tagline: 'A terminal UI and CLI tool for managing a local Minecraft server.',
    badge: 'Java • Terminal UI & CLI',
    accentColor: '#14b8a6',
    accentBg: 'rgba(20, 184, 166, 0.15)',
    labelSvg: '/svg/label-murces.svg',
    demoType: 'terminal',
    stars: 'Linux / WSL',
    originNote: 'Made to make controlling my weak Minecraft server more convenient while playing with friends :D',
    repoUrl: 'https://codeberg.org/DeployedReject/murces',
    summary: {
      overview:
        'A lightweight terminal dashboard and command-line tool that runs a Minecraft server in the background using tmux.',
      architecture: [
        'Starts and stops the Minecraft server inside a background tmux session and lets you attach to live logs or send server commands.',
        'Downloads the required Java version (OpenJDK 8, 17, or 21) automatically so you do not have to configure Java manually.',
        'Searches and installs mods, plugins, and modpacks from Modrinth and CurseForge, and updates installed mods in one command.',
        'Creates compressed tar backups of the world folder (pausing world saves first so files do not corrupt) and optionally uploads them with rclone.',
        'Manages a Playit.gg tunnel process so friends can join without port forwarding.',
      ],
      techStack: ['Java 21', 'GraalVM Native Image', 'Lanterna TUI', 'tmux', 'Playit.gg', 'Modrinth API', 'CurseForge API'],
      clientValue: '',
    },
    initialTerminalLogs: [
      '[MurCes] MurCes v1.6.0 initialized',
      '[SESSION] Server: "paper-1.21" | tmux session: "mcsv"',
      '[JDK] Using OpenJDK 21.0.4 (/opt/murces/jdks/temurin-21)',
      'Type "./murces --help" or click a command below.',
    ],
    terminalCommands: {
      './murces --help': `Murces - Minecraft Server Manager TUI & CLI
Usage:
  murces                             Open the terminal UI
  murces start [-p] [--session <s>]  Start server (-p starts Playit.gg tunnel)
  murces stop [--session <s>]        Stop server cleanly
  murces status [--session <s>]      Check if server is running
  murces server-name [name]          View or change server name
  murces tunnel <setup|status|reset> Manage Playit.gg tunnel
  murces backup                      Save world, compress to tar.zst, and upload via rclone
  murces search-modpacks <query>     Search modpacks on Modrinth
  murces install-modpack <slug>      Download and install a modpack
  murces search-plugins <query>      Search plugins on Modrinth/CurseForge
  murces install-plugin <slug>       Download plugin jar into plugins/
  murces update-mods                 Update installed mods in mods/
  murces install-jdk [version]       Download OpenJDK (8/17/21)
  murces --version                   Show version`,
      './murces status': `[STATUS] Server Name: paper-1.21
[STATUS] Process: RUNNING (PID 8412, tmux session: mcsv)
[STATUS] Memory: 4096M allocated
[STATUS] Port: 25565 | TPS: 20.0
[STATUS] Players: 4/20 online
[STATUS] Playit.gg Tunnel: CONNECTED (mc-paper-sea.playit.gg:25565)`,
      './murces backup': `[BACKUP] Starting world backup...
[CMD] Sending 'save-off' to tmux session 'mcsv'... [OK]
[CMD] Sending 'save-all flush'... [OK]
[TAR] Compressing ./world to ./backup/world-2026-10-11_21-45.tar.zst... [DONE]
[CMD] Sending 'save-on' to tmux session... [OK]
[CLEANUP] Kept latest 3 backups, deleted 1 older backup
[RCLONE] Uploading backup to remote "minecraftdrive:backups/"... [DONE]`,
      './murces update-mods': `[MODS] Checking 32 jars in ./mods/...
[API] Checking Modrinth & CurseForge for Minecraft 1.21.1 (Fabric)...
[FOUND] 3 updates available:
  - Sodium:        0.5.11 -> 0.6.2
  - Lithium:       0.12.7 -> 0.13.0
  - FerriteCore:   6.0.1  -> 6.0.3
[DOWNLOAD] Downloaded new jars and removed old versions.`,
      './murces tunnel status': `[TUNNEL] Playit.gg Status:
  Status: CONNECTED
  Local Port: 25565
  Public Address: paper-prod.playit.gg:25565`,
      './murces install-jdk 21': `[JDK] Downloading OpenJDK 21 from Adoptium...
[EXTRACT] Unpacked to ./jdks/temurin-21/
[CONFIG] Updated murces.json to use OpenJDK 21.`,
      './murces --version': 'murces v1.6.0',
    },
  },
  {
    id: 'sentric',
    name: 'SentricTechnologies',
    title: 'SentricTechnologies',
    tagline: 'A map dashboard that receives patient vitals from IoT hardware and dispatches ambulances.',
    badge: 'React • FastAPI • MQTT',
    accentColor: '#ef4444',
    accentBg: 'rgba(239, 68, 68, 0.15)',
    labelSvg: '/svg/label-sentric.svg',
    demoType: 'interactive',
    originNote: 'Made for a friend during a hackathon for their hardware IoT project ^_^',
    repoUrl: 'https://github.com/deployedreject/sentrictechnologies',
    liveUrl: 'https://sentrictechnologies.in',
    summary: {
      overview:
        'A web dashboard and Python backend where hardware sensors stream patient vitals over MQTT and operators track ambulance dispatch.',
      architecture: [
        'Receives live sensor readings and symptom reports from the IoT hardware over an MQTT broker.',
        'Displays reported cases on an interactive map grouped into hex regions so you can see where cases are piling up.',
        'Shows available ambulances on the map and lets an operator assign one to an incoming alert.',
        'Includes a basic login check to separate clinic staff from dashboard operators.',
      ],
      techStack: ['React', 'TypeScript', 'Tailwind CSS', 'MapLibre GL', 'Uber H3', 'FastAPI', 'Mosquitto MQTT', 'PostgreSQL'],
      clientValue: '',
    },
  },
  {
    id: 'cireu',
    name: 'Cireu',
    title: 'Cireu',
    tagline: 'A graph editor that finds and steps through Eulerian and Hamiltonian paths.',
    badge: 'React • TypeScript • SVG',
    accentColor: '#8b5cf6',
    accentBg: 'rgba(139, 92, 246, 0.15)',
    labelSvg: '/svg/label-cireu.svg',
    demoType: 'visualizer',
    originNote: 'Made for an assignment during my discrete mathematics class to make up for missed signatures >_<',
    repoUrl: 'https://github.com/deployedreject/cireu',
    liveUrl: 'https://deployedreject.github.io/cireu/',
    summary: {
      overview:
        'A browser tool for drawing graphs and stepping through Eulerian and Hamiltonian paths one edge at a time.',
      architecture: [
        'Lets you draw nodes and edges on an SVG canvas or edit the adjacency and incidence tables directly—changes in one update the other.',
        'Checks vertex degrees and runs Fleury\'s algorithm to find an Eulerian path or circuit.',
        'Runs backtracking search to find a Hamiltonian path or cycle and records the steps.',
        'Includes playback controls (play, pause, step forward/backward) to watch the algorithm walk the graph.',
      ],
      techStack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'SVG'],
      clientValue: '',
    },
  },
  {
    id: 'cf-p-link',
    name: 'cf-p-link',
    title: 'cf-p-link',
    tagline: 'Keeps free Cloudflare quick tunnels alive and updates a Worker with their new URLs.',
    badge: 'Java • Cloudflare Tunnels & Workers',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.15)',
    labelSvg: '/svg/label-cfplink.svg',
    demoType: 'terminal',
    originNote: 'Made to expose local dev servers and services through Cloudflare without port forwarding ;)',
    repoUrl: 'https://github.com/deployedreject/cf-p-link',
    summary: {
      overview:
        'Runs cloudflared in the background for local ports, parses each new random trycloudflare.com URL, and updates a Cloudflare Worker router.',
      architecture: [
        'Starts a `cloudflared` process for each local port listed in `config.json` and restarts it if it crashes.',
        'Reads the generated `*.trycloudflare.com` URL from `cloudflared` output whenever a tunnel starts.',
        'Generates a simple Cloudflare Worker script that routes paths (like `/api/*`) to the current tunnel URLs and uploads it via the Cloudflare API.',
        'Includes a setup command that writes the config file and creates a `systemd` service to run on boot.',
      ],
      techStack: ['Java 21', 'GraalVM Native Image', 'Cloudflare API', 'Cloudflare Workers', 'cloudflared', 'systemd'],
      clientValue: '',
    },
    initialTerminalLogs: [
      '[cf-p-link] Loaded 3 local services from /opt/cf-p-link/config.json',
      '[ProcessHandler] Started cloudflared for "api-service" (127.0.0.1:8080)',
      '[ProcessHandler] Started cloudflared for "metrics" (127.0.0.1:9090)',
      '[ProcessHandler] Started cloudflared for "grafana" (127.0.0.1:3000)',
      '[WorkerManager] Updated Cloudflare Worker with current tunnel URLs.',
      'Type "help" or click a command below.',
    ],
    terminalCommands: {
      help: `cf-p-link commands:
  status               Show running tunnels and their current URLs
  simulate-crash       Kill a tunnel process to see it restart and update the Worker
  deploy-worker        Re-upload the Cloudflare Worker script
  show-config          Show config.json
  systemd-status       Show systemd service status`,
      status: `[STATUS] Active Tunnels:
  - api-service:  http://127.0.0.1:8080 -> https://api-link-94b1.trycloudflare.com (PID 14201)
  - metrics:      http://127.0.0.1:9090 -> https://metrics-link-20a8.trycloudflare.com (PID 14202)
  - grafana:      http://127.0.0.1:3000 -> https://dash-link-77f2.trycloudflare.com (PID 14203)
[WORKER] Routing /api/*, /metrics/*, and /grafana/* to active tunnel URLs.`,
      'simulate-crash': `[TEST] Killing PID 14201 ("api-service")...
[ProcessHandler] "api-service" exited (code 137). Restarting in 5s...
[ProcessHandler] Started new tunnel: https://api-link-fresh99.trycloudflare.com
[WorkerManager] Uploading new URL to Cloudflare Worker...
[OK] Worker updated with the new tunnel URL.`,
      'deploy-worker': `[WorkerManager] Generating Worker script for 3 routes...
[WorkerManager] Uploading to Cloudflare Workers API...
[OK] Worker updated (200 OK).`,
      'show-config': `{
  "apiToken": "cf_tok_********************",
  "accountId": "8a5edab282632443",
  "workerName": "cf-p-link-router",
  "services": [
    { "name": "api-service", "localPort": 8080, "path": "/api/*" },
    { "name": "metrics", "localPort": 9090, "path": "/metrics/*" },
    { "name": "grafana", "localPort": 3000, "path": "/grafana/*" }
  ]
}`,
      'systemd-status': `● cf-p-link.service - Cloudflare Tunnel Manager
     Loaded: loaded (/etc/systemd/system/cf-p-link.service; enabled)
     Active: active (running)
   Main PID: 9284 (tunnel-daemon)`,
    },
  },
  {
    id: 'aggregator',
    name: 'Aggregator',
    title: 'Aggregator',
    tagline: 'A browser extension and backend registry that loads media from multiple sites in one place using sandboxed plugins.',
    badge: 'Browser Extension • Live Backend • Spring Boot',
    accentColor: '#84cc16',
    accentBg: 'rgba(132, 204, 22, 0.15)',
    labelSvg: '/svg/label-aggregator.svg',
    demoType: 'interactive',
    originNote: 'Wanted to learn JS, so I made it for a friend who wanted a better way to manage all his sites :)',
    repoUrl: 'https://github.com/deployedreject/aggregator',
    liveUrl: 'https://aggregator-registry.mishravaibhav2048.workers.dev',
    summary: {
      overview:
        'A browser extension and live backend registry that searches and plays media across multiple sites using sandboxed JavaScript plugins.',
      architecture: [
        'Runs each site plugin inside a sandboxed iframe so plugin scripts cannot read the main page.',
        'Uses a browser extension background script to fetch pages and media streams that would normally be blocked by CORS.',
        'Includes a Spring Boot backend that pulls plugin scripts from Git repositories and serves them to the app.',
        'Lets users vote on whether a plugin works and hides plugins that stop working.',
      ],
      techStack: ['JavaScript', 'WebExtensions API', 'React', 'Spring Boot', 'PostgreSQL', 'JGit'],
      clientValue: '',
    },
  },
];
