import { Router } from "express";
import {
  createAppointment, createAvailability, createPatientRecord, createUser, deleteAppointment,
  deleteAvailability, deletePatientRecord, deleteUser, getAppointment, getUser, listAppointments,
  listAvailability, listPatientRecords, listUsers, updateAppointment, updatePatientRecord, updateUser,
} from "./store.js";

const router = Router();
const roles = new Set(["admin", "doctor", "patient", "staff"]);
const demoUsers = [
  { id: "demo-admin", name: "MedFlow Admin", email: "admin@medflow.demo", role: "admin" },
  { id: "demo-doctor", name: "Dr. Meera Joshi", email: "doctor@medflow.demo", role: "doctor", specialty: "General Medicine" },
  { id: "demo-patient", name: "Aarav Sharma", email: "patient@medflow.demo", role: "patient" },
];

router.get("/demo-users", async (_req, res, next) => {
  try { return res.json({ users: await ensureDemoUsers() }); } catch (error) { return next(error); }
});
router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "email is required" });
    const user = (await listUsers()).find((item) => item.email.toLowerCase() === email);
    if (!user) return res.status(401).json({ error: "Demo user not found", availableRoles: ["admin", "doctor", "patient"] });
    return res.json({ user, token: `demo-${user.id}` });
  } catch (error) { return next(error); }
});

router.get("/users", async (req, res, next) => {
  try { return res.json({ users: await listUsers(req.query.role) }); } catch (error) { return next(error); }
});
router.post("/users", async (req, res, next) => {
  try {
    const user = normalizeUser(req.body);
    const missing = ["name", "email", "role"].filter((key) => !user[key]);
    if (missing.length || !roles.has(user.role)) return res.status(400).json({ error: missing.length ? "Missing required fields" : "Invalid role", missingFields: missing });
    return res.status(201).json({ user: await createUser(user) });
  } catch (error) { return next(error); }
});
router.patch("/users/:id", async (req, res, next) => {
  try { const user = await updateUser(req.params.id, normalizeUser(req.body, true)); return user ? res.json({ user }) : res.status(404).json({ error: "User not found" }); } catch (error) { return next(error); }
});
router.delete("/users/:id", async (req, res, next) => {
  try { return (await deleteUser(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: "User not found" }); } catch (error) { return next(error); }
});

router.get("/appointments", async (req, res, next) => {
  try { return res.json({ appointments: await listAppointments({ doctorId: req.query.doctorId, patientId: req.query.patientId }) }); } catch (error) { return next(error); }
});
router.post("/appointments", async (req, res, next) => {
  try {
    const value = { patient_id: req.body?.patientId, doctor_id: req.body?.doctorId, appointment_date: req.body?.appointmentDate, reason: req.body?.reason ?? "", notes: req.body?.notes ?? "" };
    const missing = ["patient_id", "doctor_id", "appointment_date"].filter((key) => !value[key]);
    if (missing.length) return res.status(400).json({ error: "Missing required fields", missingFields: missing });
    if (Number.isNaN(Date.parse(value.appointment_date))) return res.status(400).json({ error: "appointmentDate must be a valid date" });
    return res.status(201).json({ appointment: await createAppointment(value) });
  } catch (error) { return next(error); }
});
router.patch("/appointments/:id", async (req, res, next) => {
  try { const appointment = await updateAppointment(req.params.id, appointmentFields(req.body)); return appointment ? res.json({ appointment }) : res.status(404).json({ error: "Appointment not found" }); } catch (error) { return next(error); }
});
router.patch("/appointments/:id/status", async (req, res, next) => {
  try {
    const status = req.body?.status;
    if (!["scheduled", "confirmed", "completed", "cancelled", "no_show"].includes(status)) return res.status(400).json({ error: "Invalid appointment status" });
    const appointment = await updateAppointment(req.params.id, { status });
    return appointment ? res.json({ appointment }) : res.status(404).json({ error: "Appointment not found" });
  } catch (error) { return next(error); }
});
router.delete("/appointments/:id", async (req, res, next) => {
  try { return (await deleteAppointment(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: "Appointment not found" }); } catch (error) { return next(error); }
});

router.get("/availability", async (req, res, next) => { try { return res.json({ availability: await listAvailability(req.query.doctorId) }); } catch (error) { return next(error); } });
router.post("/availability", async (req, res, next) => {
  try {
    const value = { doctor_id: req.body?.doctorId, day_of_week: Number(req.body?.dayOfWeek), start_time: req.body?.startTime, end_time: req.body?.endTime, is_available: req.body?.isAvailable !== false };
    if (!value.doctor_id || !value.start_time || !value.end_time || !Number.isInteger(value.day_of_week) || value.day_of_week < 0 || value.day_of_week > 6) return res.status(400).json({ error: "doctorId, dayOfWeek (0-6), startTime and endTime are required" });
    return res.status(201).json({ availability: await createAvailability(value) });
  } catch (error) { return next(error); }
});
router.delete("/availability/:id", async (req, res, next) => { try { return (await deleteAvailability(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: "Availability not found" }); } catch (error) { return next(error); } });

router.get("/patients/:id/profile", async (req, res, next) => { try { const user = await getUser(req.params.id); return user ? res.json({ profile: user }) : res.status(404).json({ error: "Patient not found" }); } catch (error) { return next(error); } });
router.patch("/patients/:id/profile", async (req, res, next) => { try { const user = await updateUser(req.params.id, normalizeUser(req.body, true)); return user ? res.json({ profile: user }) : res.status(404).json({ error: "Patient not found" }); } catch (error) { return next(error); } });
router.get("/patients/:id/records", async (req, res, next) => { try { return res.json({ records: await listPatientRecords(req.params.id) }); } catch (error) { return next(error); } });
router.post("/patients/:id/records", async (req, res, next) => { try { if (!req.body?.title) return res.status(400).json({ error: "title is required" }); return res.status(201).json({ record: await createPatientRecord({ patient_id: req.params.id, record_type: req.body.recordType ?? "general", title: req.body.title, details: req.body.details ?? "", record_date: req.body.recordDate ?? new Date().toISOString(), created_by: req.body.createdBy ?? null }) }); } catch (error) { return next(error); } });
router.patch("/patients/:patientId/records/:id", async (req, res, next) => { try { const record = await updatePatientRecord(req.params.id, { title: req.body?.title, details: req.body?.details, record_type: req.body?.recordType }); return record ? res.json({ record }) : res.status(404).json({ error: "Record not found" }); } catch (error) { return next(error); } });
router.delete("/patients/:patientId/records/:id", async (req, res, next) => { try { return (await deletePatientRecord(req.params.id)) ? res.status(204).end() : res.status(404).json({ error: "Record not found" }); } catch (error) { return next(error); } });

router.get("/analytics", async (_req, res, next) => {
  try {
    const [users, appointments] = await Promise.all([listUsers(), listAppointments()]);
    const byStatus = appointments.reduce((result, item) => { result[item.status] = (result[item.status] ?? 0) + 1; return result; }, {});
    return res.json({ totals: { users: users.length, doctors: users.filter((u) => u.role === "doctor").length, patients: users.filter((u) => u.role === "patient").length, appointments: appointments.length }, appointmentsByStatus: byStatus });
  } catch (error) { return next(error); }
});

function normalizeUser(body = {}, partial = false) {
  const value = { name: body.name?.trim(), email: body.email?.trim()?.toLowerCase(), role: body.role, phone: body.phone?.trim(), specialty: body.specialty?.trim(), avatar_url: body.avatarUrl ?? body.avatar_url };
  if (partial) Object.keys(value).forEach((key) => value[key] === undefined && delete value[key]);
  return value;
}
function appointmentFields(body = {}) { return Object.fromEntries(Object.entries({ patient_id: body.patientId, doctor_id: body.doctorId, appointment_date: body.appointmentDate, reason: body.reason, notes: body.notes }).filter(([, value]) => value !== undefined)); }
async function ensureDemoUsers() {
  const users = await listUsers();
  for (const demo of demoUsers) if (!users.some((item) => item.id === demo.id)) await createUser(demo);
  return await listUsers();
}
export default router;
