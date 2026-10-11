import { useState, useEffect } from 'react';
import { FakeTerminal } from './FakeTerminal';

type TuiScreen =
  | 'main'
  | 'control'
  | 'install'
  | 'properties'
  | 'backups'
  | 'migration'
  | 'mods'
  | 'manage-mods'
  | 'themes'
  | 'tasks';

interface ThemePalette {
  name: string;
  bg: string;
  surface: string;
  fg: string;
  border: string;
  badgeBg: string;
  badgeFg: string;
  accent: string;
  success: string;
  info: string;
  warn: string;
}

const THEMES: Record<string, ThemePalette> = {
  'Gruvbox Dark': {
    name: 'Gruvbox Dark',
    bg: '#1d2021',
    surface: '#141617',
    fg: '#ebdbb2',
    border: '#bdae93',
    badgeBg: '#d79921',
    badgeFg: '#1d2021',
    accent: '#fabd2f',
    success: '#b8bb26',
    info: '#83a598',
    warn: '#fe8019',
  },
  'Tokyo Night': {
    name: 'Tokyo Night',
    bg: '#1a1b26',
    surface: '#13141c',
    fg: '#c0caf5',
    border: '#7aa2f7',
    badgeBg: '#e0af68',
    badgeFg: '#1a1b26',
    accent: '#7aa2f7',
    success: '#9ece6a',
    info: '#7dcfff',
    warn: '#e0af68',
  },
  Nord: {
    name: 'Nord',
    bg: '#1e222a',
    surface: '#171a20',
    fg: '#d8dee9',
    border: '#81a1c1',
    badgeBg: '#88c0d0',
    badgeFg: '#1e222a',
    accent: '#88c0d0',
    success: '#a3be8c',
    info: '#81a1c1',
    warn: '#ebcb8b',
  },
  'Catppuccin Mocha': {
    name: 'Catppuccin Mocha',
    bg: '#1e1e2e',
    surface: '#181825',
    fg: '#cdd6f4',
    border: '#cba6f7',
    badgeBg: '#f9e2af',
    badgeFg: '#1e1e2e',
    accent: '#cba6f7',
    success: '#a6e3a1',
    info: '#89b4fa',
    warn: '#fab387',
  },
};

const MOD_CATALOG = [
  {
    slug: 'xaeros-minimap',
    title: "Xaero's Minimap",
    author: 'thexaero',
    version: '24.6.1 (1.21.1)',
    desc: "Unlike many other minimap mods, Xaero's minimap keeps the aesthetic of vanilla Minecraft, which helps it be a more seamless addition to the game.",
  },
  {
    slug: 'cobblemon',
    title: 'Cobblemon',
    author: 'CobblemonMod',
    version: '1.6.0+1.21.1',
    desc: 'An open-source Pokémon mod for Fabric and NeoForge targeting modern Minecraft versions with custom animations and server-side support.',
  },
  {
    slug: 'sodium',
    title: 'Sodium',
    author: 'jellysquid3',
    version: '0.6.3+mc1.21.1',
    desc: 'Modern rendering engine and client/server optimization mod that greatly improves frame rates and reduces micro-stutter.',
  },
  {
    slug: 'lithium',
    title: 'Lithium',
    author: 'jellysquid3',
    version: '0.13.1+mc1.21.1',
    desc: 'General-purpose server optimization mod which works to improve game physics, mob AI, block ticking, and world generation without changing vanilla mechanics.',
  },
];

interface MurcesTuiDemoProps {
  initialLogs: string[];
  commands: Record<string, string>;
}

export const MurcesTuiDemo: React.FC<MurcesTuiDemoProps> = ({ initialLogs, commands }) => {
  const [mode, setMode] = useState<'tui' | 'cli'>('tui');
  const [screen, setScreen] = useState<TuiScreen>('main');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [themeName, setThemeName] = useState<string>('Gruvbox Dark');

  // Server state
  const [serverRunning, setServerRunning] = useState<boolean>(true);
  const [playitEnabled, setPlayitEnabled] = useState<boolean>(true);
  const [ramAlloc, setRamAlloc] = useState<string>('4G');
  const [engineLoader, setEngineLoader] = useState<string>('Fabric');
  const [mcVersion, setMcVersion] = useState<string>('1.21.1');
  const [consoleCmd, setConsoleCmd] = useState<string>('say Welcome to MurCes Server!');

  // Mods & Backups state
  const [modPlatform, setModPlatform] = useState<'Modrinth' | 'CurseForge'>('Modrinth');
  const [modQuery, setModQuery] = useState<string>('xaero');
  const [selectedModIdx, setSelectedModIdx] = useState<number>(0);
  const [installedMods, setInstalledMods] = useState<string[]>([
    'cobblemon-1.6.0+1.21.1.jar',
    'xaeros-minimap-24.6.1.jar',
    'lithium-0.13.1.jar',
  ]);
  const [backups, setBackups] = useState<Array<{ name: string; size: string; date: string }>>([
    { name: '2026-10-11_02-57-38.tar', size: '640.0 KB', date: '2026-10-11 02:57' },
    { name: '2026-10-10_19-14-12.tar', size: '612.4 KB', date: '2026-10-10 19:14' },
  ]);

  const [activityLogs, setActivityLogs] = useState<Array<{ type: 'OK' | 'INFO' | 'STATUS' | 'WARN'; text: string }>>([
    { type: 'OK', text: 'Applied theme: Gruvbox Dark (0% trans)' },
    { type: 'INFO', text: "Searching modrinth for 'cobblemon' (MC 1.21.1, fabric)" },
    { type: 'OK', text: 'Mod Cobblemon downloaded and installed to mods/ folder!' },
    { type: 'INFO', text: "Searching modrinth for 'xaero' (MC 1.21.1, fabric)" },
    { type: 'OK', text: "Mod Xaero's Minimap downloaded and installed to mods/ folder!" },
    { type: 'OK', text: "svctrl: tmux session: 'mcsv' active (Port 25565)." },
  ]);

  const [serverLogs, setServerLogs] = useState<string[]>([
    '[02:39:48] [Worker-Main-6/INFO]: Preparing spawn area: 2%',
    '[02:39:49] [Worker-Main-8/INFO]: Preparing spawn area: 18%',
    '[02:39:49] [Worker-Main-2/INFO]: Preparing spawn area: 51%',
    '[02:39:50] [Worker-Main-9/INFO]: Preparing spawn area: 73%',
    '[02:39:50] [Server thread/INFO]: Time elapsed: 2106 ms',
    '[02:39:50] [Server thread/INFO]: Done (5.137s)! For help, type "help"',
  ]);

  const palette = THEMES[themeName] || THEMES['Gruvbox Dark'];

  const addActivity = (type: 'OK' | 'INFO' | 'STATUS' | 'WARN', text: string) => {
    setActivityLogs((prev) => [...prev, { type, text }]);
  };

  const addServerLog = (line: string) => {
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8);
    setServerLogs((prev) => [...prev, `[${ts}] ${line}`]);
  };

  const navItems: Array<{ id: TuiScreen; key: string; label: string }> = [
    { id: 'control', key: 'S', label: '1.  \uf233 [S]erver Control & Console' },
    { id: 'install', key: 'I', label: '2.  \uf1c0 [I]nstall Server Engine' },
    { id: 'properties', key: 'C', label: '3.  \uf013 [C]onfigure Properties' },
    { id: 'backups', key: 'B', label: '4.  \uf0c7 [B]ackups (World)' },
    { id: 'migration', key: 'P', label: '5.  \uf007 [P]layer UUID Migration' },
    { id: 'mods', key: 'D', label: '6.  \uf019 [D]ownload & Browse Mods' },
    { id: 'manage-mods', key: 'M', label: '7.  \uf487 [M]anage Installed Mods' },
    { id: 'themes', key: 'Z', label: '8.  \uf1fc [Z] Customization & Themes' },
    { id: 'tasks', key: 'J', label: '9.  \uf0ae [J] Active Tasks & Job Manager' },
  ];

  // Arrow key navigation for interactive Lanterna TUI
  useEffect(() => {
    if (mode !== 'tui') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input field, let default behavior occur
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Escape') {
        setScreen('main');
        return;
      }

      if (screen === 'main') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : navItems.length - 1));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < navItems.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          setScreen(navItems[selectedIndex].id);
        } else if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
          const num = parseInt(e.key, 10) - 1;
          if (num >= 0 && num < navItems.length) {
            setSelectedIndex(num);
            setScreen(navItems[num].id);
          }
        }
      } else if (screen === 'mods') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedModIdx((prev) => (prev > 0 ? prev - 1 : MOD_CATALOG.length - 1));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedModIdx((prev) => (prev < MOD_CATALOG.length - 1 ? prev + 1 : 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, screen, selectedIndex, navItems]);

  if (mode === 'cli') {
    return (
      <div className="flex flex-col h-[620px] bg-[#141617]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1d2021] border-b border-[#3c3836] font-mono text-xs">
          <span className="text-[#fabd2f] font-bold">{'\uf120'} MurCes Headless CLI Mode (./murces)</span>
          <button
            type="button"
            onClick={() => setMode('tui')}
            className="px-3 py-1 bg-[#d79921] text-[#1d2021] font-bold cursor-pointer"
          >
            {'\uf060'} Switch back to Interactive Lanterna TUI
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <FakeTerminal initialLogs={initialLogs} commands={commands} accentColor="#fabd2f" />
        </div>
      </div>
    );
  }

  const activeMod = MOD_CATALOG[selectedModIdx] || MOD_CATALOG[0];

  return (
    <div
      className="w-full h-[640px] p-2 sm:p-3 font-mono text-xs sm:text-[13px] select-none flex flex-col justify-between overflow-hidden"
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      {/* Outer Lanterna Window Border */}
      <div
        className="relative w-full h-full border flex flex-col p-2 gap-2"
        style={{ borderColor: palette.border }}
      >
        {/* Top Window Title Badge */}
        <div className="absolute -top-2.5 left-3 flex items-center justify-between right-3 pointer-events-none">
          <span
            className="px-1.5 font-bold text-xs"
            style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
          >
            Murces - Minecraft Server Manager
          </span>
          <button
            type="button"
            onClick={() => setMode('cli')}
            className="pointer-events-auto px-2 py-0.5 text-[11px] font-bold border cursor-pointer"
            style={{
              backgroundColor: palette.surface,
              color: palette.accent,
              borderColor: palette.border,
            }}
          >
            [ {'\uf120'} Switch to CLI Shell (./murces) ]
          </button>
        </div>

        {/* Top Hotkey Bar */}
        <div
          className="flex flex-wrap items-center gap-3 px-2 py-1 border-b text-xs mt-1"
          style={{ borderColor: palette.border, color: palette.accent }}
        >
          <span className="cursor-pointer hover:underline" onClick={() => setScreen('main')}>
            {'\uf05a'} [TIP] {'\uf15c'} [A] Activity Log
          </span>
          <span className="opacity-50">|</span>
          <span className="cursor-pointer hover:underline" onClick={() => setScreen('control')}>
            {'\uf120'} [L] Server Console
          </span>
          <span className="opacity-50">|</span>
          <span className="cursor-pointer hover:underline" onClick={() => setScreen('tasks')}>
            {'\uf0ae'} [J] Active Tasks
          </span>
          <span className="opacity-50">|</span>
          <span>{'\uf013'} [TAB] Cycle Focus</span>
          <span className="opacity-50">|</span>
          <button
            type="button"
            onClick={() => setScreen('main')}
            className="cursor-pointer hover:underline font-bold"
          >
            {'\uf060'} [ESC] Back to Main Menu
          </button>
        </div>

        {/* Middle Split Row: Workspace (Left 65%) + Activity & Diagnostics (Right 35%) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2">
          {/* Left Panel: Workspace */}
          <div
            className="lg:col-span-8 relative border p-3 flex flex-col justify-between overflow-y-auto"
            style={{ borderColor: palette.border, backgroundColor: palette.surface }}
          >
            <span
              className="absolute -top-2.5 left-3 px-1.5 font-bold text-xs"
              style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
            >
              = Workspace
            </span>

            {screen === 'main' && (
              <div className="space-y-3 mt-1">
                <div style={{ color: palette.accent }} className="font-bold">
                  = Workspace: Main Menu =
                </div>

                {/* Exact ASCII Logo from main_menu.png */}
                <pre
                  className="text-[11px] sm:text-xs leading-[1.15] font-mono m-0"
                  style={{ color: palette.success }}
                >
{` __  __             ____           
|  \\/  |_   _ _ __ / ___|___  ___  
| |\\/| | | | | '__| |   / _ \\/ __|  v1.6.0
| |  | | |_| | |  | |__|  __/\\__ \\ 
|_|  |_|\\__,_|_|   \\____\\___||___/ `}
                </pre>
                <div style={{ color: palette.accent }} className="text-xs font-bold">
                  {'\uf005'} Native AOT GraalVM binary! {'\uf005'}
                </div>

                {/* Main Navigation Box */}
                <div
                  className="relative border p-2 pt-3 mt-2"
                  style={{ borderColor: palette.border }}
                >
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf013'} Main Navigation (Click or Enter to select)
                  </span>

                  <div className="space-y-0.5">
                    {navItems.map((item, idx) => {
                      const isSel = selectedIndex === idx;
                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onClick={() => setScreen(item.id)}
                          className="px-2 py-0.5 cursor-pointer font-mono transition-none"
                          style={{
                            backgroundColor: isSel ? palette.badgeBg : 'transparent',
                            color: isSel ? palette.badgeFg : palette.fg,
                            fontWeight: isSel ? 'bold' : 'normal',
                          }}
                        >
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {screen === 'control' && (
              <div className="space-y-3 mt-1">
                <div style={{ color: palette.accent }} className="font-bold">
                  = Workspace: {'\uf233'} Server Control =
                </div>

                {/* Server State Box */}
                <div className="relative border p-2.5 pt-3" style={{ borderColor: palette.border }}>
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf233'} Server State
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    <span>Server Status:</span>
                    <span
                      style={{ color: serverRunning ? palette.success : '#fb4934' }}
                      className="font-bold"
                    >
                      {'\uf111'} {serverRunning ? '[RUNNING] - Port 25565' : '[STOPPED]'}
                    </span>
                    <button
                      type="button"
                      onClick={() => addActivity('STATUS', 'Polled tmux session mcsv: HEALTHY (20.0 TPS)')}
                      className="cursor-pointer hover:underline"
                    >
                      &lt;{'\uf021'} [U]pdate Status&gt;
                    </button>
                  </div>
                </div>

                {/* Launch Options Box */}
                <div className="relative border p-2.5 pt-3" style={{ borderColor: palette.border }}>
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf013'} Launch Options
                  </span>
                  <div className="flex flex-wrap items-center gap-6">
                    <button
                      type="button"
                      onClick={() => {
                        setPlayitEnabled(!playitEnabled);
                        addActivity(
                          'INFO',
                          `Playit.gg tunnel (--public) set to ${!playitEnabled}`
                        );
                      }}
                      className="cursor-pointer"
                    >
                      [{playitEnabled ? 'x' : ' '}] {'\uf132'} [P]layit Tunnel (--public)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = ramAlloc === '4G' ? '8G' : ramAlloc === '8G' ? '12G' : '4G';
                        setRamAlloc(next);
                        addActivity('INFO', `Updated JVM heap allocation (-Xmx) to ${next}`);
                      }}
                      className="cursor-pointer"
                    >
                      {'\uf013'} [M]emory (RAM): {ramAlloc} |{'\uf0d7'}
                    </button>
                  </div>
                </div>

                {/* Server Actions Box */}
                <div className="relative border p-2.5 pt-3" style={{ borderColor: palette.border }}>
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf0ae'} Server Actions
                  </span>
                  <div className="flex flex-wrap gap-5">
                    <button
                      type="button"
                      onClick={() => {
                        setServerRunning(true);
                        addActivity('INFO', `Starting server (public=${playitEnabled}, RAM=${ramAlloc})...`);
                        addActivity('OK', "svctrl: tmux session: 'mcsv' started.");
                        addServerLog('[Server thread/INFO]: Starting minecraft server version 1.21.1');
                        addServerLog('[Server thread/INFO]: Done (2.412s)! For help, type "help"');
                      }}
                      className="cursor-pointer font-bold hover:underline"
                      style={{ color: palette.success }}
                    >
                      &lt;{'\uf04b'} [S]tart Server&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setServerRunning(false);
                        addActivity('WARN', 'Dispatched graceful stop to tmux session mcsv.');
                        addServerLog('[Server thread/INFO]: Stopping the server');
                        addServerLog('[Server thread/INFO]: Saving worlds...');
                      }}
                      className="cursor-pointer font-bold hover:underline text-red-400"
                    >
                      &lt;{'\uf04d'} [T]erminate Server&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setServerRunning(true);
                        addActivity('STATUS', 'Restarting Minecraft daemon inside tmux session mcsv...');
                        addServerLog('[Server thread/INFO]: Reloading server properties & chunks...');
                      }}
                      className="cursor-pointer font-bold hover:underline"
                      style={{ color: palette.accent }}
                    >
                      &lt;{'\uf021'} [R]estart Server&gt;
                    </button>
                  </div>
                </div>

                {/* Command Dispatch Box */}
                <div className="relative border p-2.5 pt-3" style={{ borderColor: palette.border }}>
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf120'} Command Dispatch
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span>{'\uf120'} [C]onsole Cmd (/):</span>
                    <input
                      type="text"
                      value={consoleCmd}
                      onChange={(e) => setConsoleCmd(e.target.value)}
                      className="flex-1 bg-black/30 px-2 py-0.5 outline-none border border-white/10"
                      style={{ color: palette.fg }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addActivity('OK', `Dispatched command '${consoleCmd}' to tmux session mcsv`);
                        addServerLog(`[Server thread/INFO]: [Server] ${consoleCmd}`);
                      }}
                      className="cursor-pointer font-bold hover:underline"
                      style={{ color: palette.accent }}
                    >
                      &lt;{'\uf00c'} [D]ispatch&gt;
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen('main')}
                  className="cursor-pointer hover:underline"
                >
                  &lt;{'\uf060'} [B]ack to Main Menu&gt;
                </button>
              </div>
            )}

            {screen === 'install' && (
              <div className="space-y-3 mt-1">
                <div style={{ color: palette.accent }} className="font-bold">
                  = Workspace: {'\uf013'} Install Server Engine =
                </div>
                <div className="relative border p-3 pt-4 space-y-1.5" style={{ borderColor: palette.border }}>
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf013'} Server Configuration
                  </span>
                  <div
                    className="flex justify-between cursor-pointer hover:bg-white/5 px-1"
                    onClick={() =>
                      setEngineLoader(
                        engineLoader === 'Fabric' ? 'Paper' : engineLoader === 'Paper' ? 'NeoForge' : 'Fabric'
                      )
                    }
                  >
                    <span>{'\uf233'} [E]ngine:</span>
                    <span className="font-bold">{engineLoader} |{'\uf0d7'}</span>
                  </div>
                  <div
                    className="flex justify-between cursor-pointer hover:bg-white/5 px-1"
                    onClick={() => setMcVersion(mcVersion === '1.21.1' ? '1.20.4' : '1.21.1')}
                  >
                    <span>{'\uf1c0'} Game [V]ersion:</span>
                    <span className="font-bold">{mcVersion} |{'\uf0d7'}</span>
                  </div>
                  <div className="flex justify-between px-1">
                    <span>{'\uf013'} Loader [L] Version:</span>
                    <span>0.16.5 (Latest Stable)</span>
                  </div>
                  <div className="flex justify-between px-1">
                    <span>{'\ue738'} Portable Open[J]DK:</span>
                    <span style={{ color: palette.success }}>[x] Eclipse Temurin 21.0.4 (Auto)</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      addActivity('INFO', `Starting installation of ${engineLoader} ${mcVersion} (RAM: ${ramAlloc})...`);
                      addActivity('STATUS', `Downloading ${engineLoader.toLowerCase()}-installer.jar (100.00%)`);
                      addActivity('OK', 'Server installation & EULA acceptance finished successfully!');
                    }}
                    className="px-2 py-0.5 font-bold cursor-pointer"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    &lt;{'\uf0c7'} [I]nstall Only&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreen('main')}
                    className="cursor-pointer hover:underline"
                  >
                    &lt;{'\uf060'} [B]ack to Main Menu&gt;
                  </button>
                </div>
              </div>
            )}

            {screen === 'mods' && (
              <div className="space-y-2 mt-1">
                <div style={{ color: palette.accent }} className="font-bold">
                  = Workspace: {'\uf019'} Download & Browse Mods =
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setModPlatform(modPlatform === 'Modrinth' ? 'CurseForge' : 'Modrinth')
                    }
                    className="cursor-pointer"
                  >
                    {'\uf002'} [P]lat: <strong>{modPlatform}</strong> |{'\uf0d7'}
                  </button>
                  <span>{'\uf013'} L[o]ad: {engineLoader.toLowerCase()} |{'\uf0d7'}</span>
                  <span>{'\uf013'} [V]er: {mcVersion} |{'\uf0d7'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{'\uf002'} [Q] Query:</span>
                  <input
                    type="text"
                    value={modQuery}
                    onChange={(e) => setModQuery(e.target.value)}
                    className="bg-black/30 px-2 py-0.5 border border-white/10 outline-none w-36"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      addActivity(
                        'INFO',
                        `Searching ${modPlatform.toLowerCase()} for '${modQuery}' (MC ${mcVersion}, ${engineLoader.toLowerCase()})`
                      )
                    }
                    className="px-1.5 font-bold cursor-pointer"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    &lt;{'\uf002'} [S]earch&gt;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const jarName = `${activeMod.slug}-${activeMod.version}.jar`;
                      if (!installedMods.includes(jarName)) {
                        setInstalledMods((prev) => [...prev, jarName]);
                      }
                      addActivity('INFO', `Downloading mod: ${activeMod.title}`);
                      addActivity('OK', `Mod ${activeMod.title} downloaded and installed to mods/ folder!`);
                    }}
                    className="cursor-pointer font-bold hover:underline"
                    style={{ color: palette.success }}
                  >
                    &lt;{'\uf019'} [D]ownload&gt;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="relative border p-2 pt-3" style={{ borderColor: palette.border }}>
                    <span
                      className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                      style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                    >
                      {'\uf487'} Results [L]ist ({'\uf077'}/{'\uf078'})
                    </span>
                    <div className="space-y-0.5">
                      {MOD_CATALOG.map((m, i) => (
                        <div
                          key={m.slug}
                          onClick={() => setSelectedModIdx(i)}
                          className="px-1.5 py-0.5 cursor-pointer truncate"
                          style={{
                            backgroundColor: selectedModIdx === i ? palette.badgeBg : 'transparent',
                            color: selectedModIdx === i ? palette.badgeFg : palette.fg,
                          }}
                        >
                          {'\uf487'} {m.title} - {m.author}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative border p-2 pt-3" style={{ borderColor: palette.border }}>
                    <span
                      className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                      style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                    >
                      {'\uf15c'} Mod Details & Versions
                    </span>
                    <div className="space-y-1 text-xs">
                      <div style={{ color: palette.accent }}>Title: {activeMod.title}</div>
                      <div style={{ color: palette.accent }}>Author: {activeMod.author}</div>
                      <div>Version: {activeMod.version}</div>
                      <p className="opacity-85 text-[11px] leading-snug pt-1 border-t border-white/10">
                        {activeMod.desc}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen('main')}
                  className="cursor-pointer hover:underline"
                >
                  &lt;{'\uf060'} [B]ack to Main Menu&gt;
                </button>
              </div>
            )}

            {screen === 'backups' && (
              <div className="space-y-3 mt-1">
                <div style={{ color: palette.accent }} className="font-bold">
                  = Workspace: {'\uf0c7'} World Backups =
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const stamp = new Date().toISOString().replace('T', '_').slice(0, 19).replace(/:/g, '-');
                      setBackups((prev) => [
                        { name: `${stamp}.tar`, size: '648.0 KB', date: stamp.slice(0, 16).replace('_', ' ') },
                        ...prev.slice(0, 2),
                      ]);
                      addServerLog('save-off');
                      addServerLog('[Server thread/INFO]: Automatic saving is now disabled');
                      addServerLog('save-all flush');
                      addServerLog('save-on');
                      addServerLog('[Server thread/INFO]: Automatic saving is now enabled');
                      addActivity('OK', `Created atomic snapshot ${stamp}.tar & synced via rclone!`);
                    }}
                    className="cursor-pointer font-bold hover:underline"
                    style={{ color: palette.success }}
                  >
                    &lt;{'\uf0c7'} [K] Backup Now&gt;
                  </button>
                  <span>Found {backups.length} backup archive(s). (Retain quota: 3 | rclone: minecraftdrive)</span>
                </div>

                <div className="relative border p-2.5 pt-3" style={{ borderColor: palette.border }}>
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf15c'} Backups [L]ist
                  </span>
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 opacity-70 border-b border-white/10 pb-0.5">
                      <span>Archive</span>
                      <span>Size</span>
                      <span>Date</span>
                    </div>
                    {backups.map((b, idx) => (
                      <div
                        key={b.name}
                        className="grid grid-cols-3 px-1 py-0.5"
                        style={{
                          backgroundColor: idx === 0 ? palette.badgeBg : 'transparent',
                          color: idx === 0 ? palette.badgeFg : palette.fg,
                        }}
                      >
                        <span>{b.name}</span>
                        <span>{b.size}</span>
                        <span>{b.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen('main')}
                  className="cursor-pointer hover:underline"
                >
                  &lt;{'\uf060'} [B]ack to Main Menu&gt;
                </button>
              </div>
            )}

            {screen === 'themes' && (
              <div className="space-y-3 mt-1">
                <div style={{ color: palette.accent }} className="font-bold">
                  = Workspace: {'\uf1fc'} Customization & Themes =
                </div>
                <div className="text-xs">Select from developer 24-bit TrueColor palettes:</div>
                <div className="relative border p-3 pt-4 space-y-2" style={{ borderColor: palette.border }}>
                  <span
                    className="absolute -top-2.5 left-2 px-1 font-bold text-xs"
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                  >
                    {'\uf1fc'} Appearance Settings
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(THEMES).map((tName) => (
                      <button
                        key={tName}
                        type="button"
                        onClick={() => {
                          setThemeName(tName);
                          addActivity('OK', `Applied theme: ${tName} (100% TrueColor)`);
                        }}
                        className="px-2.5 py-1 border cursor-pointer font-bold"
                        style={{
                          backgroundColor: themeName === tName ? palette.badgeBg : 'transparent',
                          color: themeName === tName ? palette.badgeFg : palette.fg,
                          borderColor: palette.border,
                        }}
                      >
                        {tName}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 text-xs space-y-1 opacity-90">
                    <div>[x] Enable 24-bit TrueColor (ANSI RGB)</div>
                    <div>[x] Enforce Minimum Screen Size (&gt;= 70x18)</div>
                    <div>[x] Minecraft pickaxe dirt-breaking loading animation</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScreen('main')}
                  className="cursor-pointer hover:underline"
                >
                  &lt;{'\uf060'} [B]ack to Main Menu&gt;
                </button>
              </div>
            )}

            {(screen === 'properties' ||
              screen === 'migration' ||
              screen === 'manage-mods' ||
              screen === 'tasks') && (
              <div className="space-y-3 mt-1">
                <div style={{ color: palette.accent }} className="font-bold">
                  = Workspace: {screen.toUpperCase()} =
                </div>
                {screen === 'manage-mods' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Installed Mods in ./mods/ ({installedMods.length}):</span>
                      <button
                        type="button"
                        onClick={() =>
                          addActivity(
                            'OK',
                            'Bulk 1-Key Update [U]: Verified SHA-1 hashes against Modrinth; all mods up-to-date!'
                          )
                        }
                        className="px-2 py-0.5 font-bold cursor-pointer"
                        style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                      >
                        &lt;{'\uf021'} [U]pdate All Mods (1-Key)&gt;
                      </button>
                    </div>
                    <div className="border p-2 space-y-1" style={{ borderColor: palette.border }}>
                      {installedMods.map((m) => (
                        <div key={m} className="flex justify-between">
                          <span>{'\uf00c'} {m}</span>
                          <span style={{ color: palette.success }}>[ACTIVE]</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {screen === 'properties' && (
                  <div className="border p-2 space-y-1 text-xs" style={{ borderColor: palette.border }}>
                    <div>server-port = 25565</div>
                    <div>motd = {'\u00A7'}aMurCes Managed Minecraft 1.21.1 Server</div>
                    <div>max-players = 20</div>
                    <div>online-mode = true</div>
                    <div>view-distance = 12</div>
                    <div>simulation-distance = 10</div>
                  </div>
                )}
                {screen === 'migration' && (
                  <div className="border p-2 space-y-1.5 text-xs" style={{ borderColor: palette.border }}>
                    <div>Identity UUID Transfer (Offline &lt;-&gt; Mojang Online UUID):</div>
                    <div>Source Player: Steve_Old (UUID: 3c8a...91b2)</div>
                    <div>Target Player: DeployedReject (UUID: 8f1e...44a0)</div>
                    <button
                      type="button"
                      onClick={() =>
                        addActivity(
                          'OK',
                          'Migrated playerdata, advancements & stats with safety backup archive!'
                        )
                      }
                      className="px-2 py-0.5 font-bold cursor-pointer mt-1"
                      style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
                    >
                      &lt;{'\uf0e7'} [M]igrate UUID Data&gt;
                    </button>
                  </div>
                )}
                {screen === 'tasks' && (
                  <div className="border p-2 space-y-1 text-xs" style={{ borderColor: palette.border }}>
                    <div style={{ color: palette.success }}>
                      [COMPLETED] Modrinth Dependency Resolver (0 active threads)
                    </div>
                    <div style={{ color: palette.success }}>
                      [RUNNING] Playit.gg Tunnel Supervisor (PID 8420)
                    </div>
                    <div style={{ color: palette.success }}>
                      [RUNNING] tmux session &apos;mcsv&apos; log pipe reader
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setScreen('main')}
                  className="cursor-pointer hover:underline"
                >
                  &lt;{'\uf060'} [B]ack to Main Menu&gt;
                </button>
              </div>
            )}
          </div>

          {/* Right Panel: Activity & Diagnostics [A] */}
          <div
            className="lg:col-span-4 relative border p-2.5 pt-3 flex flex-col justify-between overflow-hidden"
            style={{ borderColor: palette.border, backgroundColor: palette.surface }}
          >
            <span
              className="absolute -top-2.5 left-3 px-1.5 font-bold text-xs"
              style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
            >
              {'\uf15c'} Activity & Diagnostics [A]
            </span>
            <div className="overflow-y-auto space-y-1 text-xs pr-1">
              {activityLogs.map((l, i) => (
                <div
                  key={i}
                  style={{
                    color:
                      l.type === 'OK'
                        ? palette.success
                        : l.type === 'INFO'
                        ? palette.info
                        : l.type === 'WARN'
                        ? palette.warn
                        : palette.fg,
                  }}
                >
                  [{l.type}:] {l.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Panel: Server Console (Live Output) [L] */}
        <div
          className="relative h-32 border p-2.5 pt-3 overflow-y-auto"
          style={{ borderColor: palette.border, backgroundColor: palette.surface }}
        >
          <span
            className="absolute -top-2.5 left-3 px-1.5 font-bold text-xs"
            style={{ backgroundColor: palette.badgeBg, color: palette.badgeFg }}
          >
            &gt;_ Server Console (Live Output) [L]
          </span>
          <div className="space-y-0.5 text-xs">
            {serverLogs.map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: line.includes('Done') ? palette.success : palette.info,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
