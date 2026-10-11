export interface RepoStat {
  name: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
  source: 'github' | 'codeberg';
  url: string;
}

export interface CommitTickerItem {
  repo: string;
  message: string;
  date: string;
}

export interface PingResult {
  name: string;
  target: string;
  status: 'UP' | 'DOWN' | 'PINGING';
  latencyMs: number | null;
}

export interface DeveloperStats {
  handle: string;
  level: number;
  totalCommitsYear: number;
  publicRepos: number;
  totalStars: number;
  murcesStars: number;
  followers: number;
  languages: Array<{ name: string; percent: number; blocks: number }>;
  recentCommits: CommitTickerItem[];
  contributionGrid: number[][]; // 7 rows x 20 cols (0..4 intensity)
  repos: RepoStat[];
  fetchedLive: boolean;
}

const CACHE_KEY = 'dr_retro_stats_v2';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const FALLBACK_STATS: DeveloperStats = {
  handle: 'DEPLOYEDREJECT',
  level: 24,
  totalCommitsYear: 482,
  publicRepos: 14,
  totalStars: 19,
  murcesStars: 16,
  followers: 12,
  languages: [
    { name: 'JAVA / GRAAL', percent: 38, blocks: 8 },
    { name: 'TYPESCRIPT  ', percent: 32, blocks: 7 },
    { name: 'PYTHON / IOT', percent: 18, blocks: 4 },
    { name: 'SHELL / SYS ', percent: 12, blocks: 3 },
  ],
  recentCommits: [
    { repo: 'murces', message: 'feat(tui): native AOT GraalVM & Modrinth sync', date: 'RECENT' },
    { repo: 'SentricTechnologies', message: 'feat(vital): AP H3 hex map & MQTT dispatch', date: 'RECENT' },
    { repo: 'Cireu', message: 'feat(graph): Fleury bridge check & step player', date: 'RECENT' },
    { repo: 'cf-p-link', message: 'feat(daemon): auto-redeploy Worker on tunnel crash', date: 'RECENT' },
  ],
  contributionGrid: [
    [0, 1, 2, 0, 1, 3, 2, 1, 0, 2, 3, 4, 2, 1, 0, 1, 2, 3, 4, 3],
    [1, 2, 3, 1, 0, 2, 4, 3, 1, 2, 4, 3, 1, 2, 1, 2, 3, 4, 2, 4],
    [0, 0, 1, 2, 2, 3, 1, 0, 2, 3, 2, 1, 3, 4, 2, 1, 4, 3, 3, 2],
    [2, 1, 0, 1, 3, 4, 2, 2, 1, 0, 1, 2, 4, 3, 1, 3, 2, 4, 4, 3],
    [1, 3, 2, 0, 1, 2, 3, 4, 2, 1, 3, 2, 1, 2, 3, 4, 1, 2, 3, 4],
    [0, 1, 1, 2, 0, 1, 2, 1, 3, 2, 1, 0, 2, 1, 2, 3, 2, 3, 4, 2],
    [0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 2, 1, 0, 1, 1, 2, 1, 2, 3, 1],
  ],
  repos: [
    { name: 'murces', stars: 16, forks: 2, language: 'Java', updatedAt: '2026-10', source: 'codeberg', url: 'https://codeberg.org/DeployedReject/murces' },
    { name: 'SentricTechnologies', stars: 1, forks: 0, language: 'TypeScript', updatedAt: '2026-10', source: 'github', url: 'https://github.com/DeployedReject/SentricTechnologies' },
    { name: 'Cireu', stars: 1, forks: 0, language: 'TypeScript', updatedAt: '2026-10', source: 'github', url: 'https://github.com/DeployedReject/Cireu' },
    { name: 'cf-p-link', stars: 1, forks: 0, language: 'Java', updatedAt: '2026-10', source: 'github', url: 'https://github.com/DeployedReject/cf-p-link' },
  ],
  fetchedLive: false,
};

export async function fetchDeveloperStats(): Promise<DeveloperStats> {
  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
        return parsed.data as DeveloperStats;
      }
    }
  } catch {
    // ignore storage errors
  }

  // Optional custom Cloudflare Worker endpoint if configured in .env
  const workerUrl = import.meta.env.VITE_STATS_WORKER_URL as string | undefined;
  if (workerUrl) {
    try {
      const res = await fetch(workerUrl);
      if (res.ok) {
        const data = (await res.json()) as DeveloperStats;
        localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }));
        return data;
      }
    } catch {
      // fall through to direct public API fetch
    }
  }

  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    const envToken = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
    if (envToken) {
      headers.Authorization = `Bearer ${envToken}`;
    }

    const [userRes, reposRes, eventsRes, contribRes, codebergRes] = await Promise.allSettled([
      fetch('https://api.github.com/users/DeployedReject', { headers }),
      fetch('https://api.github.com/users/DeployedReject/repos?per_page=100&sort=updated', { headers }),
      fetch('https://api.github.com/users/DeployedReject/events/public?per_page=25', { headers }),
      fetch('https://github-contributions-api.jogruber.de/v4/DeployedReject?y=last'),
      fetch('https://codeberg.org/api/v1/repos/DeployedReject/murces'),
    ]);

    let publicRepos = FALLBACK_STATS.publicRepos;
    let followers = FALLBACK_STATS.followers;
    if (userRes.status === 'fulfilled' && userRes.value.ok) {
      const u = await userRes.value.json();
      publicRepos = u.public_repos ?? publicRepos;
      followers = u.followers ?? followers;
    }

    let murcesStars = FALLBACK_STATS.murcesStars;
    let murcesForks = 2;
    if (codebergRes.status === 'fulfilled' && codebergRes.value.ok) {
      const cb = await codebergRes.value.json();
      murcesStars = cb.stars_count ?? murcesStars;
      murcesForks = cb.forks_count ?? murcesForks;
    }

    let ghStars = 0;
    const langCounts: Record<string, number> = { Java: 4, TypeScript: 4, Python: 2, Shell: 1 };
    const repoList: RepoStat[] = [
      {
        name: 'murces',
        stars: murcesStars,
        forks: murcesForks,
        language: 'Java',
        updatedAt: 'LIVE',
        source: 'codeberg',
        url: 'https://codeberg.org/DeployedReject/murces',
      },
    ];

    if (reposRes.status === 'fulfilled' && reposRes.value.ok) {
      const reposJson = await reposRes.value.json();
      if (Array.isArray(reposJson)) {
        for (const r of reposJson) {
          ghStars += r.stargazers_count || 0;
          if (r.language) {
            langCounts[r.language] = (langCounts[r.language] || 0) + (r.size || 100);
          }
          if (r.name.toLowerCase() !== 'murces') {
            repoList.push({
              name: r.name,
              stars: r.stargazers_count || 0,
              forks: r.forks_count || 0,
              language: r.language || 'Code',
              updatedAt: (r.updated_at || '').slice(0, 10),
              source: 'github',
              url: r.html_url,
            });
          }
        }
      }
    }

    const totalLangWeight = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
    const sortedLangs = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, val]) => {
        const pct = Math.max(8, Math.round((val / totalLangWeight) * 100));
        return {
          name: name.toUpperCase().padEnd(12, ' ').slice(0, 12),
          percent: pct,
          blocks: Math.max(1, Math.min(10, Math.round(pct / 10))),
        };
      });

    const recentCommits: CommitTickerItem[] = [];
    if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
      const evJson = await eventsRes.value.json();
      if (Array.isArray(evJson)) {
        for (const ev of evJson) {
          if (ev.type === 'PushEvent' && ev.payload?.commits?.length) {
            const repoShort = (ev.repo?.name || '').split('/')[1] || ev.repo?.name || 'repo';
            const msg = ev.payload.commits[0].message?.split('\n')[0] || 'code update';
            const dateStr = (ev.created_at || '').slice(5, 10);
            recentCommits.push({ repo: repoShort, message: msg, date: dateStr });
            if (recentCommits.length >= 5) break;
          }
        }
      }
    }

    let totalCommitsYear = FALLBACK_STATS.totalCommitsYear;
    let contributionGrid = FALLBACK_STATS.contributionGrid;
    if (contribRes.status === 'fulfilled' && contribRes.value.ok) {
      const cJson = await contribRes.value.json();
      if (cJson?.total?.lastYear) {
        totalCommitsYear = cJson.total.lastYear;
      }
      if (Array.isArray(cJson?.contributions) && cJson.contributions.length >= 140) {
        const last140 = cJson.contributions.slice(-140);
        const grid: number[][] = Array.from({ length: 7 }, () => []);
        last140.forEach((day: { level?: number }, idx: number) => {
          const row = idx % 7;
          grid[row].push(day.level ?? 0);
        });
        contributionGrid = grid;
      }
    }

    const totalStars = ghStars + murcesStars;
    const level = Math.max(15, Math.min(99, Math.floor(totalCommitsYear / 15) + publicRepos));

    const result: DeveloperStats = {
      handle: 'DEPLOYEDREJECT',
      level,
      totalCommitsYear,
      publicRepos,
      totalStars,
      murcesStars,
      followers,
      languages: sortedLangs.length >= 3 ? sortedLangs : FALLBACK_STATS.languages,
      recentCommits: recentCommits.length > 0 ? recentCommits : FALLBACK_STATS.recentCommits,
      contributionGrid,
      repos: repoList.slice(0, 6),
      fetchedLive: true,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: result }));
    } catch {
      // ignore
    }
    return result;
  } catch {
    return FALLBACK_STATS;
  }
}

export async function measureEndpointPings(): Promise<PingResult[]> {
  const endpoints = [
    { name: 'MURCES.CODEBERG', target: 'https://codeberg.org/api/v1/version' },
    { name: 'GITHUB.REST.API', target: 'https://api.github.com/zen' },
    { name: 'CIREU.GH.PAGES ', target: 'https://deployedreject.github.io/cireu/' },
    { name: 'ARCHIVE.ORG.API', target: 'https://archive.org/metadata/VoyageDansLaLune' },
  ];

  const results = await Promise.all(
    endpoints.map(async (ep) => {
      const t0 = performance.now();
      try {
        await fetch(ep.target, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' });
        const ms = Math.max(4, Math.round(performance.now() - t0));
        return { name: ep.name, target: ep.target, status: 'UP' as const, latencyMs: ms };
      } catch {
        return { name: ep.name, target: ep.target, status: 'DOWN' as const, latencyMs: null };
      }
    })
  );

  return results;
}
