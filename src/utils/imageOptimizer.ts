import sharp from "sharp";

export async function optimizedImage(inputPath: string, outputPath: string, quality: number) {
  try {
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath)
  } catch (e) {
    console.log(e);
  }

  return outputPath
}