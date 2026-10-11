import type { Project } from '../data/projects';

interface CartridgeProps {
  project: Project;
  onClick?: () => void;
  className?: string;
  showShadow?: boolean;
  showTooltip?: boolean;
}

const PLATE_LABELS: Record<string, string> = {
  murces: 'MURCES',
  sentric: 'SENTRIC',
  cireu: 'CIREU',
  'cf-p-link': 'CF-P-LINK',
  aggregator: 'AGGREGATOR',
};

export const Cartridge: React.FC<CartridgeProps> = ({
  project,
  onClick,
  className = 'w-full h-full',
  showShadow = true,
}) => {
  const plateLabel = PLATE_LABELS[project.id] || project.name.toUpperCase().slice(0, 10);

  return (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer select-none transition-transform duration-300 ease-out hover:-translate-y-3 ${className}`}
    >
      {/* Physical contact shadow on the shelf surface */}
      {showShadow && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[84%] h-3.5 bg-black/80 rounded-full blur-[4px] transition-all duration-300 group-hover:w-[70%] group-hover:bg-black/50 group-hover:blur-[7px] group-hover:translate-y-2 pointer-events-none" />
      )}

      {/* Cartridge Outer Shell (SVG) */}
      <svg
        viewBox="0 0 800 900"
        className="w-full h-full overflow-visible drop-shadow-[6px_10px_16px_rgba(0,0,0,0.8)]"
      >
        <defs>
          <linearGradient id={`body-${project.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#DFD7CE" />
            <stop offset="0.5" stopColor="#C4B9AE" />
            <stop offset="1" stopColor="#9E9287" />
          </linearGradient>
          <linearGradient id={`light-${project.id}`} x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0" stopColor="#d6f8b8" stopOpacity="0.32" />
            <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="1" stopColor="#141112" stopOpacity="0.35" />
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
            strokeOpacity="0.45"
            strokeWidth="4"
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

          {/* Moulded title plate */}
          <rect
            x="160"
            y="640"
            width="480"
            height="72"
            rx="12"
            fill="#231f1d"
            stroke="#8f847a"
            strokeWidth="4"
          />
          <text
            x="400"
            y="688"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Press Start 2P', monospace"
            fontSize="24"
            fontWeight="bold"
          >
            {plateLabel}
          </text>

          {/* screws */}
          <circle cx="86" cy="735" r="11" fill="#9A8F85" />
          <circle cx="714" cy="735" r="11" fill="#9A8F85" />
          <circle cx="86" cy="733" r="4" fill="#6F655D" />
          <circle cx="714" cy="733" r="4" fill="#6F655D" />
        </g>

        {/* Directional TV rim-light & shade across cartridge shell */}
        <rect
          x="0"
          y="0"
          width="800"
          height="900"
          fill={`url(#light-${project.id})`}
          clipPath={`url(#clip-${project.id})`}
        />
      </svg>
    </div>
  );
};
