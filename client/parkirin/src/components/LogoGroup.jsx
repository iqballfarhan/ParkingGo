import React from 'react';

// Logo asset paths (public/assets/)
const logos = [
  '/assets/logo_ParkGo.png',
  '/assets/logo_ParkGo_1.png',
  '/assets/logo_ParkGo_2.png',
];

/**
 * LogoGroup - displays all ParkGo logos in a visually balanced, responsive row.
 * - Maintains aspect ratio and clear space
 * - Consistent spacing
 * - Responsive scaling
 */
const LogoGroup = ({ className = '' }) => (
  <div
    className={`flex flex-row items-center justify-center gap-8 py-4 flex-wrap ${className}`}
    aria-label="ParkGo Logos"
  >
    {logos.map((src, idx) => (
      <div
        key={src}
        className="bg-white rounded-lg shadow-md p-4 flex items-center justify-center min-w-[80px] min-h-[60px]"
        style={{ minWidth: 80, minHeight: 60 }}
      >
        <img
          src={src}
          alt={`ParkGo Logo ${idx + 1}`}
          className="h-16 w-auto max-w-[160px] object-contain"
          style={{ aspectRatio: 'auto 3/1' }}
        />
      </div>
    ))}
  </div>
);

export default LogoGroup;
