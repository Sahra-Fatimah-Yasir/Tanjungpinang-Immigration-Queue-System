import { useEffect, useState } from 'react';
import Sidebar from '../../Components/Sidebar.tsx';
import Header from '../../Components/Header.tsx';
import { RefreshCw } from 'lucide-react';
import { formatDateTimeWib } from '../../lib/dateTime.ts';

interface QueueItem {
  id: number;
  ticket_number: string;
  service: {
    code: string;
    name: string;
  };
  customer_name?: string | null;
  identity_number?: string | null;
  counter?: {
    id: number;
    code: string;
    number: number;
  } | null;
  status: 'WAITING' | 'CALLING' | 'SERVING';
  created_at: string;
}

export default function ActiveQueue() {
  const [queues, setQueues] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadQueues = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('/api/queue/active', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal memuat antrian aktif');
      }

      setQueues(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueues();
    const interval = window.setInterval(loadQueues, 5000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="w-full sticky top-0 z-30 bg-surface px-8 py-4 flex justify-between items-center shadow-sm">
          <h2 className="font-manrope font-bold tracking-tight text-xl text-primary">Active Queue</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={loadQueues}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60"
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

          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-none">
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Queue Number</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Pemohon</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Service</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Counter</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {queues.map((queue) => (
                  <tr key={queue.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-6 py-5 font-headline font-bold text-primary">{queue.ticket_number}</td>
                    <td className="px-6 py-5">
                      <div className="font-medium">{queue.customer_name || '-'}</div>
                      <div className="text-xs text-outline">{queue.identity_number || '-'}</div>
                    </td>
                    <td className="px-6 py-5">{queue.service.name}</td>
                    <td className="px-6 py-5">{queue.counter?.code || '-'}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        queue.status === 'SERVING'
                          ? 'bg-emerald-100 text-emerald-700'
                          : queue.status === 'CALLING'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {queue.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">{formatDateTimeWib(queue.created_at)}</td>
                  </tr>
                ))}

                {queues.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-outline">
                      Tidak ada antrian aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
