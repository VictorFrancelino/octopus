import fs from "fs/promises";
import path from "path";
import { match as pathMatch, type MatchFunction } from "path-to-regexp";

export type RouteEntry = {
  pattern: string;
  matcher: MatchFunction<Record<string, string | string[] | undefined>>;
  file: string;
  score: number;
};

const PAGES_DIR = path.resolve(process.cwd(), "src/pages");

/** cria matcher a partir do pattern (ex: "/users/:id" ou "/posts/:slug*") */
function createMatcher(pattern: string): MatchFunction<Record<string, string | string[] | undefined>> {
  return pathMatch(pattern, { decode: decodeURIComponent, end: true });
}

/** transforma caminho de arquivo relativo (pages/about.oct) -> route pattern */
export function filePathToPattern(relPath: string): string {
  const parts = relPath.split(path.sep).map((p) => p.replace(/\\/g, "/"));
  const last = parts[parts.length - 1];
  const base = last !== undefined ? last.replace(/\.oct$/i, "") : "";
  if (base === "index" && parts.length === 1) return "/";
  if (base === "index") {
    parts[parts.length - 1] = "";
  } else {
    parts[parts.length - 1] = base;
  }

  const segs = parts.filter(Boolean);
  const routeSegs = segs.map((seg) => {
    const m = seg.match(/^\[(\.\.\.)?(.+?)\]$/);
    if (m) {
      const isCatchAll = !!m[1];
      const name = m[2];
      return isCatchAll ? `:${name}*` : `:${name}`;
    }
    return seg;
  });

  return "/" + routeSegs.join("/");
}

/** heurística de especificidade */
function calcScore(pattern: string) {
  if (pattern === "/") return 1000;
  const segs = pattern.split("/").filter(Boolean);
  let score = 0;
  for (const s of segs) {
    if (s.startsWith(":") && s.endsWith("*")) score += 0;
    else if (s.startsWith(":")) score += 5;
    else score += 10;
  }
  return score;
}

/** percorre src/pages e gera lista de RouteEntry */
export async function buildRouteList(pagesDir = PAGES_DIR): Promise<RouteEntry[]> {
  const entries: RouteEntry[] = [];

  async function walk(dir: string, baseRel = "") {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const it of items) {
      const abs = path.join(dir, it.name);
      const rel = baseRel ? path.join(baseRel, it.name) : it.name;
      if (it.isDirectory()) {
        await walk(abs, rel);
      } else if (it.isFile() && it.name.endsWith(".oct")) {
        const pattern = filePathToPattern(rel);
        const matcher = createMatcher(pattern);
        const score = calcScore(pattern);
        entries.push({ pattern, matcher, file: path.resolve(dir, it.name), score });
      }
    }
  }

  await walk(pagesDir, "");
  entries.sort((a, b) => (b.score - a.score) || (b.pattern.length - a.pattern.length));
  return entries;
}

/** encontra a rota que casa com pathname e devolve file + params */
export function matchRoute(pathname: string, routes: RouteEntry[]): { file: string; params: Record<string, string> } | null {
  let p = pathname || "/";
  if (p !== "/" && p.endsWith("/")) p = p.replace(/\/+$/, "");

  for (const r of routes) {
    const res = r.matcher(p);
    if (!res) continue;

    const rawParams = res.params || {};
    const params: Record<string, string> = {};

    // normalize: values can be string | string[] | undefined
    for (const [k, v] of Object.entries(rawParams)) {
      if (v == null) params[k] = "";
      else if (Array.isArray(v)) params[k] = v.map(String).join("/");
      else params[k] = String(v);
    }

    return { file: r.file, params };
  }

  return null;
}

/** helper: find 404 page if exists */
export async function find404(pagesDir = PAGES_DIR): Promise<string | null> {
  const candidate = path.join(pagesDir, "404.oct");
  try {
    await fs.access(candidate);
    return candidate;
  } catch {
    return null;
  }
}
