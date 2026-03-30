interface SnapfixLogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

export default function SnapfixLogo({ size = 40, className = "", showBackground = false }: SnapfixLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Snap-Fix Kenya logo"
    >
      {/* White rounded background (optional, for standalone use) */}
      {showBackground && (
        <rect width="100" height="100" rx="20" fill="white" />
      )}

      {/* ── House outline ── */}
      {/* Roof (triangle) + walls */}
      <path
        d="M50,14 L88,46 L80,46 L80,83 L20,83 L20,46 L12,46 Z"
        fill="white"
        stroke="#22c55e"
        strokeWidth="5.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ── Crossed tools inside house ── */}
      {/* Paint brush — top-left to bottom-right */}
      <g>
        {/* Brush handle */}
        <rect
          x="46.5" y="44" width="7" height="27" rx="3.5"
          fill="#22c55e"
          transform="rotate(-40 50 57)"
        />
        {/* Brush metal ferrule */}
        <rect
          x="46.5" y="44" width="7" height="7" rx="1"
          fill="#16a34a"
          transform="rotate(-40 50 57)"
        />
        {/* Brush tip (tapered point) */}
        <polygon
          points="0,-5 -4,5 4,5"
          fill="#22c55e"
          transform="translate(38,68) rotate(-40)"
        />
      </g>

      {/* Wrench — bottom-left to top-right */}
      <g>
        {/* Wrench handle */}
        <rect
          x="46.5" y="44" width="7" height="27" rx="3.5"
          fill="#22c55e"
          transform="rotate(40 50 57)"
        />
        {/* Wrench head ring */}
        <circle
          cx="63" cy="43"
          r="8.5"
          fill="none"
          stroke="#22c55e"
          strokeWidth="5.5"
        />
        {/* Notch cut in wrench head */}
        <rect x="59" y="38" width="8" height="7" fill="white" />
      </g>

      {/* ── Pink location pin ── top-right, partly overlapping roof ── */}
      {/* Pin body (teardrop) */}
      <circle cx="78" cy="20" r="11" fill="#ec4899" />
      <path d="M72,27 L78,42 L84,27" fill="#ec4899" />
      {/* Pin inner dot */}
      <circle cx="78" cy="20" r="4.5" fill="white" />
    </svg>
  );
}
