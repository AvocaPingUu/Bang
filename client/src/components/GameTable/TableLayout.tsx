// Poker-Tisch SVG-Hintergrund: Holzrahmen + grünes Filztuch
export default function TableLayout() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Filz-Textur Gradient */}
        <radialGradient id="feltGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2A5C3A" />
          <stop offset="70%" stopColor="#1E4A2C" />
          <stop offset="100%" stopColor="#122E1B" />
        </radialGradient>

        {/* Holzrahmen Gradient */}
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A0522D" />
          <stop offset="30%" stopColor="#8B4513" />
          <stop offset="60%" stopColor="#6B3410" />
          <stop offset="100%" stopColor="#4A2008" />
        </linearGradient>

        {/* Holzmaserung */}
        <filter id="woodGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blend" />
          <feComponentTransfer in="blend">
            <feFuncA type="linear" slope="0.15" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" operator="over" />
        </filter>

        {/* Filz-Rauschen */}
        <filter id="feltNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.08" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" operator="over" />
        </filter>

        {/* Innenschatten für Tisch */}
        <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="blur" />
          <feOffset dx="0" dy="4" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
          <feFlood floodColor="#000" floodOpacity="0.5" />
          <feComposite in2="shadowDiff" operator="in" result="shadow" />
          <feComposite in="shadow" in2="SourceGraphic" operator="over" />
        </filter>

        <clipPath id="tableClip">
          <ellipse cx="960" cy="520" rx="760" ry="390" />
        </clipPath>
      </defs>

      {/* Hintergrund — dunkles Holz-Paneel */}
      <rect width="1920" height="1080" fill="#1A0A00" />

      {/* Hintergrund-Muster: Wandbretter */}
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x={i * 160}
          y="0"
          width="158"
          height="1080"
          fill={i % 2 === 0 ? '#1E0C02' : '#160800'}
          opacity="0.6"
        />
      ))}

      {/* Wanddekoration: Horizontale Leisten */}
      {[200, 400, 600, 800].map((y) => (
        <rect key={y} x="0" y={y} width="1920" height="3" fill="#3A1A08" opacity="0.4" />
      ))}

      {/* Äußerer Holzrahmen (Tischkante) */}
      <ellipse
        cx="960" cy="520" rx="800" ry="430"
        fill="url(#woodGrad)"
        filter="url(#woodGrain)"
      />

      {/* Holzmaserungslinien */}
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse
          key={i}
          cx="960" cy="520"
          rx={800 - i * 8}
          ry={430 - i * 4}
          fill="none"
          stroke="#5C2A0A"
          strokeWidth="1"
          opacity={0.2 - i * 0.01}
        />
      ))}

      {/* Goldene Zierleiste */}
      <ellipse
        cx="960" cy="520" rx="785" ry="415"
        fill="none"
        stroke="#D4A853"
        strokeWidth="3"
        opacity="0.7"
      />
      <ellipse
        cx="960" cy="520" rx="778" ry="408"
        fill="none"
        stroke="#8B6914"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Filztuch */}
      <ellipse
        cx="960" cy="520" rx="765" ry="395"
        fill="url(#feltGrad)"
        filter="url(#feltNoise)"
      />

      {/* Filz-Innenschatten */}
      <ellipse
        cx="960" cy="520" rx="765" ry="395"
        fill="none"
        stroke="#0A1A0F"
        strokeWidth="40"
        opacity="0.5"
        filter="url(#innerShadow)"
      />

      {/* Filz-Ziernähte */}
      <ellipse
        cx="960" cy="520" rx="720" ry="355"
        fill="none"
        stroke="#1A3A24"
        strokeWidth="2"
        strokeDasharray="12 8"
        opacity="0.5"
      />

      {/* Tischbeine Andeutung */}
      {[560, 760, 1100, 1380].map((x, i) => (
        <rect
          key={i}
          x={x - 20}
          y="895"
          width="40"
          height="185"
          rx="6"
          fill="url(#woodGrad)"
          opacity="0.9"
        />
      ))}
      {/* Querstrebe */}
      <rect x="540" y="960" width="860" height="18" rx="4" fill="url(#woodGrad)" opacity="0.7" />

      {/* Bodenreflexion */}
      <ellipse cx="960" cy="1060" rx="720" ry="20" fill="#000" opacity="0.4" />
    </svg>
  );
}
