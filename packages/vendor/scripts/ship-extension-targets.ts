/**
 * Copies the generated `extension-targets.d.ts` into `dist` and writes an empty
 * runtime entry. Runs after `tsup` so the concurrent declaration build cannot
 * prune the shipped declaration file.
 */
import fs from "fs"
import path from "path"

const dir = import.meta.dir ?? __dirname
const src = path.join(dir, "..", "src", "extension-targets.d.ts")
const distDir = path.join(dir, "..", "dist")

if (fs.existsSync(src) && fs.existsSync(distDir)) {
  fs.copyFileSync(src, path.join(distDir, "extension-targets.d.ts"))
  fs.writeFileSync(path.join(distDir, "extension-targets.js"), "export {}\n")
}
