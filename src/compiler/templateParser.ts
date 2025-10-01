import { parseFrontmatter } from "./frontmatter";

function extractTagContent(source: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, "i");
  const match = source.match(regex);
  return match?.[1]?.trim() ?? "";
}

export function extractParts(source: string) {
  const { frontmatter, body } = parseFrontmatter(source);

  return {
    frontmatter,
    template: extractTagContent(body, "template"),
    style: extractTagContent(body, "style"),
    script: {
      content: extractTagContent(body, "script"),
      attributes: ((): string => {
        const m = body.match(/<script([^>]*)>/i);
        return m?.[1]?.trim() ?? "";
      })
    },
  };
}