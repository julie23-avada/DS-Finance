import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, color, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const isOver = value > 100;

  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(value)}%</span>
          {isOver && <span className="text-red-500 font-medium">Over budget!</span>}
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, clamped)}%`,
            backgroundColor: isOver ? "#ef4444" : color || "#6366f1",
          }}
        />
      </div>
    </div>
  );
}
