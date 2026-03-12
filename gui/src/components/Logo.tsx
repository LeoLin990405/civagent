/**
 * 🍍 菠萝王朝 Brand Logo
 * Imperial pineapple with crown — SVG component
 */
export function PineappleLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Crown */}
      <g>
        <path
          d="M22 18L25 8L32 14L39 8L42 18"
          stroke="url(#crown-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Crown jewels */}
        <circle cx="25" cy="10" r="1.5" fill="#d4a574" />
        <circle cx="32" cy="13" r="1.5" fill="#e5c9a8" />
        <circle cx="39" cy="10" r="1.5" fill="#d4a574" />
      </g>

      {/* Pineapple body */}
      <ellipse
        cx="32"
        cy="38"
        rx="14"
        ry="18"
        fill="url(#body-gradient)"
        stroke="url(#body-stroke)"
        strokeWidth="1.5"
      />

      {/* Cross-hatch pattern on pineapple */}
      <g opacity="0.3" stroke="#0d0d1a" strokeWidth="0.8">
        {/* Diagonal lines */}
        <line x1="22" y1="30" x2="42" y2="46" />
        <line x1="22" y1="36" x2="38" y2="52" />
        <line x1="26" y1="24" x2="42" y2="40" />
        <line x1="42" y1="30" x2="22" y2="46" />
        <line x1="42" y1="36" x2="26" y2="52" />
        <line x1="38" y1="24" x2="22" y2="40" />
      </g>

      {/* Leaves */}
      <g>
        <path d="M32 20C28 12 24 16 26 20" fill="#4a7c59" stroke="#3d6b4a" strokeWidth="0.5" />
        <path d="M32 20C36 12 40 16 38 20" fill="#4a7c59" stroke="#3d6b4a" strokeWidth="0.5" />
        <path d="M32 20C30 10 26 12 28 18" fill="#5a8c69" stroke="#4a7c59" strokeWidth="0.5" />
        <path d="M32 20C34 10 38 12 36 18" fill="#5a8c69" stroke="#4a7c59" strokeWidth="0.5" />
        <path d="M32 20C32 9 30 11 31 18" fill="#6a9c79" stroke="#5a8c69" strokeWidth="0.5" />
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="crown-gradient" x1="22" y1="8" x2="42" y2="18">
          <stop offset="0%" stopColor="#d4a574" />
          <stop offset="100%" stopColor="#e5c9a8" />
        </linearGradient>
        <linearGradient id="body-gradient" x1="18" y1="20" x2="46" y2="56">
          <stop offset="0%" stopColor="#e5c9a8" />
          <stop offset="50%" stopColor="#d4a574" />
          <stop offset="100%" stopColor="#c49464" />
        </linearGradient>
        <linearGradient id="body-stroke" x1="18" y1="20" x2="46" y2="56">
          <stop offset="0%" stopColor="#c49464" />
          <stop offset="100%" stopColor="#b4844f" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <PineappleLogo size={36} />
      <div>
        <div className="text-lg font-bold text-accent-gradient tracking-wide">{import.meta.env.VITE_BRAND_NAME || 'AI 朝廷'}</div>
        <div className="text-[10px] text-[var(--text-tertiary)] tracking-widest uppercase">Pineapple Dynasty</div>
      </div>
    </div>
  )
}
