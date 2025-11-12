import fs from "fs/promises";
import path from "path";
import { LRUCache } from "lru-cache";
import { compileOctopus } from "../compiler";

type CacheItem = { mtimems: number; compiled: any };

const compileCache = new LRUCache<string, CacheItem>({
  max: 200,
  ttl: 1000 * 60 * 5,
});

/**
 * Compile file using compiler + LRU cache keyed by mtime.
 * Returns the compiler result (object).
 */
export async function compileFileCached(filePath: string) {
  const abs = path.resolve(filePath);
  try {
    const st = await fs.stat(abs);
    const mt = st.mtimeMs ?? Date.now();
    const cached = compileCache.get(abs);
    if (cached && cached.mtimems === mt) return cached.compiled;

    const src = await fs.readFile(abs, "utf-8");
    const compiled = await compileOctopus(src);
    compileCache.set(abs, { mtimems: mt, compiled });
    return compiled;
  } catch (err) {
    compileCache.delete(abs);
    throw err;
  }
}

/** invalidate a cached file (useful for watcher) */
export function invalidateCompileCache(filePath: string) {
  compileCache.delete(path.resolve(filePath));
}