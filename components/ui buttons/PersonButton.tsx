// components/ui buttons/PersonButton.tsx
import React from 'react';

interface PersonButtonProps {
  onClick?: () => void;
  className?: string;
  hasActiveFilter?: boolean;
}

const PersonButton: React.FC<PersonButtonProps> = ({ 
  onClick, 
  className = '',
  hasActiveFilter = false 
}) => {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center ${hasActiveFilter ? 'bg-red-50' : ''} ${className}`}
      type="button"
      title="Filter by person"
    >
      <div style={{ width: 83, height: 30 }} className={`bg-white rounded-[3px] border ${hasActiveFilter ? 'border-red-500' : 'border-black/15'} flex items-center`}>
        <img
          src="/icons/common%20icons/person.svg"
          alt="Person"
          width={16}
          height={16}
          style={{ marginLeft: 12 }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <span className="ml-3 text-[13px] text-[#4F5051] font-normal">Person</span>
      </div>
    </button>
  );
};

export default PersonButton;