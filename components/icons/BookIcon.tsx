import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  completionPercentage: number;
}

const BookIcon: React.FC<IconProps> = ({ size = 64, className = '', completionPercentage }) => {
  // Calculate the visible height of the "completed" part of the page.
  // The page area has a height of 28px in the viewBox.
  const pageFillHeight = 28 * (completionPercentage / 100);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ imageRendering: 'pixelated' }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="lectern-book-clip">
          {/* This clips the progress fill, starting from the bottom of the page and moving up. */}
          <rect x="18" y={22 + (28 - pageFillHeight)} width="64" height={pageFillHeight} />
        </clipPath>
      </defs>

      {/* Base */}
      <path d="M20 90 L 50 75 L 80 90 L 50 105 Z" fill="#8B5E3C" />
      <path d="M20 90 V 78 L 50 63 V 75 Z" fill="#A17549" />
      <path d="M80 90 V 78 L 50 63 V 75 Z" fill="#6B4B2D" />

      {/* Support */}
      <path d="M45 75 V 55 L 55 55 V 75 Z" fill="#A17549" />
      <path d="M45 75 L 45 55 L 50 50 L 50 63 Z" fill="#6B4B2D" />

      {/* Shelf */}
      <path d="M30 58 L 70 38 L 70 53 L 30 73 Z" fill="#A17549" />
      <path d="M30 73 V 58 L 45 55 V 75 Z" fill="#6B4B2D" />
      <rect x="35" y="60" width="5" height="7" fill="#B71C1C" />
      <rect x="42" y="60" width="5" height="7" fill="#388E3C" />
      <rect x="49" y="60" width="5" height="7" fill="#1565C0" />
      
      {/* Red Mat */}
      <path d="M40 85.5 L 60 85.5 L 55 88 L 45 88 Z" fill="#B71C1C" />

      {/* Top */}
      <path d="M10 35 L 90 35 L 70 5 L 0 5 Z" fill="#A17549" />
      <path d="M90 35 V 20 L 70 -5 V 5 Z" fill="#6B4B2D" />
      
      {/* Book */}
      <g transform="translate(0, -5)">
        {/* Pages (base color) */}
        <path d="M18 50 H 82 V 22 H 18 Z" fill="#E0DDBA" />
        {/* Page Fill (progress color, clipped) */}
        <g clipPath="url(#lectern-book-clip)">
            <path d="M18 50 H 82 V 22 H 18 Z" fill="#55ACEE" />
        </g>
        {/* Book Border */}
        <path d="M18 22 H 82 V 50 H 18 Z" fill="none" stroke="#373737" strokeWidth="3" />
        {/* Page Divider */}
        <path d="M50 22 V 50" stroke="#373737" strokeWidth="3" />

        {/* Gold Corners */}
        <path d="M14 18 H 22 V 26 H 14 Z" fill="#FFD700" />
        <path d="M78 18 H 86 V 26 H 78 Z" fill="#FFD700" />
        <path d="M14 50 H 22 V 58 H 14 Z" fill="#FFD700" />
        <path d="M78 50 H 86 V 58 H 78 Z" fill="#FFD700" />
      </g>
    </svg>
  );
};

export default BookIcon;
