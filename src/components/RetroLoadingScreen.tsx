import { useState, useEffect } from 'react';
import { PROJECTS } from '../data/projects';

interface RetroLoadingScreenProps {
  onComplete: () => void;
}

const CRITICAL_IMAGES = [
  '/img/tv-static.gif',
  '/img/handheld-body.webp',
  ...PROJECTS.map((p) => p.labelSvg),
];

export const RetroLoadingScreen: React.FC<RetroLoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING BOOT ROM...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    const totalAssets = CRITICAL_IMAGES.length + 1; // +1 for fonts check
    let isCancelled = false;

    const updateItem = (text: string) => {
      if (isCancelled) return;
      loadedCount++;
      const pct = Math.min(100, Math.round((loadedCount / totalAssets) * 100));
      setProgress(pct);
      setStatusText(text);
    };

    // 1. Check Document Fonts
    if (document.fonts) {
      document.fonts.ready
        .then(() => {
          updateItem('FONTS LOADED & VERIFIED');
        })
        .catch(() => {
          updateItem('FONTS OK');
        });
    } else {
      updateItem('FONTS OK');
    }

    // 2. Preload Critical Images
    CRITICAL_IMAGES.forEach((src) => {
      const img = new Image();
      img.onload = () => updateItem(`CACHED ${src.split('/').pop()}`);
      img.onerror = () => updateItem(`SKIPPED ${src.split('/').pop()}`);
      img.src = src;
    });

    // Timeout safety guarantee: finish loading in max 1800ms so user never waits
    const maxTimer = window.setTimeout(() => {
      if (!isCancelled) {
        setProgress(100);
        setStatusText('BOOT SEQUENCE READY');
      }
    }, 1500);

    return () => {
      isCancelled = true;
      window.clearTimeout(maxTimer);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100 && !isFadingOut) {
      const fadeTimer = window.setTimeout(() => {
        setIsFadingOut(true);
      }, 250);

      const doneTimer = window.setTimeout(() => {
        onComplete();
      }, 550);

      return () => {
        window.clearTimeout(fadeTimer);
        window.clearTimeout(doneTimer);
      };
    }
  }, [progress, isFadingOut, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070b08] text-[#a6e26e] select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ fontFamily: "'VT323', monospace" }}
    >
      {/* CRT Scanline and Vignette Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 2px, transparent 2px, transparent 4px)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.95), inset 0 0 40px rgba(166,226,110,0.08)',
        }}
      />

      {/* Main Terminal Boot Box */}
      <div className="relative z-10 w-[90%] max-w-md p-6 border-2 border-[#345c26] bg-[#0c160e]/95 rounded-lg shadow-[0_0_35px_rgba(166,226,110,0.25)] flex flex-col gap-4">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-[#28481e] pb-2 text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a6e26e] animate-ping" />
            <span className="font-bold tracking-wider text-emerald-400">
              DEPLOYEDREJECT // BIOS
            </span>
          </div>
          <span className="text-xs text-[#5f9c3f]">REV 2.4.0</span>
        </div>

        {/* Status Text & Memory Check */}
        <div className="space-y-1 text-sm sm:text-base text-[#9bd968]">
          <div className="flex justify-between text-xs opacity-75">
            <span>MEM: 640K OK</span>
            <span>VRAM: 128KB OK</span>
          </div>
          <div className="truncate text-emerald-300 font-mono text-xs sm:text-sm">
            &gt; {statusText}
          </div>
        </div>

        {/* Segmented Progress Bar */}
        <div className="space-y-1">
          <div className="w-full h-4 bg-[#050a06] border border-[#2b4c20] p-0.5 rounded overflow-hidden flex items-stretch">
            <div
              className="h-full bg-gradient-to-r from-[#447831] to-[#a6e26e] transition-all duration-150 rounded-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#6fa84b] font-mono">
            <span>PREPARING ENVIRONMENT</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-[11px] text-[#4d7d35] text-center border-t border-[#1e3416] pt-2 font-mono">
          CALIBRATING SHADERS &amp; SYSTEM BUS...
        </div>
      </div>
    </div>
  );
};
