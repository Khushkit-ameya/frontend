"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableTaskProps {
  id: string;
  title: string;
}

export const SortableTask: React.FC<SortableTaskProps> = ({ id, title }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab bg-white border border-gray-300 shadow-sm hover:shadow-md p-3 rounded-md text-sm font-medium text-gray-800 flex items-center justify-between"
    >
      {title}
      <span className="text-gray-400 text-xs">⋮⋮</span>
    </div>
  );
};
