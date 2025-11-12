import { serve } from "bun";
import fs from "fs";
import path from "path";
import { buildRouteList, matchRoute, find404 } from "./router";
import type { RouteEntry } from "./router";
import { tryServeStatic } from "./utils/static";
import { renderPageFromOct } from "./utils/renderPage";
import { watchPagesForDev } from "./utils/watch";
import { PAGES_DIR } from "./utils/paths";

let routes: RouteEntry[] = [];
let fallback404: string | null = null;

async function rebuildRoutes() {
  routes = await buildRouteList();
  fallback404 = await find404();
}

/* bootstrap */
await rebuildRoutes();
if (fs.existsSync(PAGES_DIR)) watchPagesForDev(rebuildRoutes);

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === "" ? "/" : url.pathname.replace(/\/+$/, "") || "/";

    const staticResp = await tryServeStatic(req);
    if (staticResp) return staticResp;

    const matched = matchRoute(pathname, routes);
    if (!matched) {
      if (fallback404) {
        const html = await renderPageFromOct(fallback404, { title: "404 - Not Found" }, {});
        return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=UTF-8" } });
      }
      return new Response("Not found", { status: 404 });
    }

    const meta = { title: `${path.basename(matched.file).replace(/\.oct$/, "")} | Octopus` };
    const html = await renderPageFromOct(matched.file, meta, matched.params);
    return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  },
});