import { accentColor, header, logger, outputDir, pagesDir } from "../utils";
import { compilePage } from "../../compiler";
import { createSpinner } from "nanospinner";
import fs from "fs/promises";
import path from "path";

export async function compile() {
  header();
  logger.info("Compilando páginas .oct para dist...");

  await fs.mkdir(outputDir, { recursive: true });
  const files = await fs.readdir(pagesDir);
  const octFiles = files.filter(file => file.endsWith(".oct"));

  const spinner = createSpinner(
    accentColor(`🐙 Preparando compilação de ${octFiles.length} páginas...`)
  ).start();

  let compiledCount = 0;
  const errors: string[] = [];

  const compilationTasks = octFiles.map(file => {
    return (async () => {
      const inputPath = path.join(pagesDir, file);
      const outName = file.replace(/\.oct$/, ".html");
      const outPath = path.join(outputDir, outName);

      try {
        spinner.update({ text: accentColor(`🐙 Compilando ${file}...`) });

        const compiled = await compilePage(inputPath);

        const data = typeof compiled === "string" ? compiled : JSON.stringify(compiled, null, 2);

        await fs.writeFile(outPath, data);
        compiledCount++;
        return { file, success: true };
      } catch (e) {
        return { file, success: false, error: String(e) };
      }
    })();
  });

  const results = await Promise.all(compilationTasks);

  results.forEach(result => {
    if (!result.success && result.error) errors.push(`Falha ao compilar ${result.file}: ${result.error}`);
  });

  if (errors.length === 0) spinner.success({ text: accentColor(`🐙 ${compiledCount} páginas compiladas com sucesso!`) });
  else {
    spinner.error({
      text: `Falha na compilação de ${errors.length} páginas.`,
    });
    errors.forEach(err => logger.error(err));
  }
}
