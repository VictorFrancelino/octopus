import chokidar from "chokidar";
import path from "path";
import { PAGES_DIR } from "./paths";
import { invalidateCompileCache } from "./compileCache";

/**
 * Watch pages dir and run callback on changes.
 * callback should rebuild routes (outside of this util).
 */
export function watchPagesForDev(onChange: () => Promise<void>) {
  const watcher = chokidar.watch(PAGES_DIR, { ignoreInitial: true });
  const handler = async (p?: string) => {
    if (p) {
      invalidateCompileCache(path.resolve(p));
      console.log("[watch] invalidated cache for", p);
    }
    console.log("[watch] change detected, running callback...");
    await onChange();
  };
  watcher.on("add", handler).on("change", handler).on("unlink", handler);
  console.log("[watch] watching pages with chokidar");
  return watcher;
}