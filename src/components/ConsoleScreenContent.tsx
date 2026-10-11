import { useState, useEffect, useMemo, useRef } from 'react';
import type { Project } from '../data/projects';
import {
  fetchDeveloperStats,
  measureEndpointPings,
  type DeveloperStats,
  type PingResult,
} from '../services/githubStats';

export type ScreenTab = 'status' | 'cartridges' | 'github' | 'pings' | 'hire';

export interface ChannelOption {
  label: string;
  action: 'ping' | 'url';
  url?: string;
}

export function getChannelOptions(
  activeTab: ScreenTab,
  stats: DeveloperStats | null
): ChannelOption[] {
  if (activeTab === 'status') {
    return [
      {
        label: '\uf09b  Open GitHub Profile (github.com/DeployedReject)',
        action: 'url',
        url: 'https://github.com/DeployedReject',
      },
      {
        label: '\uf126  Open Codeberg Profile (codeberg.org/DeployedReject)',
        action: 'url',
        url: 'https://codeberg.org/DeployedReject',
      },
    ];
  }
  if (activeTab === 'github') {
    const commits = stats?.recentCommits || [
      { repo: 'murces', message: 'drop windows support, wsl only', date: '10-11' },
      { repo: 'SentricTechnologies', message: 'update map view and mqtt handler', date: '10-04' },
      { repo: 'Cireu', message: 'fix light theme colors', date: '10-11' },
    ];
    const uniqueRepos = Array.from(new Set(commits.map((c) => c.repo))).slice(0, 3);
    return [
      ...uniqueRepos.map((repo) => ({
        label: `\uf126  Open Repo: DeployedReject/${repo}`,
        action: 'url' as const,
        url: `https://github.com/DeployedReject/${repo}`,
      })),
      {
        label: '\uf09b  View All Repositories on GitHub',
        action: 'url',
        url: 'https://github.com/DeployedReject?tab=repositories',
      },
    ];
  }
  if (activeTab === 'pings') {
    return [
      {
        label: '\uf021  Re-Ping Active Servers (144.24.141.13 & 150.230.141.102)',
        action: 'ping',
      },
      {
        label: '\uf233  Open Aggregator Server (144.24.141.13)',
        action: 'url',
        url: 'http://144.24.141.13',
      },
      {
        label: '\uf233  Open Sentric Technologies Server (150.230.141.102)',
        action: 'url',
        url: 'http://150.230.141.102',
      },
    ];
  }
  if (activeTab === 'hire') {
    return [
      {
        label: '\uf09b  GitHub   : github.com/DeployedReject',
        action: 'url',
        url: 'https://github.com/DeployedReject',
      },
      {
        label: '\uf126  Codeberg : codeberg.org/DeployedReject',
        action: 'url',
        url: 'https://codeberg.org/DeployedReject',
      },
      {
        label: '\uf0e0  Email    : mishravaibhav2048@gmail.com',
        action: 'url',
        url: 'mailto:mishravaibhav2048@gmail.com',
      },
    ];
  }
  return [];
}

interface ConsoleScreenContentProps {
  projects: Project[];
  activeTab: ScreenTab;
  selectedIndex?: number;
  optionIndex?: number;
  onSelectOptionIndex?: (idx: number) => void;
  onTriggerOption?: (opt: ChannelOption) => void;
  pingRefreshKey?: number;
  isTableZoomedOut: boolean;
  insertingProject?: Project | null;
  hideRomsTab?: boolean;
}

function makeBlockBar(blocks: number, total = 10): string {
  const filled = Math.max(0, Math.min(total, blocks));
  return '█'.repeat(filled) + '░'.repeat(total - filled);
}

const SHORT_NAMES: Record<string, string> = {
  murces: 'MurCes',
  sentric: 'SentricTechnologies',
  cireu: 'Cireu',
  'cf-p-link': 'cf-p-link',
  aggregator: 'Aggregator',
};

export const ConsoleScreenContent: React.FC<ConsoleScreenContentProps> = ({
  projects,
  activeTab,
  selectedIndex = 0,
  optionIndex = 0,
  onSelectOptionIndex,
  onTriggerOption,
  pingRefreshKey = 0,
  isTableZoomedOut,
  insertingProject = null,
  hideRomsTab = false,
}) => {
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [pings, setPings] = useState<PingResult[]>([
    { name: 'Aggregator Server', target: '144.24.141.13', status: 'PINGING', latencyMs: null },
    { name: 'Sentric Technologies', target: '150.230.141.102', status: 'PINGING', latencyMs: null },
    { name: 'Home Server', target: '[API NOT REVEALED]', status: 'HIDDEN', latencyMs: null },
  ]);
  const [typedProgress, setTypedProgress] = useState<{ text: string; count: number }>({
    text: '',
    count: 0,
  });

  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    fetchDeveloperStats().then(setStats);
  }, []);

  useEffect(() => {
    setPings((prev) =>
      prev.map((p) =>
        p.status === 'HIDDEN' ? p : { ...p, status: 'PINGING', latencyMs: null }
      )
    );
    measureEndpointPings().then(setPings);
  }, [pingRefreshKey]);

  const normalizedIndex =
    ((selectedIndex % projects.length) + projects.length) % projects.length;
  const highlightedProject = projects[normalizedIndex] || projects[0];

  const channelOptions = useMemo(
    () => getChannelOptions(activeTab, stats),
    [activeTab, stats]
  );
  const safeOptionIndex =
    channelOptions.length > 0
      ? ((optionIndex % channelOptions.length) + channelOptions.length) %
        channelOptions.length
      : 0;

  // Ensure the selected ROM option is always scrolled into view when navigating on mobile
  useEffect(() => {
    if (activeTab === 'cartridges') {
      const el = itemRefs.current[normalizedIndex];
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [normalizedIndex, activeTab]);

  // Build the lines of text for the active screen so they print character-by-character
  const screenTextLines = useMemo(() => {
    if (insertingProject) {
      return [];
    }

    const s = stats;
    if (activeTab === 'status') {
      const langs = s?.languages || [
        { name: 'Java        ', percent: 38, blocks: 8 },
        { name: 'TypeScript  ', percent: 32, blocks: 7 },
        { name: 'Python      ', percent: 18, blocks: 4 },
        { name: 'Shell       ', percent: 12, blocks: 3 },
      ];
      return [
        '\uf120 DeployedReject (Vaibhav)',
        '----------------------------------------',
        ...langs.map(
          (l) => `${l.name} [${makeBlockBar(l.blocks, 10)}] ${String(l.percent).padStart(2, ' ')}%`
        ),
        '----------------------------------------',
        `REPOS : ${String(s?.publicRepos ?? 14).padEnd(4, ' ')} STARS : ${String(s?.totalStars ?? 19).padEnd(4, ' ')} COMMITS : ${s?.totalCommitsYear ?? 482}`,
      ];
    }

    if (activeTab === 'cartridges') {
      return [];
    }

    if (activeTab === 'github') {
      const commits = s?.recentCommits || [
        { repo: 'murces', message: 'drop windows support, wsl only', date: '10-11' },
        { repo: 'Sentric', message: 'update map view and mqtt handler', date: '10-04' },
        { repo: 'Cireu', message: 'fix light theme colors', date: '10-11' },
      ];
      return [
        `\uf126 COMMITS (365D): ${s?.totalCommitsYear ?? 482}   |   FOLLOWERS: ${s?.followers ?? 12}`,
        '----------------------------------------',
        ...commits.slice(0, 4).map(
          (c) => `[${c.date}] ${c.repo.slice(0, 10).padEnd(10, ' ')}: ${c.message.slice(0, 26)}`
        ),
      ];
    }

    if (activeTab === 'pings') {
      return [
        '\uf233 SERVERS:',
        '----------------------------------------',
        ...pings.map((p) => {
          if (p.status === 'HIDDEN') {
            return `${p.name.padEnd(21, ' ')} ${p.target}`;
          }
          const lat =
            p.status === 'PINGING'
              ? 'WAIT..'
              : p.status === 'UP'
              ? `${String(p.latencyMs ?? 18).padStart(3, ' ')}ms`
              : 'OFFLINE';
          const badge =
            p.status === 'UP' ? '[ONLINE]' : p.status === 'PINGING' ? '[PING..]' : '[DOWN]  ';
          return `${p.name.padEnd(21, ' ')} ${p.target.padEnd(15, ' ')} ${badge} ${lat}`;
        }),
        '----------------------------------------',
        "You shouldn't be able to reach my home server anyway.",
      ];
    }

    // hire / contact tab
    return [
      '\uf0e0 SELECT CONTACT CHANNEL & PRESS ENTER:',
      '----------------------------------------',
    ];
  }, [activeTab, stats, pings, insertingProject]);

  const fullText = useMemo(() => screenTextLines.join('\n'), [screenTextLines]);

  // Character-by-character typewriter interval whenever screen content changes
  useEffect(() => {
    if (!fullText) {
      setTypedProgress({ text: '', count: 0 });
      return;
    }
    const total = fullText.length;
    const step = Math.max(3, Math.ceil(total / 45));
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

  const allTabs: Array<{ id: ScreenTab; label: string }> = [
    { id: 'status', label: 'About' },
    { id: 'cartridges', label: 'ROMS' },
    { id: 'github', label: 'Commits' },
    { id: 'pings', label: 'Servers' },
    { id: 'hire', label: 'Contact' },
  ];

  const tabs = hideRomsTab ? allTabs.filter((t) => t.id !== 'cartridges') : allTabs;
  const activeChannelNum = Math.max(1, tabs.findIndex((t) => t.id === activeTab) + 1);

  return (
    <div
      className="w-full h-full bg-[#070c08] text-[#a6e26e] p-3 sm:p-5 md:p-6 flex flex-col justify-between select-none relative overflow-hidden"
      style={{
        fontFamily: "var(--font-crt)",
        imageRendering: 'pixelated',
        background:
          'radial-gradient(circle at 50% 45%, #121f14 0%, #09100a 68%, #040704 100%)',
      }}
    >
      {/* Top CRT On-Screen Display (OSD) Channel Bar */}
      <div className="border-b-2 border-[#4b6e32]/80 pb-2 flex items-center justify-between gap-2 shrink-0 pointer-events-none">
        <div
          className="flex flex-wrap gap-1.5 sm:gap-2"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          {tabs.map((t, idx) => {
            const active = activeTab === t.id;
            return (
              <div
                key={t.id}
                className={`px-2 py-1 text-[8px] sm:text-[10px] leading-none uppercase border transition-all duration-200 ${
                  active
                    ? 'bg-[#a6e26e] text-[#0b120c] border-[#d4f7b5] font-bold shadow-[0_0_12px_rgba(166,226,110,0.6)] scale-105'
                    : 'bg-[#121c13]/90 text-[#6ca144] border-[#355224] opacity-75'
                }`}
              >
                {idx + 1}.{t.label}
              </div>
            );
          })}
        </div>

        <div
          className="text-[9px] sm:text-[11px] text-[#e6cf65] px-2 py-0.5 bg-[#1b2819] border border-[#5c8244] shadow-[0_0_8px_rgba(230,207,101,0.25)] shrink-0"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          CH-0{activeChannelNum}
        </div>
      </div>

      {/* Main CRT Display Area */}
      <div className="flex-1 pt-2 sm:pt-3 min-h-0 flex flex-col md:flex-row gap-4 items-stretch justify-between overflow-hidden">
        {/* ROM Loading Animation with Logo & Description */}
        {insertingProject ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 gap-3 animate-fadeIn pointer-events-none">
            <img
              src={insertingProject.labelSvg}
              alt={insertingProject.name}
              className="w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-[#a6e26e] shadow-[0_0_20px_rgba(166,226,110,0.5)]"
            />
            <div className="pixel-dull-white text-xs sm:text-sm tracking-wide">
              {SHORT_NAMES[insertingProject.id] || insertingProject.name}
            </div>
            <div className="pixel-dull-white text-[10px] sm:text-xs max-w-md leading-relaxed">
              "{insertingProject.originNote || insertingProject.tagline}"
            </div>
            <div className="w-40 sm:w-56 h-2 bg-[#142016] border border-[#5c8244] rounded overflow-hidden mt-1">
              <div className="h-full bg-[#a6e26e] animate-romLoadBar" />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
            {fullText && (
              <pre
                className="whitespace-pre-wrap break-words text-[16px] sm:text-[20px] md:text-[22px] leading-[1.2] tracking-wide text-[#b5ec82] m-0 font-normal pointer-events-none"
                style={{
                  fontFamily: "var(--font-crt)",
                  textShadow: '0 0 8px rgba(166, 226, 110, 0.5)',
                }}
              >
                {displayedText}
                {isTyping && <span className="inline-block w-2.5 h-4 bg-[#b5ec82] ml-0.5 align-middle" />}
                {!isTyping && activeTab !== 'cartridges' && <span className="animate-pulse">█</span>}
              </pre>
            )}

            {/* Scrollable ROMs List when on ROMS channel (Mobile Handheld only) */}
            {!hideRomsTab && activeTab === 'cartridges' && (
              <div className="flex-1 flex flex-col justify-between min-h-0 gap-2 overflow-hidden pointer-events-none">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
                  {projects.map((p, i) => {
                    const isSelected = p.id === highlightedProject.id;
                    const shortName = SHORT_NAMES[p.id] || p.name;
                    return (
                      <div
                        key={p.id}
                        ref={(el) => {
                          itemRefs.current[i] = el;
                        }}
                        className={`px-2.5 py-1 border flex items-center justify-between transition-all duration-150 ${
                          isSelected
                            ? 'bg-[#a6e26e] text-[#0c140d] border-[#e2f9c8] font-bold shadow-[0_0_15px_rgba(166,226,110,0.45)]'
                            : 'bg-[#121d13]/80 text-[#9cd66c] border-[#314a22] opacity-80'
                        }`}
                      >
                        <span className="text-[16px] sm:text-[19px] md:text-[21px] tracking-wide">
                          {isSelected ? '\uf054 ' : '  '}[{i + 1}] {shortName}
                        </span>
                        <span
                          className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 ${
                            isSelected ? 'bg-[#0c140d] text-[#e6cf65]' : 'text-[#6c9e46]'
                          }`}
                          style={{ fontFamily: "var(--font-pixel)" }}
                        >
                          ROM
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Personal Origin Note for Highlighted Project */}
                <div className="shrink-0 p-2 sm:p-2.5 bg-[#152216]/95 border border-[#5c8244]">
                  <div className="pixel-dull-white text-[9px] sm:text-[11px] leading-relaxed">
                    "{highlightedProject.originNote || highlightedProject.tagline}"
                  </div>
                </div>
              </div>
            )}

            {/* Contribution Matrix on Commits tab */}
            {activeTab === 'github' && stats && !isTableZoomedOut && (
              <div className="mt-1.5 pt-1.5 border-t border-[#375224] shrink-0 pointer-events-none">
                <div className="flex flex-col gap-[3px]">
                  {stats.contributionGrid.slice(0, 4).map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-[3px]">
                      {row.slice(0, 22).map((lvl, cIdx) => {
                        const colors = ['#18261a', '#2f4d26', '#52803a', '#7ec252', '#c4f78b'];
                        return (
                          <div
                            key={cIdx}
                            className="w-2.5 h-2.5 rounded-[1px]"
                            style={{ backgroundColor: colors[Math.min(4, lvl)] }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selectable Channel Options (Opened by the TV's single ENTER button) */}
            {!isTableZoomedOut && activeTab !== 'cartridges' && channelOptions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#375224]/90 shrink-0 space-y-1 pointer-events-auto">
                <div
                  className="text-[8px] text-[#7ec252] uppercase tracking-wider mb-1 flex items-center justify-between"
                  style={{ fontFamily: "var(--font-pixel)" }}
                >
                  <span>\uf0a4 OPTIONS (CLICK OR ↑/↓ + ENTER)</span>
                  <span>[{safeOptionIndex + 1}/{channelOptions.length}]</span>
                </div>
                {channelOptions.map((opt, idx) => {
                  const isSel = idx === safeOptionIndex;
                  return (
                    <div
                      key={opt.label}
                      onClick={() => {
                        onSelectOptionIndex?.(idx);
                        onTriggerOption?.(opt);
                      }}
                      onMouseEnter={() => onSelectOptionIndex?.(idx)}
                      className={`px-2.5 py-1 border text-[15px] sm:text-[18px] flex items-center justify-between cursor-pointer transition-all ${
                        isSel
                          ? 'bg-[#a6e26e] text-[#09120a] border-[#d4f7b5] font-bold shadow-[0_0_12px_rgba(166,226,110,0.45)]'
                          : 'bg-[#101a11]/85 text-[#9cd66c] border-[#2d4520] hover:border-[#5c8244]'
                      }`}
                    >
                      <span className="truncate">
                        {isSel ? '\uf054 ' : '  '}
                        {opt.label}
                      </span>
                      {isSel && (
                        <span
                          className="text-[8px] px-1.5 py-0.5 bg-[#09120a] text-[#e6cf65] shrink-0 ml-2"
                          style={{ fontFamily: "var(--font-pixel)" }}
                        >
                          \uf061 ENTER
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

