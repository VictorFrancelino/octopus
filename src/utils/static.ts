import { safeJoinPublic, PUBLIC_DIR } from "./paths";

/**
 * Try to serve a static file from PUBLIC_DIR.
 * Returns a Response or null if not served.
 * (Simple: uses Bun.file if exists; you can enrich with mime/etag later)
 */
export async function tryServeStatic(req: Request): Promise<Response | null> {
  try {
    const url = new URL(req.url);
    const candidate = safeJoinPublic(PUBLIC_DIR, url.pathname);
    if (!candidate) return null;
    const f = Bun.file(candidate);
    if (!(await f.exists())) return null;
    return new Response(f);
  } catch {
    return null;
  }
}