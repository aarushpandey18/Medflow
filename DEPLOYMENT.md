# Vercel + Supabase deployment

This project is configured for Vercel serverless functions and Supabase Postgres
with private Supabase Storage for uploaded prescriptions. It no longer needs
Render or MongoDB.

1. In Supabase, create a project and open **SQL Editor**.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) once.
3. In Vercel, import this GitHub repository. If needed, set **Root Directory**
   to `Medflow` and deploy with the default Next.js settings.
4. Add these Vercel environment variables for Production, Preview, and Development:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=optional
OPENAI_MODEL=gpt-5-mini
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only: never prefix it with `NEXT_PUBLIC_`.
After the Vercel deployment is healthy at `/api/health`, delete the old Render
service from its dashboard. Do this only after saving and verifying a test
prescription on Vercel, because deleting Render cannot be undone.
