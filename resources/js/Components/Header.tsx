import { cn } from "../lib/utils.ts";
import { Bell, CircleUserRound } from "lucide-react";
import { formatDateWib, formatTimeWib } from "../lib/dateTime.ts";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showUser?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export default function Header({
  title,
  subtitle,
  showUser = false,
  showActions = true,
  compact = false,
  className,
}: HeaderProps) {
  const currentTime = formatTimeWib(new Date(), {
    second: "2-digit",
  });

  const currentDate = formatDateWib(new Date(), {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className={cn(
        compact
          ? "border-b border-slate-200 bg-[#f2f2f3] px-4 py-3"
          : "border-b border-slate-200 bg-[#f2f2f3] px-7 py-5",
        className
      )}
    >
      <div className={cn("flex items-center justify-between", compact ? "gap-4" : "gap-6")}>
        <div className={cn("flex min-w-0 items-center", compact ? "gap-3" : "gap-4")}>
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#08285e] shadow-md",
              compact ? "h-14 w-14" : "h-[72px] w-[72px]"
            )}
          >
            <img
              src="/images/logo.png"
              alt="Logo Imigrasi"
              className={cn("object-contain", compact ? "h-9 w-9" : "h-12 w-12")}
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="min-w-0">
            <h1
              className={cn(
                "truncate font-extrabold uppercase tracking-tight text-[#1a2c7d]",
                compact ? "text-[18px] md:text-[20px]" : "text-[20px] md:text-[22px]"
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={cn(
                  "mt-1 truncate font-medium uppercase text-[#8c6a1b]",
                  compact ? "text-[11px] tracking-[0.18em]" : "text-[13px] tracking-[0.22em]"
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className={cn("flex shrink-0 items-center", compact ? "gap-4" : "gap-6")}>
          <div className="text-right">
            <div
              className={cn(
                "font-extrabold tracking-tight text-[#10275e]",
                compact ? "text-[20px]" : "text-[22px]"
              )}
            >
              {currentTime}
            </div>
            <div
              className={cn(
                "font-medium uppercase tracking-[0.18em] text-slate-500",
                compact ? "text-[10px]" : "text-[12px]"
              )}
            >
              {currentDate}
            </div>
          </div>

          {showActions && <div className="hidden h-12 w-px bg-slate-300 md:block" />}

          {showActions && (showUser ? (
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-slate-300 p-2 text-[#1a2c7d]">
                <Bell className="h-5 w-5" />
              </button>
              <button className="rounded-lg border border-dashed border-blue-400 p-2 text-[#1a2c7d]">
                <CircleUserRound className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button className="rounded-lg border border-dashed border-blue-400 p-2 text-[#1a2c7d]">
                <CircleUserRound className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-2 text-[#1a2c7d]">
                <Bell className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
