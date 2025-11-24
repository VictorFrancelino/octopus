import path from "path"
import { publicDir } from "../../utils/paths";

/**
 * Safely join a public base and a requested pathname.
 */
export function safeJoinPublic(base: string, requested: string): string | null {
  try {
    const decoded = decodeURIComponent(requested);
    const resolved = path.resolve(base, "." + decoded);
    if (!resolved.startsWith(base)) return null;
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Try to serve a static file from publicDir.
 */
export async function tryServeStatic(req: Request): Promise<Response | null> {
  try {
    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "") return null;

    const candidate = safeJoinPublic(publicDir, url.pathname);
    if (!candidate) return null;
    
    const f = Bun.file(candidate);
    if (!(await f.exists())) return null;
    
    return new Response(f);
  } catch {
    return null;
  }
}