import path from "path";
import { handleError } from "@/src/utils/handle-error";
import { buildVendorExtensions } from "@/src/utils/build-vendor-extensions";
import { logger } from "@/src/utils/logger";
import { spinner } from "@/src/utils/spinner";
import { Command } from "commander";

export const pluginBuild = new Command()
  .name("plugin:build")
  .description("build a Medusa plugin")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    try {
      const cwd = path.resolve(opts.cwd);
      const buildSpinner = spinner("Building plugin...");

      const { Compiler } = await import("@medusajs/framework/build-tools");

      // @ts-expect-error
      const compiler = new Compiler(cwd, logger);

      const tsConfig = await compiler.loadTSConfigFile();
      if (!tsConfig) {
        buildSpinner.fail("Unable to compile plugin — tsconfig not found.");
        process.exit(1);
      }

      const bundler = await import("@medusajs/admin-bundler");
      const pluginsDistFolder = path.resolve(cwd, ".medusa/server");

      const responses = await Promise.all([
        compiler.buildPluginBackend(tsConfig),
        compiler.buildPluginAdminExtensions(bundler),
        buildVendorExtensions({ root: cwd, outDir: pluginsDistFolder }),
      ]);

      if (responses.every((response) => response === true)) {
        buildSpinner.succeed("Plugin built successfully.");
      } else {
        buildSpinner.fail("Plugin build failed.");
        process.exit(1);
      }
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });
