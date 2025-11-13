"use client";

import React, { useEffect, useRef, useState } from "react";

export interface DropDownItem {
  key: string | number;
  label: string;
  icon?: React.ReactNode;
  Bgcolor?: string;
}

interface DropDownProps {
  value: string | number | (string | number)[];
  data: DropDownItem[];
  onChange: (value: string | number) => void;
  placeholder?: string;
}

export default function DropDown({ value, data = [], onChange, placeholder }: DropDownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  console.log("data=", data);
  console.log("value=", value);

  useEffect(() => {
    function onDocument(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocument);
    return () => document.removeEventListener("mousedown", onDocument);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isMulti = Array.isArray(value);
  const selected = isMulti
    ? data.filter((c: DropDownItem) => (value as (string | number)[]).includes(c.key))
    : data.find((c: DropDownItem) => c.key === value);

  const renderSelectedContent = () => {
    if (isMulti && Array.isArray(selected) && selected.length > 0) {
      // ✅ Case 1: If "All" is selected
      if (selected.some((item: DropDownItem) => item.key === "All")) {
        return (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            All Users Selected
          </span>
        );
      }
      
      // ✅ Case 2: Show first 4 users + "+N more"
      return (
        <>
          {selected.slice(0, 3).map((item: DropDownItem) => (
            <span
              key={item.key}
              className={`text-sm px-2 py-0.5 rounded ${item.Bgcolor ?? "bg-gray-100"}`}
            >
              {item.label}
            </span>
          ))}
          {selected.length > 3 && (
            <span className="text-sm px-2 py-0.5 rounded bg-gray-200 text-gray-700">
              +{selected.length - 3} more
            </span>
          )}
        </>
      );
    } 
    
    if (!isMulti && selected && !Array.isArray(selected)) {
      // ✅ Single selection with icon
      return (
        <div>
          <span>{selected.icon}</span>
          <span className="text-sm ml-2">{selected.label}</span>
        </div>
      );
    }
    
    // ✅ No selection - show placeholder
    return <span className="text-sm text-gray-400">{placeholder}</span>;
  };

  return (
    <div ref={ref} className="flex relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full text-left border rounded px-3 h-8 flex items-center justify-between bg-white z-20"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex gap-1 items-center">
          {renderSelectedContent()}
        </div>

        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 011.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div>
          <ul
            role="listbox"
            tabIndex={-1}
            className="absolute flex flex-col h-[165px] overflow-auto bg-white left-0 px-2 mt-9 pt-2 pb-2 w-[170px] border rounded shadow-lg"
            style={{ scrollbarWidth: "none" }}
          >
            {data.map((type: DropDownItem) => {
              const isSelected = isMulti 
                ? (value as (string | number)[]).includes(type.key)
                : type.key === value;
                
              return (
                <li
                  key={String(type.key)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(type.key);
                    setOpen(false);
                  }}
                  className={
                    `cursor-pointer border mb-1 text-gray-800 rounded px-1 py-1 flex items-center text-sm hover:bg-blue-50 ${type.Bgcolor ?? ""}` +
                    (isSelected ? "" : "")
                  }
                >
                  {type.icon ? (
                    <div className={`w-7 mr-1 h-6 flex items-center justify-center rounded ${type.Bgcolor ?? ""}`}>
                      {type.icon}
                    </div>
                  ) : (
                    <div className="px-2" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm">{type.label}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}