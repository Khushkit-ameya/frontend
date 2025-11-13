import React from 'react';

interface EditIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const EditIcon: React.FC<EditIconProps> = ({ 
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
        fill="#4FAB52"
      />
      <path 
        d="M17.9492 8.7695L16.8066 9.9121L14.4629 7.5684L15.6055 6.4258C15.7227 6.3086 15.8691 6.25 16.0449 6.25C16.2207 6.25 16.3672 6.3086 16.4844 6.4258L17.9492 7.8906C18.0664 8.0078 18.125 8.1543 18.125 8.3301C18.125 8.5059 18.0664 8.6523 17.9492 8.7695ZM6.875 15.1562L13.7891 8.2422L16.1328 10.5859L9.2188 17.5H6.875V15.1562Z" 
        fill="white"
      />
    </svg>
  );
};

export default EditIcon;