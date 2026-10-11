import { useState } from 'react';
import { Activity, ShieldAlert, Radio, RefreshCw, Zap } from 'lucide-react';


export const VitalLinkDemo: React.FC = () => {
  const [activeDistrict, setActiveDistrict] = useState<'visakhapatnam' | 'vijayawada' | 'tirupati' | 'guntur'>('visakhapatnam');
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(78);
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState<boolean>(false);
  const [alertsTriggered, setAlertsTriggered] = useState<number>(3);

  const districts = {
    visakhapatnam: { name: 'Visakhapatnam Coastal', cases: 142, trend: '+14%', severity: 'ELEVATED', bedsAvailable: '78%', ping: '12ms' },
    vijayawada: { name: 'Vijayawada Central', cases: 289, trend: '+38%', severity: 'CRITICAL', bedsAvailable: '42%', ping: '18ms' },
    tirupati: { name: 'Tirupati South', cases: 64, trend: '-5%', severity: 'NORMAL', bedsAvailable: '91%', ping: '24ms' },
    guntur: { name: 'Guntur Rural', cases: 198, trend: '+22%', severity: 'WARNING', bedsAvailable: '60%', ping: '15ms' },
  };

  const handleSimulateDispatch = () => {
    setIsSimulatingDispatch(true);
    setTimeout(() => {
      setIsSimulatingDispatch(false);
      setAlertsTriggered((prev) => prev + 1);
    }, 1200);
  };

  const current = districts[activeDistrict];

  return (
    <div className="bg-stone-950 text-stone-200 rounded-lg border border-red-950/60 p-4 font-mono text-xs sm:text-sm shadow-xl flex flex-col gap-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-stone-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-950/60 border border-red-800/80 rounded text-red-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-stone-100 flex items-center gap-2 text-xs sm:text-sm">
              VITALLINK CORE // SECTOR TEL: ANDHRA PRADESH
              <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded border border-red-700/50">MQTT LIVE</span>
            </div>
            <div className="text-[10px] text-stone-400">Python VPS Node • MQTT Ingestion • Edge Token Verify</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <Radio className="w-3 h-3 animate-ping" /> Broker Online
          </span>
          <span className="text-stone-400">Edge Latency: <strong className="text-stone-200">{current.ping}</strong></span>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* District Selector & Stats */}
        <div className="space-y-2">
          <div className="text-[10px] text-stone-400 uppercase tracking-wider">Select Surveillance Node:</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(districts) as Array<keyof typeof districts>).map((k) => (
              <button
                key={k}
                onClick={() => setActiveDistrict(k)}
                className={`p-2 text-left rounded border transition-all text-xs cursor-pointer ${
                  activeDistrict === k
                    ? 'bg-red-950/50 border-red-500 text-white font-bold'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="truncate">{districts[k].name.split(' ')[0]}</div>
                <div className={`text-[10px] ${districts[k].severity === 'CRITICAL' ? 'text-red-400 font-bold' : districts[k].severity === 'ELEVATED' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ● {districts[k].severity}
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 bg-stone-900/60 rounded border border-stone-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Cases Recorded (24h):</span>
              <span className="font-bold text-red-400">{current.cases} ({current.trend})</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">ICU Bed Buffer:</span>
              <span className="font-bold text-emerald-400">{current.bedsAvailable}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400">Anomaly Index:</span>
              <span className="font-bold text-amber-400">0.82 (P &lt; 0.01)</span>
            </div>
          </div>
        </div>

        {/* Vector Map Simulation Canvas */}
        <div className="p-3 bg-stone-900/90 rounded border border-stone-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-stone-400 border-b border-stone-800/60 pb-1">
            <span>GEOSPATIAL VECTOR SIMULATOR</span>
            <span className="text-red-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Anomaly Mode
            </span>
          </div>

          {/* Abstract SVG Vector Nodes Map */}
          <div className="relative h-32 w-full my-2 flex items-center justify-center">
            <svg viewBox="0 0 200 120" className="w-full h-full opacity-80">
              {/* Regional outlines */}
              <polygon points="20,30 90,15 170,40 180,95 110,110 30,90" fill="none" stroke="#374151" strokeWidth="1" strokeDasharray="3 3" />
              {/* Connecting telemetry arcs */}
              <line x1="50" y1="50" x2="100" y2="40" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="100" y1="40" x2="140" y2="70" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.6" />
              <line x1="100" y1="40" x2="70" y2="85" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.6" />
              {/* Nodes */}
              <circle cx="50" cy="50" r="5" fill="#ef4444" className="animate-pulse" />
              <circle cx="100" cy="40" r="7" fill={activeDistrict === 'vijayawada' ? '#ef4444' : '#f59e0b'} />
              <circle cx="140" cy="70" r="5" fill={activeDistrict === 'visakhapatnam' ? '#ef4444' : '#14b8a6'} />
              <circle cx="70" cy="85" r="4" fill="#10b981" />
            </svg>
            <div className="absolute bottom-1 right-1 text-[9px] text-stone-500 font-mono">
              AP GeoJSON Mesh: 28 Vector Polygons
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-800/60 text-[10px]">
            <span className="text-stone-400">Total Dispatch Alerts:</span>
            <span className="font-bold text-red-400">{alertsTriggered}</span>
          </div>
        </div>

        {/* Dispatch Controls & Trigger */}
        <div className="flex flex-col justify-between p-3 bg-stone-900/60 rounded border border-stone-800">
          <div className="space-y-3">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider">MQTT Dispatch Controller</div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-stone-400">Sensitivity Cutoff:</span>
                <span className="text-red-400 font-bold">{anomalyThreshold}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                value={anomalyThreshold}
                onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
            </div>

            <div className="text-[11px] text-stone-400 leading-tight">
              Calculates rolling Poisson anomaly deviations over 7-day hospital triage logs to avoid false panic.
            </div>
          </div>

          <button
            onClick={handleSimulateDispatch}
            disabled={isSimulatingDispatch}
            className="w-full mt-3 py-2 px-3 rounded bg-red-900/80 hover:bg-red-800 text-red-100 font-bold border border-red-700/60 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSimulatingDispatch ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Dispatching MQTT Packets...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                Trigger Vector Field Dispatch
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
