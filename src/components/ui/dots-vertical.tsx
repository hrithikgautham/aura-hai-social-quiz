
import { cn } from "@/lib/utils";

interface DotsVerticalProps {
  className?: string;
}

export const DotsVertical = ({ className }: DotsVerticalProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
      <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
      <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
      <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
      <div className="w-1 h-1 rounded-full bg-current mb-0.5"></div>
      <div className="w-1 h-1 rounded-full bg-current"></div>
    </div>
  );
};
