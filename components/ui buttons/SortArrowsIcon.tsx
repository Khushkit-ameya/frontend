import React from 'react';

interface SortArrowsIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const SortArrowsIcon: React.FC<SortArrowsIconProps> = ({ 
  className,
  width = "12",
  height = "12",
  ...props 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 12 12" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path 
        d="M6 0L11.1962 5.45757H0.803848L6 0Z" 
        fill="white" 
        fillOpacity="0.5"
      />
      <path 
        d="M6 12L11.1962 6.54243H0.803848L6 12Z" 
        fill="white" 
        fillOpacity="0.28"
      />
    </svg>
  );
};

export default SortArrowsIcon;