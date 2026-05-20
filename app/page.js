"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  FilePlus2,
  HeartPulse,
  LoaderCircle,
  LogIn,
  Pill,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  UserRound,
} from "lucide-react";
import PrescriptionQr from "./prescription-qr";

const DEMO_DOCTOR_ID = "DR-204";
const DEMO_PASSWORD = "medflow123";
const initialForm = {
  patientName: "",
  patientId: "",
  medicine: "",
  dosage: "",
  doctorName: "",
  notes: "",
  file: null,
};

function getApiBaseUrl() {
  return "";
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ doctorId: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [query, setQuery] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [historyState, setHistoryState] = useState("loading");
  const [medicinesInput, setMedicinesInput] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisState, setAnalysisState] = useState("idle");

  useEffect(() => {
    async function loadPrescriptions() {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/prescriptions`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data.prescriptions)) {
          throw new Error("Unable to load prescriptions");
        }

        if (data.prescriptions.length > 0) {
          setPrescriptions(data.prescriptions);
          setSelectedPrescriptionId(data.prescriptions[0].prescriptionId);
        }
        setHistoryState("ready");
      } catch {
        setHistoryState("fallback");
      }
    }

    loadPrescriptions();
  }, []);

  const selectedPrescription =
    prescriptions.find((item) => item.prescriptionId === selectedPrescriptionId) ?? null;

  const filteredPrescriptions = useMemo(
    () =>
      prescriptions.filter((item) =>
        `${item.patientName} ${item.patientId} ${item.medicine} ${item.prescriptionId}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [prescriptions, query],
  );

  const metrics = {
    activeScripts: prescriptions.length,
    patientsToday: new Set(prescriptions.map((item) => item.patientId)).size,
    followUps: prescriptions.filter((item) => item.verified).length,
  };

  function handleLogin(event) {
    event.preventDefault();

    const doctorId = loginForm.doctorId.trim().toUpperCase();
    const password = loginForm.password.trim();

    if (doctorId === DEMO_DOCTOR_ID && password === DEMO_PASSWORD) {
      setLoggedIn(true);
      setLoginError("");
      return;
    }

    setLoginError("Wrong login. Use the demo credentials shown below.");
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveState("saving");
    setSaveError("");

    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) {
          body.append(key, value);
        }
      });

      const response = await fetch(`${getApiBaseUrl()}/api/prescriptions/upload`, {
        method: "POST",
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to save prescription");
      }

      const createdPrescription = {
        ...form,
        prescriptionId: data.prescriptionId,
        createdAt: new Date().toISOString(),
        verified: true,
        documentName: data.data.documentName,
        documentUrl: data.data.documentUrl,
      };

      setPrescriptions((items) => [createdPrescription, ...items]);
      setSelectedPrescriptionId(data.prescriptionId);
      setForm(initialForm);
      setSaveState("saved");
    } catch (error) {
      setSaveState("error");
      setSaveError(
        error instanceof TypeError
          ? "Backend is offline. Start the full app and try again."
          : error.message,
      );
    }
  }

  async function handleMedicineAnalysis(event) {
    event.preventDefault();
    const medicines = medicinesInput
      .split(",")
      .map((medicine) => medicine.trim())
      .filter(Boolean);

    if (medicines.length === 0) {
      return;
    }

    setAnalysisState("loading");
    setAnalysis(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/medicines/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicines }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to analyze medicines");
      }

      setAnalysis(data);
      setAnalysisState("ready");
    } catch {
      setAnalysisState("error");
    }
  }

  return (
    <main className="min-h-screen px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      {!loggedIn ? (
        <LoginScreen
          form={loginForm}
          loginError={loginError}
          onChange={(field, value) =>
            setLoginForm((state) => ({
              ...state,
              [field]: value,
            }))
          }
          onSubmit={handleLogin}
        />
      ) : (
      <section className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <BrandCard />
          <SessionCard />
          <QrCard prescription={selectedPrescription} />
        </aside>

        <div className="space-y-4">
          <Hero metrics={metrics} />

          <section className="grid gap-4 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(28rem,1.18fr)]">
            <UploadCard
              form={form}
              onChange={(field, value) => setForm((state) => ({ ...state, [field]: value }))}
              onSubmit={handleSave}
              saveState={saveState}
              saveError={saveError}
            />
            <HistoryCard
              filteredPrescriptions={filteredPrescriptions}
              historyState={historyState}
              onQueryChange={setQuery}
              onSelect={setSelectedPrescriptionId}
              query={query}
            />
          </section>

          <MedicineSafetyCard
            analysis={analysis}
            analysisState={analysisState}
            medicinesInput={medicinesInput}
            onInputChange={setMedicinesInput}
            onSubmit={handleMedicineAnalysis}
          />
        </div>
      </section>
      )}
    </main>
  );
}

function BrandCard() {
  return (
    <div className="rounded-lg bg-sky-950 p-5 text-white shadow-xl shadow-sky-950/10">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/12">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-sky-100">Clinic Console</p>
          <h1 className="text-2xl font-semibold tracking-normal">MedFlow</h1>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ form, loginError, onChange, onSubmit }) {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-md items-center">
      <div className="w-full rounded-lg border border-sky-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-950 text-white">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Clinic Console</p>
            <h1 className="text-2xl font-semibold">MedFlow</h1>
          </div>
        </div>
        <div className="mb-5 rounded-md bg-sky-50 p-3 text-sm text-sky-900">
          Demo login: <strong>{DEMO_DOCTOR_ID}</strong> / <strong>{DEMO_PASSWORD}</strong>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <ControlledField
            label="Doctor ID"
            onChange={(value) => onChange("doctorId", value)}
            value={form.doctorId}
          />
          <ControlledField
            label="Password"
            onChange={(value) => onChange("password", value)}
            type="password"
            value={form.password}
          />
          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 font-medium text-white transition hover:bg-sky-800">
            <LogIn className="h-4 w-4" />
            Login
          </button>
          {loginError && <p className="text-sm text-rose-700">{loginError}</p>}
        </form>
      </div>
    </section>
  );
}

function SessionCard() {
  return (
    <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-sky-700" />
        <h2 className="text-lg font-semibold">Doctor session</h2>
      </div>
      <p className="font-medium">Dr. Meera Joshi</p>
      <p className="text-sm text-slate-500">DR-204 / session active</p>
    </div>
  );
}

function QrCard({ prescription }) {
  return (
    <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <QrCode className="h-5 w-5 text-sky-700" />
        <h2 className="text-lg font-semibold">Patient QR</h2>
      </div>
      {prescription ? (
        <div className="flex flex-col items-center gap-4">
          <PrescriptionQr prescriptionId={prescription.prescriptionId} />
          <div className="text-center">
            <p className="font-medium">{prescription.patientName}</p>
            <p className="text-sm text-slate-500">{prescription.prescriptionId}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-sky-50 p-4 text-sm text-slate-600">
          Save a prescription first. Uske baad yahan uska QR dikhega, aur scan karne par verification page khulega.
        </div>
      )}
    </div>
  );
}

function Hero({ metrics }) {
  return (
    <section className="relative min-h-[15rem] overflow-hidden rounded-lg">
      <img
        alt="Doctor reviewing prescriptions on a tablet"
        className="absolute inset-0 h-full w-full object-cover"
        src="/clinic-banner.png"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-sky-950 via-sky-950/80 to-sky-950/20" />
      <div className="relative flex min-h-[15rem] max-w-xl flex-col justify-between p-6 text-white sm:p-7">
        <div className="flex items-center gap-2 text-sm text-sky-100">
          <Stethoscope className="h-4 w-4" />
          Prescription management
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-semibold tracking-normal">
            Today&apos;s care, organized in one clinical view.
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Metric icon={Activity} label="Active scripts" value={metrics.activeScripts} />
            <Metric icon={UserRound} label="Patients" value={metrics.patientsToday} />
            <Metric icon={CalendarDays} label="Verified" value={metrics.followUps} />
          </div>
        </div>
      </div>
    </section>
  );
}

function UploadCard({ form, onChange, onSubmit, saveError, saveState }) {
  return (
    <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <FilePlus2 className="h-5 w-5 text-sky-700" />
        <h2 className="text-lg font-semibold">Upload prescription</h2>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <ControlledField label="Patient name" value={form.patientName} onChange={(value) => onChange("patientName", value)} />
          <ControlledField label="Patient ID" value={form.patientId} onChange={(value) => onChange("patientId", value)} />
          <ControlledField label="Medicine" value={form.medicine} onChange={(value) => onChange("medicine", value)} />
          <ControlledField label="Dosage" value={form.dosage} onChange={(value) => onChange("dosage", value)} />
          <ControlledField label="Doctor name" value={form.doctorName} onChange={(value) => onChange("doctorName", value)} />
        </div>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">Notes</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:bg-white"
            onChange={(event) => onChange("notes", event.target.value)}
            value={form.notes}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">Prescription file</span>
          <input
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => onChange("file", event.target.files?.[0] ?? null)}
            type="file"
          />
          <div className="flex min-h-24 cursor-pointer items-center justify-center rounded-md border border-dashed border-sky-200 bg-sky-50 px-4 text-center transition hover:border-sky-400 hover:bg-sky-100">
            <div>
              <Upload className="mx-auto mb-2 h-5 w-5 text-sky-700" />
              <p className="text-sm font-medium">
                {form.file ? form.file.name : "Upload PDF or image"}
              </p>
              <p className="text-xs text-slate-500">PDF, JPG, PNG, or WEBP up to 10 MB</p>
            </div>
          </div>
        </label>
        <button className="flex w-full items-center justify-center gap-2 rounded-md bg-sky-700 px-4 py-2.5 font-medium text-white hover:bg-sky-800">
          {saveState === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
          {saveState === "saving" ? "Saving prescription" : "Save prescription"}
        </button>
        {saveState === "saved" && <p className="text-sm text-emerald-700">Prescription saved and QR generated.</p>}
        {saveState === "error" && <p className="text-sm text-rose-700">{saveError}</p>}
      </form>
    </div>
  );
}

function HistoryCard({ filteredPrescriptions, historyState, onQueryChange, onSelect, query }) {
  return (
    <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Patient prescription history</h2>
          <p className="text-sm text-slate-500">
            {historyState === "fallback" ? "Showing local sample records" : "Recent saved prescriptions"}
          </p>
        </div>
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 outline-none transition focus:border-sky-500 focus:bg-white sm:w-64"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search patient or medicine"
            value={query}
          />
        </label>
      </div>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <div className="min-w-[38rem]">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_0.7fr_0.55fr] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
            <span>Patient</span>
            <span>Medication</span>
            <span>Date</span>
            <span>Status</span>
            <span>QR</span>
          </div>
          {filteredPrescriptions.map((item) => (
            <div
              className="grid grid-cols-[1.2fr_1fr_1fr_0.7fr_0.55fr] items-center border-t border-slate-100 px-4 py-4 text-sm"
              key={item.prescriptionId}
            >
              <div>
                <p className="font-medium">{item.patientName}</p>
                <p className="text-slate-500">{item.patientId}</p>
              </div>
              <div>
                <p className="font-medium">{item.medicine}</p>
                <p className="text-slate-500">{item.dosage}</p>
              </div>
              <span>{formatDate(item.createdAt)}</span>
              <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {item.verified ? "Verified" : "Pending"}
              </span>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-md border border-sky-100 text-sky-700 transition hover:bg-sky-50"
                onClick={() => onSelect(item.prescriptionId)}
                title={`Show QR for ${item.patientName}`}
                type="button"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MedicineSafetyCard({ analysis, analysisState, medicinesInput, onInputChange, onSubmit }) {
  return (
    <section className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-sky-700" />
        <div>
          <h2 className="text-lg font-semibold">Medication safety review</h2>
          <p className="text-sm text-slate-500">Check interactions, dosage cautions, and side effects</p>
        </div>
      </div>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
        <input
          className="min-h-11 flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 outline-none transition focus:border-sky-500 focus:bg-white"
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="warfarin, ibuprofen, metformin"
          value={medicinesInput}
        />
        <button className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-sky-700 px-4 font-medium text-white hover:bg-sky-800">
          {analysisState === "loading" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Analyze
        </button>
      </form>

      {analysisState === "error" && (
        <div className="mt-4 flex items-center gap-3 rounded-md bg-rose-50 p-4 text-rose-700">
          <AlertTriangle className="h-5 w-5" />
          Analysis unavailable. Check the backend and OpenAI configuration.
        </div>
      )}

      {analysis && (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <ResultPanel
            title="Dangerous interactions"
            items={analysis.dangerousInteractions.map(
              (item) => `${item.medicines.join(" + ")}: ${item.risk} (${item.severity})`,
            )}
          />
          <ResultPanel title="Dosage warnings" items={analysis.dosageWarnings} />
          <ResultPanel
            title="Side effects"
            items={analysis.sideEffectSummary.map(
              (item) =>
                `${item.medicine}: ${item.commonSideEffects.join(", ")}${
                  item.seriousSideEffects.length
                    ? `; serious: ${item.seriousSideEffects.join(", ")}`
                    : ""
                }`,
            )}
          />
          <p className="text-sm text-slate-500 lg:col-span-3">{analysis.disclaimer}</p>
        </div>
      )}
    </section>
  );
}

function ResultPanel({ items, title }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 space-y-2 text-sm text-slate-600">
        {items.length === 0 ? <p>No issues returned.</p> : items.map((item) => <p key={item}>{item}</p>)}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="min-w-28 rounded-md bg-white/12 px-3 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-sky-100">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ControlledField({ label, onChange, type = "text", value }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      <input
        className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-sky-500 focus:bg-white"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
}
