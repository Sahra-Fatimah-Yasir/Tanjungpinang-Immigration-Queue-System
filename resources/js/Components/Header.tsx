import { cn } from "../lib/utils.ts";
import { Bell, CircleUserRound } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showUser?: boolean;
  className?: string;
}

export default function Header({
  title,
  subtitle,
  showUser = false,
  className,
}: HeaderProps) {
  const currentTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className={cn(
        "border-b border-slate-200 bg-[#f2f2f3] px-7 py-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-xl bg-[#08285e] shadow-md">
            <img
              src="/images/logo-imigrasi.png"
              alt="Logo Imigrasi"
              className="h-12 w-12 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <h1 className="text-[20px] font-extrabold uppercase tracking-tight text-[#1a2c7d] md:text-[22px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-[13px] font-medium uppercase tracking-[0.22em] text-[#8c6a1b]">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[22px] font-extrabold tracking-tight text-[#10275e]">
              {currentTime}
            </div>
            <div className="text-[12px] font-medium uppercase tracking-[0.18em] text-slate-500">
              {currentDate}
            </div>
          </div>

          <div className="hidden h-12 w-px bg-slate-300 md:block" />

          {showUser ? (
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
          )}
        </div>
      </div>
    </header>
  );
}