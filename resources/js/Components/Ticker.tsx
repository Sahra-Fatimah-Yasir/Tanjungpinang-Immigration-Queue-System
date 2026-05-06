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
    <footer className="overflow-hidden border-t-4 border-[#d4a62a] bg-[#08285e]">
      <div className="flex h-14 items-center xl:h-16">
        <div className="flex h-full shrink-0 items-center gap-2 border-r border-white/10 px-4 text-[#ffc94f] xl:gap-3 xl:px-5">
          <Megaphone className="h-5 w-5 xl:h-6 xl:w-6" />
          <span className="text-[14px] font-extrabold uppercase tracking-tight xl:text-[16px]">
            Pengumuman
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="ticker-text flex min-w-max items-center gap-12 whitespace-nowrap px-6 text-[15px] font-medium text-white xl:gap-16 xl:px-8 xl:text-[17px]">
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
