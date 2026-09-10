import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import {
  findPrescription,
  listPrescriptions,
  savePrescription,
  uploadDocument,
} from "./store.js";

const router = Router();
const upload = multer({
  // Vercel's filesystem is read-only, so retain uploads in memory and send
  // them directly to Supabase Storage.
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter(_req, file, callback) {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error("Only PDF, JPG, PNG, and WEBP files are allowed"));
      return;
    }

    callback(null, true);
  },
});

function createPrescriptionId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `RX-${date}-${suffix}`;
}

function normalizePrescription(body) {
  return {
    patientName: body.patientName?.trim(),
    patientId: body.patientId?.trim(),
    medicine: body.medicine?.trim(),
    dosage: body.dosage?.trim(),
    doctorName: body.doctorName?.trim(),
    notes: body.notes?.trim() || "",
  };
}

function validatePrescription(prescription) {
  const requiredFields = ["patientName", "patientId", "medicine", "dosage", "doctorName"];
  return requiredFields.filter((field) => !prescription[field]);
}

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const prescription = normalizePrescription(req.body);
    const missingFields = validatePrescription(prescription);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields,
      });
    }

    const prescriptionId = createPrescriptionId();
    const documentUrl = await uploadDocument(req.file, prescriptionId);
    const payload = {
      ...prescription,
      prescriptionId,
      verified: true,
      documentName: req.file?.originalname ?? null,
      documentUrl,
      createdAt: new Date().toISOString(),
    };

    await savePrescription(prescriptionId, payload);

    return res.status(201).json({
      message: "Prescription saved",
      prescriptionId,
      verificationPath: `/verify/${prescriptionId}`,
      data: {
        ...prescription,
        verified: true,
        documentName: payload.documentName,
        documentUrl: payload.documentUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:prescriptionId/verify", async (req, res, next) => {
  try {
    const data = await findPrescription(req.params.prescriptionId);

    if (!data) {
      return res.status(404).json({
        valid: false,
        message: "Prescription not found",
      });
    }

    return res.json({
      valid: true,
      prescription: {
        prescriptionId: data.prescriptionId,
        patientName: data.patientName,
        patientId: data.patientId,
        medicine: data.medicine,
        dosage: data.dosage,
        doctorName: data.doctorName,
        notes: data.notes,
        documentName: data.documentName,
        documentUrl: data.documentUrl,
        verified: data.verified,
        createdAt: normalizeDate(data.createdAt),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const prescriptions = (await listPrescriptions()).map((data) => ({
      prescriptionId: data.prescriptionId,
      patientName: data.patientName,
      patientId: data.patientId,
      medicine: data.medicine,
      dosage: data.dosage,
      doctorName: data.doctorName,
      notes: data.notes,
      documentName: data.documentName,
      documentUrl: data.documentUrl,
      verified: data.verified,
      createdAt: normalizeDate(data.createdAt),
    }));

    return res.json({ prescriptions });
  } catch (error) {
    return next(error);
  }
});

export default router;

function normalizeDate(value) {
  return value?.toDate?.()?.toISOString() ?? value?.toISOString?.() ?? null;
}
