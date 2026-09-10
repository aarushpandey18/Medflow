import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

let supabase;

function getSupabase() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!supabase) supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  return supabase;
}

export async function savePrescription(prescriptionId, payload) {
  const { error } = await requireSupabase().from("prescriptions").upsert(toRow({ ...payload, prescriptionId }), { onConflict: "prescription_id" });
  if (error) throw new Error(`Supabase save failed: ${error.message}`);
}

export async function findPrescription(prescriptionId) {
  const { data, error } = await requireSupabase().from("prescriptions").select("*").eq("prescription_id", prescriptionId).maybeSingle();
  if (error) throw new Error(`Supabase lookup failed: ${error.message}`);
  return data ? withSignedDocument(fromRow(data)) : null;
}

export async function listPrescriptions() {
  const { data, error } = await requireSupabase().from("prescriptions").select("*").order("created_at", { ascending: false }).limit(25);
  if (error) throw new Error(`Supabase list failed: ${error.message}`);
  return data.map(fromRow);
}

export async function uploadDocument(file, prescriptionId) {
  if (!file) return null;
  const extension = file.originalname.includes(".") ? file.originalname.split(".").pop().toLowerCase() : "bin";
  const objectPath = `${prescriptionId}/${crypto.randomUUID()}.${extension}`;
  const client = requireSupabase();
  const { error } = await client.storage.from("prescription-files").upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw new Error(`Supabase file upload failed: ${error.message}`);
  return objectPath;
}

export function getStorageInfo() { return { provider: "supabase", database: "Postgres", collection: "prescriptions" }; }

export async function checkStorageConnection() {
  try {
    const { error } = await requireSupabase().from("prescriptions").select("prescription_id", { head: true, count: "exact" }).limit(1);
    if (error) throw new Error(error.message);
    return { ok: true, provider: "supabase" };
  } catch (error) { return { ok: false, provider: "supabase", message: error.message }; }
}

function requireSupabase() {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  return client;
}

function toRow(data) { return { prescription_id: data.prescriptionId, patient_name: data.patientName, patient_id: data.patientId, medicine: data.medicine, dosage: data.dosage, doctor_name: data.doctorName, notes: data.notes, verified: data.verified, document_name: data.documentName, document_url: data.documentUrl, created_at: data.createdAt instanceof Date ? data.createdAt.toISOString() : data.createdAt }; }
function fromRow(row) { return { prescriptionId: row.prescription_id, patientName: row.patient_name, patientId: row.patient_id, medicine: row.medicine, dosage: row.dosage, doctorName: row.doctor_name, notes: row.notes ?? "", verified: row.verified, documentName: row.document_name, documentUrl: row.document_url, createdAt: row.created_at }; }

async function withSignedDocument(prescription) {
  if (!prescription.documentUrl || prescription.documentUrl.startsWith("http")) return prescription;
  const { data, error } = await requireSupabase().storage.from("prescription-files").createSignedUrl(prescription.documentUrl, 60 * 10);
  if (error) throw new Error(`Supabase document access failed: ${error.message}`);
  return { ...prescription, documentUrl: data.signedUrl };
}
