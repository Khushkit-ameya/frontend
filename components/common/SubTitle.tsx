"use client";

import { useCallback, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import ProjectFilter from "./ProjectFilter";
import HolidayFilter from "../BizIgnite/Holiday/HolidayFilter";

interface SubtitleItem {
  name: string;
  title?: string; // Make title optional since not all items need it
  icon: React.ReactNode;
  onClick?: () => void; // Also make onClick optional for consistency
}

interface SubtitleProps {
  subtitleObj: SubtitleItem[];
  action: boolean;
  onClose: () => void;
}

const Subtitle = (prop: SubtitleProps) => {
  const anchorRef = useRef<HTMLButtonElement>(null);   
  // Pre-calculate conditions for filters
  const hasProjectFilter = prop.subtitleObj.some(
    (item: SubtitleItem) => typeof item.title === "string" && item.title === "Project Filter"
  );

  
  return (
    <div className="flex text-gray-600 text-[13px]">
      {prop.subtitleObj.map(({ name, title, icon, onClick }, index: number) => {
        const isProjectAddFilters = typeof title === "string" && (title === "Project Filter" || title === "Holiday Filter");

        if (name === "search") {
          return <SearchBar key={index} />;
        }

        if (name === "") {
          return (
            <button
              key={index}
              className="flex border-gray-600 bg-gray-300 text-2xl text-gray-500 rounded items-center px-1 shadow-xl mr-1 cursor-pointer hover:scale-105 active:scale-95"
            >
              <p className="flex items-center">{icon}</p>
              <span>{name}</span>
            </button>
          );
        }

        return (
          <button
            key={index}
            type="button"
            onClick={onClick}
            ref={isProjectAddFilters ? anchorRef : undefined}
            className="flex bg-white rounded items-center px-2 border border-gray-300 shadow-xl mr-1 cursor-pointer hover:scale-105 active:scale-95"
          >
            <p className="mr-1 flex items-center">{icon}</p>
            <span>{name}</span>
          </button>
        );
      })}

      {/* Render filter based on page */}
      {prop.action && hasProjectFilter && (
        hasProjectFilter ? (
          <ProjectFilter anchorRef={anchorRef as React.RefObject<HTMLElement>} onClose={prop.onClose} />
        ) : null
      )}
    </div>
  );
};

export default Subtitle;
