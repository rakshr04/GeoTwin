import React from 'react';

type GeotwinLogoProps = {
  className?: string;
  size?: number;
  iconOnly?: boolean;
  animate?: boolean;
};

export const GeotwinLogo: React.FC<GeotwinLogoProps> = ({
  className = "",
  size = 64,
  iconOnly = false,
  animate = true,
}) => {
  const activeClass = animate ? "logo-active" : "";

  return (
    <div className={`flex flex-col items-center justify-center select-none ${activeClass} ${className}`}>
      {/* Premium restoration logo icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-svg"
      >
        <defs>
          {/* Elegant atmospheric emerald glow */}
          <filter id="emerald-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Controlled node glow */}
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Leaf fill gradient */}
          <linearGradient id="leaf-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1E3F20" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#489F32" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#D0EEC9" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Ambient background aura (breathing glow) */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          className="logo-ambient-aura"
        />

        {/* Outer Circular Shield (matching user upload logo) */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="rgba(127, 161, 100, 0.95)"
          strokeWidth="1.6"
          filter="url(#emerald-glow)"
          className="logo-circle-frame"
        />

        {/* Connecting Lines */}
        <g strokeWidth="0.8" strokeLinecap="round" opacity="0.8" stroke="#3E4F38">
          {/* Top Network Connections */}
          <line x1="50" y1="12" x2="50" y2="24" className="logo-line line-inner-top line-it-1" />
          <line x1="33.5" y1="21.5" x2="30" y2="36" className="logo-line line-inner-top line-it-2" />
          <line x1="33.5" y1="21.5" x2="50" y2="24" className="logo-line line-inner-top line-it-3" />
          <line x1="66.5" y1="21.5" x2="70" y2="36" className="logo-line line-inner-top line-it-4" />
          <line x1="66.5" y1="21.5" x2="50" y2="24" className="logo-line line-inner-top line-it-5" />
          <line x1="30" y1="36" x2="50" y2="24" className="logo-line line-inner-top line-it-6" />
          <line x1="70" y1="36" x2="50" y2="24" className="logo-line line-inner-top line-it-7" />
          <line x1="30" y1="36" x2="70" y2="36" className="logo-line line-inner-top line-it-8" />

          {/* Left Network Connections */}
          <line x1="17" y1="31" x2="30" y2="36" className="logo-line line-inner-mid line-im-1" />
          <line x1="17" y1="31" x2="26" y2="52" className="logo-line line-inner-mid line-im-2" />
          <line x1="30" y1="36" x2="26" y2="52" className="logo-line line-inner-mid line-im-3" />
          <line x1="17" y1="50" x2="26" y2="52" className="logo-line line-inner-mid line-im-4" />
          <line x1="17" y1="69" x2="26" y2="52" className="logo-line line-inner-mid line-im-5" />
          <line x1="17" y1="69" x2="32" y2="68" className="logo-line line-inner-mid line-im-6" />
          <line x1="32" y1="68" x2="26" y2="52" className="logo-line line-inner-mid line-im-7" />

          {/* Right Network Connections */}
          <line x1="83" y1="31" x2="70" y2="36" className="logo-line line-inner-mid line-im-8" />
          <line x1="83" y1="31" x2="74" y2="52" className="logo-line line-inner-mid line-im-9" />
          <line x1="70" y1="36" x2="74" y2="52" className="logo-line line-inner-mid line-im-10" />
          <line x1="83" y1="50" x2="74" y2="52" className="logo-line line-inner-mid line-im-11" />
          <line x1="83" y1="69" x2="74" y2="52" className="logo-line line-inner-mid line-im-12" />
          <line x1="83" y1="69" x2="68" y2="68" className="logo-line line-inner-mid line-im-13" />
          <line x1="68" y1="68" x2="74" y2="52" className="logo-line line-inner-mid line-im-14" />

          {/* Bottom Network Connections */}
          <line x1="50" y1="88" x2="50" y2="76" className="logo-line line-inner-bottom line-ib-1" />
          <line x1="33.5" y1="78.5" x2="50" y2="76" className="logo-line line-inner-bottom line-ib-2" />
          <line x1="33.5" y1="78.5" x2="32" y2="68" className="logo-line line-inner-bottom line-ib-3" />
          <line x1="66.5" y1="78.5" x2="50" y2="76" className="logo-line line-inner-bottom line-ib-4" />
          <line x1="66.5" y1="78.5" x2="68" y2="68" className="logo-line line-inner-bottom line-ib-5" />
          <line x1="32" y1="68" x2="50" y2="76" className="logo-line line-inner-bottom line-ib-6" />
          <line x1="68" y1="68" x2="50" y2="76" className="logo-line line-inner-bottom line-ib-7" />
          <line x1="32" y1="68" x2="68" y2="68" className="logo-line line-inner-bottom line-ib-8" />
        </g>

        {/* Central Leaf with Gradient Fill & Emerald Outline */}
        <g className="logo-leaf-group">
          <path
            d="M50,72 C35,58 35,42 50,26 C65,42 65,58 50,72 Z"
            fill="url(#leaf-grad)"
            stroke="#489F32"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#emerald-glow)"
            className="logo-leaf-contour"
          />
          {/* Inner stem and central vein */}
          <path
            d="M50,72 L50,34"
            stroke="#D0EEC9"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="logo-leaf-vein"
          />
          {/* Symmetrical diagonal branch veins (3 pairs pointing upwards matching the second picture) */}
          <path
            d="M50,58 L57,51"
            stroke="#D0EEC9"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="logo-leaf-vein-branch"
          />
          <path
            d="M50,58 L43,51"
            stroke="#D0EEC9"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="logo-leaf-vein-branch"
          />
          <path
            d="M50,48 L57,41"
            stroke="#D0EEC9"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="logo-leaf-vein-branch"
          />
          <path
            d="M50,48 L43,41"
            stroke="#D0EEC9"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="logo-leaf-vein-branch"
          />
          <path
            d="M50,38 L55,32"
            stroke="#D0EEC9"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="logo-leaf-vein-branch"
          />
          <path
            d="M50,38 L45,32"
            stroke="#D0EEC9"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="logo-leaf-vein-branch"
          />
        </g>

        {/* Network Nodes */}
        <g className="logo-nodes-group">
          {/* Outer primary vertices */}
          <circle cx="50" cy="12" r="2.8" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-1" />
          <circle cx="83" cy="31" r="2.8" fill="#489F32" filter="url(#node-glow)" className="logo-node node-2" />
          <circle cx="83" cy="69" r="2.8" fill="#489F32" filter="url(#node-glow)" className="logo-node node-3" />
          <circle cx="50" cy="88" r="2.8" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-4" />
          <circle cx="17" cy="69" r="2.8" fill="#489F32" filter="url(#node-glow)" className="logo-node node-5" />
          <circle cx="17" cy="31" r="2.8" fill="#489F32" filter="url(#node-glow)" className="logo-node node-6" />

          {/* Outer mid-edge vertices */}
          <circle cx="33.5" cy="21.5" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-7" />
          <circle cx="66.5" cy="21.5" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-8" />
          <circle cx="17" cy="50" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-9" />
          <circle cx="83" cy="50" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-10" />
          <circle cx="33.5" cy="78.5" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-11" />
          <circle cx="66.5" cy="78.5" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-12" />

          {/* Inner mesh vertices */}
          <circle cx="30" cy="36" r="2.2" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-13" />
          <circle cx="70" cy="36" r="2.2" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-14" />
          <circle cx="26" cy="52" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-15" />
          <circle cx="74" cy="52" r="2.2" fill="#489F32" filter="url(#node-glow)" className="logo-node node-16" />
          <circle cx="32" cy="68" r="2.2" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-17" />
          <circle cx="68" cy="68" r="2.2" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-18" />
          <circle cx="50" cy="24" r="2.2" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-19" />
          <circle cx="50" cy="76" r="2.2" fill="#D0EEC9" filter="url(#node-glow)" className="logo-node node-20" />
        </g>
      </svg>

      {!iconOnly && (
        <span className="font-sans font-extrabold text-[15px] tracking-[0.2em] uppercase text-white mt-4 logo-text">
          GEOTWIN
        </span>
      )}

      <style>{`
        /* Staggered Path & Line Drawing Keyframes */
        .logo-line {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          transition: stroke-dashoffset 0.1s ease-out;
        }

        .logo-active .logo-line {
          animation: drawLogoLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* Delay configurations for lines */
        .logo-active .line-o-1  { animation-delay: 0.05s; }
        .logo-active .line-o-2  { animation-delay: 0.10s; }
        .logo-active .line-o-3  { animation-delay: 0.15s; }
        .logo-active .line-o-4  { animation-delay: 0.20s; }
        .logo-active .line-o-5  { animation-delay: 0.25s; }
        .logo-active .line-o-6  { animation-delay: 0.30s; }
        .logo-active .line-o-7  { animation-delay: 0.35s; }
        .logo-active .line-o-8  { animation-delay: 0.40s; }
        .logo-active .line-o-9  { animation-delay: 0.45s; }
        .logo-active .line-o-10 { animation-delay: 0.50s; }
        .logo-active .line-o-11 { animation-delay: 0.55s; }
        .logo-active .line-o-12 { animation-delay: 0.60s; }

        .logo-active .line-it-1 { animation-delay: 0.5s; }
        .logo-active .line-it-2 { animation-delay: 0.55s; }
        .logo-active .line-it-3 { animation-delay: 0.6s; }
        .logo-active .line-it-4 { animation-delay: 0.65s; }
        .logo-active .line-it-5 { animation-delay: 0.7s; }
        .logo-active .line-it-6 { animation-delay: 0.75s; }
        .logo-active .line-it-7 { animation-delay: 0.8s; }
        .logo-active .line-it-8 { animation-delay: 0.85s; }

        .logo-active .line-im-1  { animation-delay: 0.8s; }
        .logo-active .line-im-2  { animation-delay: 0.85s; }
        .logo-active .line-im-3  { animation-delay: 0.9s; }
        .logo-active .line-im-4  { animation-delay: 0.95s; }
        .logo-active .line-im-5  { animation-delay: 1.0s; }
        .logo-active .line-im-6  { animation-delay: 1.05s; }
        .logo-active .line-im-7  { animation-delay: 1.1s; }
        .logo-active .line-im-8  { animation-delay: 0.8s; }
        .logo-active .line-im-9  { animation-delay: 0.85s; }
        .logo-active .line-im-10 { animation-delay: 0.9s; }
        .logo-active .line-im-11 { animation-delay: 0.95s; }
        .logo-active .line-im-12 { animation-delay: 1.0s; }
        .logo-active .line-im-13 { animation-delay: 1.05s; }
        .logo-active .line-im-14 { animation-delay: 1.1s; }

        .logo-active .line-ib-1 { animation-delay: 1.1s; }
        .logo-active .line-ib-2 { animation-delay: 1.15s; }
        .logo-active .line-ib-3 { animation-delay: 1.2s; }
        .logo-active .line-ib-4 { animation-delay: 1.25s; }
        .logo-active .line-ib-5 { animation-delay: 1.3s; }
        .logo-active .line-ib-6 { animation-delay: 1.35s; }
        .logo-active .line-ib-7 { animation-delay: 1.4s; }
        .logo-active .line-ib-8 { animation-delay: 1.45s; }

        @keyframes drawLogoLine {
          to {
            stroke-dashoffset: 0;
            stroke: #486F42;
          }
        }

        /* Network Nodes Animation */
        .logo-node {
          opacity: 0;
          transform: scale(0);
          transform-origin: center;
        }

        .logo-active .logo-node {
          animation: activateNode 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .logo-active .node-1 { animation-delay: 0.1s; }
        .logo-active .node-4 { animation-delay: 0.1s; }
        .logo-active .node-6 { animation-delay: 0.3s; }
        .logo-active .node-2 { animation-delay: 0.3s; }
        .logo-active .node-5 { animation-delay: 0.5s; }
        .logo-active .node-3 { animation-delay: 0.5s; }
        .logo-active .node-7 { animation-delay: 0.7s; }
        .logo-active .node-8 { animation-delay: 0.7s; }
        .logo-active .node-9 { animation-delay: 0.9s; }
        .logo-active .node-10 { animation-delay: 0.9s; }
        .logo-active .node-11 { animation-delay: 1.1s; }
        .logo-active .node-12 { animation-delay: 1.1s; }
        .logo-active .node-13 { animation-delay: 1.3s; }
        .logo-active .node-14 { animation-delay: 1.3s; }
        .logo-active .node-19 { animation-delay: 1.3s; }
        .logo-active .node-15 { animation-delay: 1.5s; }
        .logo-active .node-16 { animation-delay: 1.5s; }
        .logo-active .node-17 { animation-delay: 1.7s; }
        .logo-active .node-18 { animation-delay: 1.7s; }
        .logo-active .node-20 { animation-delay: 1.7s; }

        @keyframes activateNode {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          70% {
            transform: scale(1.4);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* Leaf Construction Animation */
        .logo-leaf-contour {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          fill-opacity: 0;
        }

        .logo-active .logo-leaf-contour {
          animation: drawLeafContour 2.0s cubic-bezier(0.25, 1, 0.5, 1) 0.8s forwards;
        }

        @keyframes drawLeafContour {
          0% {
            stroke-dashoffset: 200;
            fill-opacity: 0;
          }
          70% {
            stroke-dashoffset: 0;
            fill-opacity: 0;
          }
          100% {
            stroke-dashoffset: 0;
            fill-opacity: 1;
          }
        }

        .logo-leaf-vein {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
        }

        .logo-active .logo-leaf-vein {
          animation: drawLeafVein 1.2s ease-out 1.6s forwards;
        }

        .logo-leaf-vein-branch {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
        }

        .logo-active .logo-leaf-vein-branch {
          animation: drawLeafVein 0.8s ease-out 2.0s forwards;
        }

        @keyframes drawLeafVein {
          to {
            stroke-dashoffset: 0;
          }
        }

        /* Breathing Aura Glow (Completeness & Resting State) */
        .logo-ambient-aura {
          stroke: rgba(72, 159, 50, 0.0);
          stroke-width: 1;
        }

        .logo-active .logo-ambient-aura {
          animation: auraBreathe 4s ease-in-out infinite alternate;
          animation-delay: 2.6s;
        }

        @keyframes auraBreathe {
          0% {
            stroke: rgba(72, 159, 50, 0.12);
            fill: rgba(72, 159, 50, 0.02);
            r: 34;
          }
          100% {
            stroke: rgba(208, 238, 201, 0.22);
            fill: rgba(208, 238, 201, 0.05);
            r: 42;
          }
        }

        /* Logo scale completeness pulse */
        .logo-active.logo-svg {
          animation: logoScalePulse 0.5s ease-out 2.6s forwards;
        }

        @keyframes logoScalePulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 0 12px rgba(72, 159, 50, 0.35));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 8px rgba(72, 159, 50, 0.15));
          }
        }

        /* Muted slow breathing for logo elements */
        .logo-active .logo-leaf-contour {
          animation: leafGlowBreathe 3s ease-in-out infinite alternate;
          animation-delay: 3.1s;
        }

        @keyframes leafGlowBreathe {
          0% {
            filter: drop-shadow(0 0 4px rgba(72, 159, 50, 0.35));
          }
          100% {
            filter: drop-shadow(0 0 10px rgba(208, 238, 201, 0.65));
          }
        }
      `}</style>
    </div>
  );
};

export default GeotwinLogo;
