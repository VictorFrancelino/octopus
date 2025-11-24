import type { ParsedParts } from "../types";

const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/i;

export function scriptParser(content: string, result: ParsedParts) {
  const scriptMatch = content.match(scriptRegex);
  if (scriptMatch) {
    result.script = {
      attributes: (scriptMatch[1] ?? "").trim(),
      content: (scriptMatch[2] ?? "").trim()
    };
    content = content.replace(scriptMatch[0], "");
  }
}