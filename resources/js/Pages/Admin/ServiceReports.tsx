import { useEffect, useState } from 'react';
import Sidebar from '../../Components/Sidebar.tsx';
import Header from '../../Components/Header.tsx';
import { BarChart3, CheckCircle2, Download, FileText, RefreshCw, Ticket, Timer, XCircle } from 'lucide-react';
import { formatDateWib, getWibDateStamp } from '../../lib/dateTime.ts';

interface QueueStatistics {
  total_queues: number;
  completed: number;
  skipped: number;
  avg_wait_time: number | null;
  avg_service_time: number | null;
}

export default function ServiceReports() {
  const [stats, setStats] = useState<QueueStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/queue/statistics', {
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal memuat laporan');
      }

      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleDownload = () => {
    if (!stats) return;

    const rows = [
      ['Tanggal', formatDateWib(new Date())],
      ['Total Antrian', stats.total_queues],
      ['Selesai Dilayani', stats.completed],
      ['Dilewati', stats.skipped],
      ['Rata-rata Tunggu (menit)', stats.avg_wait_time ?? 0],
      ['Rata-rata Layanan (menit)', stats.avg_service_time ?? 0],
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-antrian-${getWibDateStamp()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const cards = [
    {
      label: 'Total Antrian',
      value: stats?.total_queues ?? 0,
      icon: Ticket,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      label: 'Selesai',
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Dilewati',
      value: stats?.skipped ?? 0,
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-50',
    },
    {
      label: 'Rata-rata Layanan',
      value: `${stats?.avg_service_time ?? 0} mnt`,
      icon: Timer,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="w-full sticky top-0 z-30 bg-surface px-8 py-4 flex justify-between items-center shadow-sm">
          <h2 className="font-manrope font-bold tracking-tight text-xl text-primary">Service Reports</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadStats}
              disabled={loading}
              className="px-4 py-2 bg-surface-container-low text-primary font-bold rounded-lg hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
              <div key={card.label} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
                <div className={`mb-4 inline-flex rounded-xl p-3 ${card.bg}`}>
                  <card.icon className={`w-7 h-7 ${card.color}`} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-outline">{card.label}</p>
                <h3 className="mt-2 text-4xl font-black text-primary">{card.value}</h3>
              </div>
            ))}
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-7 h-7 text-primary" />
                <div>
                  <h3 className="font-manrope font-extrabold text-xl text-primary">
                    Laporan Harian
                  </h3>
                  <p className="text-sm text-outline">
                    Rekap operasional tanggal {formatDateWib(new Date())}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!stats}
                className="py-3 px-5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download CSV
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-surface-container-low p-5">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">Rata-rata Tunggu</span>
                </div>
                <p className="mt-3 text-3xl font-black text-primary">
                  {stats?.avg_wait_time ?? 0} menit
                </p>
              </div>

              <div className="rounded-xl bg-surface-container-low p-5">
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">Rata-rata Layanan</span>
                </div>
                <p className="mt-3 text-3xl font-black text-primary">
                  {stats?.avg_service_time ?? 0} menit
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
