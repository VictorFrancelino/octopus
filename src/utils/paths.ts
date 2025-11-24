import path from "path";

export const projectRoot = process.cwd();
export const indexHtml = path.resolve(projectRoot, "index.html");
export const pagesDir = path.resolve(projectRoot, "src/pages");
export const publicDir = path.resolve(projectRoot, "public");