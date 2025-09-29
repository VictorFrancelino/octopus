export function extractParts(source: string) {
  return {
    template: extractTagContent(source, "template"),
    style: extractTagContent(source, "style"),
    script: {
      content: extractTagContent(source, "script"),
      attributes: extractScriptAttributes(source),
    },
  };
}

function extractTagContent(source: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`, "i");
  const match = source.match(regex);
  return match?.[1]?.trim() ?? "";
}

function extractScriptAttributes(source: string): string {
  const match = source.match(/<script([^>]*)>/i);
  return match?.[1]?.trim() ?? "";
}