import { cn } from "../lib/utils.ts";
import { Accessibility, Landmark } from "lucide-react";
import { motion } from "framer-motion";

interface QueueCardProps {
  category: string;
  title: string;
  counters: string;
  ticketNumber: string;
  currentCounterLabel?: string;
  nextTicketNumber?: string | undefined;
  nextCustomerName?: string | undefined;
  status?: "ACTIVE" | "LIVE" | "PROCESSING" | "PRIORITY";
  accent?: string;
  isPriority?: boolean;
  compact?: boolean;
  className?: string;
}

export default function QueueCard({
  category,
  title,
  counters,
  ticketNumber,
  currentCounterLabel,
  nextTicketNumber,
  nextCustomerName,
  status = "ACTIVE",
  accent,
  isPriority = false,
  compact = false,
  className,
}: QueueCardProps) {
  const statusLabel =
    isPriority || status === "PRIORITY"
      ? "Ramah HAM"
      : status === "LIVE"
        ? "Dipanggil"
        : status === "PROCESSING"
          ? "Dilayani"
          : "Menunggu";

  const counterLabel =
    currentCounterLabel ||
    (status === "LIVE" || status === "PROCESSING"
      ? "Loket sedang aktif"
      : "Loket belum aktif");

  const nextCustomerLabel = nextTicketNumber
    ? nextCustomerName || "Nama belum diisi"
    : "Belum ada antrean";
  const hasTicket = ticketNumber.trim() !== "" && ticketNumber !== "-";
  const displayCounterLabel = hasTicket ? counterLabel : "Belum aktif";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-white p-3 shadow-sm",
          isPriority
            ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100"
            : "border-slate-200",
          className
        )}
      >
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-slate-100/70 blur-2xl" />

        <div className="relative z-10 flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {category}
            </p>
            <h2 className="mt-1 truncate text-[19px] font-black leading-tight tracking-tight text-slate-900 2xl:text-[21px]">
              {title}
            </h2>
            <div className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
              <Landmark className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{counters}</span>
            </div>
          </div>

          <div
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
              isPriority || status === "PRIORITY"
                ? "bg-amber-500 text-white"
                : "border border-blue-200 bg-blue-50 text-blue-700"
            )}
          >
            {isPriority || status === "PRIORITY" ? (
              <Accessibility className="h-3.5 w-3.5" />
            ) : (
              <span
                className={cn(
                  "h-2 w-2 rounded-full bg-blue-500",
                  status === "LIVE" ? "animate-pulse" : ""
                )}
              />
            )}
            {isPriority || status === "PRIORITY" ? "Prioritas" : statusLabel}
          </div>
        </div>

        <div className="relative z-10 mt-3 grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(148px,0.84fr)] gap-3 overflow-hidden rounded-2xl bg-[#102052] p-3 text-white shadow-lg">
          <div className="flex min-h-0 min-w-0 flex-col justify-between">
            <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">
              Nomor Dipanggil
            </p>

            <motion.div
              key={ticketNumber}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "my-2 truncate font-black leading-none tracking-tight",
                hasTicket ? "text-[clamp(2.4rem,4.25vw,4.75rem)]" : "text-2xl",
                isPriority ? "text-amber-300" : "text-white"
              )}
            >
              {hasTicket ? ticketNumber : "Belum dipanggil"}
            </motion.div>

            <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  status === "LIVE" ? "animate-pulse bg-blue-300" : "bg-white"
                )}
              />
              {statusLabel}
            </div>
          </div>

          <div className="grid min-h-0 gap-2">
            <div className="min-w-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200">
                Loket
              </p>
              <p className="mt-1 truncate text-sm font-extrabold text-white">
                {displayCounterLabel}
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-white/10 bg-white/10 px-3 py-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200">
                Berikutnya
              </p>
              <p className="mt-1 truncate text-2xl font-black leading-none tracking-tight text-white">
                {nextTicketNumber || "-"}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold text-slate-300">
                {nextCustomerLabel}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative overflow-hidden border bg-white shadow-sm transition",
        compact
          ? "rounded-2xl p-3 2xl:p-4"
          : "rounded-3xl p-6 hover:-translate-y-1 hover:shadow-xl lg:p-8",
        isPriority
          ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100"
          : "border-slate-200",
        className
      )}
    >
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-slate-100/70 blur-2xl" />

      <div className={cn("relative z-10 flex h-full min-h-0 flex-col justify-between", compact ? "gap-3" : "gap-8")}>
        <div className={cn("flex items-start justify-between", compact ? "gap-3" : "gap-4")}>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-semibold uppercase text-slate-500",
                compact ? "text-[10px] tracking-[0.18em]" : "text-xs tracking-[0.24em]"
              )}
            >
              {category}
            </p>
            <h2
              className={cn(
                "mt-1 truncate font-black tracking-tight text-slate-900",
                compact ? "text-lg leading-tight 2xl:text-xl" : "text-2xl lg:text-3xl"
              )}
            >
              {title}
            </h2>
            <div
              className={cn(
                "mt-2 inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 font-semibold text-slate-700",
                compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
              )}
            >
              <Landmark className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              <span className="truncate">{counters}</span>
            </div>
          </div>

          {isPriority || status === "PRIORITY" ? (
            <div
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-500 font-bold uppercase tracking-[0.18em] text-white",
                compact ? "px-2 py-1 text-[10px]" : "px-3 py-2 text-xs"
              )}
            >
              <Accessibility className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
              Prioritas
            </div>
          ) : (
            <div
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 font-bold uppercase tracking-[0.18em] text-blue-700",
                compact ? "px-2 py-1 text-[10px]" : "px-3 py-2 text-xs"
              )}
            >
              <span className={cn(
                "rounded-full bg-blue-500",
                compact ? "h-2 w-2" : "h-2.5 w-2.5",
                status === "LIVE" ? "animate-pulse" : ""
              )} />
              {statusLabel}
            </div>
          )}
        </div>

        <div
          className={cn(
            "relative z-10 rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-lg",
            compact ? "px-3 py-3 2xl:px-4 2xl:py-4" : "rounded-3xl px-6 py-8"
          )}
        >
          <p
            className={cn(
              "font-semibold uppercase text-blue-200",
              compact ? "text-[10px] tracking-[0.2em]" : "text-xs tracking-[0.28em]"
            )}
          >
            Nomor Sedang Dipanggil
          </p>

          <motion.div
            key={ticketNumber}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "text-center font-black tracking-tight",
              compact
                ? "mt-2 text-[clamp(2.6rem,5.1vw,5.25rem)] leading-none"
                : "mt-4 text-6xl sm:text-7xl lg:text-8xl",
              isPriority ? "text-amber-300" : "text-white"
            )}
          >
            {ticketNumber}
          </motion.div>

          <div className={cn(compact ? "mt-3 space-y-2" : "mt-6 space-y-3")}>
            <div
              className={cn(
                "flex flex-wrap items-center justify-between rounded-2xl bg-white/10",
                compact ? "gap-2 px-3 py-2" : "gap-3 px-4 py-3"
              )}
            >
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-white/15 font-bold uppercase tracking-[0.18em] text-white",
                  compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
                )}
              >
                <span
                  className={cn(
                    "rounded-full bg-white",
                    compact ? "h-2 w-2" : "h-2.5 w-2.5",
                    status === "LIVE" ? "animate-pulse" : ""
                  )}
                />
                {statusLabel}
              </div>
              <p className={cn("truncate font-bold text-slate-100", compact ? "text-xs" : "text-sm")}>
                {counterLabel}
              </p>
            </div>

            <div
              className={cn(
                "flex items-center justify-between rounded-2xl border border-white/10 bg-white/5",
                compact ? "gap-3 px-3 py-2" : "gap-4 px-4 py-3"
              )}
            >
              <p
                className={cn(
                  "font-semibold uppercase text-blue-200",
                  compact ? "text-[10px] tracking-[0.16em]" : "text-xs tracking-[0.2em]"
                )}
              >
                Berikutnya
              </p>

              <div className="min-w-0 text-right">
                <p className={cn("font-black tracking-tight text-white", compact ? "text-xl" : "text-2xl")}>
                  {nextTicketNumber || "-"}
                </p>
                <p className={cn("mt-0.5 truncate font-semibold text-slate-300", compact ? "text-xs" : "text-sm")}>
                  {nextCustomerLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
