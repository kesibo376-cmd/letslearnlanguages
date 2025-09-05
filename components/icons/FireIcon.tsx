import React from 'react';
import type { Theme } from '../../types';

interface IconProps {
  size?: number;
  className?: string;
  isFilled?: boolean;
  theme: Theme;
}

const FireIcon: React.FC<IconProps> = ({ size = 24, className = '', isFilled = false, theme }) => {
  const isPixelated = theme === 'minecraft' || theme === 'retro-web';

  // Original smooth path
  const smoothPath = (
    <>
      <path d="M12 22c-2.5-1-4-4.5-4-8.5 0-4.5 4-8.5 4-8.5s4 4 4 8.5c0 4-1.5 7.5-4 8.5z" />
      <path d="M10.5 6s-1.5 2-1.5 3.5c0 1.5 1.5 3 1.5 3" />
      <path d="M14 12c.5-1 .5-2 0-3" />
    </>
  );

  // New pixelated path
  const pixelPath = (
    <path fillRule="evenodd" d="M12 22H11V20H9V17H7V11H9V6H11V2H13V6H15V11H17V17H15V20H13V22H12Z" />
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isPixelated ? 'currentColor' : (isFilled ? "currentColor" : "none")}
      stroke={isPixelated ? (isFilled ? 'var(--mc-border-dark)' : 'currentColor') : "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`streak-fire-icon ${className} ${isFilled ? 'filled' : ''}`}
      aria-hidden="true"
    >
      {isPixelated ? pixelPath : smoothPath}
    </svg>
  );
};

export default FireIcon;