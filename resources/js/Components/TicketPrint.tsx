import { QRCodeSVG } from "qrcode.react";

export default function TicketPrint({ data }: any) {
  const trackingUrl =
    data.tracking_url ||
    `${window.location.origin}/track/${data.tracking_code}`;

  return (
    <div
      id="ticket-print"
      style={{
        width: "58mm",
        maxWidth: "58mm",
        background: "#ffffff",
        color: "#000000",
        padding: "4mm",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        textAlign: "center",
      }}
    >
      <img
        src="/images/logo.png"
        alt="Logo Imigrasi"
        style={{
          width: "14mm",
          height: "14mm",
          objectFit: "contain",
          margin: "0 auto 2mm",
        }}
      />

      <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>
        Kantor Imigrasi
      </div>

      <div style={{ fontSize: "9px", fontWeight: 600, marginTop: "1mm" }}>
        Kelas I TPI Tanjungpinang
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "3mm 0" }} />

      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>
        Nomor Antrian
      </div>

      <div
        style={{
          fontSize: "34px",
          fontWeight: 900,
          lineHeight: 1.1,
          margin: "2mm 0",
          letterSpacing: "1px",
        }}
      >
        {data.ticket_number}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "3mm 0" }} />

      <div style={{ textAlign: "left", fontSize: "9.5px", lineHeight: 1.5 }}>
        <div>
          <strong>Nama:</strong> {data.customer_name || "-"}
        </div>
        <div>
          <strong>NIK/No Paspor:</strong> {data.identity_number || "-"}
        </div>
        <div>
          <strong>Layanan:</strong> {data.service_title || "-"}
        </div>
        <div>
          <strong>Tanggal:</strong> {data.date || "-"}
        </div>
        <div>
          <strong>Waktu:</strong> {data.time || "-"}
        </div>
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "3mm 0" }} />

      <div style={{ display: "flex", justifyContent: "center", marginTop: "2mm" }}>
        <QRCodeSVG value={trackingUrl} size={92} />
      </div>

      <div style={{ fontSize: "8.5px", fontWeight: 700, marginTop: "2mm" }}>
        Scan untuk cek status antrian
      </div>

      <div
        style={{
          fontSize: "7px",
          marginTop: "1.5mm",
          wordBreak: "break-all",
          lineHeight: 1.3,
        }}
      >
        {trackingUrl}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "3mm 0" }} />

      <div style={{ fontSize: "8.5px", lineHeight: 1.4 }}>
        Harap menunggu hingga nomor Anda dipanggil.
      </div>

      <div style={{ fontSize: "8px", marginTop: "2mm" }}>
        Terima kasih
      </div>
    </div>
  );
}
