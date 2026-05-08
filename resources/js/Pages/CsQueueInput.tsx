import { useEffect, useState } from "react";
import { Printer, Ticket } from "lucide-react";
import TicketPrint from "../Components/TicketPrint.js";
import { formatDateWib, formatTimeWib } from "../lib/dateTime.ts";

interface Service {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  is_priority: boolean;
}

const AUTO_PRINT_SETTING_KEY = "cs-auto-print-ticket";
const PRINT_FRAME_ID = "ticket-print-frame";

const buildPrintDocument = (printContents: string) => `
  <!doctype html>
  <html>
    <head>
      <title>Print Tiket</title>
      <style>
        @page {
          size: 72mm 180mm;
          margin: 0;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          width: 72mm;
          min-width: 72mm;
          background: #ffffff;
          color: #000000;
          font-family: Arial, Helvetica, sans-serif;
        }

        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        img,
        svg {
          display: block;
        }

        #ticket-print {
          width: 72mm !important;
          max-width: 72mm !important;
          box-shadow: none !important;
        }
      </style>
    </head>
    <body>
      ${printContents}
    </body>
  </html>
`;

const waitForPrintImages = (frameDocument: Document) => {
  const images = Array.from(frameDocument.images);

  if (images.length === 0) {
    return Promise.resolve();
  }

  return Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        })
    )
  ).then(() => undefined);
};

const printTicketMarkup = (printContents: string) => {
  document.getElementById(PRINT_FRAME_ID)?.remove();

  const frame = document.createElement("iframe");
  frame.id = PRINT_FRAME_ID;
  frame.title = "Cetak tiket antrian";
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "1px";
  frame.style.height = "1px";
  frame.style.border = "0";
  frame.style.opacity = "0";
  frame.style.visibility = "hidden";

  document.body.appendChild(frame);

  const frameWindow = frame.contentWindow;
  const frameDocument = frame.contentDocument || frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    frame.remove();
    return false;
  }

  frameDocument.open();
  frameDocument.write(buildPrintDocument(printContents));
  frameDocument.close();

  const cleanup = () => window.setTimeout(() => frame.remove(), 1000);
  frameWindow.addEventListener("afterprint", cleanup, { once: true });

  waitForPrintImages(frameDocument).then(() => {
    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
    }, 250);
  });

  window.setTimeout(cleanup, 60000);

  return true;
};

export default function CsQueueInput() {
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoPrintTicket, setAutoPrintTicket] = useState(() => {
    try {
      return window.localStorage.getItem(AUTO_PRINT_SETTING_KEY) !== "false";
    } catch {
      return true;
    }
  });
  const [pendingAutoPrint, setPendingAutoPrint] = useState(false);

  const selectedServiceData = services.find((s) => s.id === selectedService);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch("/api/services", {
          headers: { Accept: "application/json" },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Gagal memuat layanan.");
        }

        setServices(data.data || []);
      } catch (err: any) {
        setError(err.message || "Gagal memuat layanan.");
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        AUTO_PRINT_SETTING_KEY,
        autoPrintTicket ? "true" : "false"
      );
    } catch {
      // Keep printing usable even when browser storage is unavailable.
    }
  }, [autoPrintTicket]);

  const handlePrintTicket = () => {
    const printContents = document.getElementById("ticket-print")?.outerHTML;

    if (!printContents) {
      setError("Tiket belum siap dicetak.");
      return;
    }

    const printStarted = printTicketMarkup(printContents);

    if (!printStarted) {
      setError("Gagal membuka dialog cetak. Coba tekan tombol Print Tiket.");
    }
  };

  useEffect(() => {
    if (!result || !pendingAutoPrint) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handlePrintTicket();
      setPendingAutoPrint(false);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [result, pendingAutoPrint]);

  const generate = async () => {
    setError("");
    setResult(null);
    setPendingAutoPrint(false);

    if (!name.trim()) {
      setError("Nama pemohon wajib diisi.");
      return;
    }

    if (!selectedService) {
      setError("Pilih jenis layanan terlebih dahulu.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/queue/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          service_category_id: selectedService,
          customer_name: name.trim(),
          identity_number: nik.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal membuat nomor antrian.");
      }

      const ticketData = {
        ...data.data.queue,
        customer_name: name.trim(),
        identity_number: nik.trim(),
        service_title: selectedServiceData?.name || data.data.queue.service.name,
        service_desc:
          selectedServiceData?.description || data.data.queue.service.description,
        kanim: "Kantor Imigrasi Kelas I TPI Tanjungpinang",
        date: formatDateWib(new Date(), {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        time: formatTimeWib(new Date()),
        tracking_url:
          data.data.queue.tracking_url ||
          `${window.location.origin}/track/${data.data.queue.tracking_code}`,
      };

      setResult(ticketData);
      setPendingAutoPrint(autoPrintTicket);
      setName("");
      setNik("");
      setSelectedService(null);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-outline-variant bg-surface-container-lowest px-8 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo.png"
              alt="Logo Imigrasi"
              className="h-14 w-14 object-contain"
            />

            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-primary">
                Input Antrian CS
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-outline">
                Kantor Imigrasi Kelas I TPI Tanjungpinang
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-black text-primary">
              {formatTimeWib(new Date())}
            </p>
            <p className="text-xs font-semibold text-outline">
              {formatDateWib(new Date())}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 p-8 xl:grid-cols-12">
        <section className="space-y-8 xl:col-span-8">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="text-lg font-black text-primary">Data Pemohon</h2>
            <p className="mt-1 text-sm text-outline">
              CS cukup mengisi nama, NIK/No Paspor, lalu memilih layanan.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-outline">
                  Nama Pemohon
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama pemohon"
                  className="w-full rounded-xl border border-outline-variant px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-outline">
                  NIK / No. Paspor
                </label>
                <input
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  placeholder="Opsional"
                  className="w-full rounded-xl border border-outline-variant px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-black text-primary">Pilih Layanan</h2>
            <p className="mt-1 text-sm text-outline">
              Deskripsi layanan mengikuti kategori antrean yang digunakan kantor.
            </p>

            {servicesLoading && (
              <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-sm font-semibold text-outline">
                Memuat layanan...
              </div>
            )}

            {!servicesLoading && services.length === 0 && (
              <div className="mt-5 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-sm font-semibold text-outline">
                Belum ada layanan aktif.
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {services.map((service) => {
                const active = selectedService === service.id;

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service.id)}
                    className={`rounded-2xl border p-6 text-left shadow-sm transition-all ${
                      active
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-outline-variant bg-surface-container-lowest hover:border-primary hover:shadow-md"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-black text-white">
                        {service.code}
                      </div>

                      {active && (
                        <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                          Dipilih
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-primary">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {service.description || "Layanan keimigrasian."}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-bold text-primary shadow-sm">
              <input
                type="checkbox"
                checked={autoPrintTicket}
                onChange={(event) => setAutoPrintTicket(event.target.checked)}
                className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
              />
              Auto cetak setelah generate
            </label>

            <button
              type="button"
              onClick={generate}
              disabled={loading || servicesLoading || !selectedService}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-10 py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Printer className="h-5 w-5" />
              {loading ? "Memproses..." : "Generate Tiket"}
            </button>
          </div>
        </section>

        <aside className="xl:col-span-4">
          <div className="sticky top-8 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <h2 className="text-lg font-black text-primary">Preview Tiket</h2>
            <p className="mt-1 text-sm text-outline">
              Tiket akan muncul setelah nomor antrean berhasil dibuat.
            </p>

            <div className="mt-6 rounded-2xl border border-dashed border-outline-variant bg-white p-6 text-center">
              {result ? (
                <>
                  <div className="overflow-x-auto pb-1">
                    <div className="mx-auto w-fit">
                      <TicketPrint id="ticket-preview" data={result} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrintTicket}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary px-6 py-3 font-bold text-primary transition hover:bg-primary hover:text-white"
                  >
                    <Printer className="h-5 w-5" />
                    Print Tiket
                  </button>
                </>
              ) : (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-outline">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-container-low text-primary">
                    <Ticket className="h-10 w-10" />
                  </div>
                  <p className="font-bold text-primary">Belum ada tiket</p>
                  <p className="mt-1 text-sm">
                    Isi data dan pilih layanan untuk membuat tiket.
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      <div style={{ display: "none" }}>
        {result && <TicketPrint data={result} />}
      </div>
    </div>
  );
}
