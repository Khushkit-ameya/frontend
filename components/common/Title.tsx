"use client";
import React from "react";

interface TitleItem {
  name: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface TitleProps {
  TitleObj: TitleItem[];
  name: string;
}

export default function Title(props: TitleProps) {
  const { TitleObj, name } = props;
  return (
    <div className="flex justify-between items-center title-root text-[14px]">
      <h1 className="flex text-white items-center font-bold">
        {name}
      </h1>
      <div className="flex text-gray-600">
        {TitleObj.map(({ name, icon, onClick }, index: number) => {
          return (
            <button
              key={index}
              className="flex font-semibold text-[#C81C1F] bg-white rounded items-center px-3 py-1 mr-2 border shadow-xl cursor-pointer active:scale-95"
              onClick={onClick}
            >
              <p className="mr-1">{icon}</p>
              <span>{name}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
}