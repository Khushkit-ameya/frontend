import React from 'react';

interface DeleteIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const DeleteIcon: React.FC<DeleteIconProps> = ({ 
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
        fill="#F96332"
      />
      <path 
        d="M14.2445 7.8242H16.268V9H8.1195V7.8242H10.143L10.7445 7.25H13.643L14.2445 7.8242ZM10.1156 12.418L11.3734 13.6758L10.143 14.9062L10.9633 15.7266L12.1938 14.4961L13.4242 15.7266L14.2445 14.9062L13.0141 13.6758L14.2445 12.418L13.4242 11.5977L12.1938 12.8555L10.9633 11.5977L10.1156 12.418ZM8.6938 16.5742V9.5742H15.6938V16.5742C15.6938 16.8841 15.5753 17.1576 15.3383 17.3945C15.1013 17.6315 14.8279 17.75 14.518 17.75H9.8695C9.5596 17.75 9.2862 17.6315 9.0492 17.3945C8.8122 17.1576 8.6938 16.8841 8.6938 16.5742Z" 
        fill="white"
      />
    </svg>
  );
};

export default DeleteIcon;