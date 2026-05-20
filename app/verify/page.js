import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function VerifyIndexPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 text-slate-900">
      <section className="w-full max-w-xl rounded-lg border border-sky-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-950 text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Prescription verification</p>
            <h1 className="text-2xl font-semibold">Missing prescription ID</h1>
          </div>
        </div>
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          Scan a prescription QR code or open a verification link that includes the prescription ID.
        </p>
        <Link
          className="mt-5 inline-flex rounded-md bg-sky-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-800"
          href="/"
        >
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
