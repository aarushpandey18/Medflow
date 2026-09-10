/**
 * Public API URL for a split frontend/backend deployment.
 *
 * Leave NEXT_PUBLIC_API_BASE_URL empty when Next.js and Express run in the
 * same Render service: requests then use the local /api rewrite. Set it to
 * the public Render API URL (without a trailing slash) when they are hosted
 * as separate services.
 */
export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
}

