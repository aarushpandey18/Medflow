# Permanent Deployment

This project runs a Next.js frontend and an Express API. For a simple permanent URL, deploy it as one Node web service on Render.

## Render

1. Push the `Medflow` project folder to GitHub. If it is inside a larger
   repository, set Render's **Root Directory** to `Medflow`.
2. Open Render and create a new Blueprint from the repository.
3. Render will read `render.yaml`.
4. Deploy the `medflow-dashboard` service.
5. Open the generated `.onrender.com` URL.

The blueprint deploys frontend and API together, so the frontend uses `/api`
automatically. Set `MONGODB_URI` before testing saves: Render's local disk is
ephemeral and must not be used for permanent prescription records.

## Separate frontend and Render API

If the frontend is deployed separately (for example, on Vercel) and the API
is already on Render, add this variable to the **frontend** deployment, then
redeploy it:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-service.onrender.com
```

Do not add a trailing slash. The API must expose `/api/health`; open it in a
browser and confirm `"connection":{"ok":true}` before using the dashboard.
QR codes now use the current frontend URL, so scanning them on any phone opens
the correct verification page. Add the production frontend domain to the API
CORS configuration if you restrict CORS later.

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
