
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const FlowerNonIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22v-7" />
    <path d="M12 15c-2.76 0-5-3.58-5-8 0-2.21 1-4.21 2.5-5.5C10.5 1.2 11.23 1 12 1s1.5.2 2.5.5c1.5 1.29 2.5 3.29 2.5 5.5 0 4.42-2.24 8-5 8z" />
  </svg>
);

export default FlowerNonIcon;
