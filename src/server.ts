import { serve } from "bun";
import fs from "fs"
import path from "path";
import { compileOctopus } from "./compiler";

function renderPageFromOct(file: string, meta: { title: string, description: string }) {
  const template = fs.readFileSync(path.resolve(import.meta.dir, "../index.html"), "utf-8")
  const body = compileOctopus(fs.readFileSync(file, "utf-8"))

  return template
    .replace("{{title}}", meta.title)
    .replace("{{description}}", meta.description)
    .replace("{{body}}", body)
}

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      const html = renderPageFromOct(path.resolve("./src/pages/home.oct"), {
        title: "Página Inicial | Octopus",
        description: "Bem-vindo ao incrível framework Octopus.",
      })

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      });
    }

    return new Response("Página não encontrada", { status: 404 });
  },
});
