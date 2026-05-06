import { cn } from "../lib/utils.ts";
import { 
  LayoutDashboard, 
  Ticket, 
  Monitor, 
  BarChart3, 
  Settings, 
  PlusCircle, 
  LogOut,
  Shield
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Shield, label: "Officer Management", path: "/admin/officers" },
  { icon: Monitor, label: "Counter Management", path: "/admin/counters" },
  { icon: Ticket, label: "Active Queue", path: "/admin/queue" },
  { icon: BarChart3, label: "Service Reports", path: "/admin/reports" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

  return (
    <aside className="h-screen w-64 sticky top-0 flex flex-col py-6 bg-surface-container-low border-none font-inter text-sm font-medium">
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-14 h-14 flex items-center justify-center">
          <img
            src="/images/logo.png"
            alt="Logo Imigrasi"
            className="w-18 h-18 object-contain"
          />
        </div>
        <div>
          <h2 className="text-lg font-black text-primary leading-tight uppercase tracking-tighter">Kantor Imigrasi</h2>
          <p className="text-[10px] uppercase tracking-widest text-outline font-bold">Kelas I TPI Tanjung Pinang</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center px-6 py-3 transition-all duration-200 ease-in-out",
                isActive 
                  ? "bg-white text-primary font-bold shadow-sm rounded-r-full" 
                  : "text-outline hover:bg-white/50"
              )}
            >
              <item.icon className={cn("w-5 h-5 mr-3", isActive && "fill-primary/10")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-auto">
        <Link
          to="/admin/officers"
          className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-transform"
        >
          <PlusCircle className="w-4 h-4" />
          Add Officer
        </Link>
        <div className="mt-6 pt-6 border-t border-outline-variant">
          <Link
            to="/admin/login"
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('admin_data');
            }}
            className="flex items-center text-outline px-6 py-3 hover:bg-white/50 rounded-lg transition-all duration-200 ease-in-out"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Link>
        </div>
      </div>
    </aside>
  );
}
