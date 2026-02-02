import * as path from "path";
import { Command } from "commander";
import { z } from "zod";
import { writeRouteTypes } from "@/src/codegen";
import { handleError } from "@/src/utils/handle-error";
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

    const codegenSpinner = spinner("Generating route types...");

    await writeRouteTypes(options.cwd);

    codegenSpinner.succeed("Route types generated successfully.");
    logger.break();
  } catch (error) {
    logger.break();
    handleError(error);
  }
}
