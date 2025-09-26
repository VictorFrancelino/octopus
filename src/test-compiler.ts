import { compileOctopus } from "./compiler";
import path from "path";
import fs from "fs";

const inputPath = path.resolve(__dirname, "./pages/home.oct")

function main() {
  const code = fs.readFileSync(inputPath, "utf-8")
  const output = compileOctopus(code)

  console.log("=== CÓDIGO GERADO ===")
  console.log(output)
}

main()