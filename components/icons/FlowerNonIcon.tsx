import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const FlowerNonIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <img
    src="/components/icons/STR-non.png"
    width={size}
    height={size}
    className={className}
    alt=""
  />
);

export default FlowerNonIcon;