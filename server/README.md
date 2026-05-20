# Medical Prescription API

## Setup

1. Run `npm run dev:full` for a local demo using in-memory prescription storage.
2. To persist records with Firebase, copy `.env.example` to `.env`.
3. Set `FIREBASE_PROJECT_ID`.
4. Provide Firebase Admin credentials with either:
   - `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json`
   - `FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-service-account-json>`
5. Start the API with `npm run dev:server`.

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
