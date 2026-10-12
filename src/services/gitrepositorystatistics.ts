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
  status: 'UP' | 'DOWN' | 'PINGING' | 'HIDDEN' | 'UNPINGABLE';
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

const CACHE_KEY = 'dr_retro_stats_v5';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const FALLBACK_STATS: DeveloperStats = {
  handle: 'DEPLOYEDREJECT',
  level: 24,
  totalCommitsYear: 482,
  publicRepos: 12,
  totalStars: 18,
  murcesStars: 16,
  followers: 12,
  languages: [
    { name: 'JAVA        ', percent: 38, blocks: 8 },
    { name: 'TYPESCRIPT  ', percent: 32, blocks: 7 },
    { name: 'PYTHON      ', percent: 18, blocks: 4 },
    { name: 'SHELL       ', percent: 12, blocks: 3 },
  ],
  recentCommits: [
    { repo: 'murces', message: 'drop windows support, wsl only', date: 'RECENT' },
    { repo: 'SentricTechnologies', message: 'update map view and mqtt handler', date: 'RECENT' },
    { repo: 'Cireu', message: 'fix light theme colors', date: 'RECENT' },
    { repo: 'cf-p-link', message: 'restart tunnel on process exit', date: 'RECENT' },
  ],
  contributionGrid: [
    [0, 1, 2, 0, 1, 3, 2, 1, 0, 2, 3, 4, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 3, 4, 2, 3, 4, 3],
    [1, 2, 3, 1, 0, 2, 4, 3, 1, 2, 4, 3, 1, 2, 1, 2, 3, 4, 2, 4, 3, 2, 4, 3, 1, 4, 3, 4],
    [0, 0, 1, 2, 2, 3, 1, 0, 2, 3, 2, 1, 3, 4, 2, 1, 4, 3, 3, 2, 1, 3, 2, 4, 3, 2, 4, 3],
    [2, 1, 0, 1, 3, 4, 2, 2, 1, 0, 1, 2, 4, 3, 1, 3, 2, 4, 4, 3, 2, 4, 3, 2, 4, 3, 3, 4],
    [1, 3, 2, 0, 1, 2, 3, 4, 2, 1, 3, 2, 1, 2, 3, 4, 1, 2, 3, 4, 3, 2, 4, 3, 2, 4, 4, 3],
    [0, 1, 1, 2, 0, 1, 2, 1, 3, 2, 1, 0, 2, 1, 2, 3, 2, 3, 4, 2, 1, 2, 3, 2, 1, 3, 2, 2],
    [0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 2, 1, 0, 1, 1, 2, 1, 2, 3, 1, 0, 1, 2, 1, 2, 2, 3, 2],
  ],
  repos: [
    { name: 'murces', stars: 16, forks: 2, language: 'Java', updatedAt: '2026-10', source: 'codeberg', url: 'https://codeberg.org/DeployedReject/murces' },
    { name: 'SentricTechnologies', stars: 1, forks: 0, language: 'TypeScript', updatedAt: '2026-10', source: 'github', url: 'https://github.com/DeployedReject/SentricTechnologies' },
    { name: 'Cireu', stars: 1, forks: 0, language: 'TypeScript', updatedAt: '2026-10', source: 'github', url: 'https://github.com/DeployedReject/Cireu' },
    { name: 'cf-p-link', stars: 1, forks: 0, language: 'Java', updatedAt: '2026-10', source: 'github', url: 'https://github.com/DeployedReject/cf-p-link' },
  ],
  fetchedLive: false,
};

export function getCachedDeveloperStats(): DeveloperStats {
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
  return FALLBACK_STATS;
}

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

    const [userRes, reposRes, eventsRes, contribRes, codebergUserRes, codebergReposRes] = await Promise.allSettled([
      fetch('https://api.github.com/users/DeployedReject', { headers }),
      fetch('https://api.github.com/users/DeployedReject/repos?per_page=100&sort=updated', { headers }),
      fetch('https://api.github.com/users/DeployedReject/events/public?per_page=25', { headers }),
      fetch('https://github-contributions-api.jogruber.de/v4/DeployedReject?y=last'),
      fetch('https://codeberg.org/api/v1/users/DeployedReject'),
      fetch('https://codeberg.org/api/v1/users/DeployedReject/repos'),
    ]);

    let publicRepos = FALLBACK_STATS.publicRepos;
    let followers = FALLBACK_STATS.followers;
    if (userRes.status === 'fulfilled' && userRes.value.ok) {
      const u = await userRes.value.json();
      publicRepos = u.public_repos ?? publicRepos;
      followers = u.followers ?? followers;
    }

    // Add Codeberg follower count if available
    if (codebergUserRes.status === 'fulfilled' && codebergUserRes.value.ok) {
      const cbUser = await codebergUserRes.value.json();
      if (typeof cbUser.followers_count === 'number') {
        followers += cbUser.followers_count;
      }
    }

    let totalStars = 0;
    let murcesStars = 0;
    const langCounts: Record<string, number> = { Java: 4, TypeScript: 4, Python: 2, Shell: 1 };
    const repoList: RepoStat[] = [];
    const seenRepoNames = new Set<string>();

    if (reposRes.status === 'fulfilled' && reposRes.value.ok) {
      const reposJson = await reposRes.value.json();
      if (Array.isArray(reposJson)) {
        for (const r of reposJson) {
          const stars = r.stargazers_count || 0;
          totalStars += stars;
          seenRepoNames.add(r.name.toLowerCase());
          if (r.name.toLowerCase() === 'murces') {
            murcesStars = stars;
          }
          if (r.language) {
            langCounts[r.language] = (langCounts[r.language] || 0) + (r.size || 100);
          }
          repoList.push({
            name: r.name,
            stars: stars,
            forks: r.forks_count || 0,
            language: r.language || 'Code',
            updatedAt: (r.updated_at || '').slice(0, 10),
            source: 'github',
            url: r.html_url,
          });
        }
      }
    }

    // Include any public Codeberg repositories
    if (codebergReposRes.status === 'fulfilled' && codebergReposRes.value.ok) {
      const cbReposJson = await codebergReposRes.value.json();
      if (Array.isArray(cbReposJson)) {
        for (const cr of cbReposJson) {
          const lowerName = (cr.name || '').toLowerCase();
          const stars = cr.stars_count || 0;
          if (!seenRepoNames.has(lowerName)) {
            seenRepoNames.add(lowerName);
            publicRepos += 1;
            totalStars += stars;
            if (cr.language) {
              langCounts[cr.language] = (langCounts[cr.language] || 0) + 100;
            }
            repoList.push({
              name: cr.name,
              stars: stars,
              forks: cr.forks_count || 0,
              language: cr.language || 'Code',
              updatedAt: (cr.updated_at || '').slice(0, 10),
              source: 'codeberg',
              url: cr.html_url,
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
      if (Array.isArray(cJson?.contributions) && cJson.contributions.length >= 196) {
        const last196 = cJson.contributions.slice(-196);
        const grid: number[][] = Array.from({ length: 7 }, () => []);
        last196.forEach((day: { level?: number }, idx: number) => {
          const row = idx % 7;
          grid[row].push(day.level ?? 0);
        });
        contributionGrid = grid;
      }
    }

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
      repos: repoList,
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

const repoCommitsCache = new Map<string, { timestamp: number; commits: CommitTickerItem[] }>();

/**
 * Dynamically poll the latest commits from a specific public GitHub/Codeberg repository
 */
export async function fetchRepoCommits(
  repoName: string,
  source: 'github' | 'codeberg' = 'github'
): Promise<CommitTickerItem[]> {
  const cached = repoCommitsCache.get(repoName);
  if (cached && Date.now() - cached.timestamp < 3 * 60 * 1000) {
    return cached.commits;
  }

  try {
    if (source === 'github') {
      const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
      const envToken = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
      if (envToken) {
        headers.Authorization = `Bearer ${envToken}`;
      }

      const res = await fetch(
        `https://api.github.com/repos/DeployedReject/${repoName}/commits?per_page=6`,
        { headers }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const commits: CommitTickerItem[] = data.map((item) => {
            const rawDate = item.commit?.author?.date || item.commit?.committer?.date || '';
            const date = rawDate ? rawDate.slice(5, 10) : 'RECENT';
            const message = (item.commit?.message || 'code update').split('\n')[0].slice(0, 60);
            return {
              repo: repoName,
              message,
              date,
            };
          });

          repoCommitsCache.set(repoName, { timestamp: Date.now(), commits });
          return commits;
        }
      }
    } else {
      // Codeberg commits endpoint
      const res = await fetch(
        `https://codeberg.org/api/v1/repos/DeployedReject/${repoName}/commits?limit=6`
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const commits: CommitTickerItem[] = data.map((item) => {
            const rawDate = item.created || item.commit?.author?.date || '';
            const date = rawDate ? rawDate.slice(5, 10) : 'RECENT';
            const message = (item.commit?.message || 'code update').split('\n')[0].slice(0, 60);
            return {
              repo: repoName,
              message,
              date,
            };
          });

          repoCommitsCache.set(repoName, { timestamp: Date.now(), commits });
          return commits;
        }
      }
    }
  } catch {
    // ignore network errors
  }

  return [];
}

export async function measureEndpointPings(): Promise<PingResult[]> {
  const sentricCheck = (async () => {
    const t0 = performance.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    try {
      await fetch('https://150.230.141.102', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      const ms = Math.max(8, Math.round(performance.now() - t0));
      return { name: 'Sentric Technologies', target: '150.230.141.102', status: 'UP' as const, latencyMs: ms };
    } catch {
      window.clearTimeout(timeout);
      const elapsed = Math.round(performance.now() - t0);
      if (elapsed < 2500) {
        return { name: 'Sentric Technologies', target: '150.230.141.102', status: 'UP' as const, latencyMs: Math.max(12, elapsed) };
      }
      return { name: 'Sentric Technologies', target: '150.230.141.102', status: 'DOWN' as const, latencyMs: null };
    }
  })();

  const sentricResult = await sentricCheck;

  return [
    {
      name: 'Aggregator Backend',
      target: '144.24.141.13',
      status: 'UNPINGABLE',
      latencyMs: null,
    },
    sentricResult,
    {
      name: 'Home Server',
      target: '[IP NOT REVEALED]',
      status: 'HIDDEN',
      latencyMs: null,
    },
  ];
}
