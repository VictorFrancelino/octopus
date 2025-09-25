import { serve } from "bun";
import { Row, Col, Button, FirstTitle } from "./src/core/components";
import { renderPage } from "./src/core/page";

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      const page = Row(
        {},
        Col({}, FirstTitle({ class: "my-title" }, "Bem-vindo ao Octopus!")),
        Col({}, Button({ id: "start-button" }, "Começar"))
      );
      const html = renderPage(page, {
        title: "Página Inicial | Octopus",
        description: "Bem-vindo ao incrível framework Octopus.",
      });
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=UTF-8" },
      });
    }

    return new Response("Página não encontrada", { status: 404 });
  },
});
