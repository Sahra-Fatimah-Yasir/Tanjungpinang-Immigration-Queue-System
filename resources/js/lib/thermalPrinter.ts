import * as qz from "qz-tray";

export interface ThermalTicketData {
  ticket_number?: string | null;
  service_title?: string | null;
  customer_name?: string | null;
  identity_number?: string | null;
  date?: string | null;
  time?: string | null;
  tracking_code?: string | null;
  tracking_url?: string | null;
  kanim?: string | null;
}

export interface ThermalPrintOptions {
  printerName?: string | null;
}

const DEFAULT_PRINTER_QUERY = "TM-T82";
const RECEIPT_COLUMNS = 42;

const chr = (value: number) => String.fromCharCode(value);

const command = {
  init: "\x1B\x40",
  alignLeft: "\x1B\x61\x00",
  alignCenter: "\x1B\x61\x01",
  boldOn: "\x1B\x45\x01",
  boldOff: "\x1B\x45\x00",
  normalSize: "\x1D\x21\x00",
  doubleHeight: "\x1D\x21\x01",
  doubleWidthHeight: "\x1D\x21\x11",
  fontA: "\x1B\x4D\x00",
  fontB: "\x1B\x4D\x01",
  feedAndPartialCut: "\x1D\x56\x42\x00",
};

const normalizeText = (value?: string | null) => {
  return String(value || "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "")
    .trim();
};

const centerText = (value: string, width = RECEIPT_COLUMNS) => {
  const text = normalizeText(value);
  if (text.length >= width) return text;

  const left = Math.floor((width - text.length) / 2);
  return `${" ".repeat(left)}${text}`;
};

const divider = (char = "-") => `${char.repeat(RECEIPT_COLUMNS)}\n`;

const wrapText = (value?: string | null, width = RECEIPT_COLUMNS) => {
  const text = normalizeText(value);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    if (!word) return;

    if (word.length > width) {
      if (line) {
        lines.push(line);
        line = "";
      }

      for (let index = 0; index < word.length; index += width) {
        lines.push(word.slice(index, index + width));
      }
      return;
    }

    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });

  if (line) lines.push(line);

  return lines.length > 0 ? lines : ["-"];
};

const printLabelValue = (label: string, value?: string | null) => {
  const safeLabel = normalizeText(label).slice(0, 12);
  const safeValue = normalizeText(value);
  const prefix = `${safeLabel.padEnd(12, " ")}: `;
  const valueWidth = RECEIPT_COLUMNS - prefix.length;
  const valueLines = wrapText(safeValue, valueWidth);

  return valueLines
    .map((line, index) => `${index === 0 ? prefix : " ".repeat(prefix.length)}${line}`)
    .join("\n")
    .concat("\n");
};

const buildQrCommand = (value?: string | null) => {
  const qrValue = normalizeText(value);
  if (!qrValue || qrValue === "-") return "";

  const dataLength = qrValue.length + 3;
  const pL = chr(dataLength % 256);
  const pH = chr(Math.floor(dataLength / 256));

  return [
    "\x1D\x28\x6B\x04\x00\x31\x41\x32\x00",
    "\x1D\x28\x6B\x03\x00\x31\x43\x06",
    "\x1D\x28\x6B\x03\x00\x31\x45\x31",
    `\x1D\x28\x6B${pL}${pH}\x31\x50\x30${qrValue}`,
    "\x1D\x28\x6B\x03\x00\x31\x51\x30",
  ].join("");
};

export const buildThermalTicketCommands = (ticket: ThermalTicketData) => {
  const officeName =
    ticket.kanim || "Kantor Imigrasi Kelas I TPI Tanjungpinang";
  const ticketNumber = normalizeText(ticket.ticket_number);
  const serviceCode = ticketNumber.split("-")[0] || "-";
  const trackingUrl =
    ticket.tracking_code && typeof window !== "undefined"
      ? `${window.location.origin}/track/${ticket.tracking_code}`
      : ticket.tracking_url || "";

  return [
    command.init,
    command.fontA,
    command.alignCenter,
    command.boldOn,
    "TIKET ANTRIAN\n",
    command.boldOff,
    ...wrapText(officeName, RECEIPT_COLUMNS).map((line) => `${centerText(line)}\n`),
    divider(),
    command.boldOn,
    "NOMOR ANTRIAN\n",
    command.doubleWidthHeight,
    `${ticketNumber}\n`,
    command.normalSize,
    command.boldOff,
    `KODE LAYANAN ${serviceCode}\n`,
    divider(),
    command.boldOn,
    ...wrapText(ticket.service_title, RECEIPT_COLUMNS).map((line) => `${centerText(line)}\n`),
    command.boldOff,
    "\n",
    command.alignLeft,
    printLabelValue("Nama", ticket.customer_name),
    printLabelValue("NIK/Paspor", ticket.identity_number || "-"),
    printLabelValue("Tanggal", ticket.date),
    printLabelValue("Waktu", ticket.time),
    divider(),
    command.alignCenter,
    command.boldOn,
    "PANTAU STATUS ANTRIAN\n",
    command.boldOff,
    buildQrCommand(trackingUrl),
    "\n",
    ...wrapText(trackingUrl || "-", RECEIPT_COLUMNS).map((line) => `${centerText(line)}\n`),
    divider(),
    ...wrapText(
      "Harap menunggu di area layanan dan perhatikan layar panggilan.",
      RECEIPT_COLUMNS
    ).map((line) => `${centerText(line)}\n`),
    "\n",
    command.boldOn,
    "TERIMA KASIH\n",
    command.boldOff,
    "\n\n\n",
    command.feedAndPartialCut,
  ];
};

const getQzErrorMessage = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (/websocket|connect|connection|refused|failed/i.test(message)) {
    return "QZ Tray belum berjalan atau belum terpasang di komputer ini.";
  }

  if (/printer|find|not found|cannot find/i.test(message)) {
    return "Printer thermal tidak ditemukan oleh QZ Tray.";
  }

  return message || "Gagal mengirim tiket ke printer thermal.";
};

const connectQzTray = async () => {
  if (qz.websocket.isActive()) return;

  await qz.websocket.connect({
    retries: 2,
    delay: 1,
  });
};

const resolvePrinterName = async (printerName?: string | null): Promise<string> => {
  const query = normalizeText(printerName || DEFAULT_PRINTER_QUERY);
  const found = await qz.printers.find(query);

  const printer = Array.isArray(found) ? found[0] : found;

  if (!printer) {
    throw new Error(`Printer ${query} tidak ditemukan.`);
  }

  return printer;
};

export const printThermalTicket = async (
  ticket: ThermalTicketData,
  options: ThermalPrintOptions = {}
) => {
  try {
    await connectQzTray();

    const printer = await resolvePrinterName(options.printerName);
    const config = qz.configs.create(printer, {
      encoding: "ISO-8859-1",
      forceRaw: true,
      jobName: "Tiket Antrian",
    });

    await qz.print(config, buildThermalTicketCommands(ticket));
  } catch (error) {
    throw new Error(getQzErrorMessage(error));
  }
};

export const testThermalPrinterConnection = async (printerName?: string | null) => {
  try {
    await connectQzTray();
    return await resolvePrinterName(printerName);
  } catch (error) {
    throw new Error(getQzErrorMessage(error));
  }
};
