# Permanent Deployment

This project runs a Next.js frontend and an Express API. For a simple permanent URL, deploy it as one Node web service on Render.

## Render

1. Push this `hackthon` folder to GitHub.
2. Open Render and create a new Blueprint from the repository.
3. Render will read `render.yaml`.
4. Deploy the `medflow-dashboard` service.
5. Open the generated `.onrender.com` URL.

## Important environment variables

Add these in Render if you want persistent data and AI analysis:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=medflow
MONGODB_COLLECTION=prescriptions
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5-mini
```

Firebase is still supported if `MONGODB_URI` is not set. Without MongoDB or Firebase, prescriptions use the local fallback and are not suitable for production hosting.

Uploaded files are stored on the service filesystem. For production-grade document persistence, use object storage instead of local uploads.
