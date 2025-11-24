import { accentColor, header, logger } from "./utils";
import { build, compile, create, dev } from "./commands";

async function main() {
  const command = process.argv[2] ?? "help";

  switch (command) {
    case "dev":
      await dev();
      break;
    case "build":
      await build();
      break;
    case "compile":
    case "compile-pages":
      await compile();
      break;
    case "create":
      await create();
      break;
    case "help":
    default:
      header();
      logger.plain(accentColor("🐙 Uso:") + " oct <comando>\n");
      logger.plain(accentColor("Comandos:"));
      logger.plain(
        accentColor("  dev          ") +
          "Inicia servidor de desenvolvimento com hot reload"
      );
      logger.plain(
        accentColor("  build        ") + "Compila para produção (Bun.build)"
      );
      logger.plain(
        accentColor("  compile      ") + 
        "Compila páginas .oct para dist/ (Paralelizado!)"
      );
      logger.plain(
        accentColor("  create       ") + "Cria interativamente uma nova página .oct"
      );
      logger.plain(accentColor("  help         ") + "Mostra esta ajuda");
      break;
  }
}

main().catch((e) => {
  logger.error(accentColor("🐙 Erro fatal:"));
  console.error(e);
  process.exit(1);
});