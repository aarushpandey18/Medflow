import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const medicineAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    dangerousInteractions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          medicines: {
            type: "array",
            items: { type: "string" },
          },
          risk: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "moderate", "high"],
          },
        },
        required: ["medicines", "risk", "severity"],
      },
    },
    dosageWarnings: {
      type: "array",
      items: { type: "string" },
    },
    sideEffectSummary: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          medicine: { type: "string" },
          commonSideEffects: {
            type: "array",
            items: { type: "string" },
          },
          seriousSideEffects: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["medicine", "commonSideEffects", "seriousSideEffects"],
      },
    },
    disclaimer: { type: "string" },
  },
  required: [
    "dangerousInteractions",
    "dosageWarnings",
    "sideEffectSummary",
    "disclaimer",
  ],
};

router.post("/analyze", async (req, res, next) => {
  try {
    const medicines = normalizeMedicines(req.body.medicines);

    if (medicines.length === 0) {
      return res.status(400).json({
        error: "Provide at least one medicine",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.json(buildFallbackAnalysis(medicines));
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "You are a medication safety assistant. Return concise JSON only. Flag possible dangerous interactions, dosage-related warnings, and a brief side-effect summary. Do not diagnose, prescribe, or replace a clinician or pharmacist.",
          },
          {
            role: "user",
            content: `Analyze this medicine list: ${medicines.join(", ")}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "medicine_analysis",
            schema: medicineAnalysisSchema,
            strict: true,
          },
        },
      });

      return res.json(JSON.parse(response.output_text));
    } catch (error) {
      console.warn("OpenAI medicine analysis failed. Using local fallback.", error);
      return res.json(buildFallbackAnalysis(medicines, "ai-fallback"));
    }
  } catch (error) {
    return next(error);
  }
});

function normalizeMedicines(medicines) {
  if (!Array.isArray(medicines)) {
    return [];
  }

  return medicines
    .map((medicine) => (typeof medicine === "string" ? medicine.trim() : ""))
    .filter(Boolean)
    .slice(0, 20);
}

function buildFallbackAnalysis(medicines, mode = "local-fallback") {
  const normalized = medicines.map(getMedicineKey);
  const dangerousInteractions = [];

  if (hasAll(normalized, ["warfarin", "ibuprofen"])) {
    dangerousInteractions.push({
      medicines: ["warfarin", "ibuprofen"],
      risk: "May increase bleeding risk",
      severity: "high",
    });
  }

  if (hasAll(normalized, ["metformin", "alcohol"])) {
    dangerousInteractions.push({
      medicines: ["metformin", "alcohol"],
      risk: "May increase lactic acidosis risk",
      severity: "moderate",
    });
  }

  if (hasAll(normalized, ["atorvastatin", "clarithromycin"])) {
    dangerousInteractions.push({
      medicines: ["atorvastatin", "clarithromycin"],
      risk: "May increase statin exposure and muscle toxicity risk",
      severity: "high",
    });
  }

  return {
    dangerousInteractions,
    dosageWarnings: getDosageWarnings(normalized),
    sideEffectSummary: medicines.map((medicine) => ({
      medicine,
      commonSideEffects: getCommonSideEffects(medicine),
      seriousSideEffects: getSeriousSideEffects(medicine),
    })),
    disclaimer:
      mode === "ai-fallback"
        ? "AI-assisted review is temporarily unavailable, so this local demo analysis was used. Confirm medication decisions with a qualified clinician or pharmacist."
        : "Local demo analysis only. Configure OPENAI_API_KEY for AI-assisted review and confirm medication decisions with a qualified clinician or pharmacist.",
    mode,
  };
}

function getCommonSideEffects(medicine) {
  const summary = getMedicineSummary(medicine);
  return (
    summary?.commonSideEffects ?? [
      "side effects vary by dose and patient condition",
      "nausea, dizziness, sleepiness, rash, or stomach upset may occur with some medicines",
    ]
  );
}

function getSeriousSideEffects(medicine) {
  return (
    getMedicineSummary(medicine)?.seriousSideEffects ?? [
      "urgent care is needed for breathing trouble, facial swelling, severe rash, fainting, unusual bleeding, or severe vomiting",
    ]
  );
}

function getDosageWarnings(medicines) {
  const warnings = new Set();

  medicines.forEach((medicine) => {
    const summary = medicineSummaries[medicine];

    if (summary?.dosageWarnings) {
      summary.dosageWarnings.forEach((warning) => {
        warnings.add(warning);
      });
      return;
    }

    warnings.add("Use only the prescribed dose and confirm safety for pregnancy, allergy history, kidney/liver disease, or other current medicines.");
  });

  return [...warnings];
}

function getMedicineSummary(medicine) {
  return medicineSummaries[getMedicineKey(medicine)] ?? null;
}

function getMedicineKey(medicine) {
  const normalized = medicine.toLowerCase().replace(/[^a-z0-9]/g, "");
  return medicineAliases[normalized] ?? normalized;
}

function hasAll(values, requiredValues) {
  return requiredValues.every((value) => values.includes(value));
}

const medicineAliases = {
  acetaminophen: "paracetamol",
  crocin: "paracetamol",
  dolo: "paracetamol",
  paracetamol: "paracetamol",
  amoxycillin: "amoxicillin",
  amoxicillin: "amoxicillin",
  augmentin: "amoxicillinclavulanate",
  amoxicillinclavulanate: "amoxicillinclavulanate",
  azithral: "azithromycin",
  azithromycin: "azithromycin",
  cetirizine: "cetirizine",
  cetrizine: "cetirizine",
  levocetirizine: "levocetirizine",
  pantoprazole: "pantoprazole",
  pan: "pantoprazole",
  omeprazole: "omeprazole",
  ibuprofen: "ibuprofen",
  brufen: "ibuprofen",
  aspirin: "aspirin",
  metformin: "metformin",
  atorvastatin: "atorvastatin",
  warfarin: "warfarin",
  clarithromycin: "clarithromycin",
  alcohol: "alcohol",
};

const medicineSummaries = {
  paracetamol: {
    commonSideEffects: ["usually well tolerated", "nausea is uncommon"],
    seriousSideEffects: ["liver injury risk with overdose or alcohol use"],
    dosageWarnings: ["Check total daily paracetamol dose across all combination products."],
  },
  amoxicillin: {
    commonSideEffects: ["nausea", "diarrhea", "rash"],
    seriousSideEffects: ["allergic reaction", "severe diarrhea"],
    dosageWarnings: ["Avoid if there is a known penicillin allergy unless a clinician confirms it is safe."],
  },
  amoxicillinclavulanate: {
    commonSideEffects: ["diarrhea", "nausea", "stomach upset"],
    seriousSideEffects: ["allergic reaction", "liver-related symptoms", "severe diarrhea"],
    dosageWarnings: ["Take exactly as prescribed and confirm safety if there is a penicillin allergy."],
  },
  azithromycin: {
    commonSideEffects: ["nausea", "diarrhea", "stomach pain"],
    seriousSideEffects: ["heart rhythm problems in higher-risk patients", "allergic reaction"],
    dosageWarnings: ["Confirm use with a clinician if there is a history of heart rhythm problems."],
  },
  cetirizine: {
    commonSideEffects: ["sleepiness", "dry mouth", "tiredness"],
    seriousSideEffects: ["severe allergic reaction is rare"],
    dosageWarnings: ["Avoid driving if it causes sleepiness."],
  },
  levocetirizine: {
    commonSideEffects: ["sleepiness", "dry mouth", "fatigue"],
    seriousSideEffects: ["severe allergic reaction is rare"],
    dosageWarnings: ["Avoid alcohol or driving if it causes sleepiness."],
  },
  pantoprazole: {
    commonSideEffects: ["headache", "nausea", "stomach pain"],
    seriousSideEffects: ["low magnesium with long-term use", "severe diarrhea"],
    dosageWarnings: ["Long-term use should be reviewed by a clinician."],
  },
  omeprazole: {
    commonSideEffects: ["headache", "nausea", "stomach pain"],
    seriousSideEffects: ["low magnesium with long-term use", "severe diarrhea"],
    dosageWarnings: ["Long-term use should be reviewed by a clinician."],
  },
  ibuprofen: {
    commonSideEffects: ["stomach upset", "heartburn"],
    seriousSideEffects: ["stomach bleeding", "kidney problems", "allergic reaction"],
    dosageWarnings: ["Avoid duplicate NSAID use and confirm safety in kidney disease or stomach ulcer history."],
  },
  aspirin: {
    commonSideEffects: ["stomach upset", "heartburn", "easy bruising"],
    seriousSideEffects: ["bleeding", "allergic reaction"],
    dosageWarnings: ["Check with a clinician before combining with blood thinners or other NSAIDs."],
  },
  metformin: {
    commonSideEffects: ["nausea", "diarrhea", "stomach upset"],
    seriousSideEffects: ["lactic acidosis is rare but serious"],
    dosageWarnings: ["Confirm safety in kidney disease or heavy alcohol use."],
  },
  atorvastatin: {
    commonSideEffects: ["muscle pain", "digestive upset"],
    seriousSideEffects: ["severe muscle injury", "liver-related symptoms"],
    dosageWarnings: ["Report unexplained severe muscle pain or weakness."],
  },
  warfarin: {
    commonSideEffects: ["bleeding", "bruising"],
    seriousSideEffects: ["serious bleeding"],
    dosageWarnings: ["Requires INR monitoring and interaction checks with new medicines."],
  },
  clarithromycin: {
    commonSideEffects: ["nausea", "diarrhea", "taste changes"],
    seriousSideEffects: ["heart rhythm problems in higher-risk patients", "allergic reaction"],
    dosageWarnings: ["Check interactions before combining with statins or heart rhythm medicines."],
  },
  alcohol: {
    commonSideEffects: ["drowsiness", "stomach irritation"],
    seriousSideEffects: ["dangerous interactions with some medicines"],
    dosageWarnings: ["Avoid alcohol with sedating medicines and confirm safety with diabetes medicines."],
  },
};

export default router;
