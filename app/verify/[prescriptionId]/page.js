"use client";

import { CircleCheckBig, CircleX, LoaderCircle, Stethoscope } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getApiBaseUrl } from "../../api";

export default function VerifyPrescriptionPage() {
  const { prescriptionId } = useParams();
  const apiBaseUrl = getApiBaseUrl();
  const [state, setState] = useState({
    status: "loading",
    prescription: null,
  });

  useEffect(() => {
    async function verifyPrescription() {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/prescriptions/${prescriptionId}/verify`,
        );
        const data = await response.json();

        if (!response.ok || !data.valid) {
          setState({ status: "invalid", prescription: null });
          return;
        }

        setState({
          status: "valid",
          prescription: data.prescription,
        });
      } catch {
        setState({ status: "invalid", prescription: null });
      }
    }

    if (prescriptionId) {
      verifyPrescription();
    }
  }, [prescriptionId]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-900">
      <section className="w-full max-w-xl rounded-lg border border-sky-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-950 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Prescription verification</p>
            <h1 className="text-2xl font-semibold">{prescriptionId}</h1>
          </div>
        </div>

        {state.status === "loading" && (
          <div className="flex items-center gap-3 rounded-md bg-sky-50 p-4 text-sky-800">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Verifying prescription
          </div>
        )}

        {state.status === "invalid" && (
          <div className="flex items-center gap-3 rounded-md bg-rose-50 p-4 text-rose-700">
            <CircleX className="h-5 w-5" />
            Prescription could not be verified.
          </div>
        )}

        {state.status === "valid" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-md bg-emerald-50 p-4 text-emerald-700">
              <CircleCheckBig className="h-5 w-5" />
              Prescription verified
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Patient" value={state.prescription.patientName} />
              <Detail label="Patient ID" value={state.prescription.patientId} />
              <Detail label="Medicine" value={state.prescription.medicine} />
              <Detail label="Dosage" value={state.prescription.dosage} />
              <Detail label="Doctor" value={state.prescription.doctorName} />
              <Detail label="Issued" value={formatDate(state.prescription.createdAt)} />
              <Detail
                label="Document"
                value={
                  state.prescription.documentUrl ? (
                    <a
                      className="text-sky-700 underline"
                      href={`${apiBaseUrl}${state.prescription.documentUrl}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {state.prescription.documentName ?? "Open file"}
                    </a>
                  ) : (
                    "Not uploaded"
                  )
                }
              />
            </dl>
          </div>
        )}
      </section>
    </main>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value || "Not available"}</dd>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
