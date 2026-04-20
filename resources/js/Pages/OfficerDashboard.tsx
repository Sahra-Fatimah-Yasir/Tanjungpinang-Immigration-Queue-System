import Sidebar from "../Components/Sidebar.tsx";
import Header from "../Components/Header.tsx";
import { 
  Megaphone, 
  RotateCcw, 
  CheckCircle2, 
  MoveUp, 
  Timer, 
  BadgeCheck, 
  Users, 
  TrendingUp, 
  Info,
  ArrowRight,
  Headphones,
  ChevronRight
} from "lucide-react";
import { cn } from "../lib/utils.ts";

export default function OfficerDashboard() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header 
          title="Immigration Indonesia" 
          subtitle="Counter 2 - Paspor Service" 
          showUser 
        />

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Current Ticket Main Card */}
            <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border-l-4 border-secondary">
              <div className="p-8 flex-1 flex flex-col justify-center items-center text-center relative">
                <div className="absolute top-6 left-8 flex items-center gap-2">
                  <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded-full uppercase tracking-tighter font-label">Serving Now</span>
                </div>
                <span className="text-xs font-label uppercase tracking-[0.2em] text-outline mb-2">Current Ticket Number</span>
                <div className="mb-4">
                  <h2 className="text-9xl font-headline font-extrabold text-primary tracking-tighter">A-248</h2>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold font-headline text-on-surface">Rahman Hakim Al-Fatih</h3>
                  <p className="text-on-surface-variant font-medium flex items-center justify-center gap-2">
                    <BadgeCheck className="w-4 h-4" />
                    3275012304950001
                  </p>
                </div>
                
                <div className="mt-12 flex flex-wrap justify-center gap-4 w-full max-w-2xl">
                  <button className="flex-1 min-w-[160px] px-6 py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/10">
                    <Megaphone className="w-5 h-5" />
                    Panggil Antrian
                  </button>
                  <button className="flex-1 min-w-[160px] px-6 py-4 bg-surface-container-high text-primary border border-outline-variant/30 rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-white active:scale-95">
                    <RotateCcw className="w-5 h-5" />
                    Panggil Ulang
                  </button>
                  <button className="flex-1 min-w-[160px] px-6 py-4 bg-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-primary-container/20">
                    <CheckCircle2 className="w-5 h-5" />
                    Selesai
                  </button>
                  <button className="flex-1 min-w-[160px] px-6 py-4 bg-transparent text-primary border border-primary rounded-xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-primary/5 active:scale-95">
                    <MoveUp className="w-5 h-5" />
                    Transfer
                  </button>
                </div>
              </div>
              
              <div className="bg-surface-container-low px-8 py-4 flex justify-between items-center border-t border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2].map((i) => (
                      <img 
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-white object-cover" 
                        src={`https://picsum.photos/seed/user${i}/100/100`} 
                        alt="User" 
                        referrerPolicy="no-referrer"
                      />
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary-fixed text-[10px] font-bold flex items-center justify-center text-on-secondary-fixed">+12</div>
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant">Waiting in Queue</span>
                </div>
                <div className="flex items-center gap-2 text-on-tertiary-container font-bold text-sm">
                  <Timer className="w-4 h-4 animate-pulse" />
                  <span>Est. Wait: 12 Mins</span>
                </div>
              </div>
            </div>

            {/* Stats Panel */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-primary p-6 rounded-xl relative overflow-hidden group shadow-lg">
                <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Users className="w-32 h-32 text-white" />
                </div>
                <p className="text-primary-fixed-dim font-label text-[10px] uppercase tracking-widest font-bold">Total Served Today</p>
                <h4 className="text-5xl font-headline font-extrabold text-white mt-2">142</h4>
                <div className="mt-4 flex items-center gap-2 text-primary-fixed text-xs">
                  <TrendingUp className="w-4 h-4" />
                  <span>12% more than yesterday</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border-l-4 border-primary-container">
                <p className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest font-bold">In Queue Waiting</p>
                <h4 className="text-5xl font-headline font-extrabold text-primary mt-2">14</h4>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="w-full bg-surface-container h-1.5 rounded-full">
                    <div className="bg-primary-container h-full rounded-full w-[65%]" />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase text-outline">
                    <span>High Traffic</span>
                    <span>Target: 20/hr</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-bold text-sm text-on-surface">Service Details</h5>
                  <Info className="w-4 h-4 text-secondary" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-surface-container">
                    <span className="text-xs text-on-surface-variant">Service Class</span>
                    <span className="text-xs font-bold text-primary">Paspor Umum</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-surface-container">
                    <span className="text-xs text-on-surface-variant">Shift Status</span>
                    <span className="text-xs font-bold text-emerald-600 px-2 py-1 bg-emerald-50 rounded">Active</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-on-surface-variant">Login Duration</span>
                    <span className="text-xs font-bold text-primary">04:22:15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-headline font-bold text-primary">Upcoming in Queue</h3>
              <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                View Full List <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: "A-249", name: "Siti Aminah", type: "Perpanjangan Paspor" },
                { id: "A-250", name: "Marcus Wijaya", type: "Paspor Baru (E-Paspor)" },
                { id: "A-251", name: "Linh Tran", type: "Layanan WNA" },
                { id: "A-252", name: "Ahmad Subagyo", type: "Pengambilan Paspor", highlight: true },
              ].map((ticket) => (
                <div key={ticket.id} className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center font-bold",
                      ticket.highlight ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container text-primary"
                    )}>
                      {ticket.id}
                    </div>
                    <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                  </div>
                  <p className="font-bold text-on-surface mb-1 truncate">{ticket.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-wider">{ticket.type}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Assistance */}
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/50 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Need assistance with this ticket?</p>
                <p className="text-xs text-on-surface-variant">Report issues or request supervisor override.</p>
              </div>
            </div>
            <button className="px-6 py-2 border border-primary text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all">
              Contact Supervisor
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
