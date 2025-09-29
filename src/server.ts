import { serve } from "bun";
import fs from "fs";
import path from "path";
import { compileOctopus } from "./compiler";
import { buildRouteList, matchRoute, find404 } from "./router";
import type { RouteEntry } from "./router";

const INDEX_HTML = path.resolve(import.meta.dir, "../index.html");
const PAGES_DIR = path.resolve(process.cwd(), "src/pages");
const PUBLIC_DIR = path.resolve(process.cwd(), "public");

let routes: RouteEntry[] = [];
let fallback404: string | null = null;

/** helper: read index.html template once */
function readIndexTemplate(): string {
  try {
    return fs.readFileSync(INDEX_HTML, "utf-8");
  } catch (e) {
    console.error("[server] failed to read index.html:", e);
    return "<!doctype html><html><head><meta charset='utf-8'><title>{{title}}</title></head><body>{{body}}</body></html>";
  }
}

/** render page using your compileOctopus and inject meta + params */
async function renderPageFromOct(file: string, meta: { title?: string; description?: string }, params?: Record<string, string>): Promise<string> {
  const template = readIndexTemplate();
  const body = await compileOctopus(fs.readFileSync(file, "utf-8"));

  const paramsScript = params && Object.keys(params).length
    ? `<script>window.__OCTO_PARAMS__ = ${JSON.stringify(params)};</script>`
    : "";

  const title = meta.title ?? path.basename(file).replace(/\.oct$/, "");
  const description = meta.description ?? "";

  return template
    .replace("{{title}}", title)
    .replace("{{description}}", description)
    .replace("{{body}}", `${paramsScript}${body}`);
}

/** build routes at startup (and when pages change) */
async function rebuildRoutes() {
  try {
    routes = await buildRouteList();
    console.log("[router] routes:");
    routes.forEach((r) => console.log(" ", r.pattern, "->", r.file));
    fallback404 = await find404();
    if (fallback404) console.log("[router] found 404:", fallback404);
  } catch (e) {
    console.error("[router] failed to build route list:", e);
  }
}

/** dev: watch pages dir and rebuild routes when files change (debounced) */
function watchPagesForDev() {
  try {
    let timer: any = null;
    fs.watch(PAGES_DIR, { recursive: true }, (ev, file) => {
      // debounce rapid events
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        console.log("[router] change detected in pages/, rebuilding routes...");
        await rebuildRoutes();
      }, 150);
    });
    console.log("[router] watching pages for changes:", PAGES_DIR);
  } catch (e) {
    console.warn("[router] watch not available or failed:", e);
  }
}

/* bootstrap */
await rebuildRoutes();
// start watcher in dev (if pages dir exists)
try {
  if (fs.existsSync(PAGES_DIR)) watchPagesForDev();
} catch { }

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const rawPath = url.pathname || "/";
    const routePath = rawPath === "" ? "/" : rawPath.replace(/\/+$/, "") || "/";
    console.log(`[Request] ${req.method} ${routePath}`);

    try {
      // 1) serve static files from /public first (images, css, runtime, etc)
      // map url.pathname to public path (ensure no path traversal)
      try {
        const safeRequested = decodeURIComponent(url.pathname);
        const candidate = path.join(PUBLIC_DIR, safeRequested);
        // quick containment check
        if (candidate.startsWith(PUBLIC_DIR)) {
          const f = Bun.file(candidate);
          if (await f.exists()) {
            // let Bun infer Content-Type
            return new Response(f);
          }
        }
      } catch (e) {
        // ignore decode / path errors and continue to route matching
      }

      // 2) match route
      const matched = matchRoute(routePath, routes);

      if (!matched) {
        // not found - try fallback 404.oct
        if (fallback404) {
          const html = await renderPageFromOct(fallback404, { title: "404 - Not Found" }, {});
          return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=UTF-8" } });
        }
        return new Response("Página não encontrada", { status: 404 });
      }

      // 3) matched route -> compile and render
      // derive a simple meta from filename
      const titleName = path.basename(matched.file).replace(/\.oct$/, "");
      const meta = { title: `${titleName} | Octopus`, description: "" };

      // render page and inject params as window.__OCTO_PARAMS__
      const html = await renderPageFromOct(matched.file, meta, matched.params);

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      });
    } catch (err) {
      console.error("[server] error handling request:", err);
      // on error, if 404 exists render it for dev diagnostics
      if (fallback404) {
        try {
          const html = await renderPageFromOct(fallback404, { title: "500 - Error" }, {});
          return new Response(html, { status: 500, headers: { "Content-Type": "text/html; charset=UTF-8" } });
        } catch (e) {
          // fallback plaintext
        }
      }
      return new Response("Erro interno do servidor", { status: 500 });
    }
  },
});