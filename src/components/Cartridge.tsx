import type { Project } from '../data/projects';


interface CartridgeProps {
  project: Project;
  onClick?: () => void;
  className?: string;
}

export const Cartridge: React.FC<CartridgeProps> = ({
  project,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer select-none transition-all duration-300 transform hover:-translate-y-4 hover:scale-105 ${className}`}
      style={{ width: '128px', height: '144px' }}
    >
      {/* Levitating shadow underneath */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-black/60 rounded-full blur-sm group-hover:scale-125 group-hover:bg-black/80 transition-all duration-300" />

      {/* Cartridge Outer Shell (SVG) */}
      <svg
        viewBox="0 0 800 900"
        className="w-full h-full overflow-visible drop-shadow-xl"
      >
        <defs>
          <linearGradient id={`body-${project.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D9D0C6" />
            <stop offset="0.55" stopColor="#C4B9AE" />
            <stop offset="1" stopColor="#A89C91" />
          </linearGradient>
          <linearGradient id={`light-${project.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.38" />
            <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#2b2326" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={`recess-${project.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7E746B" />
            <stop offset="1" stopColor="#9D9288" />
          </linearGradient>
          <linearGradient id={`plate-${project.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5A4F55" />
            <stop offset="1" stopColor="#3A3236" />
          </linearGradient>
          <clipPath id={`clip-${project.id}`}>
            <path d="M 90 50 H 710 Q 760 50 760 100 V 740 Q 760 785 715 785 H 85 Q 40 785 40 740 V 100 Q 40 50 90 50 Z" />
          </clipPath>
          <clipPath id={`label-clip-${project.id}`}>
            <rect x="140" y="210" width="520" height="390" rx="14" />
          </clipPath>
        </defs>

        <g>
          {/* connector plate (narrower, inset) */}
          <path
            d="M 150 770 H 650 V 842 Q 650 862 630 862 H 170 Q 150 862 150 842 Z"
            fill={`url(#plate-${project.id})`}
          />
          <g stroke="#8B7F86" strokeWidth="5" strokeLinecap="round" opacity="0.7">
            <line x1="190" y1="800" x2="190" y2="846" />
            <line x1="226" y1="800" x2="226" y2="846" />
            <line x1="262" y1="800" x2="262" y2="846" />
            <line x1="298" y1="800" x2="298" y2="846" />
            <line x1="334" y1="800" x2="334" y2="846" />
            <line x1="370" y1="800" x2="370" y2="846" />
            <line x1="406" y1="800" x2="406" y2="846" />
            <line x1="442" y1="800" x2="442" y2="846" />
            <line x1="478" y1="800" x2="478" y2="846" />
            <line x1="514" y1="800" x2="514" y2="846" />
            <line x1="550" y1="800" x2="550" y2="846" />
            <line x1="586" y1="800" x2="586" y2="846" />
          </g>

          {/* main shell */}
          <path
            d="M 90 50 H 710 Q 760 50 760 100 V 740 Q 760 785 715 785 H 85 Q 40 785 40 740 V 100 Q 40 50 90 50 Z"
            fill={`url(#body-${project.id})`}
          />
          {/* stepped corner notches */}
          <path d="M 40 100 Q 40 50 90 50 H 130 V 96 H 40 Z" fill="#B3A89D" />
          <path d="M 760 100 Q 760 50 710 50 H 670 V 96 H 760 Z" fill="#B3A89D" />
          <path
            d="M 130 50 V 96 H 40"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.35"
            strokeWidth="3"
          />

          {/* grip ridges */}
          <g strokeLinecap="round">
            <line x1="170" y1="84" x2="630" y2="84" stroke="#8F847A" strokeWidth="9" />
            <line x1="170" y1="78" x2="630" y2="78" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" />
            <line x1="170" y1="112" x2="630" y2="112" stroke="#8F847A" strokeWidth="9" />
            <line x1="170" y1="106" x2="630" y2="106" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" />
            <line x1="170" y1="140" x2="630" y2="140" stroke="#8F847A" strokeWidth="9" />
            <line x1="170" y1="134" x2="630" y2="134" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" />
          </g>

          {/* label recess frame */}
          <rect x="120" y="190" width="560" height="420" rx="26" fill={`url(#recess-${project.id})`} />
          <rect
            x="124"
            y="194"
            width="552"
            height="412"
            rx="24"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.25"
            strokeWidth="3"
          />

          {/* Artwork Image */}
          <image
            href={project.labelSvg}
            x="140"
            y="210"
            width="520"
            height="390"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#label-clip-${project.id})`}
          />

          {/* title plate */}
          <rect x="180" y="640" width="440" height="72" rx="16" fill="#1c1917" stroke={project.accentColor} strokeWidth="3" />
          <text
            x="400"
            y="688"
            textAnchor="middle"
            fill="#f5f5f4"
            fontFamily="'Press Start 2P', monospace"
            fontSize="26"
            fontWeight="bold"
          >
            {project.name.toUpperCase().slice(0, 11)}
          </text>

          {/* screws */}
          <circle cx="86" cy="735" r="11" fill="#9A8F85" />
          <circle cx="714" cy="735" r="11" fill="#9A8F85" />
          <circle cx="86" cy="733" r="4" fill="#6F655D" />
          <circle cx="714" cy="733" r="4" fill="#6F655D" />
        </g>

        {/* light and shade */}
        <rect
          x="0"
          y="0"
          width="800"
          height="900"
          fill={`url(#light-${project.id})`}
          clipPath={`url(#clip-${project.id})`}
        />
      </svg>

      {/* Floating tooltip badge */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900 border border-stone-700 text-stone-200 text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none z-30">
        Insert {project.name}
      </div>
    </div>
  );
};
