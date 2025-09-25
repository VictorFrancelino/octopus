import { serve } from "bun";
import { Title, Row, Text, Column } from "./core/components";
import { renderPage } from "./core/page";

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      const page = (
        <Row justify="center" items="center">
          <Title
            as="h1"
            class="hero-title"
            style={{ fontSize: "32px", textAlign: "center", color: "red" }}
            id="title-1"
          >
            Hello Octopus!
          </Title>
          <Text>It's a extraordinary text.</Text>
        </Row>
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
