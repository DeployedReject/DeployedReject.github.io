import { useState, useEffect, useMemo, useRef } from 'react';
import type { Project } from '../data/projects';
import {
  fetchDeveloperStats,
  measureEndpointPings,
  type DeveloperStats,
  type PingResult,
} from '../services/githubStats';

export type ScreenTab = 'status' | 'cartridges' | 'github' | 'pings' | 'hire';

interface ConsoleScreenContentProps {
  projects: Project[];
  activeTab: ScreenTab;
  selectedIndex?: number;
  pingRefreshKey?: number;
  isTableZoomedOut: boolean;
  insertingProjectName?: string | null;
}

function makeBlockBar(blocks: number, total = 10): string {
  const filled = Math.max(0, Math.min(total, blocks));
  return '█'.repeat(filled) + '░'.repeat(total - filled);
}

const SHORT_NAMES: Record<string, string> = {
  murces: 'MurCes',
  sentric: 'VitalLink',
  cireu: 'Cireu',
  'cf-p-link': 'cf-p-link',
  aggregator: 'Aggregator',
};

export const ConsoleScreenContent: React.FC<ConsoleScreenContentProps> = ({
  projects,
  activeTab,
  selectedIndex = 0,
  pingRefreshKey = 0,
  isTableZoomedOut,
  insertingProjectName,
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

  // Ensure the selected ROM option is always scrolled into view when navigating
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
    if (insertingProjectName) {
      return [
        `> LOADING : ${insertingProjectName.toUpperCase()}`,
        '> STARTING DEMO...',
      ];
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
        'DeployedReject (Vaibhav)',
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
        `COMMITS (365D): ${s?.totalCommitsYear ?? 482}   |   FOLLOWERS: ${s?.followers ?? 12}`,
        '----------------------------------------',
        ...commits.slice(0, 4).map(
          (c) => `[${c.date}] ${c.repo.slice(0, 10).padEnd(10, ' ')}: ${c.message.slice(0, 26)}`
        ),
      ];
    }

    if (activeTab === 'pings') {
      return [
        'SERVERS:',
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
      'CONTACT:',
      '----------------------------------------',
      'GITHUB   : github.com/DeployedReject',
      'CODEBERG : codeberg.org/DeployedReject',
      'EMAIL    : mishravaibhav2048@gmail.com',
    ];
  }, [activeTab, stats, pings, insertingProjectName]);

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

  const tabs: Array<{ id: ScreenTab; label: string }> = [
    { id: 'status', label: 'About' },
    { id: 'cartridges', label: 'ROMS' },
    { id: 'github', label: 'Commits' },
    { id: 'pings', label: 'Servers' },
    { id: 'hire', label: 'Contact' },
  ];

  const activeChannelNum = tabs.findIndex((t) => t.id === activeTab) + 1;

  return (
    <div
      className="w-full h-full bg-[#0d140e] text-[#a6e26e] p-3 sm:p-5 md:p-6 flex flex-col justify-between select-none pointer-events-none relative overflow-hidden"
      style={{
        fontFamily: "'VT323', monospace",
        imageRendering: 'pixelated',
        background:
          'radial-gradient(circle at 50% 45%, #162418 0%, #0d150e 68%, #070b07 100%)',
      }}
    >
      {/* Top CRT On-Screen Display (OSD) Channel Bar */}
      <div className="border-b-2 border-[#4b6e32]/80 pb-2 flex items-center justify-between gap-2 shrink-0">
        <div
          className="flex flex-wrap gap-1.5 sm:gap-2"
          style={{ fontFamily: "'Press Start 2P', monospace" }}
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
          style={{ fontFamily: "'Press Start 2P', monospace" }}
        >
          CH-0{activeChannelNum}
        </div>
      </div>

      {/* Main CRT Display Area */}
      <div className="flex-1 pt-2 sm:pt-3 min-h-0 flex flex-col md:flex-row gap-4 items-stretch justify-between overflow-hidden">
        {/* Left/Main Terminal Readout */}
        <div className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
          {fullText && (
            <pre
              className="whitespace-pre-wrap break-words text-[16px] sm:text-[20px] md:text-[23px] leading-[1.22] tracking-wide text-[#b5ec82] m-0 font-normal"
              style={{
                fontFamily: "'VT323', monospace",
                textShadow: '0 0 8px rgba(166, 226, 110, 0.5)',
              }}
            >
              {displayedText}
              {isTyping && <span className="inline-block w-2.5 h-4 bg-[#b5ec82] ml-0.5 align-middle" />}
              {!isTyping && activeTab !== 'cartridges' && <span className="animate-pulse">█</span>}
            </pre>
          )}

          {/* Scrollable ROMs List when on ROMS channel (Always keeps selected option scrolled into view) */}
          {!insertingProjectName && activeTab === 'cartridges' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 gap-2 overflow-hidden">
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
                        {isSelected ? '► ' : '  '}[{i + 1}] {shortName}
                      </span>
                      <span
                        className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 ${
                          isSelected ? 'bg-[#0c140d] text-[#e6cf65]' : 'text-[#6c9e46]'
                        }`}
                        style={{ fontFamily: "'Press Start 2P', monospace" }}
                      >
                        ROM
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Personal Origin Note for Highlighted Project */}
              <div className="shrink-0 p-2 sm:p-2.5 bg-[#152216]/95 border border-[#5c8244] text-[#f0f7e6]">
                <div className="text-[14px] sm:text-[18px] md:text-[20px] leading-tight">
                  "{highlightedProject.originNote || highlightedProject.tagline}"
                </div>
              </div>
            </div>
          )}

          {/* Contribution Matrix on Commits tab */}
          {!insertingProjectName && activeTab === 'github' && stats && (
            <div className="mt-2 pt-2 border-t border-[#375224] shrink-0">
              <div className="flex flex-col gap-[3px]">
                {stats.contributionGrid.slice(0, 5).map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-[3px]">
                    {row.slice(0, 22).map((lvl, cIdx) => {
                      const colors = ['#18261a', '#2f4d26', '#52803a', '#7ec252', '#c4f78b'];
                      return (
                        <div
                          key={cIdx}
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[1px]"
                          style={{ backgroundColor: colors[Math.min(4, lvl)] }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Cartridge Label Artwork (Visible on larger screens in fullscreen mode) */}
        {!insertingProjectName && !isTableZoomedOut && (
          <div className="hidden md:flex w-52 lg:w-60 shrink-0 flex-col justify-between border-2 border-[#4b6e32] bg-[#101a11]/90 p-2 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <div className="relative flex-1 rounded border border-[#5c8244] overflow-hidden bg-[#0a100b] flex items-center justify-center">
              <img
                src={highlightedProject.labelSvg}
                alt={highlightedProject.name}
                className="w-full h-full object-cover opacity-90 filter contrast-110"
              />
              <div
                className="absolute bottom-1.5 inset-x-1.5 bg-[#0e170f]/95 border border-[#a6e26e] px-2 py-1 text-center text-[9px] text-[#e6cf65]"
                style={{ fontFamily: "'Press Start 2P', monospace" }}
              >
                {SHORT_NAMES[highlightedProject.id] || highlightedProject.name}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
