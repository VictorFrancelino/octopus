import fs from "fs/promises";
import path from "path";

export type RouteEntry = {
  pattern: string; // e.g. /users/:id or /posts/:slug*
  regex: RegExp;
  paramNames: string[]; // ['id']
  file: string; // absolute path to .oct file
  score: number; // used for sorting: higher = more specific
};

const PAGES_DIR = path.resolve(process.cwd(), "src/pages");

/** transforma caminho de arquivo relativo (pages/about.oct) -> route pattern */
function filePathToPattern(relPath: string): string {
  // normaliza separadores
  const parts = relPath.split(path.sep).map((p) => p.replace(/\\/g, "/"));
  // remove .oct extension
  const last = parts[parts.length - 1];
  const base = last !== undefined ? last.replace(/\.oct$/i, "") : "";
  if (base === "index" && parts.length === 1) return "/"; // pages/index.oct => /
  if (base === "index") {
    // pages/foo/index.oct => /foo
    parts[parts.length - 1] = ""; // drop index
  } else {
    parts[parts.length - 1] = base;
  }

  const segs = parts.filter(Boolean); // remove empty
  const routeSegs = segs.map((seg) => {
    // dynamic [id]
    const m = seg.match(/^\[(\.\.\.)?(.+?)\]$/);
    if (m) {
      const isCatchAll = !!m[1]; // '...' present
      const name = m[2];
      return isCatchAll ? `:${name}*` : `:${name}`;
    }
    return seg;
  });

  return "/" + routeSegs.join("/");
}

/** cria regex e paramNames a partir de pattern */
function patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  // escape regex for static parts, convert :name and :name* to groups
  const paramNames: string[] = [];
  let regexStr = "^";
  const segs = pattern.split("/").filter(Boolean);
  if (pattern === "/") {
    return { regex: /^\/$/, paramNames: [] };
  }

  for (const seg of segs) {
    regexStr += "\\/";
    if (seg.startsWith(":") && seg.endsWith("*")) {
      const name = seg.slice(1, -1);
      paramNames.push(name);
      regexStr += "(.+)";
    } else if (seg.startsWith(":")) {
      const name = seg.slice(1);
      paramNames.push(name);
      regexStr += "([^/]+)";
    } else {
      // static seg - escape it
      regexStr += seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  regexStr += "\\/?$"; // allow optional trailing slash
  const regex = new RegExp(regexStr);
  return { regex, paramNames };
}

/** heurística de especificidade: mais static segments => maior score.
 * catch-all penaliza fortemente.
 */
function calcScore(pattern: string) {
  if (pattern === "/") return 1000;
  const segs = pattern.split("/").filter(Boolean);
  let score = 0;
  for (const s of segs) {
    if (s.startsWith(":") && s.endsWith("*")) score += 0; // catch-all crappy
    else if (s.startsWith(":")) score += 5; // dynamic
    else score += 10; // static
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
        const { regex, paramNames } = patternToRegex(pattern);
        const score = calcScore(pattern);
        entries.push({
          pattern,
          regex,
          paramNames,
          file: path.resolve(dir, it.name),
          score,
        });
      }
    }
  }

  await walk(pagesDir, "");
  // sort by score desc (more specific first), tie-breaker: longer pattern first
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.pattern.length - a.pattern.length;
  });

  return entries;
}

/** encontra a rota que casa com pathname e devolve file + params */
export function matchRoute(pathname: string, routes: RouteEntry[]): { file: string; params: Record<string, string> } | null {
  // normalize pathname: remove trailing slashes (except root)
  let p = pathname || "/";
  if (p !== "/" && p.endsWith("/")) p = p.replace(/\/+$/, "");

  for (const r of routes) {
    const m = r.regex.exec(p);
    if (!m) continue;
    const params: Record<string, string> = {};
    if (r.paramNames.length) {
      // match groups in order
      // m[1], m[2], etc corresponds to paramNames
      r.paramNames.forEach((name, idx) => {
        const val = m[idx + 1] ?? "";
        params[name] = decodeURIComponent(val);
      });
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
