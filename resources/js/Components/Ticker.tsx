import { Megaphone } from "lucide-react";

export default function Ticker() {
  const messages = [
    "Selamat Datang di Kantor Imigrasi Kelas I TPI Tanjungpinang",
    "KAMI MELAYANI DENGAN HATI DAN INTEGRITAS",
    "Siapkan berkas asli dan fotokopi Anda untuk mempercepat proses verifikasi",
    "Pembayaran paspor hanya melalui bank atau pos",
    "Terima kasih telah menunggu dengan tertib",
  ];

  return (
    <footer className="overflow-hidden border-t-2 border-[#d4a62a] bg-[#08285e]">
      <div className="flex h-10 items-center">
        <div className="flex h-full shrink-0 items-center gap-2 border-r border-white/10 px-3 text-[#ffc94f]">
          <Megaphone className="h-4 w-4" />
          <span className="text-[12px] font-extrabold uppercase tracking-tight">
            Pengumuman
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-text flex min-w-max items-center gap-10 whitespace-nowrap px-5 text-[13px] font-medium text-white">
            {messages.map((msg, index) => (
              <span key={index}>- {msg}</span>
            ))}
            {messages.map((msg, index) => (
              <span key={`dup-${index}`}>- {msg}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
