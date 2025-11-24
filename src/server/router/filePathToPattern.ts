import path from "path";

/**
 * Transforma caminho de arquivo relativo em padrão de rota Radix3.
 * pages/index.oct -> /
 * pages/about.oct -> /about
 * pages/users/[id].oct -> /users/:id
 * pages/docs/[...slug].oct -> /docs/**:slug
 */
export function filePathToPattern(relPath: string): string {
  const posix = relPath.split(path.sep).join("/");
  const parts = posix.split("/").filter(Boolean);
  const last = parts.pop() ?? "";
  const base = last.replace(/\.oct$/i, "");

  if (base !== "index") {
    parts.push(base);
  }

  const routeSegs = parts.map(seg => {
    // Catch-all: [...slug] -> **:slug
    const catchAll = seg.match(/^\[\.{3}(.+?)\]$/);
    if (catchAll) return `**:${catchAll[1]}`;

    // Dinâmico: [id] -> :id
    const dynamic = seg.match(/^\[(.+?)\]$/);
    if (dynamic) return `:${dynamic[1]}`;

    return seg;
  });

  const pattern = "/" + routeSegs.join("/");
  return pattern === "//" ? "/" : pattern;
}