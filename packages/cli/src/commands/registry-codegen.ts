import * as fs from "fs/promises";
import * as path from "path";
import { Command } from "commander";
import { z } from "zod";
import { writeRegistryRouteTypes } from "@/src/codegen";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import { spinner } from "@/src/utils/spinner";

export const registryCodegenOptionsSchema = z.object({
  cwd: z.string(),
});

export const registryCodegen = new Command()
  .name("registry:codegen")
  .description("generate type definitions for registry block API routes")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    await runRegistryCodegen({
      cwd: path.resolve(opts.cwd),
    });
  });

async function runRegistryCodegen(
  opts: z.infer<typeof registryCodegenOptionsSchema>
) {
  try {
    const options = registryCodegenOptionsSchema.parse(opts);
    const srcDir = path.join(options.cwd, "src");

    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    const blocks = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    if (blocks.length === 0) {
      logger.warn("No blocks found in src/");
      return;
    }

    const codegenSpinner = spinner("Generating registry route types...");

    const apiDirs: { block: string; apiDir: string }[] = [];

    for (const block of blocks) {
      const apiDir = path.join(srcDir, block, "api");
      const exists = await fs
        .stat(apiDir)
        .then((s) => s.isDirectory())
        .catch(() => false);

      if (exists) {
        apiDirs.push({ block, apiDir });
      }
    }

    if (apiDirs.length === 0) {
      codegenSpinner.succeed("No API routes found in registry blocks.");
      return;
    }

    await writeRegistryRouteTypes(options.cwd, apiDirs);

    codegenSpinner.succeed("Registry route types generated successfully.");
    logger.break();
  } catch (error) {
    logger.break();
    handleError(error);
  }
}
