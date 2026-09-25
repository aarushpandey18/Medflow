import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

let supabase;
const memory = {
  prescriptions: new Map(),
  users: new Map(),
  appointments: new Map(),
  doctor_availability: new Map(),
  patient_records: new Map(),
};

function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabase) supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  return supabase;
}
export const makeId = (prefix) => `${prefix}-${crypto.randomUUID()}`;
export const isSupabaseConfigured = () => Boolean(getSupabase());

async function insert(table, row, key = "id") {
  const client = getSupabase();
  if (!client) { memory[table].set(row[key], { ...row }); return row; }
  const { data, error } = await client.from(table).insert(row).select().single();
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data;
}
async function update(table, id, row) {
  const client = getSupabase();
  if (!client) {
    const existing = memory[table].get(id);
    if (!existing) return null;
    const value = { ...existing, ...row, updated_at: new Date().toISOString() };
    memory[table].set(id, value); return value;
  }
  const { data, error } = await client.from(table).update(row).eq("id", id).select().maybeSingle();
  if (error) throw new Error(`Supabase update failed: ${error.message}`);
  return data;
}
async function remove(table, id) {
  const client = getSupabase();
  if (!client) return memory[table].delete(id);
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  return true;
}
async function list(table, { column, value, order = "created_at", ascending = false } = {}) {
  const client = getSupabase();
  if (!client) {
    return [...memory[table].values()].filter((item) => value === undefined || item[column] === value)
      .sort((a, b) => String(b[order] ?? "").localeCompare(String(a[order] ?? "")));
  }
  let query = client.from(table).select("*");
  if (value !== undefined) query = query.eq(column, value);
  const { data, error } = await query.order(order, { ascending });
  if (error) throw new Error(`Supabase list failed: ${error.message}`);
  return data;
}

// Prescription API (kept compatible with the original routes).
export async function savePrescription(prescriptionId, payload) {
  const row = toPrescriptionRow({ ...payload, prescriptionId });
  const client = getSupabase();
  if (!client) { memory.prescriptions.set(prescriptionId, row); return; }
  const { error } = await client.from("prescriptions").upsert(row, { onConflict: "prescription_id" });
  if (error) throw new Error(`Supabase save failed: ${error.message}`);
}
export async function findPrescription(prescriptionId) {
  const client = getSupabase();
  if (!client) return withSignedDocument(fromPrescriptionRow(memory.prescriptions.get(prescriptionId)));
  const { data, error } = await client.from("prescriptions").select("*").eq("prescription_id", prescriptionId).maybeSingle();
  if (error) throw new Error(`Supabase lookup failed: ${error.message}`);
  return data ? withSignedDocument(fromPrescriptionRow(data)) : null;
}
export async function listPrescriptions() {
  return (await list("prescriptions", { order: "created_at" })).map(fromPrescriptionRow);
}
export async function uploadDocument(file, prescriptionId) {
  if (!file) return null;
  const client = getSupabase();
  if (!client) return null;
  const extension = file.originalname.includes(".") ? file.originalname.split(".").pop().toLowerCase() : "bin";
  const objectPath = `${prescriptionId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from("prescription-files").upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw new Error(`Supabase file upload failed: ${error.message}`);
  return objectPath;
}

export const createUser = (user) => insert("users", { id: user.id ?? makeId("USR"), ...user });
export const listUsers = (role) => list("users", role ? { column: "role", value: role, order: "created_at" } : { order: "created_at" });
export const getUser = async (id) => (await list("users", { column: "id", value: id }))[0] ?? null;
export const updateUser = (id, values) => update("users", id, values);
export const deleteUser = (id) => remove("users", id);
export const createAppointment = (value) => insert("appointments", { id: value.id ?? makeId("APT"), status: "scheduled", ...value });
export const listAppointments = (filters = {}) => list("appointments", filters.doctorId ? { column: "doctor_id", value: filters.doctorId } : filters.patientId ? { column: "patient_id", value: filters.patientId } : { order: "appointment_date" });
export const getAppointment = async (id) => (await list("appointments", { column: "id", value: id }))[0] ?? null;
export const updateAppointment = (id, values) => update("appointments", id, values);
export const deleteAppointment = (id) => remove("appointments", id);
export const createAvailability = (value) => insert("doctor_availability", { id: value.id ?? makeId("AVL"), ...value });
export const listAvailability = (doctorId) => list("doctor_availability", doctorId ? { column: "doctor_id", value: doctorId, order: "day_of_week", ascending: true } : { order: "day_of_week", ascending: true });
export const deleteAvailability = (id) => remove("doctor_availability", id);
export const createPatientRecord = (value) => insert("patient_records", { id: value.id ?? makeId("REC"), ...value });
export const listPatientRecords = (patientId) => list("patient_records", { column: "patient_id", value: patientId, order: "record_date" });
export const updatePatientRecord = (id, values) => update("patient_records", id, values);
export const deletePatientRecord = (id) => remove("patient_records", id);

export function getStorageInfo() { return { provider: getSupabase() ? "supabase" : "memory", database: getSupabase() ? "Postgres" : "in-memory", collection: "prescriptions" }; }
export async function checkStorageConnection() {
  if (!getSupabase()) return { ok: true, provider: "memory" };
  try { const { error } = await getSupabase().from("prescriptions").select("prescription_id", { head: true, count: "exact" }).limit(1); if (error) throw new Error(error.message); return { ok: true, provider: "supabase" }; }
  catch (error) { return { ok: false, provider: "supabase", message: error.message }; }
}
function toPrescriptionRow(data) { return { prescription_id: data.prescriptionId, patient_name: data.patientName, patient_id: data.patientId, medicine: data.medicine, dosage: data.dosage, doctor_name: data.doctorName, notes: data.notes ?? "", verified: data.verified ?? true, document_name: data.documentName, document_url: data.documentUrl, created_at: data.createdAt ?? new Date().toISOString() }; }
function fromPrescriptionRow(row) { return row && { prescriptionId: row.prescription_id, patientName: row.patient_name, patientId: row.patient_id, medicine: row.medicine, dosage: row.dosage, doctorName: row.doctor_name, notes: row.notes ?? "", verified: row.verified, documentName: row.document_name, documentUrl: row.document_url, createdAt: row.created_at }; }
async function withSignedDocument(prescription) {
  if (!prescription || !prescription.documentUrl || prescription.documentUrl.startsWith("http") || !getSupabase()) return prescription;
  const { data, error } = await getSupabase().storage.from("prescription-files").createSignedUrl(prescription.documentUrl, 600);
  if (error) throw new Error(`Supabase document access failed: ${error.message}`);
  return { ...prescription, documentUrl: data.signedUrl };
}
