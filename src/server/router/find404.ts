import path from "path";
import { pagesDir } from "../../utils/paths";

/** Helper para 404 */
export async function find404(pgsDir = pagesDir): Promise<string | null> {
  const candidate = path.join(pgsDir, "404.oct");
  const f = Bun.file(candidate);
  if (await f.exists()) return candidate;
  return null;
}