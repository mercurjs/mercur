import * as path from "path";
import { Command } from "commander";
import { z } from "zod";
import spawn from "cross-spawn";
import { writeRouteTypes } from "@/src/codegen";
import { getCommandBin } from "@/src/utils/get-command-bin";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";

export const developOptionsSchema = z.object({
  cwd: z.string(),
});

export const develop = new Command()
  .name("develop")
  .description("start the mercur development server")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .allowUnknownOption()
  .action(async (opts) => {
    await runDevelop({
      cwd: path.resolve(opts.cwd),
    });
  });

async function runDevelop(opts: z.infer<typeof developOptionsSchema>) {
  try {
    const options = developOptionsSchema.parse(opts);

    await writeRouteTypes(options.cwd);
    // await patchMedusa(); // TODO: re-enable when plugin provides full admin product route overrides

    const medusaBin = await getCommandBin("@medusajs/cli", "medusa", options.cwd);

    // Pass through any extra args after "develop"
    const spawnCommand = process.argv
      .slice(2)
      .filter((arg) => !["develop"].includes(arg));

    return new Promise<void>((res, rej) => {
      spawn(medusaBin, ["develop", ...spawnCommand], {
        cwd: options.cwd,
        env: { ...process.env, FORCE_COLOR: "3" },
        stdio: "inherit",
      })
        .on("exit", (code: number | null) => {
          if (code === 0 || code === null) {
            res();
          } else {
            process.exit(code);
          }
        })
        .on("error", rej);
    });
  } catch (error) {
    logger.break();
    handleError(error);
  }
}
