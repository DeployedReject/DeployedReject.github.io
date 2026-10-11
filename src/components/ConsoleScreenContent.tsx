import { useState, useEffect, useMemo, useRef } from 'react';
import type { Project } from '../data/projects';
import {
  fetchDeveloperStats,
  measureEndpointPings,
  type DeveloperStats,
  type PingResult,
} from '../services/gitrepositorystatistics';

export type ScreenTab = 'status' | 'cartridges' | 'github' | 'pings' | 'hire';

export interface ChannelOption {
  label: string;
  action: 'ping' | 'url' | 'copy';
  url?: string;
  copyText?: string;
}

export function getChannelOptions(
  activeTab: ScreenTab,
  stats: DeveloperStats | null
): ChannelOption[] {
  if (activeTab === 'status') {
    return [
      {
        label: '\uf121  Browse Java Repositories',
        action: 'url',
        url: 'https://github.com/DeployedReject?tab=repositories&language=java',
      },
      {
        label: '\uf121  Browse TypeScript Repositories',
        action: 'url',
        url: 'https://github.com/DeployedReject?tab=repositories&language=typescript',
      },
      {
        label: '\uf121  Browse Python & Shell Repositories',
        action: 'url',
        url: 'https://github.com/DeployedReject?tab=repositories&language=python',
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
    return uniqueRepos.map((repo) => ({
      label: `\uf126  DeployedReject/${repo}`,
      action: 'url' as const,
      url: `https://github.com/DeployedReject/${repo}`,
    }));
  }
  if (activeTab === 'pings') {
    return [
      {
        label: '\uf021  Refresh Server Pings',
        action: 'ping',
      },
      {
        label: '\uf233  aggregator-registry.mishravaibhav2048.workers.dev',
        action: 'url',
        url: 'https://aggregator-registry.mishravaibhav2048.workers.dev',
      },
      {
        label: '\uf233  sentrictechnologies.in',
        action: 'url',
        url: 'https://sentrictechnologies.in',
      },
    ];
  }
  if (activeTab === 'hire') {
    return [
      {
        label: '\uf09b  github.com/DeployedReject',
        action: 'url',
        url: 'https://github.com/DeployedReject',
      },
      {
        label: '\uf126  codeberg.org/DeployedReject',
        action: 'url',
        url: 'https://codeberg.org/DeployedReject',
      },
      {
        label: '\uf0e0  mishravaibhav2048@gmail.com',
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
  pingRefreshKey?: number;
  isTableZoomedOut: boolean;
  insertingProject?: Project | null;
  hideRomsTab?: boolean;
  isLightMode?: boolean;
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
  pingRefreshKey = 0,
  isTableZoomedOut,
  insertingProject = null,
  hideRomsTab = false,
  isLightMode = false,
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
  const prevTabRef = useRef<ScreenTab>(activeTab);

  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    prevTabRef.current = activeTab;
  }, [activeTab]);

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
        '\uf120 DeployedReject (Vaibhav) (•‿•)',
        '----------------------------------------',
        ...langs.map(
          (l) => `${l.name} [${makeBlockBar(l.blocks, 10)}] ${String(l.percent).padStart(2, ' ')}%`
        ),
        '----------------------------------------',
        `REPOS : ${String(s?.publicRepos ?? 14).padEnd(6, ' ')} STARS : ${String(s?.totalStars ?? 19)}`,
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
        `\uf126 365D TOTAL: ${s?.totalCommitsYear ?? 482}   |   FOLLOWERS: ${s?.followers ?? 12}`,
        ...commits.slice(0, 2).map(
          (c) => `[${c.date}] ${c.repo.slice(0, 10).padEnd(10, ' ')}: ${c.message.slice(0, 32)}`
        ),
      ];
    }

    if (activeTab === 'pings') {
      return [
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
        "You shouldn't be able to reach my home server anyway (⌐■_■)",
      ];
    }

    // hire / contact tab (links are listed exclusively in the selectable rows below)
    return [
      'FOCUS    : Linux CLI/TUIs, Daemons & Web Systems',
      'TIMEZONE : IST (UTC+5:30)',
      'STATUS   : Open to Systems & Backend Engineering :D',
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

  return (
    <div
      className={`w-full h-full p-3 sm:p-5 md:p-6 flex flex-col justify-between select-none relative overflow-hidden transition-colors duration-300 ${
        isLightMode ? 'bg-[#e6f0e2] text-[#142918]' : 'bg-[#070c08] text-[#a6e26e]'
      }`}
      style={{
        fontFamily: "var(--font-crt)",
        imageRendering: 'pixelated',
        background: isLightMode
          ? 'radial-gradient(circle at 50% 45%, #f2f8ef 0%, #e1ede0 68%, #cfe0cd 100%)'
          : 'radial-gradient(circle at 50% 45%, #121f14 0%, #09100a 68%, #040704 100%)',
      }}
    >
      {/* Top CRT On-Screen Display (OSD) Channel Bar */}
      <div
        className={`border-b-2 pb-2 flex items-center justify-between gap-2 shrink-0 pointer-events-none ${
          isLightMode ? 'border-[#5c8754]/70' : 'border-[#4b6e32]/80'
        }`}
      >
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
                    ? isLightMode
                      ? 'bg-[#1c3b22] text-[#f2f8ef] border-[#0f2413] font-bold shadow-sm scale-105'
                      : 'bg-[#a6e26e] text-[#0b120c] border-[#d4f7b5] font-bold shadow-[0_0_12px_rgba(166,226,110,0.6)] scale-105'
                    : isLightMode
                    ? 'bg-[#d5e4d2] text-[#2d5434] border-[#8ab083] opacity-85'
                    : 'bg-[#121c13]/90 text-[#6ca144] border-[#355224] opacity-75'
                }`}
              >
                {idx + 1}.{t.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main CRT Display Area */}
      <div className="flex-1 pt-2 sm:pt-3 min-h-0 flex flex-col md:flex-row gap-4 items-stretch justify-between overflow-hidden">
        {/* ROM Loading Animation with Logo & Progress Bar */}
        {insertingProject ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-2 gap-3 animate-fadeIn pointer-events-none">
            <img
              src={insertingProject.labelSvg}
              alt={insertingProject.name}
              className={`w-16 h-16 sm:w-24 sm:h-24 object-cover rounded-lg border-2 ${
                isLightMode
                  ? 'border-[#1c3b22] shadow-md'
                  : 'border-[#a6e26e] shadow-[0_0_20px_rgba(166,226,110,0.5)]'
              }`}
            />
            <div
              className={`text-xs sm:text-sm tracking-wide ${
                isLightMode ? 'text-[#142918] font-bold' : 'pixel-dull-white'
              }`}
              style={{ fontFamily: 'var(--font-pixel)' }}
            >
              {SHORT_NAMES[insertingProject.id] || insertingProject.name}
            </div>
            <div
              className={`w-40 sm:w-56 h-2 border rounded overflow-hidden mt-1 ${
                isLightMode
                  ? 'bg-[#cfe0cd] border-[#5c8754]'
                  : 'bg-[#142016] border-[#5c8244]'
              }`}
            >
              <div
                className={`h-full animate-romLoadBar ${
                  isLightMode ? 'bg-[#1c3b22]' : 'bg-[#a6e26e]'
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
            {fullText && (
              <pre
                className={`whitespace-pre-wrap break-words text-[16px] sm:text-[20px] md:text-[22px] leading-[1.2] tracking-wide m-0 font-normal pointer-events-none ${
                  isLightMode ? 'text-[#142918]' : 'text-[#b5ec82]'
                }`}
                style={{
                  fontFamily: "var(--font-crt)",
                  textShadow: isLightMode ? 'none' : '0 0 8px rgba(166, 226, 110, 0.5)',
                }}
              >
                {displayedText}
                {isTyping && (
                  <span
                    className={`inline-block w-2.5 h-4 ml-0.5 align-middle ${
                      isLightMode ? 'bg-[#142918]' : 'bg-[#b5ec82]'
                    }`}
                  />
                )}
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
                            ? isLightMode
                              ? 'bg-[#1c3b22] text-[#f2f8ef] border-[#0f2413] font-bold'
                              : 'bg-[#a6e26e] text-[#0c140d] border-[#e2f9c8] font-bold shadow-[0_0_15px_rgba(166,226,110,0.45)]'
                            : isLightMode
                            ? 'bg-[#d5e4d2] text-[#1c3b22] border-[#8ab083]'
                            : 'bg-[#121d13]/80 text-[#9cd66c] border-[#314a22] opacity-80'
                        }`}
                      >
                        <span className="text-[16px] sm:text-[19px] md:text-[21px] tracking-wide">
                          {isSelected ? '\uf054 ' : '  '}[{i + 1}] {shortName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Personal Origin Note for Highlighted Project */}
                <div
                  className={`shrink-0 p-2 sm:p-2.5 border ${
                    isLightMode
                      ? 'bg-[#d5e4d2] border-[#5c8754] text-[#142918]'
                      : 'bg-[#152216]/95 border-[#5c8244]'
                  }`}
                >
                  <div
                    className={`text-[9px] sm:text-[11px] leading-relaxed ${
                      isLightMode ? 'text-[#142918]' : 'pixel-dull-white'
                    }`}
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    "{highlightedProject.originNote || highlightedProject.tagline}"
                  </div>
                </div>
              </div>
            )}

            {/* Prominent Full-Width Commit History Chart (Weekly Volume Bars + 7x28 Contribution Heatmap) */}
            {activeTab === 'github' && stats && !isTableZoomedOut && (() => {
              const grid = stats.contributionGrid;
              const numCols = Math.min(28, grid[0]?.length || 20);
              const colors = isLightMode
                ? ['#d5e4d2', '#9ec497', '#639c5a', '#356e2d', '#163d12']
                : ['#121f14', '#274520', '#487a33', '#7ec252', '#c8fa8c'];
              const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
              const weeklyTotals = Array.from({ length: numCols }, (_, colIdx) =>
                grid.reduce((sum, row) => sum + (row[colIdx] ?? 0), 0)
              );
              const maxWeekly = Math.max(12, ...weeklyTotals);

              return (
                <div
                  className={`my-1.5 p-2.5 sm:p-3 rounded border-2 shrink-0 pointer-events-none flex flex-col gap-2 ${
                    isLightMode
                      ? 'border-[#5c8754] bg-[#dbead8]/90 shadow-inner'
                      : 'border-[#4b7533] bg-[#09130a]/90 shadow-[0_0_20px_rgba(166,226,110,0.16),inset_0_0_16px_rgba(0,0,0,0.85)]'
                  }`}
                >
                  {/* Chart Header & Phosphor Legend */}
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 border-b pb-1.5 ${
                      isLightMode ? 'border-[#8ab083]' : 'border-[#2f4d22]'
                    }`}
                    style={{ fontFamily: 'var(--font-pixel)' }}
                  >
                    <span
                      className={`text-[8px] sm:text-[9px] tracking-wider flex items-center gap-1.5 ${
                        isLightMode ? 'text-[#142918]' : 'text-[#b5ec82]'
                      }`}
                    >
                      <span>{'\uf080'}</span>
                      <span>28-WEEK ACTIVITY</span>
                    </span>
                    <div
                      className={`flex items-center gap-1.5 text-[7px] sm:text-[8px] ${
                        isLightMode ? 'text-[#2d5434]' : 'text-[#7ec252]'
                      }`}
                    >
                      <span>LESS</span>
                      {colors.map((c, idx) => (
                        <span
                          key={idx}
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 inline-block border ${
                            isLightMode ? 'border-[#6d9666]' : 'border-[#3a5e29]'
                          }`}
                          style={{
                            backgroundColor: c,
                            boxShadow:
                              !isLightMode && idx === 4
                                ? '0 0 6px rgba(200,250,140,0.75)'
                                : 'none',
                          }}
                        />
                      ))}
                      <span>MORE</span>
                    </div>
                  </div>

                  {/* Weekly Commit Volume Spark-Bar Chart */}
                  <div
                    className={`flex items-end gap-[3px] sm:gap-1 h-7 sm:h-9 pl-7 sm:pl-9 pr-0.5 pt-1 border-b pb-1 ${
                      isLightMode ? 'border-[#8ab083]/70' : 'border-[#233b1a]/80'
                    }`}
                  >
                    {weeklyTotals.map((tot, cIdx) => {
                      const pct = Math.max(14, Math.round((tot / maxWeekly) * 100));
                      const isPeak = tot >= maxWeekly * 0.72;
                      return (
                        <div key={cIdx} className="flex-1 h-full flex items-end">
                          <div
                            className="w-full rounded-t-[1px]"
                            style={{
                              height: `${pct}%`,
                              backgroundColor: isLightMode
                                ? isPeak
                                  ? '#163d12'
                                  : '#4b8243'
                                : isPeak
                                ? '#b5ec82'
                                : '#58943d',
                              boxShadow:
                                !isLightMode && isPeak
                                  ? '0 0 8px rgba(181,236,130,0.55)'
                                  : 'none',
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Full 7-Day x 28-Week Contribution Heatmap Grid */}
                  <div className="flex flex-col gap-[3px] sm:gap-1">
                    {grid.slice(0, 7).map((row, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-[3px] sm:gap-1">
                        <span
                          className={`w-6 sm:w-8 text-[7px] sm:text-[8px] shrink-0 text-left ${
                            isLightMode ? 'text-[#2d5434]' : 'text-[#7ec252]'
                          }`}
                          style={{ fontFamily: 'var(--font-pixel)' }}
                        >
                          {rIdx % 2 === 0 ? dayLabels[rIdx] : ''}
                        </span>
                        <div className="flex-1 flex gap-[3px] sm:gap-1">
                          {row.slice(0, numCols).map((lvl, cIdx) => {
                            const clamped = Math.min(4, Math.max(0, lvl));
                            return (
                              <div
                                key={cIdx}
                                className={`flex-1 h-2.5 sm:h-3.5 md:h-4 rounded-[2px] border ${
                                  isLightMode
                                    ? 'border-[#8ab083]/70'
                                    : 'border-[#22381a]/70'
                                }`}
                                style={{
                                  backgroundColor: colors[clamped],
                                  boxShadow:
                                    !isLightMode && clamped >= 4
                                      ? '0 0 8px rgba(200, 250, 140, 0.65)'
                                      : !isLightMode && clamped === 3
                                      ? '0 0 4px rgba(126, 194, 82, 0.35)'
                                      : 'none',
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Highlighted Channel Options (Scrolled via SCROLL knob, triggered via SELECT button) */}
            {!isTableZoomedOut && activeTab !== 'cartridges' && channelOptions.length > 0 && (
              <div
                className={`mt-2 pt-2 border-t shrink-0 space-y-1 pointer-events-none ${
                  isLightMode ? 'border-[#6d9666]' : 'border-[#375224]/90'
                }`}
              >
                {channelOptions.map((opt, idx) => {
                  const isSel = idx === safeOptionIndex;
                  return (
                    <div
                      key={opt.label}
                      className={`px-2.5 py-1 border text-[15px] sm:text-[18px] flex items-center justify-between transition-all ${
                        isSel
                          ? isLightMode
                            ? 'bg-[#1c3b22] text-[#f2f8ef] border-[#0f2413] font-bold shadow-sm'
                            : 'bg-[#a6e26e] text-[#09120a] border-[#d4f7b5] font-bold shadow-[0_0_12px_rgba(166,226,110,0.45)]'
                          : isLightMode
                          ? 'bg-[#d5e4d2]/90 text-[#1c3b22] border-[#8ab083]'
                          : 'bg-[#101a11]/85 text-[#9cd66c] border-[#2d4520]'
                      }`}
                    >
                      <span className="truncate">
                        {isSel ? '\uf054 ' : '  '}
                        {opt.label}
                      </span>
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

