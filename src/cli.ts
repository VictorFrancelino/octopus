import { spawn } from "bun";

import { compilePage } from "./compiler";
import fs from "fs/promises";
import path from "path";

const PAGES_DIR = path.resolve(__dirname, "pages");
const OUTPUT_DIR = path.resolve(__dirname, "../dist/pages");

const command = process.argv[2];

const mainFile = "src/server.tsx";

switch (command) {
  case "dev": {
    console.log("🐙 Iniciando Octopus em modo de desenvolvimento...");

    const args = ["--watch", "--hot", mainFile];

    // Inicia o processo do Bun com as flags de watch e hot-reload
    const proc = spawn(["bun", ...args], {
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    });

    console.log(
      `🚀 Servidor rodando com hot-reload! Acesse http://localhost:3000`
    );
    console.log("Alterações no código serão aplicadas automaticamente.");
    break;
  }
  case "build": {
    console.log("🐙 Construindo seu projeto Octopus para produção...");

    try {
      const result = await Bun.build({
        entrypoints: [mainFile],
        outdir: "./build",
        target: "bun", // Otimiza para o runtime do Bun
        splitting: true, // Separa o código em pedaços para melhor performance
        minify: true, // Minifica o código para ser menor
      });

      if (result.success) {
        console.log("✅ Build concluído com sucesso!");
        console.log("Para rodar em produção, use: bun ./build/server.js");
      } else {
        console.error("❌ Erro durante o build:");
        console.error(result.logs);
      }
    } catch (e) {
      console.error("❌ Falha crítica no processo de build:", e);
    }
    break;
  }
  default: {
    console.log("🐙 Octopus CLI");
    console.log("Comandos disponíveis:");
    console.log("dev - Inicia o servidor de desenvolvimento com hot-reload");
    console.log("build - Cria uma versão otimizada para produção");
    break;
  }
}

async function build() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const pageFiles = await fs.readdir(PAGES_DIR);

  for (const file of pageFiles) {
    if (file.endsWith(".oct")) {
      const inputPath = path.join(PAGES_DIR, file);
      const outputFilename = file.replace(".oct", ".js");
      const outputPath = path.join(OUTPUT_DIR, outputFilename);

      console.log(`Compilando ${file}...`);
      const compiledCode = await compilePage(inputPath);
      await fs.writeFile(outputPath, compiledCode);
      console.log(`Sucesso! Arquivo gerado em ${outputPath}`);
    }
  }
}
