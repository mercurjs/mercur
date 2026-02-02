import * as path from "path";
import { Command } from "commander";
import { z } from "zod";
import { writeRouteTypes } from "@/src/codegen";
import { preFlightCodegen } from "@/src/preflights/preflight-codegen";
import * as ERRORS from "@/src/utils/errors";
import { handleError } from "@/src/utils/handle-error";
import { highlighter } from "@/src/utils/highlighter";
import { logger } from "@/src/utils/logger";
import { spinner } from "@/src/utils/spinner";

export const codegenOptionsSchema = z.object({
  cwd: z.string(),
});

export const codegen = new Command()
  .name("codegen")
  .description("generate type definitions for API routes")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    await runCodegen({
      cwd: path.resolve(opts.cwd),
    });
  });

async function runCodegen(opts: z.infer<typeof codegenOptionsSchema>) {
  try {
    const options = codegenOptionsSchema.parse(opts);

    const { errors, config, projectInfo } = await preFlightCodegen(options);

    if (errors[ERRORS.MISSING_CONFIG] || !config) {
      logger.error(
        `A ${highlighter.info(
          "blocks.json"
        )} file is required to run codegen. Run ${highlighter.info(
          "mercur init"
        )} to create one.`
      );
      logger.break();
      process.exit(1);
    }

    if (errors[ERRORS.CODGEN_MISSING_MEDUSA_CONFIG_FILE] || !projectInfo) {
      logger.error(
        `Could not find a ${highlighter.info(
          "medusa-config.ts"
        )} file in ${highlighter.info(options.cwd)}.`
      );
      logger.break();
      process.exit(1);
    }

    const codegenSpinner = spinner("Generating route types...");

    await writeRouteTypes(projectInfo.medusaDir!, config.resolvedPaths.api);

    codegenSpinner.succeed("Route types generated successfully.");
    logger.break();
  } catch (error) {
    logger.break();
    handleError(error);
  }
}
