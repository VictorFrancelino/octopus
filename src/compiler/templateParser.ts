import { parseFrontmatter } from "./frontmatter";

function extractTagContent(source: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = source.match(regex);
  return match?.[1]?.trim() ?? "";
}

export function extractParts(source: string) {
  const { frontmatter, body } = parseFrontmatter(String(source ?? ""));

  const template = extractTagContent(body, "template");
  const style = extractTagContent(body, "style");
  const scriptContent = extractTagContent(body, "script");

  // capture the attributes inside the opening <script ...>
  const attrsMatch = body.match(/<script\b([^>]*)>/i);
  // attrsMatch[1] might be undefined -> normalize to empty string
  const rawAttrs = (attrsMatch?.[1] ?? "").trim();
  // sanitize: remove any stray '>' (safety) and trim whitespace
  const scriptAttributes = rawAttrs.replace(/>/g, "").trim();

  return {
    frontmatter,
    template,
    style,
    script: {
      content: scriptContent,
      attributes: scriptAttributes,
    },
  };
}