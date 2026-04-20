import Header from "../Components/Header.tsx";
import QueueCard from "../Components/QueueCard.tsx";
import Ticker from "../Components/Ticker.tsx";
import { RotateCcw } from "lucide-react";

export default function PublicDisplay() {
  const histories = [
    { id: "A-242", service: "PASPOR", counter: "COUNTER 3", time: "2 mins ago" },
    { id: "C-087", service: "IZIN TINGGAL", counter: "COUNTER 6", time: "5 mins ago" },
    { id: "B-011", service: "CUSTOMER SERVICE", counter: "COUNTER 2", time: "8 mins ago" },
    { id: "A-241", service: "PASPOR", counter: "COUNTER 4", time: "12 mins ago" },
  ];

  return (
    <div className="min-h-screen bg-[#eef1f5] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[1600px] overflow-hidden rounded-[28px] border-[6px] border-slate-400/40 bg-[#f7f7f8] shadow-2xl">
        <Header
          title="IMMIGRATION INDONESIA"
          subtitle="KANTOR IMIGRASI KELAS I TPI TANJUNGPINANG"
        />

        <main className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-12">
          <section className="xl:col-span-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <QueueCard
                category="CATEGORY: PASSPORT SERVICE"
                title="Paspor"
                counters="Counters 1, 2, 3, 4"
                ticketNumber="A-243"
                status="ACTIVE"
                accent="gold"
              />

              <QueueCard
                category="CATEGORY: INFORMATION"
                title="Customer Service"
                counters="Counters 1, 2"
                ticketNumber="B-012"
                status="LIVE"
                accent="blue"
              />

              <QueueCard
                category="CATEGORY: HUMAN RIGHTS FRIENDLY"
                title="Ramah HAM"
                counters="Counter 1 (Priority)"
                ticketNumber="R-005"
                status="PRIORITY"
                accent="gold"
                isPriority
              />

              <QueueCard
                category="CATEGORY: STAY PERMIT"
                title="Izin Tinggal"
                counters="Counter 5, 6"
                ticketNumber="C-088"
                status="PROCESSING"
                accent="blue"
              />
            </div>
          </section>

          <aside className="xl:col-span-4">
            <div className="flex h-full flex-col gap-5">
              <div className="relative overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80"
                  alt="Informasi edukasi layanan"
                  className="h-[180px] w-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08285e] via-[#0b2c64]/70 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-[18px] font-bold tracking-tight text-white md:text-[20px]">
                    Prosedur Pembuatan E-Paspor Baru
                  </h3>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.22em] text-blue-100">
                    Informasi Edukasi Layanan
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-hidden rounded-2xl bg-[#ececec] shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200/70 px-6 py-5">
                  <RotateCcw className="h-4 w-4 text-slate-700" />
                  <h3 className="text-[13px] font-bold uppercase tracking-[0.22em] text-slate-800">
                    Recent History
                  </h3>
                </div>

                <div className="space-y-3 p-4">
                  {histories.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                    >
                      <div>
                        <div className="text-[22px] font-extrabold tracking-tight text-[#08285e]">
                          {item.id}
                        </div>
                        <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                          {item.service} - {item.counter}
                        </div>
                      </div>
                      <div className="text-[12px] font-medium text-slate-500">
                        {item.time}
                      </div>
                    </div>
                  ))}
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

interface QueueCardProps {
  category: string
  title: string
  counters: string
  ticketNumber: string
  status: string
  accent: string
  isPriority?: boolean
}