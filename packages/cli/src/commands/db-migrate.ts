import * as path from "path";
import { Command } from "commander";
import { z } from "zod";
import spawn from "cross-spawn";
import { getCommandBin } from "@/src/utils/get-command-bin";
import { patchMedusa } from "@/src/utils/patch-medusa";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";

export const dbMigrateOptionsSchema = z.object({
  cwd: z.string(),
});

export const dbMigrate = new Command()
  .name("db:migrate")
  .description("run database migrations")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .allowUnknownOption()
  .action(async (opts) => {
    await runDbMigrate({
      cwd: path.resolve(opts.cwd),
    });
  });

async function runDbMigrate(opts: z.infer<typeof dbMigrateOptionsSchema>) {
  try {
    const options = dbMigrateOptionsSchema.parse(opts);

    await patchMedusa();

    const medusaBin = await getCommandBin("@medusajs/cli", "medusa", options.cwd);

    const spawnCommand = process.argv
      .slice(2)
      .filter((arg) => !["db:migrate"].includes(arg));

    return new Promise<void>((res, rej) => {
      spawn(medusaBin, ["db:migrate", ...spawnCommand], {
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
