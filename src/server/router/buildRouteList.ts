import path from "path";
import fg from "fast-glob";
import { pagesDir } from "../../utils/paths";
import { filePathToPattern } from "./filePathToPattern";
import { createRouter, type RadixRouter } from "radix3";

let _routerCache: RadixRouter<{ file: string }> | null = null;

/**
 * Constrói a Radix Tree com todas as rotas.
 */
export async function buildRouteList(pgsDir = pagesDir): Promise<RadixRouter<{ file: string }>> {
  if (_routerCache) return _routerCache;

  const files = await fg("**/*.oct", { cwd: pgsDir, absolute: true, dot: false });
  const router = createRouter<{ file: string }>();

  for (const file of files) {
    const rel = path.relative(pgsDir, file);
    const pattern = filePathToPattern(rel);
    router.insert(pattern, { file });
  }

  _routerCache = router;
  return router;
}