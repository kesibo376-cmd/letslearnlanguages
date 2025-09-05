import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const FlowerOuiIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <img
    src="https://cheery-mooncake-49edfd.netlify.app/str-oui.png"
    width={size}
    height={size}
    className={className}
    alt=""
  />
);

export default FlowerOuiIcon;