import { useRef } from "react"
import { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface HolidayFilterProps {
  anchorRef?: React.RefObject<HTMLElement>;
  onClose: () => void;
}

export default function HolidayFilter({ anchorRef, onClose }: HolidayFilterProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  console.log("popRef", popupRef);
  
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('');

  const handleApply = () => {
    console.log('Applied filters:', formatToDate(fromDate), formatToDate(toDate), selectedOption);
    onClose();
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setSelectedOption('');
  };

  // format date into dd-mm-yyyy
  function formatToDate(isoDate: string): string {
    // isoDate expected "yyyy-mm-dd" or falsy
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    if (!y || !m || !d) return "";
    return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
  }

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-start justify-end pt-60 right-6 z-50">
      {/* Filter Modal */}
      <div className="bg-white border border-gray-300 rounded-xl shadow-xl animate-slideDown">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-3">
          <h2 className="text-2xl font-semibold text-gray-800">Filter</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Date Wise Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Date Wise</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-5">
              {/* From Date */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  From Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="add from date"
                  />
                  <Calendar className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={20} />
                </div>
              </div>

              {/* To Date */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  To Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder="add to date"
                  />
                  <Calendar className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={20} />
                </div>
              </div>
            </div>

            {/* Radio Options */}
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="holidayType"
                  value="all"
                  checked={selectedOption === 'all'}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">All Holiday</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="holidayType"
                  value="upcoming"
                  checked={selectedOption === 'upcoming'}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">Upcoming Holiday</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="bg-red-600 cursor-pointer text-white px-5 py-2 rounded-lg active:scale-95 transition font-medium"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="bg-white cursor-pointer text-gray-700 px-5 rounded-lg border border-gray-300 hover:bg-gray-200 active:scale-95 transition font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}