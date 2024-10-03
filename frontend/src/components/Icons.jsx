import React from 'react';

/**
 * Clean, lightweight, professional SVG Icons
 * Adheres to DESIGN_SYSTEM.md vector styling
 */

const baseSvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export const SproutIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M7 20h10" />
    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4-.1 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.4 1.7-4.6-2.7.2-4.2.9-4.9 2z" />
  </svg>
);

export const WheatIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="m2 22 10-10" />
    <path d="m16 8-1.5 1.5a2 2 0 0 0 0 2.8l.5.5a2 2 0 0 0 2.8 0L19.2 11" />
    <path d="M9.5 14.5 8 16a2 2 0 0 0 0 2.8l.5.5a2 2 0 0 0 2.8 0l1.4-1.4" />
    <path d="M18.8 4 17 5.8a2 2 0 0 0 0 2.8l.5.5a2 2 0 0 0 2.8 0l1.9-1.9" />
    <path d="M14 10a2 2 0 0 1-2.8 0l-.5-.5a2 2 0 0 1 0-2.8L12.5 5" />
    <path d="M20 2c-.5.5-1.5 1-2 2s-1 1.5-2 2" />
  </svg>
);

export const LeafIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

export const RootIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M12 2v4" />
    <path d="M10 6h4" />
    <path d="M6 10c0 4 2 8 6 12 4-4 6-8 6-12a6 6 0 0 0-12 0Z" />
    <path d="M9 13c1.5 1.5 4.5 1.5 6 0" />
  </svg>
);

export const AppleIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
    <path d="M10 2c1 .5 2 2 2 5" />
  </svg>
);

export const CowIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.7 16 10 16 10l-1-4-3 1-1-3H7L6 7l-3-1-1 4c0 0-2.7.7-4.5 1.1C-.3 11.3-.1 12.1 0 13v3c0 .6.4 1 1 1h2" />
    <path d="M3 17v4c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-4" />
    <path d="M17 17v4c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-4" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
    <circle cx="16" cy="11" r="1" fill="currentColor" />
  </svg>
);

export const EggIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-4.03-11-9-11S3 8.03 3 13c0 4.97 4.03 9 9 9z" />
  </svg>
);

export const MilkIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M8 2h8v4H8z" />
    <path d="M6 6h12v3l-2 2v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9L6 9V6z" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

export const PackageIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

export const BasketIcon = ({ size = 20, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="m5 10 7-7 7 7" />
    <path d="M4 10h16l-2 10H6L4 10Z" />
    <path d="M10 14v4" />
    <path d="M14 14v4" />
  </svg>
);

export const AlertCircleIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const ArrowRightIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const CheckCircleIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export const MicroscopeIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M6 18h8" />
    <path d="M3 22h18" />
    <path d="M14 22a7 7 0 1 0 0-14h-1" />
    <path d="M9 14h2" />
    <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
    <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
  </svg>
);

export const PillIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

export const MapIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

export const ClipboardIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

export const ClockIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const RefreshIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

export const CameraIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export const FlaskIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M10 2v7.31L4.1 19.1A2 2 0 0 0 5.8 22h12.4a2 2 0 0 0 1.7-2.9L14 9.31V2" />
    <path d="M8.5 2h7" />
    <path d="M7 16h10" />
  </svg>
);

export const ZapIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const ShieldIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const TruckIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

export const SearchIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const PrintIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

export const CopyIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const TargetIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export const EyeIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const FileTextIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export const LandmarkIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <line x1="3" y1="22" x2="21" y2="22" />
    <line x1="6" y1="18" x2="6" y2="11" />
    <line x1="10" y1="18" x2="10" y2="11" />
    <line x1="14" y1="18" x2="14" y2="11" />
    <line x1="18" y1="18" x2="18" y2="11" />
    <polygon points="12 2 20 7 4 7" />
  </svg>
);

export const AlertTriangleIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const XIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const StopCircleIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <rect x="9" y="9" width="6" height="6" />
  </svg>
);

export const SatelliteDishIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <path d="M4 10a7.31 7.31 0 0 0 10 10Z" />
    <path d="m9 15 3-3" />
    <path d="M17 13a6 6 0 0 0-6-6" />
    <path d="M21 13A10 10 0 0 0 11 3" />
  </svg>
);

export const LayersIcon = ({ size = 18, color = 'currentColor', className = '', ...props }) => (
  <svg width={size} height={size} {...baseSvgProps} stroke={color} className={className} {...props}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

/**
 * Helper to dynamically render category vector icons
 */
export const CategoryIcon = ({ category = 'other', size = 18, ...props }) => {
  const norm = String(category || 'other').toLowerCase();
  switch (norm) {
    case 'grains':
      return <WheatIcon size={size} {...props} />;
    case 'tubers':
      return <RootIcon size={size} {...props} />;
    case 'fruits':
      return <AppleIcon size={size} {...props} />;
    case 'vegetables':
      return <LeafIcon size={size} {...props} />;
    case 'livestock':
      return <CowIcon size={size} {...props} />;
    case 'poultry':
      return <EggIcon size={size} {...props} />;
    case 'dairy':
      return <MilkIcon size={size} {...props} />;
    case 'all':
      return <BasketIcon size={size} {...props} />;
    case 'other':
    default:
      return <PackageIcon size={size} {...props} />;
  }
};
