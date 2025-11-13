"use client";
import React from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";

type Props = {
  className?: string;
  children: React.ReactNode;
};

const CustomScrollArea: React.FC<Props> = ({ className, children }) => {
  return (
    <ScrollArea.Root className={`custom-scrollbar w-full h-full ${className ?? ""}`} type="hover">
      <ScrollArea.Viewport className="w-full h-full">
        {children}
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none transition-colors duration-150 ease-out">
        <ScrollArea.Thumb className="flex-1 rounded-[4px]" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner />
    </ScrollArea.Root>
  );
};

export default CustomScrollArea;
