"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function PrescriptionQr({ prescriptionId }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    if (!prescriptionId || typeof window === "undefined") {
      return;
    }

    const configuredAppBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(
      window.location.hostname,
    );
    const appBaseUrl =
      isLocalhost && configuredAppBaseUrl ? configuredAppBaseUrl : window.location.origin;
    const verificationUrl = `${appBaseUrl}/verify/${prescriptionId}`;

    QRCode.toDataURL(verificationUrl, {
      color: {
        dark: "#082f49",
        light: "#ffffff",
      },
      margin: 1,
      width: 180,
    }).then(setSrc);
  }, [prescriptionId]);

  return src ? (
    <img
      alt={`QR code for prescription ${prescriptionId}`}
      className="h-44 w-44 rounded-md bg-white p-3 shadow-sm"
      src={src}
    />
  ) : (
    <div className="flex h-44 w-44 items-center justify-center rounded-md bg-sky-50 text-sm text-slate-500">
      Generating QR
    </div>
  );
}
