import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const FlowerNonIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <img
    src="https://cheery-mooncake-49edfd.netlify.app/str-non.png"
    width={size}
    height={size}
    className={className}
    alt=""
  />
);

export default FlowerNonIcon;