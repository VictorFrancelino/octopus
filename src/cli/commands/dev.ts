import { accentColor, header, logger, mainFile } from "../utils";
import { spawn } from "bun";
import pc from "picocolors";

export async function dev() {
  header();
  logger.info("Iniciando Octopus em modo de desenvolvimento...");

  const args = ["--watch", "--hot", mainFile];

  logger.info(pc.dim(`> bun ${args.join(" ")}`));
  logger.info(accentColor("🐙 Servidor de desenvolvimento iniciado!"));

  const proc = spawn(["bun", ...args], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  const exitCode = await proc.exited;
  if (exitCode === 0) logger.success("Servidor de desenvolvimento finalizado com sucesso");
  else logger.error(`Servidor de desenvolvimento finalizado com código ${exitCode}`);
}