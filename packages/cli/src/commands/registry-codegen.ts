import * as fs from "fs/promises";
import * as path from "path";
import { Command } from "commander";
import { z } from "zod";
import { ROUTE_FILE_PATTERN, writeRegistryRouteTypes } from "@/src/codegen";
import { preFlightRegistryCodegen } from "@/src/preflights/preflight-registry-codegen";
import { registrySchema } from "@/src/registry/schema";
import * as ERRORS from "@/src/utils/errors";
import { handleError } from "@/src/utils/handle-error";
import { highlighter } from "@/src/utils/highlighter";
import { logger } from "@/src/utils/logger";
import { spinner } from "@/src/utils/spinner";

export const registryCodegenOptionsSchema = z.object({
  cwd: z.string(),
  registryFile: z.string(),
});

export const registryCodegen = new Command()
  .name("registry:codegen")
  .description("generate type definitions for registry block API routes")
  .argument("[registry]", "path to registry.json file", "./registry.json")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (registry: string, opts) => {
    await runRegistryCodegen({
      cwd: path.resolve(opts.cwd),
      registryFile: registry,
    });
  });

async function runRegistryCodegen(
  opts: z.infer<typeof registryCodegenOptionsSchema>
) {
  try {
    const options = registryCodegenOptionsSchema.parse(opts);

    const { errors, resolvePaths } = await preFlightRegistryCodegen(options);

    if (errors[ERRORS.MISSING_CONFIG]) {
      logger.error(
        `A ${highlighter.info(
          "blocks.json"
        )} file is required to run registry:codegen. Run ${highlighter.info(
          "mercur init"
        )} to create one.`
      );
      logger.break();
      process.exit(1);
    }

    if (errors[ERRORS.BUILD_MISSING_REGISTRY_FILE] || !resolvePaths) {
      logger.error(
        `Could not find a registry file at ${highlighter.info(
          path.resolve(options.cwd, options.registryFile)
        )}.`
      );
      logger.break();
      process.exit(1);
    }

    const content = await fs.readFile(resolvePaths.registryFile, "utf-8");
    const result = registrySchema.safeParse(JSON.parse(content));

    if (!result.success) {
      logger.error(
        `Invalid registry file at ${highlighter.info(
          resolvePaths.registryFile
        )}.`
      );
      logger.break();
      process.exit(1);
    }

    const routeFilePaths: string[] = [];

    for (const item of result.data.items) {
      if (!item.files) continue;

      for (const file of item.files) {
        if (file.type === "registry:api" && ROUTE_FILE_PATTERN.test(file.path)) {
          routeFilePaths.push(file.path);
        }
      }
    }

    if (routeFilePaths.length === 0) {
      logger.warn("No API route files found in registry.");
      return;
    }

    const codegenSpinner = spinner("Generating registry route types...");

    await writeRegistryRouteTypes(options.cwd, routeFilePaths);

    codegenSpinner.succeed("Registry route types generated successfully.");
    logger.break();
  } catch (error) {
    logger.break();
    handleError(error);
  }
}
