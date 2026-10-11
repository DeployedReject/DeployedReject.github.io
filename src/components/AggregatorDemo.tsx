import { useState } from 'react';
import { Search, Shield, Play, Layers, Lock } from 'lucide-react';



interface MediaItem {
  id: string;
  title: string;
  source: 'Internet Archive' | 'Wikimedia Commons' | 'Blender Open Movies';
  type: 'video' | 'audio' | 'text';
  duration: string;
  license: string;
  previewUrl: string;
}

export const AggregatorDemo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('space');
  const [activePluginFilter, setActivePluginFilter] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    '[SANDBOX] Plugin runtime initialized in isolated Web Worker context',
    '[SANDBOX] Strict CSP active: script-src \'none\', network-proxy \'enforced\'',
    '[RESOLVER] Loaded 3 legal open-source discovery plugins',
  ]);

  const mockMedia: MediaItem[] = [
    {
      id: 'ia-1',
      title: 'Voyage Dans La Lune (1902 George Méliès)',
      source: 'Internet Archive',
      type: 'video',
      duration: '12:52',
      license: 'Public Domain',
      previewUrl: 'Classic cinematic milestone of early lunar space travel exploration.',
    },
    {
      id: 'blender-1',
      title: 'Tears of Steel (Sci-Fi VFX Project)',
      source: 'Blender Open Movies',
      type: 'video',
      duration: '12:14',
      license: 'Creative Commons 3.0',
      previewUrl: 'High quality open CGI science fiction short film rendered in Blender.',
    },
    {
      id: 'wiki-1',
      title: 'Apollo 11 Saturn V Launch Audio Stream',
      source: 'Wikimedia Commons',
      type: 'audio',
      duration: '04:18',
      license: 'NASA / Public Domain',
      previewUrl: 'Original mission audio transmission recorded at Cape Canaveral.',
    },
    {
      id: 'blender-2',
      title: 'Big Buck Bunny (4K 60fps Open Benchmark)',
      source: 'Blender Open Movies',
      type: 'video',
      duration: '09:56',
      license: 'Creative Commons 3.0',
      previewUrl: 'Iconic open source character animation benchmark animation.',
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSandboxLogs((prev) => [
      ...prev,
      `[DISPATCH] Broadcasting query "${searchTerm}" to ${activePluginFilter === 'all' ? 'all plugins' : activePluginFilter}...`,
      `[SANDBOX] Normalized 4 metadata streams in 42ms via Cloudflare Worker proxy`,
    ]);
  };

  const handleTestTamper = () => {
    setSandboxLogs((prev) => [
      ...prev,
      `[SECURITY] Injected untrusted plugin payload attempting DOM access: window.cookie...`,
      `[BLOCKED] Web Worker boundary trapped violation: SecurityError: Access denied. Sandbox intact!`,
    ]);
  };

  const filtered = mockMedia.filter((m) => {
    const matchesFilter = activePluginFilter === 'all' || m.source === activePluginFilter;
    const matchesQuery = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.previewUrl.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="bg-stone-950 text-stone-200 rounded-lg border border-lime-900/60 p-4 font-mono text-xs sm:text-sm shadow-xl flex flex-col gap-3">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-stone-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-lime-950/60 border border-lime-800/80 rounded text-lime-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-stone-100 flex items-center gap-2 text-xs sm:text-sm">
              UNIFIED AGGREGATOR // SANDBOXED RUNTIME
              <span className="text-[10px] bg-lime-900/60 text-lime-300 px-1.5 py-0.5 rounded border border-lime-700/50">
                Legal Public Sources
              </span>
            </div>
            <div className="text-[10px] text-stone-400">Web Worker Isolation • Edge Metadata Proxy • Zero Direct DOM Bleed</div>
          </div>
        </div>

        <button
          onClick={handleTestTamper}
          className="text-[11px] px-2.5 py-1 rounded bg-stone-900 hover:bg-red-950/60 text-red-400 border border-red-900/40 hover:border-red-700/70 cursor-pointer flex items-center gap-1 transition-colors"
        >
          <Shield className="w-3 h-3" /> Test Malicious Sandbox Escape
        </button>
      </div>

      {/* Search Input & Plugins Bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search open archives, films, audio..."
            className="w-full bg-stone-900 border border-stone-800 rounded pl-8 pr-3 py-1.5 text-xs text-stone-100 placeholder:text-stone-600 outline-none focus:border-lime-500/80"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto text-xs">
          {['all', 'Internet Archive', 'Wikimedia Commons', 'Blender Open Movies'].map((plugin) => (
            <button
              key={plugin}
              type="button"
              onClick={() => setActivePluginFilter(plugin)}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors cursor-pointer shrink-0 ${
                activePluginFilter === plugin
                  ? 'bg-lime-950/70 border-lime-500 text-lime-300 font-bold'
                  : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:border-stone-700'
              }`}
            >
              {plugin === 'all' ? 'All Active Plugins' : plugin}
            </button>
          ))}
        </div>
      </form>

      {/* Main Grid: Results & Sandbox Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Results List */}
        <div className="md:col-span-2 space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-stone-500 bg-stone-900/40 rounded border border-stone-800">
              No results found across active plugin sources. Try typing "space" or "bunny".
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedMedia(item)}
                className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                  selectedMedia?.id === item.id
                    ? 'bg-lime-950/40 border-lime-500 text-white'
                    : 'bg-stone-900/60 border-stone-800/80 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    <Play className="w-3 h-3 text-lime-400 shrink-0" /> {item.title}
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Source: <strong className="text-stone-300">{item.source}</strong> • {item.license} • {item.duration}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-400 uppercase font-mono">
                  {item.type}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Sandbox Runtime Monitor Log */}
        <div className="bg-stone-900/90 rounded border border-stone-800 p-2.5 flex flex-col justify-between font-mono text-[10px]">
          <div>
            <div className="text-stone-400 font-bold mb-1.5 flex items-center justify-between pb-1 border-b border-stone-800">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-lime-400" /> SANDBOX AUDIT TRAIL
              </span>
              <span className="text-emerald-400">ISOLATED</span>
            </div>
            <div className="space-y-1 text-stone-400 max-h-[170px] overflow-y-auto">
              {sandboxLogs.slice(-6).map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-tight ${log.includes('BLOCKED') ? 'text-red-400 font-bold' : log.includes('SECURITY') ? 'text-amber-400' : 'text-stone-400'}`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-stone-800 text-[9px] text-stone-500">
            CORS proxy: edge.cloudflare.worker • Safe sandbox execution
          </div>
        </div>
      </div>
    </div>
  );
};
