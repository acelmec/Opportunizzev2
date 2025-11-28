import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBadge({
  score,
  label,
  size = "md",
  showLabel = true,
}: ScoreBadgeProps) {
  const getScoreColor = (value: number) => {
    if (value >= 70) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50";
    if (value >= 40) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50";
    return "text-muted-foreground bg-muted";
  };

  const getProgressColor = (value: number) => {
    if (value >= 70) return "bg-emerald-500";
    if (value >= 40) return "bg-amber-500";
    return "bg-muted-foreground/40";
  };

  const sizeClasses = {
    sm: "h-12 w-12 text-xs",
    md: "h-16 w-16 text-sm",
    lg: "h-20 w-20 text-base",
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          sizeClasses[size],
          getScoreColor(score)
        )}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            className="stroke-current opacity-20"
            strokeWidth="2"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            className={cn("transition-all duration-500", getProgressColor(score))}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="font-mono font-semibold">{score}</span>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground text-center max-w-16 truncate">
          {label}
        </span>
      )}
    </div>
  );
}

interface ScoreBarProps {
  score: number;
  label: string;
  className?: string;
}

export function ScoreBar({ score, label, className }: ScoreBarProps) {
  const getProgressColor = (value: number) => {
    if (value >= 70) return "bg-emerald-500";
    if (value >= 40) return "bg-amber-500";
    return "bg-muted-foreground/40";
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            getProgressColor(score)
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
