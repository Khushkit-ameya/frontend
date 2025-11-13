import React from 'react';
import Image from 'next/image';

interface AddFiltersButtonProps {
  onClick?: () => void;
  className?: string;
}

const AddFiltersButton: React.FC<AddFiltersButtonProps> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`${className}`}
      type="button"
      style={{ height: '30px', padding: 0, background: 'transparent', border: 'none' }}
    >
      <Image 
        src="/icons/addFilterButton.svg" 
        alt="Add Filters" 
        width={30} 
        height={30}
        className="h-[30px] w-auto"
      />
    </button>
  );
};

export default AddFiltersButton;