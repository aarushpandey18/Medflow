# Medical Prescription API

## Setup

1. Copy `.env.example` to `.env`.
2. To persist records with MongoDB Atlas, set `MONGODB_URI`.
3. Optional: set `MONGODB_DB` and `MONGODB_COLLECTION`. Defaults are `medflow` and `prescriptions`.
4. Run `npm run dev:full`.

MongoDB Atlas example:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=medflow
MONGODB_COLLECTION=prescriptions
```

If `MONGODB_URI` is set, MongoDB is used first. Firebase remains supported as a fallback:

1. Set `FIREBASE_PROJECT_ID`.
2. Provide Firebase Admin credentials with either:
   - `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json`
   - `FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-service-account-json>`
3. Start the API with `npm run dev:server`.

## Routes

### `GET /api/health`

Returns API status.

### `POST /api/prescriptions/upload`

Saves a prescription and generates a unique `prescriptionId`.
The response also includes `verificationPath`, which can be encoded into a QR code by the frontend.
Send this route as `multipart/form-data` with an optional `file` field for PDF/JPG/PNG/WEBP uploads.

```json
{
  "patientName": "Aarav Sharma",
  "patientId": "PT-1042",
  "medicine": "Amoxicillin 500 mg",
  "dosage": "1 capsule twice daily",
  "doctorName": "Dr. Meera Joshi",
  "notes": "Take after meals"
}
```

### `GET /api/prescriptions/:prescriptionId/verify`

Verifies whether a prescription exists and returns its stored details.

### `GET /api/prescriptions`

Returns the latest 25 prescriptions.

### `POST /api/medicines/analyze`

Uses the OpenAI API to return structured medication safety information.

```json
{
  "medicines": ["warfarin", "ibuprofen", "metformin"]
}
```

Response fields:

- `dangerousInteractions`
- `dosageWarnings`
- `sideEffectSummary`
- `disclaimer`
