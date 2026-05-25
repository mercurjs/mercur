import * as path from "path"
import { Command } from "commander"
import { z } from "zod"
import spawn from "cross-spawn"
import {
  postprocessModulesBindings,
  preflightBuild,
} from "@/src/preflights/preflight-build"
import { getCommandBin } from "@/src/utils/get-command-bin"
import { handleError } from "@/src/utils/handle-error"
import { logger } from "@/src/utils/logger"
import { spinner } from "@/src/utils/spinner"

export const buildOptionsSchema = z.object({
  cwd: z.string(),
})

export const build = new Command()
  .name("build")
  .description("build the mercur application")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd(),
  )
  .allowUnknownOption()
  .action(async (opts) => {
    await runBuild({
      cwd: path.resolve(opts.cwd),
    })
  })

async function runBuild(opts: z.infer<typeof buildOptionsSchema>) {
  try {
    const options = buildOptionsSchema.parse(opts)

    const preflightSpinner = spinner("Running Mercur preflight...")
    await preflightBuild(options.cwd)
    preflightSpinner.succeed(
      "Mercur preflight ran (route map + type shim emitted to .mercur/).",
    )

    const medusaBin = await getCommandBin(
      "@medusajs/cli",
      "medusa",
      options.cwd,
    )

    // Forward any extra args the user passed (e.g. `--admin-only`).
    const passthrough = process.argv
      .slice(2)
      .filter((arg) => !["build"].includes(arg))

    await new Promise<void>((resolve, reject) => {
      spawn(medusaBin, ["build", ...passthrough], {
        cwd: options.cwd,
        env: { ...process.env, FORCE_COLOR: "3" },
        stdio: "inherit",
      })
        .on("exit", (code) => {
          if (code === 0 || code === null) {
            resolve()
          } else {
            process.exit(code)
          }
        })
        .on("error", reject)
    })

    // medusa build ran the upstream `generateContainerTypes` step; strip
    // the resulting `'product': ...` line so it doesn't collide with the
    // shim's re-declared `ModuleImplementations`. See SPEC-006.
    const postSpinner = spinner(
      "Disarming Medusa's modules-bindings codegen...",
    )
    await postprocessModulesBindings(options.cwd)
    postSpinner.succeed("Modules-bindings post-process complete.")
  } catch (error) {
    logger.break()
    handleError(error)
  }
}
