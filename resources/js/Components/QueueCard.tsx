import { cn } from "../lib/utils.ts";
import { Accessibility, ArrowRight, Landmark } from "lucide-react";
import { motion } from "framer-motion";

interface QueueCardProps {
  category: string;
  title: string;
  counters: string;
  ticketNumber: string;
  status?: "ACTIVE" | "LIVE" | "PROCESSING" | "PRIORITY";
  accent?: string;
  isPriority?: boolean;
  className?: string;
}

export default function QueueCard({
  category,
  title,
  counters,
  ticketNumber,
  status = "ACTIVE",
  accent,
  isPriority = false,
  className,
}: QueueCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl lg:p-8",
        isPriority
          ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100"
          : "border-slate-200",
        className
      )}
    >
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-slate-100/70 blur-2xl" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {category}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 lg:text-3xl">
              {title}
            </h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <Landmark className="h-4 w-4" />
              {counters}
            </div>
          </div>

          {isPriority ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
              <Accessibility className="h-4 w-4" />
              Prioritas
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {status}
            </div>
          )}
        </div>

        <div className="relative z-10 rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-6 py-8 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">
            Nomor Sedang Dipanggil
          </p>

          <motion.div
            key={ticketNumber}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "mt-4 text-center text-6xl font-black tracking-tight sm:text-7xl lg:text-8xl",
              isPriority ? "text-amber-300" : "text-white"
            )}
          >
            {ticketNumber}
          </motion.div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                Status Layanan
              </p>
              <p className="mt-1 text-sm font-bold">
                {isPriority ? "Layanan Prioritas Ramah HAM" : "Layanan Berjalan"}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-900">
              Detail
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}