import { cn } from "../lib/utils.ts";
import { Bell, User, ShieldCheck } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showUser?: boolean;
  className?: string;
}

export default function Header({ title, subtitle, showUser = false, className }: HeaderProps) {
  const currentTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header
      className={cn(
        "w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
        className
      )}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-blue-900 shadow-lg">
            <ShieldCheck className="h-7 w-7 text-amber-300" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">
              Sistem Antrian Digital
            </p>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 lg:text-2xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm font-medium text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden text-right md:block">
            <div className="text-2xl font-black tracking-tight text-slate-900">
              {currentTime}
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              {currentDate}
            </div>
          </div>

          {showUser && (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <button className="rounded-full border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
                <Bell className="h-5 w-5" />
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">Petugas Loket</p>
                <p className="text-xs text-slate-500">Sesi aktif</p>
              </div>
              <button className="rounded-full bg-slate-100 p-2.5 text-slate-700 transition hover:bg-slate-200">
                <User className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}