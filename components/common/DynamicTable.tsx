import React, { useMemo, useState } from "react";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  center?: boolean;
  sortable?: boolean;
  render?: (row: T, idx: number) => React.ReactNode;
  isFilterable?:boolean
};

type Props<T> = {
  columns: Column<T>[];
  items: T[];
  maxRowsBeforeScroll?: number;
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
} | null;

export default function SimpleTable<T extends Record<string, unknown>>({
  columns,
  items,
  maxRowsBeforeScroll = 7,
}: Props<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Handle sorting
  const sortedItems = useMemo(() => {
    if (!sortConfig) {
      return items ? [...items] : [];
    }

    const sorted = [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [items, sortConfig]);

  const display = sortedItems;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    
    if (sortConfig && sortConfig.key === key) {
      // If already sorting by this column, toggle direction
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }

    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return (
        <div className="flex flex-col opacity-50 cursor-pointer text-[8px] ml-2">
          <span>▲</span>
          <span className="mt-[-5px]">▼</span>
        </div>
      );
    }
    return sortConfig.direction === "asc" ? (
      <span className="ml-2 text-xs hover:text-white cursor-pointer">▲</span>
    ) : (
      <span className="ml-2 text-xs hover:text-white cursor-pointer">▼</span>
    );
  };

  const ROW_HEIGHT = 50;
  const HEADER_HEIGHT = 50;
  const maxHeightPx = maxRowsBeforeScroll * ROW_HEIGHT + HEADER_HEIGHT;

  return (
    <div className="overflow-x-auto border border-b-gray-300 mb-1 mt-3 mx-4" style={{ scrollbarWidth: "none" }}>
      <div
        className="w-full border border-gray-300 rounded"
        style={{ 
          maxHeight: display.length > maxRowsBeforeScroll ? `${maxHeightPx}em` : "auto", 
          overflowY: "auto", 
          scrollbarWidth: "none" 
        }}
      >
        <table className="min-w-full">
          <thead className="bg-[#656462]  text-white sticky top-0 z-10">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-4 py-2 border-r-2 border-white text-sm font-medium last:border-r-0 whitespace-nowrap ${
                    c.center ? "text-center" : "text-left"
                  }`}
                  onClick={() => c.sortable && handleSort(String(c.key))}
                >
                  <div className="flex items-center justify-center">
                    {c.label}
                    {c.sortable && getSortIcon(String(c.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-gray-500" colSpan={columns.length}>
                  No records
                </td>
              </tr>
            )}
            {display.map((row, idx) => (
              <tr
                key={('id' in row ? row.id : idx) as React.Key}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                } hover:bg-gray-100 transition-colors`}
              >
                {columns.map((c) => (
                  <td
                    key={String(c.key)}
                    className={`py-1 px-4 border text-sm border-r-2 whitespace-nowrap border-gray-200 last:border-r-0 ${
                      c.center ? "text-center" : "text-left"
                    }`}
                  >
                    {c.render ? c.render(row, idx) : (row[c.key as keyof T] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}