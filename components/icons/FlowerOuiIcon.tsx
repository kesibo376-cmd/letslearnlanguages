import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const FlowerOuiIcon: React.FC<IconProps> = ({ size = 24, className = '' }) => (
  <img
    src="components/icons/STR-oui.png"
    width={size}
    height={size}
    className={className}
    alt="Blooming flower representing a completed daily goal"
  />
);

export default FlowerOuiIcon;
