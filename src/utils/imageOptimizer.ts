import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

/**
 * Garante que um diretório exista, criando-o se necessário.
 */
async function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Otimiza uma imagem local usando o Sharp.
 * @param localSrc - O caminho da imagem a partir da pasta 'public' (ex: /images/photo.jpg).
 * @param quality - A qualidade da imagem de saída (1-100).
 * @returns O caminho público da nova imagem otimizada (ex: /images/photo-optimized.webp).
 */
export async function optimizeLocalImage(
  localSrc: string,
  quality: number
): Promise<string> {
  try {
    const publicDir = path.resolve(process.cwd(), "public");
    const originalImagePath = path.join(publicDir, localSrc);

    // Gera um nome de arquivo único baseado no original e na qualidade.
    const ext = path.extname(localSrc);
    const baseName = path.basename(localSrc, ext);
    const hash = crypto
      .createHash("md5")
      .update(`${localSrc}${quality}`)
      .digest("hex")
      .substring(0, 6);
    const optimizedFileName = `${baseName}-${hash}-q${quality}.webp`;
    const optimizedImagePath = path.join(
      publicDir,
      path.dirname(localSrc),
      optimizedFileName
    );
    const publicOptimizedPath = path
      .join(path.dirname(localSrc), optimizedFileName)
      .replace(/\\/g, "/");

    // Verifica se o arquivo otimizado já existe para não reprocessar
    try {
      await fs.access(optimizedImagePath);
      console.log(
        `[Cache] Usando imagem otimizada existente: ${publicOptimizedPath}`
      );
      return publicOptimizedPath;
    } catch {
      // Arquivo não existe, continuar para otimização
    }

    // Garante que o diretório de saída exista
    await ensureDirectoryExists(optimizedImagePath);

    // Otimiza a imagem
    await sharp(originalImagePath).webp({ quality }).toFile(optimizedImagePath);

    console.log(`[Sharp] ✅ Imagem otimizada gerada: ${publicOptimizedPath}`);

    return publicOptimizedPath;
  } catch (error) {
    console.error(`❌ Erro ao otimizar a imagem "${localSrc}":`, error);
    return localSrc;
  }
}
