"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  Clock3,
  FilePlus2,
  HeartPulse,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  Menu,
  Pill,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import PrescriptionQr from "./prescription-qr";
import { getApiBaseUrl } from "./api";

const demoUsers = {
  admin: { id: "AD-001", password: "medflow123", name: "Ananya Rao", role: "admin" },
  doctor: { id: "DR-204", password: "medflow123", name: "Dr. Meera Joshi", role: "doctor" },
  patient: { id: "PT-1001", password: "medflow123", name: "Rohan Mehta", role: "patient" },
};

const sampleAppointments = [
  { id: "APT-001", patientName: "Rohan Mehta", patientId: "PT-1001", doctorName: "Dr. Meera Joshi", date: "2026-09-25", time: "10:30", type: "Follow-up", status: "confirmed" },
  { id: "APT-002", patientName: "Priya Shah", patientId: "PT-1002", doctorName: "Dr. Arjun Patel", date: "2026-09-25", time: "12:00", type: "Consultation", status: "pending" },
  { id: "APT-003", patientName: "Kabir Singh", patientId: "PT-1003", doctorName: "Dr. Meera Joshi", date: "2026-09-26", time: "09:00", type: "Review", status: "confirmed" },
];

const sampleUsers = [
  { id: "DR-204", name: "Dr. Meera Joshi", email: "meera@medflow.demo", role: "doctor", status: "Active" },
  { id: "DR-205", name: "Dr. Arjun Patel", email: "arjun@medflow.demo", role: "doctor", status: "Active" },
  { id: "PT-1001", name: "Rohan Mehta", email: "rohan@medflow.demo", role: "patient", status: "Active" },
  { id: "PT-1002", name: "Priya Shah", email: "priya@medflow.demo", role: "patient", status: "Active" },
];

const initialForm = { patientName: "", patientId: "", medicine: "", dosage: "", doctorName: "Dr. Meera Joshi", notes: "", file: null };

export default function Home() {
  const [session, setSession] = useState(null);
  const [login, setLogin] = useState({ role: "doctor", id: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [appointments, setAppointments] = useState(sampleAppointments);
  const [users, setUsers] = useState(sampleUsers);

  async function loadWorkspace(role) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/medflow/appointments`);
      const data = await response.json();
      if (response.ok && Array.isArray(data.appointments) && data.appointments.length) setAppointments(data.appointments);
      const userResponse = await fetch(`${getApiBaseUrl()}/api/medflow/users`);
      const userData = await userResponse.json();
      if (userResponse.ok && Array.isArray(userData.users) && userData.users.length) setUsers(userData.users);
    } catch {
      // The demo data keeps the MVP usable when the optional API is offline.
    }
    setSession(demoUsers[role]);
  }

  function handleLogin(event) {
    event.preventDefault();
    const selected = demoUsers[login.role];
    if ((login.id.trim().toUpperCase() === selected.id || !login.id.trim()) && (login.password.trim() === selected.password || !login.password.trim())) {
      setLoginError("");
      loadWorkspace(login.role);
    } else setLoginError(`Use the ${login.role} demo credentials shown below.`);
  }

  if (!session) return <LoginScreen login={login} error={loginError} onChange={(field, value) => setLogin((state) => ({ ...state, [field]: value }))} onSubmit={handleLogin} />;

  return (
    <main className="min-h-screen px-4 py-4 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <Sidebar session={session} onLogout={() => setSession(null)} />
        <section className="min-w-0 space-y-4">
          <Header session={session} onLogout={() => setSession(null)} />
          {session.role === "admin" && <AdminDashboard users={users} setUsers={setUsers} appointments={appointments} />}
          {session.role === "doctor" && <DoctorDashboard appointments={appointments} setAppointments={setAppointments} />}
          {session.role === "patient" && <PatientDashboard session={session} appointments={appointments} setAppointments={setAppointments} />}
        </section>
      </div>
    </main>
  );
}

function LoginScreen({ login, error, onChange, onSubmit }) {
  const selected = demoUsers[login.role];
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-sky-100 bg-white p-7 shadow-xl shadow-sky-950/5">
        <div className="mb-7 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-950 text-white"><HeartPulse /></div><div><p className="text-sm text-slate-500">Clinical operations platform</p><h1 className="text-2xl font-semibold">MedFlow</h1></div></div>
        <div className="mb-5 grid grid-cols-3 gap-2">
          {Object.keys(demoUsers).map((role) => <button key={role} type="button" onClick={() => onChange("role", role)} className={`rounded-lg px-2 py-2 text-sm font-medium capitalize ${login.role === role ? "bg-sky-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{role}</button>)}
        </div>
        <div className="mb-5 rounded-xl bg-sky-50 p-3 text-sm text-sky-900">Demo {login.role}: <strong>{selected.id}</strong> / <strong>{selected.password}</strong></div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label={`${login.role} ID`} value={login.id} onChange={(value) => onChange("id", value)} placeholder={selected.id} />
          <Field label="Password" type="password" value={login.password} onChange={(value) => onChange("password", value)} placeholder={selected.password} />
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-3 font-medium text-white hover:bg-sky-800"><LogIn className="h-4 w-4" />Enter workspace</button>
          {error && <p className="text-sm text-rose-700">{error}</p>}
        </form>
        <p className="mt-5 text-center text-xs text-slate-400">Leave fields blank to try the selected demo role.</p>
      </section>
    </main>
  );
}

function Sidebar({ session, onLogout }) {
  return <aside className="hidden flex-col gap-4 lg:flex">
    <div className="rounded-2xl bg-sky-950 p-5 text-white shadow-xl shadow-sky-950/10"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10"><HeartPulse /></div><div><p className="text-xs text-sky-200">Clinical operations</p><h1 className="text-xl font-semibold">MedFlow</h1></div></div></div>
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><Avatar name={session.name} /><div className="min-w-0"><p className="truncate font-medium">{session.name}</p><p className="text-xs capitalize text-slate-500">{session.role} · {session.id}</p></div></div><div className="mt-4 space-y-1 text-sm text-slate-600"><NavItem icon={LayoutDashboard} label="Overview" active /><NavItem icon={CalendarDays} label="Appointments" /><NavItem icon={Users} label="People & records" /><NavItem icon={Settings} label="Settings" /></div><button onClick={onLogout} className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Sign out</button></div>
  </aside>;
}

function Header({ session, onLogout }) {
  return <header className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white px-4 py-3 shadow-sm sm:px-6"><div className="flex items-center gap-3"><Menu className="h-5 w-5 text-slate-400 lg:hidden" /><div><p className="text-sm text-slate-500">Good morning</p><h2 className="text-xl font-semibold">{session.name}</h2></div></div><div className="flex items-center gap-3"><span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium capitalize text-emerald-700 sm:inline">{session.role} view</span><button onClick={onLogout} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Sign out"><LogIn className="h-4 w-4 rotate-180" /></button></div></header>;
}

function AdminDashboard({ users, setUsers, appointments }) {
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "patient" });
  function addUser(event) { event.preventDefault(); setUsers((items) => [...items, { ...newUser, id: `${newUser.role === "doctor" ? "DR" : "PT"}-${1000 + items.length}`, status: "Active" }]); setNewUser({ name: "", email: "", role: "patient" }); setShowForm(false); }
  return <><PageTitle title="Admin overview" subtitle="Manage your clinic, care teams, and performance." action={<button onClick={() => setShowForm((value) => !value)} className="button-primary"><UserPlus className="h-4 w-4" />Add user</button>} /><StatGrid items={[["Total users", users.length + 1, Users, "up 12% this month"], ["Appointments", appointments.length, CalendarDays, "2 need attention"], ["Active doctors", users.filter((user) => user.role === "doctor").length, Stethoscope, "All schedules live"], ["Completion rate", "94%", Activity, "up 4.6% this month"]]} />{showForm && <form onSubmit={addUser} className="card grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto]"><Field label="Name" value={newUser.name} onChange={(value) => setNewUser({ ...newUser, name: value })} required /><Field label="Email" value={newUser.email} onChange={(value) => setNewUser({ ...newUser, email: value })} required /><label className="block"><span className="label">Role</span><select className="input" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}><option value="patient">Patient</option><option value="doctor">Doctor</option></select></label><button className="button-primary self-end">Create</button></form>}<div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><UserManagement users={users} setUsers={setUsers} /><AnalyticsCard /></div></>;
}

function UserManagement({ users, setUsers }) {
  const [query, setQuery] = useState("");
  const visible = users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="card"><div className="card-heading"><div><h3 className="card-title">People & access</h3><p className="muted">Manage doctors and patients in your clinic</p></div><div className="relative"><Search className="search-icon" /><input className="input pl-9" placeholder="Search users" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="overflow-x-auto"><table className="table"><thead><tr><th>Person</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>{visible.map((user) => <tr key={user.id}><td><div className="flex items-center gap-3"><Avatar name={user.name} /><div><p className="font-medium">{user.name}</p><p className="muted">{user.email}</p></div></div></td><td><span className="capitalize">{user.role}</span></td><td><Status value={user.status.toLowerCase()} /></td><td><button onClick={() => setUsers((items) => items.filter((item) => item.id !== user.id))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></section>;
}

function DoctorDashboard({ appointments, setAppointments }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [historyState, setHistoryState] = useState("loading");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");
  const [query, setQuery] = useState("");
  const [medicinesInput, setMedicinesInput] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analysisState, setAnalysisState] = useState("idle");
  useEffect(() => { fetch(`${getApiBaseUrl()}/api/prescriptions`).then((response) => response.json()).then((data) => { if (Array.isArray(data.prescriptions)) { setPrescriptions(data.prescriptions); setSelectedPrescriptionId(data.prescriptions[0]?.prescriptionId ?? ""); setHistoryState("ready"); } }).catch(() => setHistoryState("fallback")); }, []);
  const selected = prescriptions.find((item) => item.prescriptionId === selectedPrescriptionId);
  const filtered = prescriptions.filter((item) => `${item.patientName} ${item.medicine} ${item.patientId}`.toLowerCase().includes(query.toLowerCase()));
  async function savePrescription(event) { event.preventDefault(); setSaveState("saving"); setSaveError(""); try { const body = new FormData(); Object.entries(form).forEach(([key, value]) => value && body.append(key, value)); const response = await fetch(`${getApiBaseUrl()}/api/prescriptions/upload`, { method: "POST", body }); const data = await readResponse(response); if (!response.ok) throw new Error(data.error ?? "Unable to save prescription"); const created = { ...form, prescriptionId: data.prescriptionId, createdAt: new Date().toISOString(), verified: true, documentName: data.data.documentName, documentUrl: data.data.documentUrl }; setPrescriptions((items) => [created, ...items]); setSelectedPrescriptionId(created.prescriptionId); setForm(initialForm); setSaveState("saved"); } catch (error) { setSaveState("error"); setSaveError(error instanceof TypeError ? "Backend is offline. Start the full app and try again." : error.message); } }
  async function analyze(event) { event.preventDefault(); const medicines = medicinesInput.split(",").map((item) => item.trim()).filter(Boolean); if (!medicines.length) return; setAnalysisState("loading"); try { const response = await fetch(`${getApiBaseUrl()}/api/medicines/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ medicines }) }); const data = await readResponse(response); if (!response.ok) throw new Error(data.error); setAnalysis(data); setAnalysisState("ready"); } catch { setAnalysisState("error"); } }
  return <><PageTitle title="Doctor workspace" subtitle="Stay ahead of today's care plan and medication safety." /><StatGrid items={[["Today's appointments", appointments.filter((item) => item.date === "2026-09-25").length, CalendarDays, "Next at 10:30 AM"], ["Active prescriptions", prescriptions.length, Pill, "All records verified"], ["Patients this week", 28, UserRound, "up 8% from last week"], ["Open follow-ups", 6, Clock3, "2 due today"]]} /><div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]"><AppointmentCard appointments={appointments} setAppointments={setAppointments} doctorView /><PrescriptionForm form={form} setForm={setForm} onSubmit={savePrescription} saveState={saveState} saveError={saveError} /></div><div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><PrescriptionHistory items={filtered} query={query} setQuery={setQuery} selectedId={selectedPrescriptionId} onSelect={setSelectedPrescriptionId} historyState={historyState} selected={selected} /><AvailabilityCard /></div><MedicineSafety analysis={analysis} state={analysisState} input={medicinesInput} setInput={setMedicinesInput} onSubmit={analyze} /></>;
}

function PatientDashboard({ session, appointments, setAppointments }) {
  const [booking, setBooking] = useState(false);
  const [newAppointment, setNewAppointment] = useState({ doctorName: "Dr. Meera Joshi", date: "2026-09-29", time: "10:00", type: "Consultation" });
  const mine = appointments.filter((item) => item.patientId === session.id);
  function book(event) { event.preventDefault(); setAppointments((items) => [...items, { ...newAppointment, id: `APT-${Date.now()}`, patientName: session.name, patientId: session.id, status: "pending" }]); setBooking(false); }
  return <><PageTitle title="My health dashboard" subtitle="Your appointments, records, and care history in one place." action={<button onClick={() => setBooking((value) => !value)} className="button-primary"><CalendarDays className="h-4 w-4" />Book appointment</button>} /><StatGrid items={[["Upcoming visits", mine.filter((item) => item.status !== "cancelled").length, CalendarDays, "Next visit in 2 days"], ["Prescriptions", 4, Pill, "Last updated Sep 18"], ["Care plan", "On track", ShieldCheck, "No overdue actions"], ["Health score", "86/100", Activity, "Improved this month"]]} />{booking && <form onSubmit={book} className="card grid gap-3 sm:grid-cols-4"><label className="block"><span className="label">Doctor</span><select className="input" value={newAppointment.doctorName} onChange={(event) => setNewAppointment({ ...newAppointment, doctorName: event.target.value })}><option>Dr. Meera Joshi</option><option>Dr. Arjun Patel</option></select></label><Field label="Date" type="date" value={newAppointment.date} onChange={(value) => setNewAppointment({ ...newAppointment, date: value })} /><Field label="Time" type="time" value={newAppointment.time} onChange={(value) => setNewAppointment({ ...newAppointment, time: value })} /><button className="button-primary self-end">Request visit</button></form>}<div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]"><AppointmentCard appointments={mine} setAppointments={setAppointments} /><section className="card"><h3 className="card-title">Health history</h3><p className="muted">Recent clinical activity and records</p><div className="mt-5 space-y-4"><Timeline title="Prescription updated" detail="Amoxicillin 500 mg · Dr. Meera Joshi" date="18 Sep 2026" icon={Pill} /><Timeline title="Follow-up completed" detail="General medicine consultation" date="04 Sep 2026" icon={Stethoscope} /><Timeline title="Profile verified" detail="Contact and allergy information confirmed" date="28 Aug 2026" icon={ShieldCheck} /></div></section></div><section className="card"><div className="card-heading"><div><h3 className="card-title">My profile</h3><p className="muted">Keep your care team up to date</p></div><button className="button-secondary">Edit profile</button></div><div className="grid gap-4 sm:grid-cols-3"><Info label="Full name" value={session.name} /><Info label="Patient ID" value={session.id} /><Info label="Email" value="rohan@medflow.demo" /></div></section></>;
}

function AppointmentCard({ appointments, setAppointments, doctorView = false }) {
  async function update(id, status) { setAppointments((items) => items.map((item) => item.id === id ? { ...item, status } : item)); try { await fetch(`${getApiBaseUrl()}/api/medflow/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); } catch {} }
  return <section className="card"><div className="card-heading"><div><h3 className="card-title">{doctorView ? "Today's appointments" : "Upcoming appointments"}</h3><p className="muted">{doctorView ? "Your schedule at a glance" : "Manage your upcoming care"}</p></div><button className="button-secondary">View calendar</button></div><div className="space-y-3">{appointments.length ? appointments.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><CalendarDays className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate font-medium">{doctorView ? item.patientName : item.doctorName}</p><p className="muted">{formatDate(item.date)} · {item.time} · {item.type}</p></div></div><div className="flex items-center gap-2">{doctorView && item.status === "pending" && <><button title="Confirm" onClick={() => update(item.id, "confirmed")} className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Check className="h-4 w-4" /></button><button title="Decline" onClick={() => update(item.id, "cancelled")} className="rounded-lg bg-rose-50 p-2 text-rose-700"><X className="h-4 w-4" /></button></>}<Status value={item.status} /></div></div>) : <Empty text="No appointments yet." />}</div></section>;
}

function PrescriptionForm({ form, setForm, onSubmit, saveState, saveError }) { return <section className="card"><div className="card-heading"><div><h3 className="card-title">Upload prescription</h3><p className="muted">Create a verified record and patient QR</p></div><FilePlus2 className="text-sky-700" /></div><form className="space-y-3" onSubmit={onSubmit}><div className="grid gap-3 sm:grid-cols-2"><Field label="Patient name" value={form.patientName} onChange={(value) => setForm({ ...form, patientName: value })} required /><Field label="Patient ID" value={form.patientId} onChange={(value) => setForm({ ...form, patientId: value })} required /><Field label="Medicine" value={form.medicine} onChange={(value) => setForm({ ...form, medicine: value })} required /><Field label="Dosage" value={form.dosage} onChange={(value) => setForm({ ...form, dosage: value })} required /></div><label className="block"><span className="label">Notes</span><textarea className="input min-h-20" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label><label className="block"><span className="label">Prescription file</span><input className="input p-2" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })} /></label><button className="button-primary w-full justify-center">{saveState === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}{saveState === "saving" ? "Saving..." : "Save prescription"}</button>{saveState === "saved" && <p className="text-sm text-emerald-700">Prescription saved and QR generated.</p>}{saveState === "error" && <p className="text-sm text-rose-700">{saveError}</p>}</form></section>; }

function PrescriptionHistory({ items, query, setQuery, selectedId, onSelect, historyState, selected }) { return <section className="card"><div className="card-heading"><div><h3 className="card-title">Prescription history</h3><p className="muted">{historyState === "fallback" ? "Connect the API to load saved records" : "Recent verified patient records"}</p></div><div className="relative"><Search className="search-icon" /><input className="input pl-9" placeholder="Search records" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div><div className="space-y-2">{items.length ? items.map((item) => <button key={item.prescriptionId} onClick={() => onSelect(item.prescriptionId)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${selectedId === item.prescriptionId ? "border-sky-300 bg-sky-50" : "border-slate-100 hover:bg-slate-50"}`}><div><p className="font-medium">{item.patientName}</p><p className="muted">{item.medicine} · {item.dosage}</p></div><div className="text-right"><Status value="verified" /><p className="mt-1 text-xs text-slate-400">{formatDate(item.createdAt)}</p></div></button>) : <Empty text="No prescriptions yet. Add the first record above." />}</div>{selected && <div className="mt-4 flex items-center gap-4 rounded-xl bg-slate-50 p-3"><PrescriptionQr prescriptionId={selected.prescriptionId} /><div><p className="font-medium">Patient QR ready</p><p className="muted">{selected.prescriptionId}</p></div></div>}</section>; }

function AvailabilityCard() { return <section className="card"><div className="card-heading"><div><h3 className="card-title">Schedule & availability</h3><p className="muted">Your clinic hours this week</p></div><button className="button-secondary">Edit</button></div><div className="space-y-2">{[["Mon - Fri", "09:00 - 17:00", true], ["Saturday", "09:00 - 13:00", true], ["Sunday", "Unavailable", false]].map(([day, hours, active]) => <div key={day} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm"><span className="font-medium">{day}</span><span className={active ? "text-emerald-700" : "text-slate-400"}>{hours}</span></div>)}</div><div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"><Clock3 className="mr-2 inline h-4 w-4" />2 availability requests need review.</div></section>; }

function MedicineSafety({ analysis, state, input, setInput, onSubmit }) { return <section className="card"><div className="card-heading"><div><h3 className="card-title">Medication safety review</h3><p className="muted">Check interactions, dosage cautions, and side effects</p></div><Sparkles className="text-sky-700" /></div><form className="flex gap-2" onSubmit={onSubmit}><input className="input" placeholder="warfarin, ibuprofen, metformin" value={input} onChange={(event) => setInput(event.target.value)} /><button className="button-primary shrink-0">{state === "loading" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Analyze</button></form>{state === "error" && <p className="mt-3 text-sm text-rose-700">Analysis unavailable. Check the backend configuration.</p>}{analysis && <div className="mt-4 grid gap-3 sm:grid-cols-3">{<Result title="Interactions" items={analysis.dangerousInteractions.map((item) => `${item.medicines.join(" + ")}: ${item.risk}`)} />}<Result title="Dosage warnings" items={analysis.dosageWarnings} /><Result title="Side effects" items={analysis.sideEffectSummary.map((item) => `${item.medicine}: ${item.commonSideEffects.join(", ")}`)} /><p className="text-xs text-slate-500 sm:col-span-3">{analysis.disclaimer}</p></div>}</section>; }

function AnalyticsCard() { return <section className="card"><div className="card-heading"><div><h3 className="card-title">Clinic analytics</h3><p className="muted">Appointment volume over the last 7 days</p></div><BarChart3 className="text-sky-700" /></div><div className="flex h-44 items-end gap-3 pt-5">{[42, 58, 48, 72, 64, 88, 76].map((height, index) => <div className="flex flex-1 flex-col items-center gap-2" key={height}><div className="w-full rounded-t-lg bg-sky-500/80" style={{ height: `${height}%` }} /><span className="text-xs text-slate-400">{["M", "T", "W", "T", "F", "S", "S"][index]}</span></div>)}</div><div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-sm"><span className="text-slate-500">Total visits</span><strong>184 <span className="font-normal text-emerald-600">+12.5%</span></strong></div></section>; }

function StatGrid({ items }) { return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value, Icon, detail]) => <div className="card flex items-start justify-between" key={label}><div><p className="muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div><div className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><Icon className="h-5 w-5" /></div></div>)}</div>; }
function PageTitle({ title, subtitle, action }) { return <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-sky-700">Workspace overview</p><h1 className="mt-1 text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div>{action}</div>; }
function Field({ label, value, onChange, type = "text", placeholder, required }) { return <label className="block"><span className="label">{label}</span><input className="input" required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>; }
function NavItem({ icon: Icon, label, active }) { return <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${active ? "bg-sky-50 font-medium text-sky-700" : ""}`}><Icon className="h-4 w-4" />{label}</div>; }
function Avatar({ name }) { return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-800">{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div>; }
function Status({ value }) { const positive = ["active", "confirmed", "verified"].includes(value?.toLowerCase()); return <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${positive ? "bg-emerald-50 text-emerald-700" : value === "cancelled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{value}</span>; }
function Result({ title, items }) { return <div className="rounded-xl bg-slate-50 p-3"><h4 className="text-sm font-semibold">{title}</h4><div className="mt-2 space-y-1 text-xs text-slate-600">{items.length ? items.map((item) => <p key={item}>{item}</p>) : <p>No issues returned.</p>}</div></div>; }
function Timeline({ title, detail, date, icon: Icon }) { return <div className="flex gap-3"><div className="rounded-lg bg-sky-50 p-2 text-sky-700"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-medium">{title}</p><p className="text-xs text-slate-500">{detail}</p><p className="mt-1 text-xs text-slate-400">{date}</p></div></div>; }
function Info({ label, value }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-medium">{value}</p></div>; }
function Empty({ text }) { return <div className="rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">{text}</div>; }
function formatDate(value) { if (!value) return "Not available"; return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)); }
async function readResponse(response) { const type = response.headers.get("content-type") ?? ""; return type.includes("application/json") ? response.json() : { error: await response.text() }; }
