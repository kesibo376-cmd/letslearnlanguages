import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const SparklesIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M9.94 14.53 12 22l2.06-7.47" />
    <path d="M20.34 9.34 16.5 12l3.84 2.66" />
    <path d="m2.06 14.53 7.88-2.53" />
    <path d="M3.66 9.34 7.5 12l-3.84 2.66" />
    <path d="M14.06 2.06 12 10l-2.06-7.94" />
    <path d="M17.5 4.5 14 12" />
  </svg>
);

export default SparklesIcon;
