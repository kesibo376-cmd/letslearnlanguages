
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const FlowerOuiIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    stroke="currentColor"
    strokeWidth="1"
    aria-hidden="true"
  >
    <path d="M12 22v-3" />
    <path fillRule="evenodd" d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
);

export default FlowerOuiIcon;
