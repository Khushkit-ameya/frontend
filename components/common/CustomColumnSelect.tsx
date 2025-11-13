"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState, MouseEvent, KeyboardEvent } from "react";

interface ColumnItem {
  key: string | number;
  label: string;
  icon?: string;
  color?: string;
}

interface ColumnSelectProps {
  rows?: unknown;
  value: string | number;
  data?: ColumnItem[];
  onChange: (value: string | number) => void;
  placeholder?: string;
}

export default function ColumnSelect({ 
  rows, 
  value, 
  data = [], 
  onChange, 
  placeholder 
}: ColumnSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function onDocument(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    
    document.addEventListener("mousedown", onDocument as unknown as EventListener);
    return () => document.removeEventListener("mousedown", onDocument as unknown as EventListener);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    
    document.addEventListener("keydown", onKey as unknown as EventListener);
    return () => document.removeEventListener("keydown", onKey as unknown as EventListener);
  }, []);

  const selected = Array.isArray(data) ? data.find((c: ColumnItem) => c.key === value) : undefined;
 
  return (
    <div ref={ref} className="flex relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-[170px] text-left border rounded px-3 h-8 flex items-center justify-between bg-white z-20"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className="flex items-center">
          {selected ? (
            <>
              {selected.icon ? (
                <span className={`p-1 rounded-sm ${selected.color ?? ""} bg-white`}>
                  <Image src={selected.icon} alt={selected.label} width={20} height={20} unoptimized />
                </span>
              ) : (
                <span className="w-5 inline-block" />
              )}
              <span className="text-sm ml-2">{selected.label}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400">{placeholder}</span>
          )}
        </div>

        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 011.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div className="fixed">
          <ul 
            role="listbox" 
            tabIndex={-1} 
            className="absolute flex flex-col bg-white left-0 px-2 mt-8 pt-2 pb-2 w-[170px] border rounded shadow-lg"
          >
            {data.map((col: ColumnItem) => {
              const isSelected = col.key === value;
              return (
                <li
                  key={String(col.key)}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(col.key);
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChange(col.key);
                      setOpen(false);
                      btnRef.current?.focus();
                    }
                  }}
                  className={
                    "cursor-pointer rounded px-1 py-0.5 flex items-center text-sm hover:bg-blue-50 " +
                    (isSelected ? "bg-blue-50" : "")
                  }
                >
                  {col.icon ? (
                    <div className={`w-7 mr-1 h-6 flex items-center justify-center rounded-xl ${col.color ?? ""}`}>
                      <Image src={col.icon} alt={col.label} width={18} height={18} unoptimized />
                    </div>
                  ) : (
                    <div className="px-2" />
                  )}
                  <div className="flex-1">
                    <div className="">{col.label}</div>
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