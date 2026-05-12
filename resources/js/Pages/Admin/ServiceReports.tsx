import { useEffect, useState } from "react";
import type { Workbook as ExcelWorkbook, Worksheet } from "exceljs";
import Sidebar from "../../Components/Sidebar.tsx";
import Header from "../../Components/Header.tsx";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  Ticket,
  Timer,
  XCircle,
} from "lucide-react";
import {
  formatDateTimeWib,
  formatDateWib,
  getWibDateStamp,
} from "../../lib/dateTime.ts";

interface QueueReportSummary {
  total_queues: number;
  waiting: number;
  calling: number;
  serving: number;
  completed: number;
  skipped: number;
  avg_wait_time: number | null;
  avg_service_time: number | null;
}

interface QueueReportService extends QueueReportSummary {
  service_id: number | null;
  service_code: string | null;
  service_name: string | null;
  is_priority: boolean;
}

interface QueueReportOfficer {
  id: number;
  nip: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

interface QueueReportActivity {
  id: number;
  action: string;
  action_label: string;
  notes?: string | null;
  timestamp?: string | null;
  officer?: QueueReportOfficer | null;
}

interface QueueReportQueue {
  id: number;
  ticket_number: string;
  sequence_number: number;
  tracking_code?: string | null;
  tracking_url?: string | null;
  customer_name?: string | null;
  identity_number?: string | null;
  status: string;
  status_label: string;
  date?: string | null;
  created_at?: string | null;
  called_at?: string | null;
  served_at?: string | null;
  completed_at?: string | null;
  updated_at?: string | null;
  wait_time_minutes?: number | null;
  service_time_minutes?: number | null;
  total_time_minutes?: number | null;
  service: {
    id: number | null;
    code: string | null;
    name: string | null;
    description?: string | null;
    is_priority: boolean;
    max_counters?: number | null;
  };
  counter?: {
    id: number;
    code: string;
    number: number;
    status: string;
    service_code?: string | null;
    service_name?: string | null;
  } | null;
  officers: {
    called_by?: QueueReportOfficer | null;
    completed_by?: QueueReportOfficer | null;
    skipped_by?: QueueReportOfficer | null;
    last_handled_by?: QueueReportOfficer | null;
  };
  activities: QueueReportActivity[];
}

interface QueueReport {
  date_range: {
    from: string;
    to: string;
    generated_at: string;
  };
  summary: QueueReportSummary;
  by_service: QueueReportService[];
  queues: QueueReportQueue[];
}

type SheetColumn = {
  header: string;
  key: string;
  width?: number;
};

const excelMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const empty = (value: unknown) =>
  value === null || value === undefined || value === "" ? "-" : value;

const yesNo = (value: boolean) => (value ? "Ya" : "Tidak");

const formatMaybeDate = (value?: string | null) => {
  if (!value) return "-";

  return formatDateWib(value, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatMaybeDateTime = (value?: string | null) => {
  if (!value) return "-";

  return formatDateTimeWib(value, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const styleWorksheet = (worksheet: Worksheet) => {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };

  const header = worksheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF08285E" },
  };
  header.alignment = { vertical: "middle", wrapText: true };

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
      cell.alignment = { vertical: "top", wrapText: true };
    });
  });
};

const addWorksheet = (
  workbook: ExcelWorkbook,
  name: string,
  columns: SheetColumn[],
  rows: Record<string, unknown>[]
) => {
  const worksheet = workbook.addWorksheet(name);
  worksheet.columns = columns;
  worksheet.addRows(rows);
  styleWorksheet(worksheet);
  return worksheet;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const buildExcelReport = async (report: QueueReport) => {
  const { Workbook } = await import("exceljs");
  const workbook: ExcelWorkbook = new Workbook();
  workbook.creator = "Sistem Antrian Imigrasi";
  workbook.created = new Date();
  workbook.modified = new Date();

  addWorksheet(
    workbook,
    "Ringkasan",
    [
      { header: "Metrik", key: "metric", width: 32 },
      { header: "Nilai", key: "value", width: 28 },
    ],
    [
      { metric: "Tanggal Awal", value: formatMaybeDate(report.date_range.from) },
      { metric: "Tanggal Akhir", value: formatMaybeDate(report.date_range.to) },
      {
        metric: "Dibuat Pada",
        value: formatMaybeDateTime(report.date_range.generated_at),
      },
      { metric: "Total Antrian", value: report.summary.total_queues },
      { metric: "Menunggu", value: report.summary.waiting },
      { metric: "Sedang Dipanggil", value: report.summary.calling },
      { metric: "Sedang Dilayani", value: report.summary.serving },
      { metric: "Selesai Dilayani", value: report.summary.completed },
      { metric: "Dilewati", value: report.summary.skipped },
      {
        metric: "Rata-rata Tunggu (menit)",
        value: report.summary.avg_wait_time ?? 0,
      },
      {
        metric: "Rata-rata Layanan (menit)",
        value: report.summary.avg_service_time ?? 0,
      },
    ]
  );

  addWorksheet(
    workbook,
    "Per Layanan",
    [
      { header: "ID Layanan", key: "service_id", width: 12 },
      { header: "Kode", key: "service_code", width: 10 },
      { header: "Nama Layanan", key: "service_name", width: 28 },
      { header: "Prioritas", key: "is_priority", width: 12 },
      { header: "Total", key: "total_queues", width: 10 },
      { header: "Menunggu", key: "waiting", width: 12 },
      { header: "Dipanggil", key: "calling", width: 12 },
      { header: "Dilayani", key: "serving", width: 12 },
      { header: "Selesai", key: "completed", width: 12 },
      { header: "Dilewati", key: "skipped", width: 12 },
      { header: "Avg Tunggu (mnt)", key: "avg_wait_time", width: 18 },
      { header: "Avg Layanan (mnt)", key: "avg_service_time", width: 18 },
    ],
    report.by_service.map((service) => ({
      ...service,
      is_priority: yesNo(service.is_priority),
      avg_wait_time: service.avg_wait_time ?? 0,
      avg_service_time: service.avg_service_time ?? 0,
    }))
  );

  addWorksheet(
    workbook,
    "Detail Antrian",
    [
      { header: "Queue ID", key: "id", width: 10 },
      { header: "Tanggal Operasional", key: "date", width: 22 },
      { header: "Nomor Tiket", key: "ticket_number", width: 16 },
      { header: "Nomor Urut", key: "sequence_number", width: 12 },
      { header: "Service ID", key: "service_id", width: 12 },
      { header: "Kode Layanan", key: "service_code", width: 14 },
      { header: "Nama Layanan", key: "service_name", width: 28 },
      { header: "Deskripsi Layanan", key: "service_description", width: 34 },
      { header: "Prioritas", key: "is_priority", width: 12 },
      { header: "Maks Loket", key: "max_counters", width: 12 },
      { header: "Nama Pemohon", key: "customer_name", width: 26 },
      { header: "NIK/Paspor", key: "identity_number", width: 22 },
      { header: "Status", key: "status", width: 14 },
      { header: "Label Status", key: "status_label", width: 20 },
      { header: "Counter ID", key: "counter_id", width: 12 },
      { header: "Kode Loket", key: "counter_code", width: 16 },
      { header: "Nomor Loket", key: "counter_number", width: 12 },
      { header: "Status Loket", key: "counter_status", width: 14 },
      { header: "Petugas Panggil", key: "called_by_name", width: 24 },
      { header: "NIP Panggil", key: "called_by_nip", width: 22 },
      { header: "Petugas Selesai", key: "completed_by_name", width: 24 },
      { header: "NIP Selesai", key: "completed_by_nip", width: 22 },
      { header: "Petugas Lewati", key: "skipped_by_name", width: 24 },
      { header: "NIP Lewati", key: "skipped_by_nip", width: 22 },
      { header: "Petugas Terakhir", key: "last_handled_by_name", width: 24 },
      { header: "NIP Petugas Terakhir", key: "last_handled_by_nip", width: 22 },
      { header: "Dibuat Pada", key: "created_at", width: 24 },
      { header: "Dipanggil Pada", key: "called_at", width: 24 },
      { header: "Mulai Dilayani Pada", key: "served_at", width: 24 },
      { header: "Selesai/Dilewati Pada", key: "completed_at", width: 24 },
      { header: "Update Terakhir", key: "updated_at", width: 24 },
      { header: "Waktu Tunggu (mnt)", key: "wait_time_minutes", width: 18 },
      { header: "Waktu Layanan (mnt)", key: "service_time_minutes", width: 19 },
      { header: "Total Waktu (mnt)", key: "total_time_minutes", width: 18 },
      { header: "Tracking Code", key: "tracking_code", width: 30 },
      { header: "Tracking URL", key: "tracking_url", width: 46 },
    ],
    report.queues.map((queue) => ({
      id: queue.id,
      date: formatMaybeDate(queue.date),
      ticket_number: queue.ticket_number,
      sequence_number: queue.sequence_number,
      service_id: empty(queue.service.id),
      service_code: empty(queue.service.code),
      service_name: empty(queue.service.name),
      service_description: empty(queue.service.description),
      is_priority: yesNo(queue.service.is_priority),
      max_counters: empty(queue.service.max_counters),
      customer_name: empty(queue.customer_name),
      identity_number: empty(queue.identity_number),
      status: queue.status,
      status_label: queue.status_label,
      counter_id: empty(queue.counter?.id),
      counter_code: empty(queue.counter?.code),
      counter_number: empty(queue.counter?.number),
      counter_status: empty(queue.counter?.status),
      called_by_name: empty(queue.officers.called_by?.name),
      called_by_nip: empty(queue.officers.called_by?.nip),
      completed_by_name: empty(queue.officers.completed_by?.name),
      completed_by_nip: empty(queue.officers.completed_by?.nip),
      skipped_by_name: empty(queue.officers.skipped_by?.name),
      skipped_by_nip: empty(queue.officers.skipped_by?.nip),
      last_handled_by_name: empty(queue.officers.last_handled_by?.name),
      last_handled_by_nip: empty(queue.officers.last_handled_by?.nip),
      created_at: formatMaybeDateTime(queue.created_at),
      called_at: formatMaybeDateTime(queue.called_at),
      served_at: formatMaybeDateTime(queue.served_at),
      completed_at: formatMaybeDateTime(queue.completed_at),
      updated_at: formatMaybeDateTime(queue.updated_at),
      wait_time_minutes: queue.wait_time_minutes ?? 0,
      service_time_minutes: queue.service_time_minutes ?? 0,
      total_time_minutes: queue.total_time_minutes ?? 0,
      tracking_code: empty(queue.tracking_code),
      tracking_url: empty(queue.tracking_url),
    }))
  );

  const activityRows = report.queues.flatMap((queue) =>
    queue.activities.map((activity) => ({
      activity_id: activity.id,
      queue_id: queue.id,
      ticket_number: queue.ticket_number,
      date: formatMaybeDate(queue.date),
      action: activity.action,
      action_label: activity.action_label,
      timestamp: formatMaybeDateTime(activity.timestamp),
      officer_id: empty(activity.officer?.id),
      officer_nip: empty(activity.officer?.nip),
      officer_name: empty(activity.officer?.name),
      officer_email: empty(activity.officer?.email),
      officer_phone: empty(activity.officer?.phone),
      officer_role: empty(activity.officer?.role),
      notes: empty(activity.notes),
    }))
  );

  addWorksheet(
    workbook,
    "Aktivitas Petugas",
    [
      { header: "Activity ID", key: "activity_id", width: 12 },
      { header: "Queue ID", key: "queue_id", width: 10 },
      { header: "Nomor Tiket", key: "ticket_number", width: 16 },
      { header: "Tanggal Operasional", key: "date", width: 22 },
      { header: "Kode Aksi", key: "action", width: 18 },
      { header: "Aksi", key: "action_label", width: 24 },
      { header: "Waktu Aksi", key: "timestamp", width: 24 },
      { header: "Officer ID", key: "officer_id", width: 12 },
      { header: "NIP Petugas", key: "officer_nip", width: 22 },
      { header: "Nama Petugas", key: "officer_name", width: 26 },
      { header: "Email Petugas", key: "officer_email", width: 30 },
      { header: "Telepon Petugas", key: "officer_phone", width: 18 },
      { header: "Role Petugas", key: "officer_role", width: 16 },
      { header: "Catatan", key: "notes", width: 32 },
    ],
    activityRows
  );

  return workbook.xlsx.writeBuffer();
};

export default function ServiceReports() {
  const today = getWibDateStamp();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [report, setReport] = useState<QueueReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const loadReport = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
      });

      const response = await fetch(`/api/queue/report?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memuat laporan");
      }

      setReport(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleDownload = async () => {
    if (!report) return;

    setExporting(true);
    setError("");

    try {
      const buffer = await buildExcelReport(report);
      const blob = new Blob([buffer], { type: excelMimeType });
      const from = report.date_range.from;
      const to = report.date_range.to;
      const suffix = from === to ? from : `${from}-sd-${to}`;

      downloadBlob(blob, `laporan-antrian-lengkap-${suffix}.xlsx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat file Excel");
    } finally {
      setExporting(false);
    }
  };

  const stats = report?.summary;
  const rangeLabel =
    report && report.date_range.from === report.date_range.to
      ? formatMaybeDate(report.date_range.from)
      : report
        ? `${formatMaybeDate(report.date_range.from)} - ${formatMaybeDate(report.date_range.to)}`
        : formatMaybeDate(today);

  const cards = [
    {
      label: "Total Antrian",
      value: stats?.total_queues ?? 0,
      icon: Ticket,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Selesai",
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Dilewati",
      value: stats?.skipped ?? 0,
      icon: XCircle,
      color: "text-red-700",
      bg: "bg-red-50",
    },
    {
      label: "Rata-rata Layanan",
      value: `${stats?.avg_service_time ?? 0} mnt`,
      icon: Timer,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />

      <main className="flex h-screen flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-30 flex w-full items-center justify-between bg-surface px-8 py-4 shadow-sm">
          <h2 className="font-manrope text-xl font-bold tracking-tight text-primary">
            Service Reports
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadReport}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-2 font-bold text-primary transition-colors hover:bg-white disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Header showUser title="" className="sticky-none p-0 shadow-none" />
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl space-y-8 p-8">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">
                  Tanggal Awal
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-4 py-3 font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-outline">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant px-4 py-3 font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="button"
                onClick={loadReport}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-5 py-3 font-bold text-primary transition hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarDays className="h-4 w-4" />
                Terapkan
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!report || exporting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Membuat..." : "Download Excel"}
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl bg-surface-container-lowest p-6 shadow-sm"
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 ${card.bg}`}>
                  <card.icon className={`h-7 w-7 ${card.color}`} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-outline">
                  {card.label}
                </p>
                <h3 className="mt-2 text-4xl font-black text-primary">
                  {card.value}
                </h3>
              </div>
            ))}
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="h-7 w-7 text-primary" />
                <div>
                  <h3 className="font-manrope text-xl font-extrabold text-primary">
                    Laporan Lengkap Antrian
                  </h3>
                  <p className="text-sm text-outline">
                    Data operasional {rangeLabel}.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-surface-container-low px-4 py-3 text-sm font-bold text-primary">
                {report?.queues.length ?? 0} baris detail
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-surface-container-low p-5">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-bold text-primary">Rata-rata Tunggu</span>
                </div>
                <p className="mt-3 text-3xl font-black text-primary">
                  {stats?.avg_wait_time ?? 0} menit
                </p>
              </div>

              <div className="rounded-xl bg-surface-container-low p-5">
                <div className="flex items-center gap-3">
                  <Timer className="h-5 w-5 text-primary" />
                  <span className="font-bold text-primary">Rata-rata Layanan</span>
                </div>
                <p className="mt-3 text-3xl font-black text-primary">
                  {stats?.avg_service_time ?? 0} menit
                </p>
              </div>

              <div className="rounded-xl bg-surface-container-low p-5">
                <div className="flex items-center gap-3">
                  <Ticket className="h-5 w-5 text-primary" />
                  <span className="font-bold text-primary">Masih Aktif</span>
                </div>
                <p className="mt-3 text-3xl font-black text-primary">
                  {(stats?.waiting ?? 0) + (stats?.calling ?? 0) + (stats?.serving ?? 0)}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
