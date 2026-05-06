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

interface OfficerDashboardData {
  counter: {
    code: string;
    number: number;
    service: {
      id: number;
      code: string;
      name: string;
      is_priority: boolean;
    };
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
  } | null;
  queue_in_waiting: number;
}

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<OfficerDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

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

      setData(result.data);
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
      serviceName: data?.counter?.service.name,
      customerName: data?.current_ticket?.customer_name,
      isPriority: data?.counter?.service.is_priority,
    });
  };

  const runAction = async (action: "call-next" | "serve" | "complete" | "skip") => {
    if (!token || !data?.counter) return;

    if (action !== "call-next" && !data.current_ticket) return;

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
        requestOptions.body = JSON.stringify({ service_category_id: data.counter.service.id });
      }

      const response = await fetch(url, requestOptions);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Aksi gagal diproses");
      }

      if (action === "call-next") {
        speakMessage({
          ticketNumber: result.data?.queue?.ticket_number,
          counterNumber: data.counter.number,
          serviceName: data.counter.service.name,
          customerName: result.data?.queue?.customer_name,
          isPriority: data.counter.service.is_priority,
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

  return (
    <div className="min-h-screen bg-surface">
      <Header
        title="Dashboard Petugas"
        subtitle={data?.counter ? `${data.counter.code} - ${data.counter.service.name}` : "Loket belum ditugaskan"}
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
                <p className="flex items-center justify-center gap-2 text-on-surface-variant">
                  <UserRound className="h-4 w-4" />
                  {data?.current_ticket?.identity_number || "-"}
                </p>
              </div>

              <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => runAction("call-next")}
                  disabled={actionLoading || !data?.counter}
                  className="flex items-center justify-center gap-3 rounded-xl bg-primary px-5 py-4 font-bold text-white shadow-lg shadow-primary/10 transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Megaphone className="h-5 w-5" />
                  Panggil
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
