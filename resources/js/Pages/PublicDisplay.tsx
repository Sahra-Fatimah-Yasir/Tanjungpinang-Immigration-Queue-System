import { useEffect, useMemo, useState } from "react";
import Header from "../Components/Header.tsx";
import QueueCard from "../Components/QueueCard.tsx";
import Ticker from "../Components/Ticker.tsx";
import { FileText, RotateCcw, Smartphone, Ticket, WalletCards } from "lucide-react";

interface PublicQueueItem {
  service: {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    is_priority: boolean;
    max_counters: number;
  };
  current_ticket: {
    id: number;
    ticket_number: string;
    status: "CALLING" | "SERVING";
    customer_name?: string | null;
    counter?: string | null;
    counter_number?: number | null;
  } | null;
  waiting_count: number;
  waiting_tickets: Array<{
    id: number;
    ticket_number: string;
    customer_name?: string | null;
  }>;
}

interface DisplayQueueListItem {
  id: string;
  ticket_number: string;
  customer_name: string | null;
  service_name: string;
  service_code: string;
  status: "CALLING" | "SERVING" | "WAITING";
  counter_label: string | null;
}

interface RecentHistory {
  ticket_number: string;
  service: string;
  counter?: string | null;
  status: "SERVED" | "SKIPPED";
  time_ago?: string | null;
}

const getDisplayStatus = (item: PublicQueueItem) => {
  if (item.service.is_priority) return "PRIORITY";
  if (item.current_ticket?.status === "CALLING") return "LIVE";
  if (item.current_ticket?.status === "SERVING") return "PROCESSING";
  return "ACTIVE";
};

const guideSlides = [
  {
    id: "documents",
    title: "Siapkan Dokumen Utama",
    subtitle: "Bawa berkas dasar saat pengajuan E-Paspor baru di Tanjungpinang.",
    badge: "Syarat Utama",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80",
    icon: FileText,
    accent: "bg-blue-100/95 text-blue-700",
    points: [
      "KTP elektronik yang masih berlaku",
      "Kartu Keluarga",
      "Akta lahir, buku nikah, atau ijazah",
    ],
  },
  {
    id: "mpaspor",
    title: "Daftar Lebih Dulu di M-Paspor",
    subtitle: "Pilih jadwal kedatangan sebelum datang ke kantor imigrasi.",
    badge: "Alur Layanan",
    image:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=80",
    icon: Smartphone,
    accent: "bg-emerald-100/95 text-emerald-700",
    points: [
      "Pilih kantor dan jadwal kedatangan",
      "Datang sesuai jadwal yang dipilih",
      "Lanjut verifikasi, foto, sidik jari, dan wawancara",
    ],
  },
  {
    id: "tariff",
    title: "Tarif E-Paspor",
    subtitle: "Layanan di display publik ini berfokus pada penerbitan E-Paspor.",
    badge: "Biaya Resmi",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=80",
    icon: WalletCards,
    accent: "bg-amber-100/95 text-amber-700",
    points: [
      "E-Paspor 5 tahun: Rp650.000",
      "E-Paspor 10 tahun: Rp950.000",
      "Gunakan kanal resmi dan siapkan dokumen asli",
    ],
  },
];

export default function PublicDisplay() {
  const [queues, setQueues] = useState<PublicQueueItem[]>([]);
  const [histories, setHistories] = useState<RecentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeGuideSlide, setActiveGuideSlide] = useState(0);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/queue/public-dashboard", {
        headers: { Accept: "application/json" },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memuat display antrian");
      }

      setQueues(result.data.active_queues || []);
      setHistories(result.data.recent_history || []);
    } catch (err) {
      console.error("Failed to load public dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveGuideSlide((current) => (current + 1) % guideSlides.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, []);

  const activeQueueList = useMemo(() => {
    return queues.flatMap<DisplayQueueListItem>((item) => {
      const currentItems = item.current_ticket
        ? [
            {
              id: `current-${item.current_ticket.id}`,
              ticket_number: item.current_ticket.ticket_number,
              customer_name: item.current_ticket.customer_name ?? null,
              service_name: item.service.name,
              service_code: item.service.code,
              status: item.current_ticket.status,
              counter_label: item.current_ticket.counter_number
                ? `Loket ${item.current_ticket.counter_number}`
                : item.current_ticket.counter ?? null,
            },
          ]
        : [];

      const waitingItems = item.waiting_tickets.map((ticket) => ({
        id: `waiting-${ticket.id}`,
        ticket_number: ticket.ticket_number,
        customer_name: ticket.customer_name ?? null,
        service_name: item.service.name,
        service_code: item.service.code,
        status: "WAITING" as const,
        counter_label: null,
      }));

      return [...currentItems, ...waitingItems];
    });
  }, [queues]);

  const visibleQueues = queues.slice(0, 4);
  const visibleActiveQueueList = activeQueueList.slice(0, 1);
  const hiddenActiveQueueCount = Math.max(activeQueueList.length - visibleActiveQueueList.length, 0);
  const visibleHistories = histories.slice(0, 1);
  const hiddenHistoryCount = Math.max(histories.length - visibleHistories.length, 0);

  return (
    <div className="h-screen h-[100dvh] overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-1.5 lg:p-2">
      <div className="mx-auto flex h-full w-full flex-col overflow-hidden rounded-2xl border-[3px] border-slate-300/50 bg-white shadow-2xl">
        <Header
          compact
          showActions={false}
          title="IMIGRASI INDONESIA"
          subtitle="KANTOR IMIGRASI KELAS I TPI TANJUNGPINANG"
        />

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden p-2 xl:grid-cols-12 xl:gap-3">
          <section className="min-h-0 xl:col-span-8">
            <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2 xl:gap-3">
              {visibleQueues.map((item) => {
                const nextWaitingTicket = item.waiting_tickets[0];

                return (
                  <QueueCard
                    key={item.service.id}
                    compact
                    className="h-full min-h-0"
                    category={`KATEGORI ${item.service.code}`}
                    title={item.service.name}
                    counters={`${item.waiting_count} menunggu - ${item.service.max_counters} loket`}
                    ticketNumber={item.current_ticket?.ticket_number || "-"}
                    currentCounterLabel={
                      item.current_ticket?.counter_number
                        ? `Loket ${item.current_ticket.counter_number}`
                        : item.current_ticket?.counter
                          ? `Loket ${item.current_ticket.counter}`
                          : "Menunggu panggilan loket"
                    }
                    nextTicketNumber={nextWaitingTicket?.ticket_number}
                    nextCustomerName={nextWaitingTicket?.customer_name || undefined}
                    status={getDisplayStatus(item)}
                    accent={item.service.is_priority ? "gold" : "blue"}
                    isPriority={item.service.is_priority}
                  />
                );
              })}

              {queues.length === 0 && !loading && (
                <div className="col-span-2 row-span-2 flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
                  Belum ada kategori layanan.
                </div>
              )}
            </div>
          </section>

          <aside className="hidden min-h-0 xl:col-span-4 xl:block">
            <div
              className="grid h-full min-h-0 gap-2"
              style={{
                gridTemplateRows: "minmax(0, 0.76fr) minmax(0, 1.1fr) minmax(0, 0.68fr)",
              }}
            >
              <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex shrink-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-2">
                      <Ticket className="h-5 w-5 text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900">
                        Daftar Antrian Aktif
                      </h3>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        Dipanggil dan menunggu.
                      </p>
                    </div>
                  </div>

                  {hiddenActiveQueueCount > 0 && (
                    <div className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                      +{hiddenActiveQueueCount}
                    </div>
                  )}
                </div>

                <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-hidden">
                  {visibleActiveQueueList.map((queue) => (
                    <div
                      key={queue.id}
                      className={`rounded-xl border px-3 py-1.5 shadow-sm ${
                        queue.status === "WAITING"
                          ? "border-slate-200 bg-slate-50"
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-black leading-none tracking-tight text-slate-900">
                            {queue.ticket_number}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-bold text-slate-700">
                            {queue.customer_name || "Nama belum diisi"}
                          </div>
                          <div className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {queue.service_code} - {queue.service_name}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div
                            className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                              queue.status === "WAITING"
                                ? "bg-white text-slate-700"
                                : queue.status === "SERVING"
                                  ? "bg-emerald-700 text-white"
                                  : "bg-blue-700 text-white"
                            }`}
                          >
                            {queue.status === "WAITING"
                              ? "Menunggu"
                              : queue.status === "SERVING"
                                ? "Dilayani"
                                : "Dipanggil"}
                          </div>
                          {queue.counter_label && (
                            <div className="mt-1 text-[10px] font-bold text-blue-800">
                              {queue.counter_label}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeQueueList.length === 0 && !loading && (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-xs font-semibold text-slate-500">
                      Belum ada antrian aktif hari ini.
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                <div
                  className="flex h-full transition-transform duration-700 ease-out"
                  style={{ transform: `translateX(-${activeGuideSlide * 100}%)` }}
                >
                  {guideSlides.map((slide) => {
                    const Icon = slide.icon;

                    return (
                      <div key={slide.id} className="flex h-full min-w-full flex-col p-3">
                        <div className="flex shrink-0 items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700">
                                Panduan E-Paspor
                              </p>
                              <p className="mt-0.5 truncate text-xs font-bold text-slate-500">
                                {slide.badge}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                            {activeGuideSlide + 1}/{guideSlides.length}
                          </div>
                        </div>

                        <div className="mt-3 min-h-0 flex-1 rounded-xl bg-slate-50 p-3">
                          <h4 className="text-xl font-black leading-tight tracking-tight text-slate-950">
                            {slide.title}
                          </h4>
                          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                            {slide.subtitle}
                          </p>

                          <div className="mt-3 grid gap-2">
                            {slide.points.slice(0, 2).map((point) => (
                              <div
                                key={point}
                                className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                                <span className="text-xs font-bold leading-5 text-slate-800">
                                  {point}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-slate-50 to-white shadow-lg">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="rounded-lg bg-blue-100 p-1.5">
                      <RotateCcw className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-bold uppercase tracking-widest text-slate-800">
                        Recent History
                      </h3>
                    </div>
                  </div>

                  {hiddenHistoryCount > 0 && (
                    <div className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      +{hiddenHistoryCount}
                    </div>
                  )}
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-3">
                  {visibleHistories.map((item) => (
                    <div
                      key={`${item.ticket_number}-${item.time_ago}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-lg font-black leading-none tracking-tight text-blue-950">
                          {item.ticket_number}
                        </div>
                        <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          {item.service} - {item.counter || "-"}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div
                          className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
                            item.status === "SERVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status === "SERVED" ? "Selesai" : "Dilewati"}
                        </div>
                        <div className="mt-1 text-[10px] font-semibold text-slate-500">
                          {item.time_ago || item.status}
                        </div>
                      </div>
                    </div>
                  ))}

                  {histories.length === 0 && (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 text-center text-xs font-semibold text-slate-500">
                      Belum ada riwayat layanan hari ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </main>

        <Ticker />
      </div>
    </div>
  );
}
