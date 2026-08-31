import path from "path";
import { handleError } from "@/src/utils/handle-error";
import { buildDashboardExtensions } from "@/src/utils/build-dashboard-extensions";
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

      const pluginsDistFolder = path.resolve(cwd, ".medusa/server");

      // Medusa's `buildPluginAdminExtensions` is deliberately not run here: it
      // writes the same `src/admin/index.{mjs,cjs}` that the admin pass below
      // does, and concurrently, so the two race for the file. It also builds
      // from a crawled entry, which discards an authored `src/admin/index.ts`
      // and drops the Mercur externals — so when it won the race the plugin's
      // real entry vanished.
      const responses = await Promise.all([
        compiler.buildPluginBackend(tsConfig),
        ...(["admin", "vendor"] as const).map((app) =>
          buildDashboardExtensions({
            root: cwd,
            srcDir: `src/${app}`,
            outFile: path.join(pluginsDistFolder, "src", app, "index.mjs"),
          })
        ),
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
