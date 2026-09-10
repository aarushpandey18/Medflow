import cors from "cors";
import express from "express";
import multer from "multer";
import medicineRoutes from "./medicines.js";
import prescriptionRoutes from "./prescriptions.js";
import { checkStorageConnection, getStorageInfo } from "./store.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", async (_req, res) => res.json({ status: "ok", service: "medical-prescription-api", storage: getStorageInfo(), connection: await checkStorageConnection() }));
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);
app.use(async (error, _req, res, _next) => {
  console.error(error);
  if (error instanceof multer.MulterError) return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "File is too large. The maximum upload size is 10 MB." : "The uploaded file could not be processed." });
  if (error.message === "Only PDF, JPG, PNG, and WEBP files are allowed") return res.status(400).json({ error: error.message });
  const connection = await checkStorageConnection();
  return res.status(500).json({ error: connection.ok ? "Unable to save the prescription. Please try again." : "Prescription database is unavailable. Check the Supabase connection in Vercel.", storage: getStorageInfo().provider, detail: connection.ok ? undefined : connection.message });
});
export default app;
