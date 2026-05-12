import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  History,
  LogIn,
  MapPin,
  MonitorUp,
  Sparkles,
  Ticket,
  UsersRound,
} from "lucide-react";
import Header from "../Components/Header.tsx";
import Ticker from "../Components/Ticker.tsx";

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
    customer_name?: string | null;
    status: "CALLING" | "SERVING";
    called_at?: string | null;
    counter?: string | null;
    counter_number?: number | null;
  } | null;
  waiting_count: number;
  waiting_tickets: Array<{
    id: number;
    ticket_number: string;
  }>;
}

interface DisplayQueueListItem {
  id: string;
  ticket_number: string;
  service_name: string;
  service_code: string;
  customer_name?: string | null;
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

interface CallAnnouncement {
  id: number;
  announced_at: string;
  ticket_number: string;
  customer_name?: string | null;
  status: "CALLING" | "SERVING";
  service: {
    id?: number | null;
    code?: string | null;
    name?: string | null;
  };
  counter?: string | null;
  counter_number?: number | null;
}

const ANNOUNCEMENT_DISPLAY_MS = 8000;
const INITIAL_ANNOUNCEMENT_GRACE_MS = 10000;

const loadingServices: PublicQueueItem[] = [
  {
    service: {
      id: -1,
      code: "A",
      name: "Ramah HAM",
      is_priority: true,
      max_counters: 1,
    },
    current_ticket: null,
    waiting_count: 0,
    waiting_tickets: [],
  },
  {
    service: {
      id: -2,
      code: "B",
      name: "M-Paspor",
      is_priority: false,
      max_counters: 4,
    },
    current_ticket: null,
    waiting_count: 0,
    waiting_tickets: [],
  },
  {
    service: {
      id: -3,
      code: "C",
      name: "M-Paspor",
      is_priority: false,
      max_counters: 4,
    },
    current_ticket: null,
    waiting_count: 0,
    waiting_tickets: [],
  },
  {
    service: {
      id: -4,
      code: "D",
      name: "WNA / Izin Tinggal",
      is_priority: false,
      max_counters: 2,
    },
    current_ticket: null,
    waiting_count: 0,
    waiting_tickets: [],
  },
];

const formatCounterLabel = (
  ticket: PublicQueueItem["current_ticket"] | null
) => {
  if (!ticket) return null;
  if (ticket.counter_number) return `Loket ${ticket.counter_number}`;
  if (!ticket.counter) return null;

  return ticket.counter.toLowerCase().includes("loket")
    ? ticket.counter
    : `Loket ${ticket.counter}`;
};

const getQueueStatusLabel = (status: DisplayQueueListItem["status"]) => {
  if (status === "CALLING") return "Dipanggil";
  if (status === "SERVING") return "Dilayani";
  return "Menunggu";
};

export default function PublicDisplay() {
  const [queues, setQueues] = useState<PublicQueueItem[]>([]);
  const [histories, setHistories] = useState<RecentHistory[]>([]);
  const [announcementQueue, setAnnouncementQueue] = useState<DisplayQueueListItem[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] =
    useState<DisplayQueueListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const seenAnnouncementIds = useRef<Set<number>>(new Set());
  const displayStartedAt = useRef(Date.now());

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

      const freshAnnouncements = [...(result.data.call_announcements || [])]
        .sort((first: CallAnnouncement, second: CallAnnouncement) => first.id - second.id)
        .filter((announcement: CallAnnouncement) => {
          if (seenAnnouncementIds.current.has(announcement.id)) return false;

          const announcedAt = new Date(announcement.announced_at).getTime();
          return (
            Number.isFinite(announcedAt) &&
            announcedAt >= displayStartedAt.current - INITIAL_ANNOUNCEMENT_GRACE_MS
          );
        })
        .map((announcement: CallAnnouncement) => {
          seenAnnouncementIds.current.add(announcement.id);

          return {
            id: `announcement-${announcement.id}`,
            ticket_number: announcement.ticket_number,
            service_name: announcement.service.name || "-",
            service_code: announcement.service.code || "-",
            customer_name: announcement.customer_name ?? null,
            status: "CALLING" as const,
            counter_label: formatCounterLabel({
              id: announcement.id,
              ticket_number: announcement.ticket_number,
              customer_name: announcement.customer_name,
              status: announcement.status,
              counter: announcement.counter,
              counter_number: announcement.counter_number,
            }),
          };
        });

      if (freshAnnouncements.length > 0) {
        setAnnouncementQueue((current) => [...current, ...freshAnnouncements]);
      }
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
    if (activeAnnouncement || announcementQueue.length === 0) return;

    const [nextAnnouncement, ...remainingAnnouncements] = announcementQueue;
    setActiveAnnouncement(nextAnnouncement);
    setAnnouncementQueue(remainingAnnouncements);
  }, [activeAnnouncement, announcementQueue]);

  useEffect(() => {
    if (!activeAnnouncement) return;

    const timeout = window.setTimeout(() => {
      setActiveAnnouncement(null);
    }, ANNOUNCEMENT_DISPLAY_MS);

    return () => window.clearTimeout(timeout);
  }, [activeAnnouncement]);

  const currentQueues = useMemo(() => {
    return queues.flatMap<DisplayQueueListItem>((item) => {
      if (!item.current_ticket) return [];

      return [
        {
          id: `current-${item.current_ticket.id}`,
          ticket_number: item.current_ticket.ticket_number,
          service_name: item.service.name,
          service_code: item.service.code,
          customer_name: item.current_ticket.customer_name ?? null,
          status: item.current_ticket.status,
          counter_label: formatCounterLabel(item.current_ticket),
        },
      ];
    });
  }, [queues]);

  const waitingQueues = useMemo(() => {
    return queues.flatMap<DisplayQueueListItem>((item) =>
      item.waiting_tickets.map((ticket) => ({
        id: `waiting-${ticket.id}`,
        ticket_number: ticket.ticket_number,
        service_name: item.service.name,
        service_code: item.service.code,
        status: "WAITING" as const,
        counter_label: null,
      }))
    );
  }, [queues]);

  const featuredQueue =
    activeAnnouncement ||
    announcementQueue[0] ||
    currentQueues.find((queue) => queue.status === "CALLING") ||
    currentQueues[0] ||
    null;

  const visibleWaitingQueues = waitingQueues.slice(0, 7);
  const visibleHistories = histories.slice(0, 3);
  const totalWaiting = queues.reduce((sum, item) => sum + item.waiting_count, 0);
  const serviceCards = queues.slice(0, 4);
  const visibleServiceCards =
    serviceCards.length > 0 ? serviceCards : loading ? loadingServices : [];

  return (
    <div className="h-screen overflow-hidden bg-slate-200 p-2 text-slate-950">
      <div className="relative mx-auto flex h-full w-full flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl">
        <Link
          to="/login"
          title="Portal staff"
          aria-label="Portal staff"
          className="absolute bottom-12 right-3 z-50 inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white/90 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition hover:text-blue-700"
        >
          <LogIn className="h-3.5 w-3.5" />
          Staff
        </Link>

        <Header
          compact
          showActions={false}
          title="NADI IMIGRASI"
          subtitle="KANTOR IMIGRASI KELAS I TPI TANJUNGPINANG"
        />

        <main className="grid min-h-0 flex-1 grid-cols-12 gap-2 overflow-hidden p-2">
          <section className="col-span-8 grid min-h-0 grid-rows-[minmax(0,1fr)_204px] gap-1.5">
            <div className="min-h-0">
              <div className="flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/70 via-white to-white p-4 shadow-sm">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-black uppercase text-[#08285e]">
                    <MonitorUp className="h-5 w-5 text-blue-700" />
                    Nomor Dipanggil
                  </div>

                  {featuredQueue ? (
                    <div
                      className={`rounded-lg border px-4 py-2 text-sm font-black uppercase ${
                        featuredQueue.status === "CALLING"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {getQueueStatusLabel(featuredQueue.status)}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-black uppercase text-slate-500">
                      Siap
                    </div>
                  )}
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center px-2 py-1">
                  {featuredQueue ? (
                    <div className="min-w-0 max-w-full text-center">
                      <div className="mx-auto mb-2 h-1.5 w-24 rounded-full bg-amber-400" />
                      <div className="truncate text-[clamp(5.2rem,14.5vw,11.6rem)] font-black leading-[0.9] tracking-normal text-[#08285e]">
                        {featuredQueue.ticket_number}
                      </div>

                      {featuredQueue.customer_name && (
                        <div className="mx-auto mt-3 max-w-[760px] rounded-lg border border-slate-200 bg-white px-5 py-2.5">
                          <p className="text-[11px] font-black uppercase tracking-normal text-slate-500">
                            Nama Pemohon
                          </p>
                          <p className="mt-0.5 truncate text-[clamp(1rem,2vw,1.8rem)] font-black leading-tight text-[#08285e]">
                            {featuredQueue.customer_name}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[620px] text-center">
                      <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#08285e]">
                        <Ticket className="h-8 w-8" />
                      </div>
                      <p className="text-[clamp(1.9rem,3.6vw,3.2rem)] font-black leading-tight tracking-normal text-[#08285e]">
                        Belum Ada Panggilan
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-500">
                        Nomor antrian akan tampil otomatis.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid h-[78px] shrink-0 grid-cols-2 gap-2.5">
                  <div className="min-w-0 rounded-lg border border-blue-100 bg-white px-4 py-2.5">
                    <div className="flex h-full min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-black uppercase tracking-normal text-slate-500">
                        {featuredQueue ? "Silakan Menuju" : "Status"}
                        </p>
                        <p className="mt-1 text-[clamp(1rem,1.55vw,1.35rem)] font-black leading-snug text-[#08285e]">
                          {featuredQueue?.counter_label || "Menunggu Panggilan"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-lg border border-amber-100 bg-white px-4 py-2.5">
                    <div className="flex h-full min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-black uppercase tracking-normal text-slate-500">
                          Jenis Layanan
                        </p>
                        <p className="mt-1 text-[clamp(1rem,1.55vw,1.35rem)] font-black leading-snug text-slate-950">
                          {featuredQueue
                            ? `${featuredQueue.service_code} - ${featuredQueue.service_name}`
                            : "Semua Layanan Siap"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-1.5">
              <div className="flex shrink-0 items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.12em] text-slate-600">
                  Ringkasan Layanan
                </h2>
                <span className="text-xs font-bold text-slate-500">
                  Dipanggil / Berikutnya
                </span>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-4 gap-2">
                {visibleServiceCards.map((item) => {
                  const currentTicket = item.current_ticket;
                  const nextTicket = item.waiting_tickets[0];

                  return (
                    <article
                      key={item.service.id}
                      className={`min-w-0 overflow-hidden rounded-lg border p-3 ${
                        item.service.is_priority
                          ? "border-amber-300 bg-amber-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div
                            className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-lg font-black ${
                              item.service.is_priority
                                ? "bg-amber-400 text-amber-950"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.service.code}
                          </div>
                          <h3 className="min-h-[34px] text-sm font-black leading-tight text-slate-950">
                            {item.service.name}
                          </h3>
                        </div>
                        <div className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                          {item.waiting_count}
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-lg bg-slate-100 px-2 py-2">
                          <p className="text-[10px] font-bold uppercase text-slate-500">
                            Dipanggil
                          </p>
                          <p className="truncate text-lg font-black text-[#08285e]">
                            {currentTicket?.ticket_number || "-"}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-lg bg-slate-100 px-2 py-2">
                          <p className="text-[10px] font-bold uppercase text-slate-500">
                            Berikutnya
                          </p>
                          <p className="truncate text-lg font-black text-slate-950">
                            {nextTicket?.ticket_number || "-"}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {visibleServiceCards.length === 0 && !loading && (
                  <div className="col-span-4 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-500">
                    Belum ada kategori layanan aktif.
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="col-span-4 grid min-h-0 grid-rows-[minmax(0,1fr)_190px] gap-2">
            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <UsersRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black">
                      Daftar Menunggu
                    </h2>
                    <p className="truncate text-sm font-semibold text-slate-500">
                      Total {totalWaiting} nomor dari semua layanan
                    </p>
                  </div>
                </div>
                <Ticket className="h-5 w-5 text-slate-400" />
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-3">
                {visibleWaitingQueues.map((queue, index) => (
                  <div
                    key={queue.id}
                    className="grid grid-cols-[42px_minmax(0,1fr)_52px] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-600">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-black leading-none text-[#08285e]">
                        {queue.ticket_number}
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">
                        {queue.service_name}
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 py-2 text-center text-sm font-black text-blue-800">
                      {queue.service_code}
                    </div>
                  </div>
                ))}

                {visibleWaitingQueues.length === 0 && (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm font-semibold text-slate-500">
                    {loading && queues.length === 0
                      ? "Memuat antrian..."
                      : "Belum ada antrian menunggu."}
                  </div>
                )}
              </div>
            </section>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <History className="h-5 w-5" />
                  </div>
                  <h2 className="truncate text-lg font-black">
                    Riwayat Terbaru
                  </h2>
                </div>
                <Clock3 className="h-5 w-5 text-slate-400" />
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-3">
                {visibleHistories.map((item) => (
                  <div
                    key={`${item.ticket_number}-${item.time_ago}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xl font-black leading-none">
                        {item.ticket_number}
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-slate-500">
                        {item.counter || "-"}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black ${
                        item.status === "SERVED"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.status === "SERVED" && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {item.status === "SERVED" ? "Selesai" : "Dilewati"}
                    </span>
                  </div>
                ))}

                {visibleHistories.length === 0 && (
                  <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-6 text-center text-sm font-semibold text-slate-500">
                    {loading && queues.length === 0
                      ? "Memuat riwayat..."
                      : "Belum ada riwayat."}
                  </div>
                )}
              </div>
            </section>
          </aside>
        </main>

        <Ticker />
      </div>
    </div>
  );
}
