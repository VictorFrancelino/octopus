import { accentColor, header, logger, pagesDir } from "../utils";
import { createSpinner } from "nanospinner";
import fs from "fs/promises";
import path from "path";
import prompts from "prompts";

export async function create() {
  header();
  logger.info(accentColor("🐙 Criando nova página..."));

  const response = await prompts({
    type: "text",
    name: "name",
    message: accentColor("Nome da nova página (ex: sobre):"),
    initial: "nova-pagina",
  });

  // Validação de nome mais robusta para slug
  const name = String(response.name).toLowerCase().replace(/[^a-z0-9\-]/g, "-").trim();
  if (!name) {
    logger.warn("Nome de página inválido ou vazio. Abortando.");
    return;
  }
  
  const file = path.join(pagesDir, `${name}.oct`);

  const spinner = createSpinner(accentColor(`🐙 Criando ${name}.oct...`)).start();

  // Template mais limpo
  const template = `<template>\n <Title>${name}</Title>\n <h1>Bem-vindo à página ${name}</h1>\n</template>\n\n<script>\n // Lógica da página aqui\n</script>\n`;

  try {
    await fs.mkdir(pagesDir, { recursive: true });
    // Usamos { flag: "wx" } para garantir que o arquivo não existe, evitando sobrescrever
    await fs.writeFile(file, template, { flag: "wx" });
    spinner.success({
      text: accentColor(`🐙 Página ${name}.oct criada em ${file}!`),
    });
  } catch (err) {
    spinner.error({ 
      text: `Não foi possível criar o arquivo. Pode já existir? (${String(err)})` 
    });
  }
}