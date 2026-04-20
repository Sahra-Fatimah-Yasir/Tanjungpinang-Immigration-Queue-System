import Header from "../Components/Header.tsx";
import QueueCard from "../Components/QueueCard.tsx";
import Ticker from "../Components/Ticker.tsx";
import { Clock3, MonitorSmartphone, Users, Volume2 } from "lucide-react";

export default function PublicDisplay() {
  const history = [
    { id: "A-242", layanan: "Paspor", loket: "3", waktu: "09:32" },
    { id: "C-087", layanan: "Status & Izin Tinggal", loket: "6", waktu: "09:28" },
    { id: "B-011", layanan: "Customer Service", loket: "CS 2", waktu: "09:24" },
    { id: "R-004", layanan: "Ramah HAM", loket: "1", waktu: "09:18" },
    { id: "A-241", layanan: "Paspor", loket: "4", waktu: "09:15" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white text-slate-900">
      <Header
        title="Kantor Imigrasi Kelas I TPI Tanjungpinang"
        subtitle="Display Informasi Antrian Layanan"
      />

      <main className="mx-auto flex max-w-[1700px] flex-col gap-8 px-6 py-6 lg:px-10">
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <MonitorSmartphone className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Sistem
                </p>
                <p className="text-lg font-black text-slate-900">Online</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Total Loket Aktif
                </p>
                <p className="text-lg font-black text-slate-900">8 Loket</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Jam Operasional
                </p>
                <p className="text-lg font-black text-slate-900">08.00 - 16.00</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                <Volume2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Panggilan Audio
                </p>
                <p className="text-lg font-black text-slate-900">Aktif</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <QueueCard
                category="Layanan Dokumen Perjalanan"
                title="Paspor"
                counters="Loket 1, 2, 3, 4"
                ticketNumber="A-243"
                status="ACTIVE"
              />
              <QueueCard
                category="Informasi dan Bantuan"
                title="Customer Service"
                counters="Loket CS 1, CS 2"
                ticketNumber="B-012"
                status="LIVE"
              />
              <QueueCard
                category="Layanan Prioritas"
                title="Ramah HAM"
                counters="Loket 1 (Prioritas)"
                ticketNumber="R-005"
                isPriority
                status="PRIORITAS"
              />
              <QueueCard
                category="Keimigrasian"
                title="Status dan Izin Tinggal"
                counters="Loket 5, 6"
                ticketNumber="C-088"
                status="PROCESSING"
              />
            </div>
          </div>

          <aside className="xl:col-span-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
                  Informasi Display
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">
                  Riwayat Panggilan Terakhir
                </h3>
                <p className="mt-1 text-sm text-slate-200">
                  Menampilkan antrean yang baru saja dipanggil oleh petugas.
                </p>
              </div>

              <div className="space-y-3 p-4 lg:p-5">
                {history.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition hover:bg-slate-100"
                    style={{ opacity: 1 - index * 0.06 }}
                  >
                    <div>
                      <div className="text-2xl font-black tracking-tight text-slate-900">
                        {item.id}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {item.layanan}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Loket {item.loket}
                      </p>
                    </div>

                    <div className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">
                      {item.waktu}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-amber-50 px-6 py-5">
                <p className="text-sm font-bold text-amber-900">
                  Perhatian Pengunjung
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Mohon menunggu hingga nomor Anda dipanggil dan siapkan dokumen
                  yang diperlukan sebelum menuju loket.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <Ticker />
    </div>
  );
}