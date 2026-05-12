import { QRCodeSVG } from "qrcode.react";

interface TicketPrintProps {
  data: any;
  id?: string;
}

const separatorStyle = {
  borderTop: "1px dashed #666666",
  margin: "3mm 0",
} as const;

const rowLabelStyle = {
  color: "#555555",
  fontSize: "8.2px",
  fontWeight: 800,
  textTransform: "uppercase",
} as const;

const rowValueStyle = {
  color: "#000000",
  fontSize: "9.5px",
  fontWeight: 800,
  lineHeight: 1.3,
  textAlign: "right",
  wordBreak: "break-word",
} as const;

export default function TicketPrint({ data, id = "ticket-print" }: TicketPrintProps) {
  const trackingUrl =
    data.tracking_code && typeof window !== "undefined"
      ? `${window.location.origin}/track/${data.tracking_code}`
      : data.tracking_url || "";
  const officeName =
    data.kanim || "Kantor Imigrasi Kelas I TPI Tanjungpinang";
  const serviceCode = String(data.ticket_number || "-").split("-")[0] || "-";
  const displayTrackLink = trackingUrl;

  return (
    <div
      id={id}
      style={{
        width: "72mm",
        maxWidth: "100%",
        background: "#ffffff",
        color: "#000000",
        padding: "5mm 5mm 5.5mm",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
        textAlign: "center",
        boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.06)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "14mm 1fr",
          gap: "2.6mm",
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <img
          src="/images/logo.png"
          alt="Logo Imigrasi"
          style={{
            width: "14mm",
            height: "14mm",
            objectFit: "contain",
          }}
        />

        <div>
          <div style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" }}>
            Tiket Antrian
          </div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 900,
              lineHeight: 1.18,
              marginTop: "0.8mm",
              textTransform: "uppercase",
            }}
          >
            {officeName}
          </div>
        </div>
      </div>

      <div style={separatorStyle} />

      <div
        style={{
          textAlign: "center",
          padding: "1mm 0 0.5mm",
        }}
      >
        <div
          style={{
            color: "#444444",
            fontSize: "8.5px",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Nomor Antrian
        </div>

        <div
          style={{
            fontSize: "46px",
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: "0",
            marginTop: "1mm",
          }}
        >
          {data.ticket_number}
        </div>

        <div
          style={{
            color: "#555555",
            fontSize: "8px",
            fontWeight: 800,
            marginTop: "1mm",
            textTransform: "uppercase",
          }}
        >
          Kode layanan {serviceCode}
        </div>
      </div>

      <div style={separatorStyle} />

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "8px",
            color: "#555555",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          Layanan
        </div>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 900,
            lineHeight: 1.25,
            marginTop: "0.8mm",
            wordBreak: "break-word",
          }}
        >
          {data.service_title || "-"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "24mm 1fr",
          columnGap: "3mm",
          rowGap: "1.6mm",
          textAlign: "left",
          marginTop: "3mm",
        }}
      >
        <div style={rowLabelStyle}>Nama</div>
        <div style={rowValueStyle}>{data.customer_name || "-"}</div>

        <div style={rowLabelStyle}>NIK/Paspor</div>
        <div style={rowValueStyle}>{data.identity_number || "-"}</div>

        <div style={rowLabelStyle}>Tanggal</div>
        <div style={rowValueStyle}>{data.date || "-"}</div>

        <div style={rowLabelStyle}>Waktu</div>
        <div style={rowValueStyle}>{data.time || "-"}</div>

      </div>

      <div style={separatorStyle} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "26mm 1fr",
          gap: "3mm",
          alignItems: "center",
          textAlign: "left",
        }}
      >
        <div
          style={{
            background: "#ffffff",
          }}
        >
          <QRCodeSVG value={trackingUrl || "-"} size={88} />
        </div>

        <div>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 900,
              lineHeight: 1.25,
              textTransform: "uppercase",
            }}
          >
            Pantau status antrian
          </div>
          <div
            style={{
              fontSize: "7.5px",
              lineHeight: 1.35,
              marginTop: "1.2mm",
            }}
          >
            Scan QR untuk melihat posisi antrian dan loket panggilan.
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: "7px",
          marginTop: "2mm",
          wordBreak: "break-all",
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {displayTrackLink}
      </div>

      <div style={separatorStyle} />

      <div style={{ fontSize: "8.5px", fontWeight: 800, lineHeight: 1.45 }}>
        Harap menunggu di area layanan dan perhatikan layar panggilan.
      </div>

      <div
        style={{
          fontSize: "7.5px",
          fontWeight: 800,
          marginTop: "2.2mm",
          textTransform: "uppercase",
        }}
      >
        Terima kasih
      </div>
    </div>
  );
}
