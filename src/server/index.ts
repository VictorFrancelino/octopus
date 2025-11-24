import path from "path";
import { serve } from "bun";
import { buildRouteList, find404, matchRoute } from "./router";
import { tryServeStatic } from "./utils/static";
import type { RadixRouter } from "radix3";
import { renderPageFromOct } from "./utils/renderPage";

let router: RadixRouter<{ file: string }> | null = null;
let fallback404: string | null = null;

async function rebuildRoutes() {
  router = await buildRouteList();
  fallback404 = await find404();
}

/* bootstrap */
await rebuildRoutes();

serve({
  port: 3000,
  async fetch(req) {
    if (!router) return new Response("Server is initializing...", { status: 503 });

    const url = new URL(req.url);
    let pathname = url.pathname === "" ? "/" : url.pathname;
    if (pathname !== "/" && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
    pathname = pathname.replace(/\/+/g, "/"); // remove barras duplicadas

    const staticResp = await tryServeStatic(req);
    if (staticResp) return staticResp;

    const matched = matchRoute(pathname, router);
    if (!matched) {
      if (fallback404) {
        const html = await renderPageFromOct(fallback404, { title: "404 - Not Found" }, {});
        return new Response(html, { status: 404, headers: { "Content-Type": "text/html; charset=UTF-8" } });
      }
      return new Response("Not found", { status: 404 });
    }

    const baseName = path.basename(matched.file).replace(/\.oct$/, "");
    const meta = { title: `${baseName} | Octopus` };

    const html = await renderPageFromOct(matched.file, meta, matched.params);

    return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8" } });
  },
});