import boxen from "boxen";
import pc from "picocolors";
import path from "path";

export const mainFile = "src/server/index.ts"
export const pagesDir = path.resolve(__dirname, "../pages");
export const outputDir = path.resolve(__dirname, "../../dist/pages");

export const accentColor = (text: string) => `\x1b[38;2;250;128;114m${text}\x1b[0m`;

export const logger = {
  info: (msg: string) => console.log(pc.dim("i") + " " + pc.blue(msg)),
  success: (msg: string) => console.log(pc.green("✔") + " " + pc.green(msg)),
  warn: (msg: string) => console.log(pc.yellow("⚠") + " " + pc.yellow(msg)),
  error: (msg: string) => console.error(pc.red("✖") + " " + pc.red(msg)),
  plain: (msg: string) => console.log(msg),
};

export function header() {
  const title = pc.bold(accentColor("🐙 Octopus"));
  const subtitle = pc.gray("framework • dev tools");
  console.log(
    boxen(`${title}\n${subtitle}`, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "#FA8072",
    })
  );
}
