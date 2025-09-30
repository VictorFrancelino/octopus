import { spawn } from "bun";
import fs from "fs/promises";
import path from "path";
import pc from "picocolors";
import boxen from "boxen";
import { createSpinner } from "nanospinner";
import prompts from "prompts";

import { compilePage } from "./compiler";

const PAGES_DIR = path.resolve(__dirname, "pages");
const OUTPUT_DIR = path.resolve(__dirname, "../dist/pages");
const MAIN_FILE = "src/server.ts";

const salmon = (text: string) => `\x1b[38;2;250;128;114m${text}\x1b[0m`;

function header() {
  const title = pc.bold(salmon("🐙 Octopus"));
  const subtitle = pc.gray("framework • dev tools");
  console.log(
    boxen(`${title}\n${subtitle}`, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "#FA8072",
    })
  );
}

const logger = {
  info: (msg: string) => console.log(pc.dim("i") + " " + pc.blue(msg)),
  success: (msg: string) => console.log(pc.green("✔") + " " + pc.green(msg)),
  warn: (msg: string) => console.log(pc.yellow("⚠") + " " + pc.yellow(msg)),
  error: (msg: string) => console.error(pc.red("✖") + " " + pc.red(msg)),
  plain: (msg: string) => console.log(msg),
};

async function cmdDev() {
  header();
  logger.info("Iniciando Octopus em modo de desenvolvimento...");

  const args = ["--watch", "--hot", MAIN_FILE];

  logger.info(pc.dim(`> bun ${args.join(" ")}`));
  logger.info(salmon("🐙 Servidor de desenvolvimento iniciado!"));

  const proc = spawn(["bun", ...args], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  proc.exited.then((code: number) => {
    if (code === 0) {
      logger.success("Servidor de desenvolvimento finalizado com sucesso");
    } else {
      logger.error(`Servidor de desenvolvimento finalizado com código ${code}`);
    }
  });
}

async function cmdBuild() {
  header();
  logger.info("Construindo projeto Octopus para produção...");

  const spinner = createSpinner(salmon("🐙 Compilando projeto...")).start();

  try {
    const result = await Bun.build({
      entrypoints: [MAIN_FILE],
      outdir: "./build",
      target: "bun",
      splitting: true,
      minify: true,
    });

    if (result.success) {
      spinner.success({ text: salmon("🐙 Build concluído com sucesso!") });
      logger.success("Saída do build: ./build");
      logger.success(salmon("🐙 Pronto para implantação!"));
    } else {
      spinner.error({ text: "Falha no build." });
      logger.error(String(result.logs || "Erro de build desconhecido"));
    }
  } catch (err) {
    spinner.error({ text: "Build interrompido" });
    logger.error(String(err));
  }
}

async function cmdCompilePages() {
  header();
  logger.info("Compilando páginas .oct para dist...");

  const spinner = createSpinner(salmon("🐙 Compilando páginas...")).start();

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const files = await fs.readdir(PAGES_DIR);

  let compiledCount = 0;

  for (const file of files) {
    if (!file.endsWith(".oct")) continue;
    const inputPath = path.join(PAGES_DIR, file);
    const outName = file.replace(/\.oct$/, ".html");
    const outPath = path.join(OUTPUT_DIR, outName);

    spinner.update({ text: salmon(`🐙 Compilando ${file}...`) });

    try {
      const compiled = await compilePage(inputPath);
      const data =
        typeof compiled === "string"
          ? compiled
          : JSON.stringify(compiled, null, 2);
      await fs.writeFile(outPath, data);
      compiledCount++;
    } catch (err) {
      spinner.stop();
      logger.error(`Falha ao compilar ${file}: ${String(err)}`);
      spinner.start();
    }
  }

  spinner.success({
    text: salmon(`🐙 ${compiledCount} páginas compiladas com sucesso!`),
  });
}

async function cmdCreate() {
  header();
  logger.info(salmon("🐙 Criando nova página..."));

  const response = await prompts({
    type: "text",
    name: "name",
    message: salmon("Nome da nova página (ex: sobre):"),
    initial: "nova-pagina",
  });

  const name = String(response.name).replace(/[^a-z0-9\-]/gi, "-");
  const file = path.join(PAGES_DIR, `${name}.oct`);

  const spinner = createSpinner(salmon(`🐙 Criando ${name}.oct...`)).start();

  const template = `<template>\n  <Title>${name}</Title>\n</template>\n\n<style>\n\n</style>\n`;

  try {
    await fs.mkdir(PAGES_DIR, { recursive: true });
    await fs.writeFile(file, template, { flag: "wx" });
    spinner.success({
      text: salmon(`🐙 Página ${name}.oct criada com sucesso!`),
    });
  } catch (err) {
    spinner.error({ text: `Não foi possível criar o arquivo: ${String(err)}` });
  }
}

async function main() {
  const command = process.argv[2] ?? "help";

  switch (command) {
    case "dev":
      await cmdDev();
      break;
    case "build":
      await cmdBuild();
      break;
    case "compile":
    case "compile-pages":
      await cmdCompilePages();
      break;
    case "create":
      await cmdCreate();
      break;
    case "help":
    default:
      header();
      logger.plain(salmon("🐙 Uso:") + " oct <comando>\n");
      logger.plain(salmon("Comandos:"));
      logger.plain(
        salmon("  dev          ") +
          "Inicia servidor de desenvolvimento com hot reload"
      );
      logger.plain(
        salmon("  build        ") + "Compila para produção (Bun.build)"
      );
      logger.plain(
        salmon("  compile      ") + "Compila páginas .oct para dist/"
      );
      logger.plain(
        salmon("  create       ") + "Cria interativamente uma nova página .oct"
      );
      logger.plain(salmon("  help         ") + "Mostra esta ajuda");
      break;
  }
}

main().catch((e) => {
  console.error(salmon("🐙 Erro fatal:"), e);
  process.exit(1);
});
