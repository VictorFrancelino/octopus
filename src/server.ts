import { serve } from "bun";
import fs from "fs";
import path from "path";
import { compileOctopus } from "./compiler";

async function renderPageFromOct(
  file: string,
  meta: { title: string; description: string }
): Promise<string> {
  const template = fs.readFileSync(
    path.resolve(import.meta.dir, "../index.html"),
    "utf-8"
  );
  const body = await compileOctopus(fs.readFileSync(file, "utf-8"));

  return template
    .replace("{{title}}", meta.title)
    .replace("{{description}}", meta.description)
    .replace("{{body}}", body);
}

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    console.log(`[Request] ${req.method} ${url.pathname}`);

    try {
      if (url.pathname === "/") {
        const html = await renderPageFromOct(
          path.resolve("./src/pages/home.oct"),
          {
            title: "Página Inicial | Octopus",
            description: "Bem-vindo ao incrível framework Octopus.",
          }
        );

        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=UTF-8" },
        });
      }

      const publicPath = path.join(process.cwd(), "public", url.pathname);
      const file = Bun.file(publicPath);
      if (await file.exists()) {
        return new Response(file);
      }

      return new Response("Página não encontrada", { status: 404 });
    } catch (error) {
      console.error("[Server Error]", error);
      return new Response("Erro interno do servidor", { status: 500 });
    }
  },
});
