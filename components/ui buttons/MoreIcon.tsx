import React from 'react';

interface MoreIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const MoreIcon: React.FC<MoreIconProps> = ({ 
  className,
  width = "24",
  height = "24",
  ...props 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(0px 2px 8px rgba(0, 0, 0, 0.15))' }}
      {...props}
    >
      <circle 
        cx="12" 
        cy="12" 
        r="12" 
        fill="#1C75BB"
      />
      <circle cx="8" cy="12" r="1.5" fill="white"/>
      <circle cx="12" cy="12" r="1.5" fill="white"/>
      <circle cx="16" cy="12" r="1.5" fill="white"/>
    </svg>
  );
};

export default MoreIcon;