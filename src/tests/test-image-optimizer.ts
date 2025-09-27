import { optimizedImage } from "../utils/imageOptimizer";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

async function runTest() {
  console.log("🚀 Iniciando teste de otimização de imagem...");

  const inputFile = "public/image-1.webp";
  const outputFile = "public/image-1-optimized.webp";
  const quality = 75;

  const absInput = path.resolve(process.cwd(), inputFile);
  const absOutput = path.resolve(process.cwd(), outputFile);

  // check input exists
  if (!fs.existsSync(absInput)) {
    console.error(`❌ ERRO: Arquivo de entrada não encontrado em '${inputFile}'.`);
    console.error("   Coloque a imagem em public/ e execute o script novamente.");
    process.exitCode = 1;
    return;
  }

  // ensure output folder exists
  await fsPromises.mkdir(path.dirname(absOutput), { recursive: true });

  console.log(`📥 Input: ${absInput}`);
  console.log(`📤 Output: ${absOutput}`);
  console.log(`🛠️ Quality: ${quality}`);

  try {
    const beforeStat = await fsPromises.stat(absInput);
    const beforeSizeKB = (beforeStat.size / 1024).toFixed(1);

    const result = await optimizedImage(inputFile, outputFile, quality);
    // optimizedImage should return output path or throw; adapt if your function returns differently
    if (!result && !fs.existsSync(absOutput)) {
      throw new Error("optimizedImage did not create the output file");
    }

    const afterStat = await fsPromises.stat(absOutput);
    const afterSizeKB = (afterStat.size / 1024).toFixed(1);
    const savings = (1 - afterStat.size / beforeStat.size) * 100;

    console.log("✅ Otimização concluída.");
    console.log(`   Antes:  ${beforeSizeKB} KB`);
    console.log(`   Depois: ${afterSizeKB} KB`);
    console.log(`   Economia: ${savings.toFixed(1)}%`);
    console.log(`   Arquivo gerado em: ${absOutput}`);
  } catch (err) {
    console.error("❌ Falha na otimização:", err instanceof Error ? err.message : err);
    process.exitCode = 2;
  }
}

runTest();
