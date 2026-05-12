import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Landmark,
  Loader2,
  RefreshCw,
  Ticket,
  UserRound,
} from "lucide-react";
import { formatTimeWib } from "../lib/dateTime.ts";

interface TrackData {
  queue: {
    id: number;
    ticket_number: string;
    customer_name?: string | null;
    identity_number?: string | null;
    status: "WAITING" | "CALLING" | "SERVING" | "SERVED" | "SKIPPED";
    status_label: string;
    created_at: string;
    called_at?: string | null;
    served_at?: string | null;
    completed_at?: string | null;
    tracking_url: string;
  };
  service: {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    is_priority: boolean;
  };
  counter?: {
    id: number;
    code: string;
    number: number;
  } | null;
  current_queue?: {
    ticket_number: string;
    status: string;
    counter?: string | null;
  } | null;
  progress: {
    waiting_ahead: number;
    updated_at: string;
  };
}

const statusStyles: Record<TrackData["queue"]["status"], string> = {
  WAITING: "border-amber-200 bg-amber-50 text-amber-800",
  CALLING: "border-blue-200 bg-blue-50 text-blue-800",
  SERVING: "border-emerald-200 bg-emerald-50 text-emerald-800",
  SERVED: "border-slate-200 bg-slate-50 text-slate-700",
  SKIPPED: "border-red-200 bg-red-50 text-red-700",
};

const stepIndex: Record<TrackData["queue"]["status"], number> = {
  WAITING: 1,
  CALLING: 2,
  SERVING: 3,
  SERVED: 4,
  SKIPPED: 4,
};

export default function QueueTracker() {
  const { trackingKey } = useParams();
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTrackData = async (silent = false) => {
    if (!trackingKey) return;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch(`/api/queue/track/${encodeURIComponent(trackingKey)}`, {
        headers: { Accept: "application/json" },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Nomor antrian tidak ditemukan.");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrackData();
    const interval = window.setInterval(() => loadTrackData(true), 5000);
    return () => window.clearInterval(interval);
  }, [trackingKey]);

  const activeStep = useMemo(() => {
    if (!data) return 0;
    return stepIndex[data.queue.status];
  }, [data]);

  const lastUpdated = data?.progress.updated_at
    ? formatTimeWib(data.progress.updated_at, {
        second: "2-digit",
      })
    : "-";

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Logo Imigrasi"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-base font-black uppercase text-primary md:text-xl">
                Tracking Antrian
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline md:text-xs">
                Kantor Imigrasi Kelas I TPI Tanjungpinang
              </p>
            </div>
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-5 md:p-8">
        {loading && (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-primary shadow-sm">
            <Loader2 className="mb-4 h-10 w-10 animate-spin" />
            <p className="font-bold">Memuat status antrian...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-7 w-7" />
              <div>
                <h2 className="text-xl font-black">Tracking tidak ditemukan</h2>
                <p className="mt-1 text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && data && (
          <>
            <section className="rounded-2xl bg-white p-6 text-center shadow-sm md:p-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white">
                <Ticket className="h-8 w-8" />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.24em] text-outline">
                Nomor Antrian
              </p>
              <h2 className="mt-2 text-7xl font-black tracking-tight text-primary md:text-8xl">
                {data.queue.ticket_number}
              </h2>

              <div
                className={`mx-auto mt-6 inline-flex rounded-full border px-5 py-2 text-sm font-black uppercase tracking-wider ${
                  statusStyles[data.queue.status]
                }`}
              >
                {data.queue.status_label}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-outline">
                    Layanan
                  </p>
                  <p className="mt-2 font-black text-primary">{data.service.name}</p>
                </div>

                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-outline">
                    Loket
                  </p>
                  <p className="mt-2 font-black text-primary">
                    {data.counter?.code || "Belum dipanggil"}
                  </p>
                </div>

                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-outline">
                    Update
                  </p>
                  <p className="mt-2 flex items-center gap-2 font-black text-primary">
                    {lastUpdated}
                    {refreshing && <RefreshCw className="h-4 w-4 animate-spin" />}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
                <div className="mb-6 flex items-center gap-3">
                  <Clock3 className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-black text-primary">Progress Antrian</h3>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {["Menunggu", "Dipanggil", "Dilayani", "Selesai"].map((step, index) => {
                    const complete = activeStep >= index + 1;
                    return (
                      <div key={step} className="space-y-2">
                        <div
                          className={`h-3 rounded-full ${
                            complete ? "bg-primary" : "bg-surface-container-high"
                          }`}
                        />
                        <p
                          className={`text-center text-[10px] font-bold uppercase tracking-wider ${
                            complete ? "text-primary" : "text-outline"
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <div className="rounded-xl border border-outline-variant p-5">
                    <p className="text-sm font-bold text-outline">Antrian di depan Anda</p>
                    <p className="mt-2 text-4xl font-black text-primary">
                      {data.progress.waiting_ahead}
                    </p>
                  </div>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <Landmark className="h-6 w-6 text-primary" />
                    <h3 className="font-black text-primary">Nomor Saat Ini</h3>
                  </div>
                  <p className="text-4xl font-black text-primary">
                    {data.current_queue?.ticket_number || "-"}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-outline">
                    {data.current_queue?.counter
                      ? `Loket ${data.current_queue.counter}`
                      : "Belum ada nomor dipanggil"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <UserRound className="h-6 w-6 text-primary" />
                    <h3 className="font-black text-primary">Pemohon</h3>
                  </div>
                  <p className="font-bold text-on-surface">
                    {data.queue.customer_name || "-"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-outline">
                    {data.queue.identity_number || "-"}
                  </p>
                </div>
              </aside>
            </section>

            {(data.queue.status === "CALLING" || data.queue.status === "SERVING") && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-6 w-6" />
                <div>
                  <p className="font-black">Silakan menuju loket.</p>
                  <p className="mt-1 text-sm font-medium">
                    Tunjukkan tiket ini kepada petugas bila diminta.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
