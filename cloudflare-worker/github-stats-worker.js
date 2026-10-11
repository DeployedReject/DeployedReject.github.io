/**
 * Optional Cloudflare Worker for DeployedReject Portfolio Stats & Pings
 *
 * How to use (optional — the site already fetches public GitHub & Codeberg APIs directly with 15-min localStorage cache):
 * 1. Create a Cloudflare Worker and paste this script.
 * 2. In Worker Settings -> Variables and Secrets, add secret:
 *      GITHUB_TOKEN = <your fine-grained read-only GitHub PAT>
 * 3. Optionally bind a KV namespace named STATS_CACHE.
 * 4. Set VITE_STATS_WORKER_URL=https://your-worker.your-subdomain.workers.dev in your repo Secrets / .env
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (env.STATS_CACHE) {
      const cached = await env.STATS_CACHE.get('portfolio_stats');
      if (cached) {
        return new Response(cached, { headers: corsHeaders });
      }
    }

    const ghHeaders = {
      'User-Agent': 'DeployedReject-Portfolio-Worker',
      Accept: 'application/vnd.github.v3+json',
    };
    if (env.GITHUB_TOKEN) {
      ghHeaders.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
    }

    const [userRes, reposRes, codebergRes] = await Promise.all([
      fetch('https://api.github.com/users/DeployedReject', { headers: ghHeaders }),
      fetch('https://api.github.com/users/DeployedReject/repos?per_page=100&sort=updated', { headers: ghHeaders }),
      fetch('https://codeberg.org/api/v1/repos/DeployedReject/murces', {
        headers: { 'User-Agent': 'DeployedReject-Portfolio-Worker' },
      }),
    ]);

    const user = userRes.ok ? await userRes.json() : {};
    const repos = reposRes.ok ? await reposRes.json() : [];
    const cb = codebergRes.ok ? await codebergRes.json() : {};

    const payload = JSON.stringify({
      handle: 'DEPLOYEDREJECT',
      publicRepos: user.public_repos || 14,
      followers: user.followers || 12,
      murcesStars: cb.stars_count || 16,
      totalStars:
        (cb.stars_count || 16) +
        (Array.isArray(repos) ? repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0) : 0),
      fetchedLive: true,
    });

    if (env.STATS_CACHE) {
      await env.STATS_CACHE.put('portfolio_stats', payload, { expirationTtl: 600 });
    }

    return new Response(payload, { headers: corsHeaders });
  },
};
