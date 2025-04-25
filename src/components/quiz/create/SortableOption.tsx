
import { useSortable } from "@dnd-kit/sortable";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableOptionProps {
  id: string;
  option: string;
  index: number;
}

export function SortableOption({ id, option, index }: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center justify-between p-3 mb-2 bg-white border rounded-lg cursor-move",
        isDragging && "opacity-60 border-dashed"
      )}
    >
      <div className="flex items-center">
        <ArrowUpDown className="w-4 h-4 mr-2 text-gray-500" />
        <span>{option}</span>
      </div>
      <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
        #{index + 1}
      </span>
    </div>
  );
}
