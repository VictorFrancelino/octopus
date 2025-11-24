import type { RadixRouter } from "radix3";

/**
 * Busca a rota correspondente.
 */
export function matchRoute(pathname: string, router: RadixRouter<{ file: string }>) {
  const match = router.lookup(pathname);

  if (!match) return null;

  return {
    file: match.file,
    params: match.params || {},
  };
}