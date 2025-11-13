import React from 'react';

interface CheckboxProps {
  checked?: boolean;
  onChange?: () => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked = false, onChange, className = '' }) => (
  <div className={`cursor-pointer ${className}`} onClick={onChange}>
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="18" height="18" rx="5" fill="white"/>
      <rect x="0.5" y="0.5" width="17" height="17" rx="4.5" stroke="#333333" strokeOpacity="0.3"/>
      {checked && (
        <path 
          d="M5 9L8 12L13 7" 
          stroke="#333333" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      )}
    </svg>
  </div>
);

export default Checkbox;
