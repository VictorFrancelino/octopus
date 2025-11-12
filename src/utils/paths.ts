import path from "path"

export const INDEX_HTML = path.resolve(process.cwd(), "index.html");
export const PAGES_DIR = path.resolve(process.cwd(), "src/pages");
export const PUBLIC_DIR = path.resolve(process.cwd(), "public");

/**
 * Safely join a public base and a requested pathname.
 * Returns absolute path or null if outside base (prevents traversal).
 */
export function safeJoinPublic(base: string, requested: string): string | null {
  try {
    const decoded = decodeURIComponent(requested);
    // prefix '.' avoids absolute paths from user
    const resolved = path.resolve(base, "." + decoded);
    if (!resolved.startsWith(base)) return null;
    return resolved;
  } catch {
    return null;
  }
}