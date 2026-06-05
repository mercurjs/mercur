import * as path from "path";
import { Command } from "commander";
import { z } from "zod";
import spawn from "cross-spawn";
import { writeRouteTypes } from "@/src/codegen";
import { getCommandBin } from "@/src/utils/get-command-bin";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";

export const buildOptionsSchema = z.object({
  cwd: z.string(),
});

export const build = new Command()
  .name("build")
  .description("build the mercur application")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .allowUnknownOption()
  .action(async (opts) => {
    await runBuild({
      cwd: path.resolve(opts.cwd),
    });
  });

async function runBuild(opts: z.infer<typeof buildOptionsSchema>) {
  try {
    const options = buildOptionsSchema.parse(opts);

    await writeRouteTypes(options.cwd);
    const medusaBin = await getCommandBin("@medusajs/cli", "medusa", options.cwd);

    const spawnCommand = process.argv
      .slice(2)
      .filter((arg) => !["build"].includes(arg));

    return new Promise<void>((res, rej) => {
      spawn(medusaBin, ["build", ...spawnCommand], {
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
