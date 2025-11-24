import { accentColor, header, logger, mainFile } from "../utils";
import { createSpinner } from "nanospinner";

export async function build() {
  header();
  logger.info("Construindo projeto Octopus para produção...");

  const spinner = createSpinner(accentColor("🐙 Compilando projeto...")).start();

  try {
    const result = await Bun.build({
      entrypoints: [mainFile],
      outdir: "./build",
      target: "bun",
      minify: false,
    });

    if (result.success) {
      spinner.success({ text: accentColor("🐙 Build concluído com sucesso!") });
      logger.success("Saída do build: ./build");
      logger.success(accentColor("🐙 Pronto para implantação!"));
    } else {
      spinner.error({ text: "Falha no build." });
      for (const log of result.logs) logger.error(`[${log.name}]: ${log.message}`);
      logger.error("Verifique os logs acima para detalhes.");
    }
  } catch (err) {
    spinner.error({ text: "Build interrompido" });
    logger.error(String(err));
  }
}