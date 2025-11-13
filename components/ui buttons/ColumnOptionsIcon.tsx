import React from 'react';

interface ColumnOptionsIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const ColumnOptionsIcon: React.FC<ColumnOptionsIconProps> = ({ 
  className,
  width = "4",
  height = "14",
  ...props 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 4 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="2" cy="12" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="2" cy="7" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="2" cy="2" r="2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
};

export default ColumnOptionsIcon;