import fs from "fs";
import { INDEX_HTML } from "./paths";
import { escape as heEscape } from "he";

export function readIndexTemplate(): string {
  try {
    return fs.readFileSync(INDEX_HTML, "utf-8");
  } catch (e) {
    console.error("[templates] failed to read index.html:", e);
    return "<!doctype html><html><head><meta charset='utf-8'><title>{{title}}</title></head><body>{{body}}</body></html>";
  }
}

export function escapeForHtml(value: any): string {
  return heEscape(String(value ?? ""));
}