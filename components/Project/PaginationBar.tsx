// components/Project/PaginationBar.tsx
import React from 'react';
import Image from 'next/image';

interface PaginationBarProps {
  total: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onToggleColumns?: () => void;
  showLessColumns?: boolean;
  viewToggle?: React.ReactNode;
}

const Bar: React.FC<PaginationBarProps> = ({
  total,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onToggleColumns,
  showLessColumns = false,
  viewToggle,
}) => {

  const pageSizes = [10, 20, 30, 50, 100];
  const totalPages = Math.ceil(total / pageSize);

  // Generate page numbers to show (max 4 pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 4;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 1);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Page size and total items */}
      <div className="flex items-center gap-4">
        {/* Page size dropdown */}
        <div className="flex items-center gap-2">
          <span className="font-inter font-[500] text-[14px]">Page Size</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="border border-[#00000040] rounded-[2px] px-2 py-1 text-sm focus:outline-none "
            style={{
              width: '70px',
              height: '30px',
            }}
          >
            {pageSizes.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          
        </div>

        {/* Total items */}
        <div className="font-inter font-[400] text-[14px]">
          Total: {total}
        </div>

        <button
          onClick={onToggleColumns}
          className="text-white rounded-[2px] w-[105px] h-[30px] hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: '#C81C1F',
            width: '105px',
            height: '30px',
          }}
        >
          <Image 
            src="/show-less-fold-button.svg" 
            alt={showLessColumns ? "Show More" : "Show Less"} 
            width={16} 
            height={16} 
            className="inline-block mr-2" 
          />
          <span className='font-inter font-[500] text-[14px]'>
            {showLessColumns ? 'Show More' : 'Show Less'}
          </span>
        </button>
       
      </div>

      {/* Right side - View toggle and Pagination controls */}
      <div className="flex items-center gap-1">
        {/* View mode toggle (Table/Kanban) */}
        {viewToggle && (
          <div
            className="flex items-center justify-center"
            style={{ width: '105px', height: '30px' }}
          >
            {viewToggle}
          </div>
        )}
        {/* Previous button */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center justify-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{
            backgroundColor: '#4F505114',
            width: '88px',
            height: '28px',
            borderRadius: '3px',
            border: '0.5px solid #00000040',
          }}
        >
          Previous
        </button>

        {/* Page numbers */}
        {getPageNumbers().map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`flex items-center justify-center text-sm font-medium transition-colors ${
              currentPage === page 
                ? 'text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{
              backgroundColor: currentPage === page ? '#C81C1F' : 'transparent',
              width: '34px',
              height: '28px',
              borderRadius: '3px',
              border: '0.5px solid #00000040',
            }}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-red-700"
          style={{
            backgroundColor: '#C81C1F',
            width: '56px',
            height: '28px',
            borderRadius: '3px',
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Bar;