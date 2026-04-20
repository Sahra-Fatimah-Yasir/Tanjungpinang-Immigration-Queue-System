import { Megaphone } from "lucide-react";

export default function Ticker() {
  const messages = [
    "Selamat datang di Kantor Imigrasi Kelas I TPI Tanjungpinang",
    "Mohon siapkan dokumen asli dan fotokopi sebelum menuju loket pelayanan",
    "Perhatikan nomor antrean Anda pada layar display dan panggilan suara",
    "Layanan prioritas Ramah HAM tersedia sesuai ketentuan yang berlaku",
  ];

  return (
    <footer className="mt-6 w-full overflow-hidden border-t border-slate-200 bg-slate-950">
      <div className="flex h-14 items-center">
        <div className="flex h-full items-center gap-2 bg-amber-400 px-6 text-slate-950">
          <Megaphone className="h-5 w-5" />
          <span className="text-xs font-black uppercase tracking-[0.24em]">
            Informasi
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-text flex min-w-max items-center gap-20 whitespace-nowrap px-6 text-sm font-medium text-white">
            {messages.map((msg, i) => (
              <span key={i}>{msg}</span>
            ))}
            {messages.map((msg, i) => (
              <span key={`dup-${i}`}>{msg}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}