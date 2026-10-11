import { useState, useEffect, useMemo } from 'react';
import type { Project } from '../data/projects';
import {
  fetchDeveloperStats,
  measureEndpointPings,
  type DeveloperStats,
  type PingResult,
} from '../services/githubStats';

export type ScreenTab = 'status' | 'github' | 'pings' | 'hire' | 'cartridges';

interface ConsoleScreenContentProps {
  projects: Project[];
  activeTab: ScreenTab;
  setActiveTab: (tab: ScreenTab) => void;
  onZoomToTable: () => void;
  onSelectProject: (projectId: string) => void;
  isTableZoomedOut: boolean;
  insertingProjectName?: string | null;
}

function makeBlockBar(blocks: number, total = 10): string {
  const filled = Math.max(0, Math.min(total, blocks));
  return '█'.repeat(filled) + '░'.repeat(total - filled);
}

export const ConsoleScreenContent: React.FC<ConsoleScreenContentProps> = ({
  projects,
  activeTab,
  setActiveTab,
  onZoomToTable,
  onSelectProject,
  isTableZoomedOut,
  insertingProjectName,
}) => {
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [pings, setPings] = useState<PingResult[]>([
    { name: 'MURCES.CODEBERG', target: 'codeberg.org', status: 'PINGING', latencyMs: null },
    { name: 'GITHUB.REST.API', target: 'api.github.com', status: 'PINGING', latencyMs: null },
    { name: 'CIREU.GH.PAGES ', target: 'deployedreject.github.io', status: 'PINGING', latencyMs: null },
    { name: 'ARCHIVE.ORG.API', target: 'archive.org', status: 'PINGING', latencyMs: null },
  ]);
  const [typedProgress, setTypedProgress] = useState<{ text: string; count: number }>({
    text: '',
    count: 0,
  });

  useEffect(() => {
    fetchDeveloperStats().then(setStats);
    measureEndpointPings().then(setPings);
  }, []);

  const handleRefreshPings = () => {
    setPings((prev) => prev.map((p) => ({ ...p, status: 'PINGING', latencyMs: null })));
    measureEndpointPings().then(setPings);
  };

  // Build the lines of text for the active screen so they print character-by-character
  const screenTextLines = useMemo(() => {
    if (insertingProjectName) {
      return [
        '========================================',
        '         CARTRIDGE SLOT ENGAGED         ',
        '========================================',
        '',
        `> READING ROM: ${insertingProjectName.toUpperCase()}.PAK`,
        '> CHECKING HEADER CHECKSUM...... OK!',
        '> INITIALIZING GRAPHICS......... OK!',
        '> MOUNTING INTERACTIVE DEMO.....',
      ];
    }

    const s = stats;
    if (activeTab === 'status') {
      const langs = s?.languages || [
        { name: 'JAVA / GRAAL', percent: 38, blocks: 8 },
        { name: 'TYPESCRIPT  ', percent: 32, blocks: 7 },
        { name: 'PYTHON / IOT', percent: 18, blocks: 4 },
        { name: 'SHELL / SYS ', percent: 12, blocks: 3 },
      ];
      return [
        `PLAYER 1 : DEPLOYEDREJECT   LV.${s?.level ?? 24}`,
        'CLASS    : SYSTEMS & FULL-STACK DEV',
        'GOAL     : END-TO-END CLIENT PRODUCTS',
        '----------------------------------------',
        'LANGUAGE ATTRIBUTES (FROM REPO BYTES):',
        ...langs.map(
          (l) => `  ${l.name} [${makeBlockBar(l.blocks, 10)}] ${String(l.percent).padStart(2, ' ')}%`
        ),
        '----------------------------------------',
        `PUBLIC REPOS : ${String(s?.publicRepos ?? 14).padEnd(4, ' ')} TOTAL STARS : ${s?.totalStars ?? 19}`,
        `MURCES STARS : ${String(s?.murcesStars ?? 16).padEnd(4, ' ')} YR COMMITS  : ${s?.totalCommitsYear ?? 482}`,
      ];
    }

    if (activeTab === 'github') {
      const commits = s?.recentCommits || [
        { repo: 'murces', message: 'native AOT GraalVM & Modrinth sync', date: '10-11' },
        { repo: 'Sentric', message: 'AP H3 hex map & MQTT dispatch', date: '10-04' },
        { repo: 'Cireu', message: 'Fleury bridge check & playback', date: '10-11' },
      ];
      return [
        `GITHUB + CODEBERG TELEMETRY (${s?.fetchedLive ? 'LIVE API' : 'CACHED'}):`,
        `COMMITS (LAST 365D): ${s?.totalCommitsYear ?? 482}  |  FOLLOWERS: ${s?.followers ?? 12}`,
        '----------------------------------------',
        'LATEST COMMIT LOGS:',
        ...commits.slice(0, 4).map(
          (c) => ` [${c.date}] ${c.repo.slice(0, 10).padEnd(10, ' ')}: ${c.message.slice(0, 26)}`
        ),
      ];
    }

    if (activeTab === 'pings') {
      return [
        'LIVE EDGE-TO-ORIGIN PING CHECK:',
        '----------------------------------------',
        ...pings.map((p) => {
          const lat =
            p.status === 'PINGING'
              ? 'WAIT..'
              : p.status === 'UP'
              ? `${String(p.latencyMs ?? 18).padStart(3, ' ')}ms`
              : 'ERR';
          const badge = p.status === 'UP' ? '[UP]  ' : p.status === 'PINGING' ? '[..]  ' : '[DOWN]';
          return ` ${p.name}  ${badge}  RTT: ${lat}`;
        }),
        '----------------------------------------',
        'INFRA: CLOUDFLARE WORKERS + TUNNELS + VPS',
      ];
    }

    if (activeTab === 'hire') {
      return [
        'FREELANCE SERVICES & AVAILABILITY:',
        '----------------------------------------',
        ' * FULL-STACK WEB (REACT / TS / TAILWIND)',
        ' * NATIVE LINUX DAEMONS (JAVA / GRAALVM)',
        ' * IOT & MQTT BACKENDS (PYTHON / DOCKER)',
        ' * CLOUDFLARE EDGE (WORKERS / D1 / TUNNEL)',
        '----------------------------------------',
        'GITHUB : github.com/DeployedReject',
        'EMAIL  : mishravaibhav2048@gmail.com',
        'STATUS : [ AVAILABLE FOR CONTRACTS ]',
      ];
    }

    // cartridges tab
    return [
      'SELECT A PROJECT CARTRIDGE TO INSERT:',
      '----------------------------------------',
      ...projects.map(
        (p, i) => ` [${i + 1}] ${p.name.toUpperCase().padEnd(12, ' ')} - ${p.badge.split('•')[0].trim().slice(0, 22)}`
      ),
    ];
  }, [activeTab, stats, pings, projects, insertingProjectName]);

  const fullText = useMemo(() => screenTextLines.join('\n'), [screenTextLines]);

  // Character-by-character typewriter interval whenever screen content changes
  useEffect(() => {
    const total = fullText.length;
    const step = Math.max(2, Math.ceil(total / 55)); // finishes in ~650ms
    const timer = window.setInterval(() => {
      setTypedProgress((prev) => {
        const currentCount = prev.text === fullText ? prev.count : 0;
        if (currentCount + step >= total) {
          window.clearInterval(timer);
          return { text: fullText, count: total };
        }
        return { text: fullText, count: currentCount + step };
      });
    }, 14);
    return () => window.clearInterval(timer);
  }, [fullText]);

  const charCount = typedProgress.text === fullText ? typedProgress.count : 0;
  const displayedText = fullText.slice(0, charCount);
  const isTyping = charCount < fullText.length;

  const tabs: Array<{ id: ScreenTab; label: string }> = [
    { id: 'status', label: 'Overview' },
    { id: 'github', label: 'Activity' },
    { id: 'pings', label: 'Network' },
    { id: 'hire', label: 'Contact' },
    { id: 'cartridges', label: 'Projects' },
  ];

  return (
    <div
      className="w-full h-full bg-[#111912] text-[#a6e26e] p-3 sm:p-4 flex flex-col justify-between select-none relative overflow-hidden"
      style={{
        fontFamily: "'VT323', monospace",
        imageRendering: 'pixelated',
      }}
    >
      {/* Top 8-Bit Menu Bar */}
      <div className="border-b-2 border-[#4b6e32] pb-1.5 flex flex-wrap items-center justify-between gap-1">
        <div
          className="flex flex-wrap gap-1"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab(t.id);
                }}
                className={`px-1.5 py-1 text-[8px] sm:text-[9px] leading-none uppercase cursor-pointer transition-none border ${
                  active
                    ? 'bg-[#a6e26e] text-[#0e150f] border-[#a6e26e] font-bold'
                    : 'bg-[#172318] text-[#88c057] border-[#4b6e32] hover:bg-[#243626]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div
          className="text-[8px] sm:text-[9px] text-[#e6cf65] hidden sm:block"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          CH-0{tabs.findIndex((t) => t.id === activeTab) + 1}
        </div>
      </div>

      {/* Main Character-by-Character Printed CRT Display Area */}
      <div className="flex-1 py-1.5 overflow-y-auto flex flex-col justify-between">
        <pre
          className="whitespace-pre-wrap break-words text-[15px] sm:text-[18px] md:text-[20px] leading-[1.2] tracking-wide text-[#b5ec82] m-0 font-normal"
          style={{
            fontFamily: "'VT323', monospace",
            textShadow: '0 0 6px rgba(166, 226, 110, 0.45)',
          }}
        >
          {displayedText}
          {isTyping && <span className="inline-block w-2.5 h-4 bg-[#b5ec82] ml-0.5 align-middle" />}
          {!isTyping && <span className="animate-pulse">█</span>}
        </pre>

        {/* Extra interactive widgets once typing completes */}
        {!insertingProjectName && activeTab === 'github' && stats && (
          <div className="mt-1 pt-1 border-t border-[#375224]">
            <div
              className="text-[8px] text-[#88c057] mb-1"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              CONTRIBUTION MATRIX (20 WKS):
            </div>
            <div className="flex flex-col gap-[2px]">
              {stats.contributionGrid.slice(0, 5).map((row, rIdx) => (
                <div key={rIdx} className="flex gap-[2px]">
                  {row.slice(0, 20).map((lvl, cIdx) => {
                    const colors = ['#1b2a1d', '#35542b', '#58883e', '#84c256', '#c6f68d'];
                    return (
                      <div
                        key={cIdx}
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5"
                        style={{ backgroundColor: colors[Math.min(4, lvl)] }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {!insertingProjectName && activeTab === 'pings' && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRefreshPings();
              }}
              className="px-2 py-0.5 bg-[#1e2f20] hover:bg-[#a6e26e] hover:text-[#0e150f] text-[#a6e26e] border border-[#5c8244] text-[9px] cursor-pointer"
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              [ RE-PING NODES ]
            </button>
          </div>
        )}

        {!insertingProjectName && activeTab === 'cartridges' && (
          <div className="mt-1 grid grid-cols-1 gap-1">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProject(p.id);
                }}
                className="text-left px-2 py-0.5 bg-[#19281b] hover:bg-[#a6e26e] hover:text-[#0e150f] text-[#b5ec82] border border-[#4b6e32] text-[14px] sm:text-[16px] flex items-center justify-between cursor-pointer"
                style={{ fontFamily: "'VT323', monospace" }}
              >
                <span>
                  [{i + 1}] {p.name.toUpperCase()}
                </span>
                <span className="text-[12px]">[INSERT ROM ►]</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Bar: View Cartridges on Table */}
      <div className="border-t-2 border-[#4b6e32] pt-1.5 flex items-center justify-between gap-2">
        {!isTableZoomedOut ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoomToTable();
            }}
            className="w-full py-1.5 px-2 bg-[#e6cf65] hover:bg-[#f5e48c] text-[#111912] font-bold text-[9px] sm:text-[10px] tracking-wider uppercase cursor-pointer border-2 border-[#fff3b0] shadow-[2px_2px_0px_#000] active:translate-y-0.5 text-center"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            ▼ VIEW CARTRIDGES ON TABLE ▼
          </button>
        ) : (
          <div
            className="w-full py-1 px-2 bg-[#1c2c1e] text-[#e6cf65] text-[8px] sm:text-[9px] text-center border border-[#5c8244]"
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            SELECT A CARTRIDGE ON THE TABLE OR CLICK TO ZOOM IN
          </div>
        )}
      </div>
    </div>
  );
};
