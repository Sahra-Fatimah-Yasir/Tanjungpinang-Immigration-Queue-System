import Sidebar from '../../Components/Sidebar.tsx';
import Header from '../../Components/Header.tsx';
import { Settings, ShieldCheck, Database, Users, Building2 } from 'lucide-react';

export default function AdminSettings() {
  const admin = JSON.parse(localStorage.getItem('admin_data') || '{}');

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="w-full sticky top-0 z-30 bg-surface px-8 py-4 flex justify-between items-center shadow-sm">
          <h2 className="font-manrope font-bold tracking-tight text-xl text-primary">
            System Settings
          </h2>
          <Header showUser title="" className="p-0 shadow-none sticky-none" />
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-primary">Pengaturan Sistem</h1>
            </div>
            <p className="text-outline">
              Ringkasan konfigurasi sistem antrian Kantor Imigrasi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-blue-700 mb-4" />
              <p className="text-sm text-outline">Role Admin</p>
              <h2 className="text-xl font-black text-primary">
                {admin.role || 'SUPER_ADMIN'}
              </h2>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <Users className="w-8 h-8 text-emerald-700 mb-4" />
              <p className="text-sm text-outline">Officer</p>
              <h2 className="text-xl font-black text-primary">
                Kelola di menu Officer
              </h2>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <Building2 className="w-8 h-8 text-amber-700 mb-4" />
              <p className="text-sm text-outline">Loket</p>
              <h2 className="text-xl font-black text-primary">
                Kelola di menu Counter
              </h2>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-6 shadow-sm">
              <Database className="w-8 h-8 text-purple-700 mb-4" />
              <p className="text-sm text-outline">Database</p>
              <h2 className="text-xl font-black text-primary">
                SQLite / Laravel
              </h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}