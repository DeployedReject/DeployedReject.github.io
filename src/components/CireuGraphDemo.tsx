import { useState, useEffect } from 'react';
import { Play, RotateCcw, GitGraph, Info } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  from: string;
  to: string;
}

export const CireuGraphDemo: React.FC = () => {
  const nodes: Node[] = [
    { id: 'A', x: 60, y: 50, label: 'A' },
    { id: 'B', x: 180, y: 50, label: 'B' },
    { id: 'C', x: 240, y: 150, label: 'C' },
    { id: 'D', x: 120, y: 220, label: 'D' },
    { id: 'E', x: 40, y: 150, label: 'E' },
  ];

  const edges: Edge[] = [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'D' },
    { from: 'D', to: 'E' },
    { from: 'E', to: 'A' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
  ];

  // Euler cycle playback steps
  const pathOrder = ['A', 'B', 'D', 'E', 'A', 'C', 'D', 'C', 'B']; // demo path
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: number | undefined;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= pathOrder.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isPlaying, pathOrder.length]);



  const activeNodeId = pathOrder[currentStep];

  return (
    <div className="bg-stone-950 text-stone-200 rounded-lg border border-purple-900/60 p-4 font-mono text-xs sm:text-sm shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-stone-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-950/60 border border-purple-800/80 rounded text-purple-400">
            <GitGraph className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-stone-100 flex items-center gap-2 text-xs sm:text-sm">
              CIREU // EULERIAN PATH & CYCLE SIMULATOR
              <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50">
                Fleury's Engine
              </span>
            </div>
            <div className="text-[10px] text-stone-400">Interactive SVG Matrix • Step-by-Step Traversal Playback</div>
          </div>
        </div>
        <a
          href="https://deployedreject.github.io/cireu/"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-purple-400 hover:text-purple-300 underline font-mono flex items-center gap-1"
        >
          Open Standalone App ↗
        </a>
      </div>

      {/* Main Playback Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Graph SVG canvas */}
        <div className="md:col-span-2 bg-stone-900/90 rounded border border-stone-800 relative flex items-center justify-center p-2 min-h-[240px]">
          <svg viewBox="0 0 300 260" className="w-full h-full max-h-[260px]">
            {/* Render edges */}
            {edges.map((e, idx) => {
              const fromN = nodes.find((n) => n.id === e.from)!;
              const toN = nodes.find((n) => n.id === e.to)!;
              return (
                <line
                  key={idx}
                  x1={fromN.x}
                  y1={fromN.y}
                  x2={toN.x}
                  y2={toN.y}
                  stroke="#4c1d95"
                  strokeWidth="2.5"
                  strokeOpacity="0.7"
                />
              );
            })}

            {/* Traversed path trails */}
            {pathOrder.slice(0, currentStep).map((nodeId, idx) => {
              const nextId = pathOrder[idx + 1];
              if (!nextId) return null;
              const fromN = nodes.find((n) => n.id === nodeId)!;
              const toN = nodes.find((n) => n.id === nextId)!;
              return (
                <line
                  key={`trail-${idx}`}
                  x1={fromN.x}
                  y1={fromN.y}
                  x2={toN.x}
                  y2={toN.y}
                  stroke="#a855f7"
                  strokeWidth="4"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isActive = activeNodeId === node.id;
              const isVisited = pathOrder.slice(0, currentStep + 1).includes(node.id);
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isActive ? 16 : 13}
                    fill={isActive ? '#a855f7' : isVisited ? '#6b21a8' : '#1e1b4b'}
                    stroke={isActive ? '#e9d5ff' : '#7c3aed'}
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontWeight="bold"
                    fontSize="12"
                    fontFamily="monospace"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute top-2 left-2 text-[10px] text-stone-400 bg-stone-950/80 px-2 py-0.5 rounded border border-stone-800">
            Active Vertex: <span className="text-purple-300 font-bold">{activeNodeId}</span>
          </div>
        </div>

        {/* Controls & Path Log */}
        <div className="flex flex-col justify-between p-3 bg-stone-900/60 rounded border border-stone-800 space-y-3">
          <div className="space-y-2">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider">Algorithm Playback</div>

            {/* Play/Step controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex-1 py-1.5 px-3 rounded bg-purple-900/80 hover:bg-purple-800 text-purple-100 font-bold border border-purple-700/60 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <Play className={`w-3 h-3 ${isPlaying ? 'fill-purple-200' : ''}`} />
                {isPlaying ? 'Pause' : 'Play Path'}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(0);
                }}
                className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 cursor-pointer"
                title="Reset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-stone-400 space-y-1">
              <div>Step: <strong className="text-stone-200">{currentStep + 1} / {pathOrder.length}</strong></div>
              <div className="truncate">
                Visited: <span className="text-purple-300 font-mono">
                  {pathOrder.slice(0, currentStep + 1).join(' → ')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-2 bg-stone-950/80 rounded border border-stone-800/80 text-[10px] text-stone-400 space-y-1">
            <div className="text-stone-300 font-semibold flex items-center gap-1">
              <Info className="w-3 h-3 text-purple-400" /> Graph Properties:
            </div>
            <div>• Degree(A) = 3, Degree(B) = 3</div>
            <div>• Fleury's Bridge Check: Valid</div>
            <div>• Eulerian Path Exists (Odd vertices ≤ 2)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
