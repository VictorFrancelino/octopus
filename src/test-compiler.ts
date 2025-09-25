import { compileOctopus } from "./compiler";
import path from "path";

const inputPath = path.resolve(__dirname, "./pages/home.oct")

function main() {
  const output = compileOctopus(inputPath)
  console.log("=== CÓDIGO GERADO ===")
  console.log(output)
}

main()