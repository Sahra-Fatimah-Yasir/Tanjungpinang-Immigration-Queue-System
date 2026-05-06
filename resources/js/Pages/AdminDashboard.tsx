import { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar.tsx";
import Header from "../Components/Header.tsx";
import {
  Users,
  Monitor,
  Ticket,
  CheckCircle2,
  Clock3,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  today: {
    total_queues: number;
    completed: number;
    in_progress: number;
    skipped: number;
    avg_wait_time: number | null;
    avg_service_time: number | null;
  };
  counters: {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
  };
  officers: {
    total: number;
    active_today: number;
    on_break: number;
  };
  services: {
    id: number;
    code: string;
    name: string;
    counters_count: number;
    today_queues: number;
  }[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memuat dashboard");
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
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="w-full sticky top-0 z-30 bg-surface px-8 py-4 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="font-manrope font-bold tracking-tight text-xl text-primary">
              Dashboard Admin
            </h2>
            <p className="text-xs text-outline mt-1">
              Ringkasan operasional sistem antrian hari ini.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Header showUser title="" className="p-0 shadow-none sticky-none" />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!data && !loading && (
            <div className="bg-surface-container-lowest rounded-xl p-8 text-outline shadow-sm">
              Belum ada data dashboard.
            </div>
          )}

          {data && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-primary">
                  <Ticket className="w-7 h-7 text-primary mb-4" />
                  <p className="text-xs font-bold uppercase tracking-wider text-outline">
                    Total Antrian Hari Ini
                  </p>
                  <h3 className="text-4xl font-black text-primary mt-2">
                    {data.today.total_queues}
                  </h3>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
                  <Clock3 className="w-7 h-7 text-amber-600 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-wider text-outline">
                    Sedang Diproses
                  </p>
                  <h3 className="text-4xl font-black text-primary mt-2">
                    {data.today.in_progress}
                  </h3>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-emerald-600">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-wider text-outline">
                    Selesai Dilayani
                  </p>
                  <h3 className="text-4xl font-black text-primary mt-2">
                    {data.today.completed}
                  </h3>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                  <AlertCircle className="w-7 h-7 text-red-500 mb-4" />
                  <p className="text-xs font-bold uppercase tracking-wider text-outline">
                    Dilewati
                  </p>
                  <h3 className="text-4xl font-black text-primary mt-2">
                    {data.today.skipped}
                  </h3>
                </div>
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Monitor className="w-6 h-6 text-primary" />
                    <h3 className="font-manrope font-extrabold text-xl text-primary">
                      Status Loket
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-surface-container-low p-4">
                      <p className="text-xs text-outline font-bold uppercase">Total</p>
                      <p className="text-3xl font-black text-primary">{data.counters.total}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-xs text-emerald-700 font-bold uppercase">Aktif</p>
                      <p className="text-3xl font-black text-emerald-700">{data.counters.active}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-600 font-bold uppercase">Nonaktif</p>
                      <p className="text-3xl font-black text-gray-700">{data.counters.inactive}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-xs text-amber-700 font-bold uppercase">Maintenance</p>
                      <p className="text-3xl font-black text-amber-700">{data.counters.maintenance}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-6 h-6 text-primary" />
                    <h3 className="font-manrope font-extrabold text-xl text-primary">
                      Status Officer
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-surface-container-low p-4">
                      <p className="text-xs text-outline font-bold uppercase">Total</p>
                      <p className="text-3xl font-black text-primary">{data.officers.total}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-xs text-emerald-700 font-bold uppercase">Aktif Hari Ini</p>
                      <p className="text-3xl font-black text-emerald-700">{data.officers.active_today}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-xs text-amber-700 font-bold uppercase">Istirahat</p>
                      <p className="text-3xl font-black text-amber-700">{data.officers.on_break}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-outline-variant">
                  <h3 className="font-manrope font-extrabold text-xl text-primary">
                    Ringkasan Layanan Hari Ini
                  </h3>
                  <p className="text-sm text-outline mt-1">
                    Data diambil dari kategori layanan dan antrean hari ini.
                  </p>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                        Kode
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                        Layanan
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                        Jumlah Loket
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-outline uppercase tracking-wider">
                        Antrian Hari Ini
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.services.map((service) => (
                      <tr key={service.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-5">
                          <span className="font-headline font-black text-primary text-lg">
                            {service.code}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-medium">
                          {service.name}
                        </td>
                        <td className="px-6 py-5">
                          {service.counters_count}
                        </td>
                        <td className="px-6 py-5 font-bold text-primary">
                          {service.today_queues}
                        </td>
                      </tr>
                    ))}

                    {data.services.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-outline">
                          Belum ada layanan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </div>

        <footer className="mt-auto px-8 py-4 bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
              System Online
            </span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-outline">
            © 2026 Kantor Imigrasi Kelas I TPI Tanjungpinang
          </div>
        </footer>
      </main>
    </div>
  );
}