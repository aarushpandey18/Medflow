import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import medicineRoutes from "./medicines.js";
import prescriptionRoutes from "./prescriptions.js";
import { checkStorageConnection, getStorageInfo } from "./store.js";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.resolve("uploads")));

app.get("/api/health", async (_req, res) => {
  const connection = await checkStorageConnection();

  res.json({
    status: "ok",
    service: "medical-prescription-api",
    storage: getStorageInfo(),
    connection,
  });
});

app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medicines", medicineRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === "LIMIT_FILE_SIZE";
    return res.status(isTooLarge ? 413 : 400).json({
      error: isTooLarge
        ? "File is too large. The maximum upload size is 10 MB."
        : "The uploaded file could not be processed.",
    });
  }

  if (error.message === "Only PDF, JPG, PNG, and WEBP files are allowed") {
    return res.status(400).json({ error: error.message });
  }

  res.status(500).json({
    error: "Unable to save the prescription. Check that persistent storage is configured.",
  });
});

app.listen(port, host, () => {
  console.log(`Medical prescription API listening on http://${host}:${port}`);
});
