import fs from "fs/promises";
import path from "path";
import * as cheerio from "cheerio";
import crypto from "crypto";

// Esta função processará um único arquivo .oct
export async function compilePage(inputPath: string): Promise<string> {
  const content = await fs.readFile(inputPath, "utf-8");

  // 1. Parsing: Carregar o conteúdo do arquivo com Cheerio
  const $ = cheerio.load(content);

  // Extrair os blocos
  const scriptContent = $("script").html()?.trim() || "";
  const templateContent = $("template").html()?.trim() || "";
  const styleContent = $("style").html()?.trim() || "";

  // 2. Transpilação do Template
  const transpiledTemplate = transpileTemplate(templateContent);

  // 3. Processamento do Estilo
  // Gerar um hash único baseado no conteúdo do arquivo para o CSS Scoped
  const hash = crypto
    .createHash("sha1")
    .update(inputPath)
    .digest("hex")
    .substring(0, 6);
  const scopedStyle = processScopedCSS(styleContent, hash);

  // 4. Geração do Código Final
  const outputCode = `
    // Código gerado por Octopus Compiler
    import { h } from "./core/h";
    import { renderPage } from "./core/page";
    
    // Conteúdo do script original
    ${scriptContent}

    // A função de renderização da página
    const renderTemplate = (props) => {
      return ${transpiledTemplate};
    };

    // Estilos escopados
    const pageStyles = \`${scopedStyle}\`;

    export function render(props) {
      const body = renderTemplate(props);
      return renderPage(body);
    }
  `;

  return outputCode;
}

// Lógica para transformar o HTML do template em chamadas h()
function transpileTemplate(html: string): string {
  // TODO: Implementar a lógica de conversão aqui
  return `h("div", {}, "TODO: Implementar transpilação do template")`;
}

// Lógica para adicionar escopo ao CSS
function processScopedCSS(css: string, hash: string): string {
  // TODO: Implementar a lógica para adicionar [data-v-hash] aos seletores
  return css;
}
