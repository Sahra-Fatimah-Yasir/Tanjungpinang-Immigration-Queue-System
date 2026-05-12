import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../Components/Header.tsx";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LogOut,
  Megaphone,
  RefreshCw,
  RotateCcw,
  Timer,
  UserRound,
  Users,
} from "lucide-react";

interface QueueService {
  id: number;
  code: string;
  name: string;
  is_priority: boolean;
  waiting_count?: number;
}

interface OfficerDashboardData {
  counter: {
    code: string;
    number: number;
    service: QueueService;
  } | null;
  today: {
    total_served: number;
    total_skipped: number;
    avg_service_time: number | null;
  };
  current_ticket: {
    id: number;
    ticket_number: string;
    status: "CALLING" | "SERVING";
    customer_name?: string | null;
    identity_number?: string | null;
    service?: QueueService;
  } | null;
  queue_in_waiting: number;
  callable_services?: QueueService[];
  next_service?: QueueService | null;
}

const resolveCallableServices = (dashboard: OfficerDashboardData | null): QueueService[] => {
  if (!dashboard) return [];

  if (dashboard.callable_services?.length) {
    return dashboard.callable_services;
  }

  return dashboard.counter
    ? [{ ...dashboard.counter.service, waiting_count: dashboard.queue_in_waiting }]
    : [];
};

const resolveSelectedService = (
  dashboard: OfficerDashboardData | null,
  selectedServiceId: number | null
) => {
  const services = resolveCallableServices(dashboard);

  return services.find((service) => service.id === selectedServiceId)
    || dashboard?.next_service
    || services[0]
    || null;
};

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<OfficerDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

  const token = localStorage.getItem("auth_token");
  const officer = JSON.parse(localStorage.getItem("officer_data") || "{}");

  const loadDashboard = async () => {
    if (!token) {
      navigate("/officer/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/officer/dashboard", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memuat dashboard petugas");
      }

      const dashboard = result.data as OfficerDashboardData;
      const services = resolveCallableServices(dashboard);
      const priorityWithQueue = services.find(
        (service) => service.is_priority && (service.waiting_count ?? 0) > 0
      );

      setData(dashboard);
      setSelectedServiceId((previousServiceId) => {
        const previousService = services.find((service) => service.id === previousServiceId);
        const fallbackServiceId = priorityWithQueue?.id
          ?? dashboard.next_service?.id
          ?? services[0]?.id
          ?? null;

        if (!previousService) {
          return fallbackServiceId;
        }

        if (priorityWithQueue && !previousService.is_priority && !dashboard.current_ticket) {
          return priorityWithQueue.id;
        }

        return previousServiceId;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = window.setInterval(loadDashboard, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const speakMessage = ({
    ticketNumber,
    counterNumber,
    serviceName,
    customerName,
    isPriority,
  }: {
    ticketNumber?: string | undefined;
    counterNumber?: number | undefined;
    serviceName?: string | undefined;
    customerName?: string | null | undefined;
    isPriority?: boolean | undefined;
  }) => {
    if (!ticketNumber || !counterNumber) return;

    const spokenTicketNumber = ticketNumber.replace("-", " ");
    const prefix = isPriority || serviceName?.toLowerCase().includes("ramah ham")
      ? `Nomor antrian layanan ${serviceName || "Ramah HAM"} ${spokenTicketNumber}`
      : `Nomor antrian ${spokenTicketNumber}`;

    const nameSection = customerName ? ` atas nama ${customerName}` : "";
    const message = `${prefix}${nameSection}, silakan ke loket ${counterNumber}.`;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "id-ID";
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakTicket = () => {
    speakMessage({
      ticketNumber: data?.current_ticket?.ticket_number,
      counterNumber: data?.counter?.number,
      serviceName: data?.current_ticket?.service?.name ?? data?.counter?.service.name,
      customerName: data?.current_ticket?.customer_name,
      isPriority: data?.current_ticket?.service?.is_priority ?? data?.counter?.service.is_priority,
    });
  };

  const runAction = async (action: "call-next" | "serve" | "complete" | "skip") => {
    if (!token || !data?.counter) return;

    if (action !== "call-next" && !data.current_ticket) return;

    const serviceToCall = resolveSelectedService(data, selectedServiceId);
    if (action === "call-next" && !serviceToCall) return;

    setActionLoading(true);
    setError("");

    try {
      const url =
        action === "call-next"
          ? "/api/officer/queue/call-next"
          : `/api/officer/queue/${data.current_ticket?.id}/${action}`;

      const requestOptions: RequestInit = {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (action === "call-next") {
        requestOptions.body = JSON.stringify({ service_category_id: serviceToCall?.id });
      }

      const response = await fetch(url, requestOptions);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Aksi gagal diproses");
      }

      if (action === "call-next") {
        const calledService = result.data?.queue?.service ?? serviceToCall;

        speakMessage({
          ticketNumber: result.data?.queue?.ticket_number,
          counterNumber: result.data?.queue?.counter?.number ?? data.counter.number,
          serviceName: calledService?.name,
          customerName: result.data?.queue?.customer_name,
          isPriority: calledService?.is_priority,
        });
      }

      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch("/api/officer/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null);
    }

    localStorage.removeItem("auth_token");
    localStorage.removeItem("officer_data");
    navigate("/officer/login");
  };

  const callableServices = resolveCallableServices(data);
  const selectedService = resolveSelectedService(data, selectedServiceId);
  const hasAdditionalPriority = callableServices.some(
    (service) => service.is_priority && service.id !== data?.counter?.service.id
  );
  const headerSubtitle = data?.counter
    ? `${data.counter.code} - ${data.counter.service.name}${hasAdditionalPriority ? " + Prioritas" : ""}`
    : "Loket belum ditugaskan";

  return (
    <div className="min-h-screen bg-surface">
      <Header
        title="Dashboard Petugas"
        subtitle={headerSubtitle}
        showUser
      />

      <main className="mx-auto w-full max-w-7xl space-y-8 p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary">
              {officer.name || "Petugas"}
            </h1>
            <p className="mt-1 text-sm font-semibold text-outline">
              {officer.nip || "-"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-outline-variant px-4 py-3 text-sm font-bold text-primary transition hover:bg-surface-container-low disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-container"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border-l-4 border-secondary bg-surface-container-lowest shadow-sm lg:col-span-8">
            <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
              <span className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-outline">
                Nomor Sedang Dilayani
              </span>

              <h2 className="text-7xl font-extrabold tracking-tight text-primary md:text-9xl">
                {data?.current_ticket?.ticket_number || "-"}
              </h2>

              <div className="mt-6 space-y-2">
                <p className="text-2xl font-bold text-on-surface">
                  {data?.current_ticket?.customer_name || "Belum ada antrian aktif"}
                </p>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-secondary">
                  {data?.current_ticket?.service?.name || selectedService?.name || data?.counter?.service.name || "-"}
                </p>
                <p className="flex items-center justify-center gap-2 text-on-surface-variant">
                  <UserRound className="h-4 w-4" />
                  {data?.current_ticket?.identity_number || "-"}
                </p>
              </div>

              {callableServices.length > 1 && (
                <div className="mt-8 w-full max-w-3xl rounded-xl border border-outline-variant bg-white p-3 text-left">
                  <p className="px-1 text-xs font-bold uppercase tracking-[0.18em] text-outline">
                    Antrean Yang Dipanggil
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {callableServices.map((service) => {
                      const selected = selectedService?.id === service.id;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => setSelectedServiceId(service.id)}
                          className={`flex min-h-[68px] items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition ${
                            selected
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container-low"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${
                                selected
                                  ? "bg-white text-primary"
                                  : service.is_priority
                                  ? "bg-secondary/15 text-secondary"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {service.code}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-extrabold">
                                {service.name}
                              </span>
                              <span className={`block text-xs font-semibold ${selected ? "text-white/75" : "text-outline"}`}>
                                {service.is_priority ? "Prioritas" : "Layanan utama"}
                              </span>
                            </span>
                          </span>
                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                              selected ? "bg-white/15 text-white" : "bg-surface-container-high text-primary"
                            }`}
                          >
                            {service.waiting_count ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => runAction("call-next")}
                  disabled={actionLoading || !data?.counter || !selectedService}
                  className="flex items-center justify-center gap-3 rounded-xl bg-primary px-5 py-4 font-bold text-white shadow-lg shadow-primary/10 transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Megaphone className="h-5 w-5" />
                  {selectedService ? `Panggil ${selectedService.code}` : "Panggil"}
                </button>

                <button
                  type="button"
                  onClick={speakTicket}
                  disabled={!data?.current_ticket}
                  className="flex items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high px-5 py-4 font-bold text-primary transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-5 w-5" />
                  Ulang
                </button>

                <button
                  type="button"
                  onClick={() => runAction(data?.current_ticket?.status === "CALLING" ? "serve" : "complete")}
                  disabled={actionLoading || !data?.current_ticket}
                  className="flex items-center justify-center gap-3 rounded-xl bg-primary-container px-5 py-4 font-bold text-white shadow-lg shadow-primary-container/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {data?.current_ticket?.status === "CALLING" ? "Layani" : "Selesai"}
                </button>

                <button
                  type="button"
                  onClick={() => runAction("skip")}
                  disabled={actionLoading || !data?.current_ticket}
                  className="flex items-center justify-center gap-3 rounded-xl border border-primary bg-transparent px-5 py-4 font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AlertCircle className="h-5 w-5" />
                  Lewati
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-xl bg-primary p-6 shadow-lg">
              <Users className="mb-4 h-8 w-8 text-white" />
              <p className="text-xs font-bold uppercase tracking-widest text-primary-fixed-dim">
                Dilayani Hari Ini
              </p>
              <h4 className="mt-2 text-5xl font-extrabold text-white">
                {data?.today.total_served ?? 0}
              </h4>
            </div>

            <div className="rounded-xl border-l-4 border-primary-container bg-surface-container-lowest p-6 shadow-sm">
              <Clock3 className="mb-4 h-8 w-8 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-outline">
                Menunggu
              </p>
              <h4 className="mt-2 text-5xl font-extrabold text-primary">
                {data?.queue_in_waiting ?? 0}
              </h4>
            </div>

            <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <Timer className="mb-4 h-8 w-8 text-secondary" />
              <p className="text-xs font-bold uppercase tracking-widest text-outline">
                Rata-rata Layanan
              </p>
              <h4 className="mt-2 text-3xl font-extrabold text-primary">
                {data?.today.avg_service_time ?? 0} menit
              </h4>
              <p className="mt-4 text-sm font-semibold text-outline">
                Dilewati: {data?.today.total_skipped ?? 0}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
