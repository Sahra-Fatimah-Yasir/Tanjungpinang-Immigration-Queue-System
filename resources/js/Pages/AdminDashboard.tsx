import Sidebar from "../Components/Sidebar.tsx"
import Header from "../Components/Header.tsx"
import { 
  TrendingDown, 
  Star, 
  StarHalf, 
  Edit3, 
  Download, 
  FileText, 
  BarChart,
  Search
} from "lucide-react";
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { cn } from "../lib/utils.ts"

const data = [
  { time: "08:00", value: 40 },
  { time: "09:00", value: 65 },
  { time: "10:00", value: 85 },
  { time: "11:00", value: 95, peak: true },
  { time: "12:00", value: 75 },
  { time: "13:00", value: 60 },
  { time: "14:00", value: 45 },
  { time: "15:00", value: 30 },
  { time: "16:00", value: 25 },
  { time: "17:00", value: 20 },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="w-full sticky top-0 z-30 bg-surface px-8 py-4 flex justify-between items-center shadow-sm">
          <h2 className="font-manrope font-bold tracking-tight text-xl text-primary">System Overview</h2>
          <div className="flex items-center gap-6">
            <div className="relative flex items-center group">
              <Search className="absolute left-3 w-4 h-4 text-outline group-focus-within:text-secondary transition-colors" />
              <input 
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-secondary/20 transition-all outline-none" 
                placeholder="Search files or tickets..." 
                type="text"
              />
            </div>
            <Header showUser title="" className="p-0 shadow-none sticky-none" />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Performance Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-sm border-l-4 border-secondary">
              <div>
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Average Wait Time</span>
                <h3 className="font-headline text-5xl font-extrabold text-primary mt-2">14<span className="text-2xl ml-1 font-semibold text-secondary">min</span></h3>
              </div>
              <div className="mt-8 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <TrendingDown className="w-4 h-4" />
                <span>12% from last hour</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden shadow-sm">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Current Queue</span>
              <h3 className="font-headline text-5xl font-extrabold text-primary mt-2">84</h3>
              <div className="mt-4 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-outline">Processing Capacity</span>
                  <span className="text-primary">85%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[85%]" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-secondary to-secondary-container p-8 rounded-xl relative overflow-hidden shadow-lg">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-secondary-fixed opacity-70">Efficiency Rate</span>
              <h3 className="font-headline text-5xl font-extrabold text-on-secondary-fixed mt-2">9.2</h3>
              <div className="mt-4 flex items-center text-on-secondary-fixed">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <StarHalf className="w-4 h-4 fill-current" />
              </div>
            </div>
          </section>

          {/* Counter Management */}
          <section className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h4 className="font-manrope font-extrabold text-2xl text-primary uppercase tracking-tight">Counter Management</h4>
                <p className="text-outline text-sm mt-1">Live allocation of officers to active service stations.</p>
              </div>
              <button className="px-6 py-2 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-all duration-300">
                View Map Layout
              </button>
            </div>
            
            <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-none">
                    <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Station</th>
                    <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Officer</th>
                    <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 font-label text-[10px] font-bold text-outline uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {[
                    { id: "01", name: "Lt. Adiwangsa", category: "New Visa", status: "Active", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD6hVnPZQb-xJBYEvFnqVzQ82zs3FtAU9kbiS5EhhekX2eHxwjO_uWV58I4_BAJ4TXaTySsCP9vBUEPwJp-ApVG-8rnziXgZRXJLVMmLRvg26ngS9vZAdRVn8dvqM37wYzEeaYp2g1PPg1Pa8eEzcd_5A1wc8iVnA20z0MJLwkgyMM8oRBf3yUM54e0nGXrfSu5Z9YU47d__MNf7hzZsELfiYYxSV5B6u4CxSA_oq2gQ2SKhk9zGG44VjNyh3TfQJvJyR8qTuwGZxAv" },
                    { id: "02", name: "Sgt. Pratama", category: "Renewal", status: "Active", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9PlD668cvYErV8DbnxpR1jRYOy0C1OPrqq6UsAKtr_LJnJ1j1St6BRBMP35X_h4mEUkSrkRDAG6vHAoPMRnPIICpqfOGQPfMqKt11xyJ5U_vz-DpLhv6Z5EVdvfxaMOW4lnyz3todocWKrySQBE0OIJUfcpYi3EZWy8Y05lrYdKiPPscbZQiqIrRYV4yW6EIILcgh0psruLNTZFf7TDYz6ZdVRtc6MQsMVAGwB7eQ4MBMePiLMuqbPeHaET2yB7LO2CsDmsTvW5NA" },
                    { id: "03", name: "Capt. Wijaya", category: "Emergency", status: "On Break", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcdeyc9BgYdOCLU2CLNB-e22g7vkP8p3nopU_245k37ic5hguNum9PLgbbdNtQwYA8XveWYwp1cXrgMZfghYxjvb8rCmM4GfAbuMMKjXKWU5muoGr76Tfe8hVUd1JUDvBDYMabnTBlnIWmhlEk-wRM06XsuCjeLKHs-4D5OXWzGreTpXD0Pdz324pEDZYY0fFYiUqldk-Y6HcUWqMkA5IK6qusszEjhp87PklcLKIJGMdpGoL-ETCpdNZmn2NHA2Q3rnEsyNrz1D-u" },
                  ].map((counter) => (
                    <tr key={counter.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-5 font-headline font-bold text-primary">Counter {counter.id}</td>
                      <td className="px-6 py-5 flex items-center gap-3">
                        <img className="w-8 h-8 rounded-full object-cover" src={counter.img} alt={counter.name} referrerPolicy="no-referrer" />
                        <span className="font-medium text-sm">{counter.name}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          counter.category === "New Visa" ? "bg-primary-fixed text-on-primary-fixed" : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
                        )}>
                          {counter.category}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            counter.status === "Active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"
                          )} />
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            counter.status === "Active" ? "text-emerald-700" : "text-amber-700"
                          )}>
                            {counter.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <button className="text-primary hover:text-secondary transition-colors">
                          <Edit3 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Reports & Analytics */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            <div className="lg:col-span-1 bg-surface-container-low p-8 rounded-xl flex flex-col justify-between shadow-sm">
              <div>
                <h4 className="font-manrope font-extrabold text-xl text-primary tracking-tight uppercase">Daily Intelligence</h4>
                <p className="text-outline text-sm mt-1">Export operational data for audit and review.</p>
              </div>
              <div className="mt-8 space-y-4">
                {[
                  { label: "Today's Summary", icon: FileText },
                  { label: "Monthly Performance", icon: BarChart },
                ].map((report) => (
                  <div key={report.label} className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between group hover:border-secondary transition-all border-l-4 border-l-transparent hover:border-l-secondary cursor-pointer">
                    <div className="flex items-center gap-3">
                      <report.icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-semibold">{report.label}</span>
                    </div>
                    <Download className="w-4 h-4 text-outline group-hover:text-primary" />
                  </div>
                ))}
              </div>
              <button className="mt-8 w-full py-3 bg-primary text-white font-bold rounded-lg transition-transform active:scale-95 duration-150 shadow-lg shadow-primary/20">
                Generate Custom Report
              </button>
            </div>

            <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h4 className="font-manrope font-extrabold text-xl text-primary tracking-tight uppercase">Queue Volume</h4>
                  <p className="text-outline text-sm mt-1">Real-time load balancing analysis</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-surface-container text-[10px] font-bold rounded uppercase tracking-wider">24H</span>
                  <span className="px-3 py-1 text-[10px] font-bold rounded text-outline uppercase tracking-wider">7D</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#767683', fontWeight: 600 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#767683', fontWeight: 600 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f9f9f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.peak ? '#775a19' : '#b0c6ff'} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 pt-6 border-t border-outline-variant/20 flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#b0c6ff]" />
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Average Traffic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#775a19]" />
                  <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Peak Demand</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-auto px-8 py-4 bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">System Online</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-outline">v4.2.0-Production</div>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-outline">
            © 2024 Directorate General of Immigration Indonesia
          </div>
        </footer>
      </main>
    </div>
  );
}
