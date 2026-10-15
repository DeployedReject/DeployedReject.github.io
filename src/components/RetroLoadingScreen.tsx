import { useState, useEffect, useRef } from 'react';
import { PROJECTS } from '../data/projects';

interface RetroLoadingScreenProps {
  onComplete: () => void;
}

const CRITICAL_IMAGES = [
  '/img/tv-static.gif',
  '/img/handheld-body.webp',
  ...PROJECTS.map((p) => p.labelSvg),
];

const SPINNER_FRAMES = ['/', '-', '\\', '|'];

const BOOT_LOG_TEMPLATES = [
  '[    0.000000] Linux version 6.8.0-retro (bread@deployedreject) (gcc 13.2.0) #1 SMP PREEMPT',
  '[    0.000001] Command line: BOOT_IMAGE=/vmlinuz root=UUID=79b28490 ro quiet splash console=tty1',
  '[    0.004112] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',
  '[    0.008431] ACPI: Core revision 20230628',
  '[    0.012984] Zone ranges: DMA [mem 0x00001000-0x00ffffff], Normal [mem 0x01000000-0x3fffffff]',
  '[    0.024190] smpboot: CPU0: Intel Core Retro Virtual CPU @ 3.40GHz',
  '[    0.038102] Performance Events: Retro PMU driver initialized',
  '[    0.052011] Freeing SMP code: 128K freed',
  '[    0.076290] devtmpfs: initialized',
  '[    0.098412] NET: Registered PF_INET protocol family',
  '[    0.114290] Loading font symbols: SymbolsNerdFontMono-Regular.ttf ... [  OK  ]',
  '[    0.138401] Loading CRT shaders: scanlines, barrel_distortion, phosphor_decay ... [  OK  ]',
  '[    0.162981] Probing display: 1080p RGB CRT Phosphor display detected',
  '[    0.194820] VFS: Mounted root (ext4 filesystem) readonly on device 8:1',
  '[    0.220192] systemd[1]: Inserted module \'autofs4\'',
  '[    0.245819] systemd[1]: Mounting /sys/kernel/tracing...',
  '[    0.278910] systemd[1]: Mounted /sys/kernel/tracing.',
  '[    0.312901] systemd[1]: Reached target Local File Systems (Pre).',
  '[    0.345820] systemd[1]: Starting systemd-udevd.service...',
  '[    0.389102] systemd-udevd[284]: Starting version 255.4',
  '[    0.420918] input: Retro Cream Computer Console Controller as /dev/input/event0',
  '[    0.456819] input: DMG Handheld 8-Way D-Pad & Action Well as /dev/input/event1',
  '[    0.491029] systemd[1]: Started systemd-udevd.service.',
  '[    0.534820] systemd[1]: Starting cf-p-link supervisor daemon...',
  '[    0.582910] cf-p-link[402]: Initialized GraalVM Native runtime (32MB RSS)',
  '[    0.628190] cf-p-link[402]: Registered Cloudflare edge routes [/webapp, /api, /grafana]',
  '[    0.672910] Preloading cartridge ROM assets:',
  '[    0.710920]   -> /svg/label-murces.svg ... [ LOADED ]',
  '[    0.742819]   -> /svg/label-sentric.svg ... [ LOADED ]',
  '[    0.781029]   -> /svg/label-cireu.svg ... [ LOADED ]',
  '[    0.824910]   -> /svg/label-cfplink.svg ... [ LOADED ]',
  '[    0.865819]   -> /svg/label-aggregator.svg ... [ LOADED ]',
  '[    0.910291] Audio bus: Yamaha YM2612 FM Synthesis Core ready',
  '[    0.952910] Preloading static textures: /img/tv-static.gif ... [ OK ]',
  '[    0.984920] Preloading handheld texture: /img/handheld-body.webp ... [ OK ]',
  '[    1.028490] Verifying GitHub & Codeberg stats cache ... [ OK ]',
  '[    1.074910] Initializing room viewport and interactive 3D table plane...',
  '[    1.120980] systemd[1]: Reached target Multi-User System.',
  '[    1.164820] systemd[1]: Starting DeployedReject Retro GUI Display Manager...',
  '[    1.210980] DeployedReject GUI: Initializing frame buffer 0xDE70C000',
  '[    1.254820] BOOT COMPLETE: Launching console runtime shell...',
];

export const RetroLoadingScreen: React.FC<RetroLoadingScreenProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Spinner animation
  useEffect(() => {
    const spinnerTimer = window.setInterval(() => {
      setSpinnerIdx((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 75);
    return () => window.clearInterval(spinnerTimer);
  }, []);

  // Preload actual assets and cascade the logs across a few seconds
  useEffect(() => {
    let logIdx = 0;
    let isCancelled = false;

    // Trigger image preloading in background
    CRITICAL_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    if (document.fonts) {
      document.fonts.ready.catch(() => {});
    }

    // Cascade log lines one by one across ~3.2s
    const logInterval = window.setInterval(() => {
      if (isCancelled) return;
      if (logIdx < BOOT_LOG_TEMPLATES.length) {
        logIdx += 1;
        const nextLines = BOOT_LOG_TEMPLATES.slice(0, logIdx);
        setLogs(nextLines);
        const pct = Math.min(100, Math.round((logIdx / BOOT_LOG_TEMPLATES.length) * 100));
        setProgress(pct);
      } else {
        setProgress(100);
        window.clearInterval(logInterval);
      }
    }, 75);

    // Guarantee completion within ~3.6s
    const maxTimer = window.setTimeout(() => {
      if (!isCancelled) {
        setLogs(BOOT_LOG_TEMPLATES);
        setProgress(100);
      }
    }, 3600);

    return () => {
      isCancelled = true;
      window.clearInterval(logInterval);
      window.clearTimeout(maxTimer);
    };
  }, []);

  // Auto-scroll logs to bottom as they pour in
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Keep the latest onComplete accessible without restarting the timers
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Fade out once progress hits 100%, then hand control back to the app.
  // Both timers live in one effect so the isFadingOut state update can't
  // clear the completion timeout before it fires.
  useEffect(() => {
    if (progress < 100) return;
    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, 250);

    const doneTimer = window.setTimeout(() => {
      onCompleteRef.current();
    }, 550);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [progress]);

  // Build ANSI block bar: e.g. [██████████████████░░░░░░░░] 68%
  const totalBarWidth = 28;
  const filledBlocks = Math.round((progress / 100) * totalBarWidth);
  const emptyBlocks = totalBarWidth - filledBlocks;
  const ansiBar = `[${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}]`;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col justify-between p-3 sm:p-5 bg-black text-[#a6e26e] select-none font-mono text-xs sm:text-sm transition-opacity duration-200 overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        textShadow: '0 0 4px rgba(166, 226, 110, 0.45)',
      }}
    >
      {/* CRT Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25 z-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Top Banner */}
      <div className="relative z-10 shrink-0 pb-2 border-b border-[#254219] flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="text-emerald-300 font-bold">
            [{SPINNER_FRAMES[spinnerIdx]}]
          </span>
          <span className="font-bold tracking-wider text-white">
            DEPLOYEDREJECT BOOT LOADER v2.4.0 (x86_64-retro)
          </span>
        </div>
        <span className="text-[#6fa84b] hidden sm:inline">
          TTY1 /dev/console
        </span>
      </div>

      {/* Center Wall of Scrolling Boot Logs */}
      <div
        ref={logContainerRef}
        className="relative z-10 flex-1 my-2 overflow-y-auto overflow-x-hidden space-y-0.5 font-mono text-[11px] sm:text-xs leading-tight opacity-95 pr-1 select-text"
      >
        {logs.map((line, idx) => {
          const isOk = line.includes('[  OK  ]') || line.includes('[ OK ]') || line.includes('[ LOADED ]');
          return (
            <div key={idx} className="whitespace-pre-wrap break-all">
              {isOk ? (
                <span>
                  {line.replace(/\[\s*(OK|LOADED)\s*\]/, '')}
                  <span className="text-emerald-300 font-bold">
                    {line.includes('[ LOADED ]') ? '[ LOADED ]' : '[  OK  ]'}
                  </span>
                </span>
              ) : line.includes('BOOT COMPLETE') ? (
                <span className="text-amber-300 font-bold">{line}</span>
              ) : (
                <span className="text-[#8cd462]">{line}</span>
              )}
            </div>
          );
        })}
        <div className="text-emerald-400 font-bold flex items-center gap-1.5 pt-1 animate-pulse">
          <span>&gt; LOADING MODULES</span>
          <span>{SPINNER_FRAMES[spinnerIdx]}</span>
        </div>
      </div>

      {/* Bottom ANSI Loading Bar Footer */}
      <div className="relative z-10 shrink-0 pt-2 border-t border-[#254219] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">LOAD STATUS:</span>
          <span className="text-emerald-400 font-bold tracking-wider">
            {ansiBar}
          </span>
          <span className="text-amber-400 font-bold w-12">
            {String(progress).padStart(3, ' ')}%
          </span>
        </div>

        <div className="text-[10px] sm:text-xs text-[#5f9c3f] flex items-center gap-2">
          <span>INITRAMFS: OK</span>
          <span>&bull;</span>
          <span>DMA: OK</span>
          <span>&bull;</span>
          <span>SYSFS: READY</span>
        </div>
      </div>
    </div>
  );
};
