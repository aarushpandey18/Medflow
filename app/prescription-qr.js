"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function PrescriptionQr({ prescriptionId }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!prescriptionId || typeof window === "undefined") {
      return;
    }

    // Use an explicitly configured public URL when available. This is
    // important locally because a phone cannot resolve the desktop's
    // localhost address.
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
    const verificationUrl = `${appBaseUrl}/verify/${encodeURIComponent(prescriptionId)}`;

    QRCode.toDataURL(verificationUrl, {
      color: {
        dark: "#082f49",
        light: "#ffffff",
      },
      // A larger source image and clear quiet zone make camera scans reliable,
      // including when the QR is displayed on a desktop screen.
      margin: 3,
      width: 512,
    }).then(setSrc);
  }, [prescriptionId]);

  return src ? (
    <img
      alt={`QR code for prescription ${prescriptionId}`}
      className="h-52 w-52 rounded-md bg-white shadow-sm"
      src={src}
    />
  ) : (
    <div className="flex h-44 w-44 items-center justify-center rounded-md bg-sky-50 text-sm text-slate-500">
      Generating QR
    </div>
  );
}
