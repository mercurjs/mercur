import * as path from "path";
import { Command } from "commander";
import chokidar from "chokidar";
import { z } from "zod";
import { writeRouteTypes } from "@/src/codegen";
import { handleError } from "@/src/utils/handle-error";
import { getTsConfig } from "@/src/utils/get-project-info";
import { logger } from "@/src/utils/logger";
import { spinner } from "@/src/utils/spinner";
import { highlighter } from "../utils/highlighter";

export const codegenOptionsSchema = z.object({
  cwd: z.string(),
  watch: z.boolean().default(false),
});

export const codegen = new Command()
  .name("codegen")
  .description("generate type definitions for API routes")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-w, --watch", "watch for changes and regenerate types", false)
  .action(async (opts) => {
    await runCodegen({
      cwd: path.resolve(opts.cwd),
      watch: opts.watch,
    });
  });

async function runCodegen(opts: z.infer<typeof codegenOptionsSchema>) {
  try {
    const options = codegenOptionsSchema.parse(opts);
    const tsConfig = getTsConfig(options.cwd);

    const codegenSpinner = spinner(`[${highlighter.info("@mercurjs/cli")}] Generating route types...`);

    await writeRouteTypes(options.cwd, tsConfig);

    codegenSpinner.succeed(`[${highlighter.info("@mercurjs/cli")}] Route types generated successfully.`);

    if (options.watch) {
      await writeRouteTypes(options.cwd, tsConfig);
      await watchForChanges(options.cwd, tsConfig);
    } else {
      logger.break();
    }
  } catch (error) {
    logger.break();
    handleError(error);
  }
}

async function watchForChanges(cwd: string, tsConfig: import("typescript").CompilerOptions) {
  const apiDir = path.join(cwd, "src", "api");

  const watcher = chokidar.watch("**/route.ts", {
    cwd: apiDir,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  let debounceTimer: NodeJS.Timeout | null = null;

  const cleanup = async () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    await watcher.close();
    logger.break();
    logger.info(`[${highlighter.info("@mercurjs/cli")}] Watcher stopped.`);
  };

  const regenerate = async (filePath: string) => {
    const regenSpinner = spinner(`[${highlighter.info("@mercurjs/cli")}] Change detected in ${highlighter.info(filePath)}. Regenerating...`);
    try {
      await writeRouteTypes(cwd, tsConfig);
      regenSpinner.succeed(`[${highlighter.info("@mercurjs/cli")}] Route types regenerated.`);
    } catch (error) {
      regenSpinner.fail(`[${highlighter.info("@mercurjs/cli")}] Failed to regenerate route types.`);
      handleError(error);
    }
  };

  const debouncedRegenerate = (filePath: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => regenerate(filePath), 100);
  };

  watcher
    .on("add", debouncedRegenerate)
    .on("change", debouncedRegenerate)
    .on("unlink", debouncedRegenerate)
    .on("ready", () => {
      logger.info(`[${highlighter.info("@mercurjs/cli")}] Watching for changes... (Press Ctrl+C to stop)`);
    })
    .on("error", (error) => {
      logger.error(`[${highlighter.info("@mercurjs/cli")}] Watcher error:`);
      handleError(error);
    });

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      cleanup().then(resolve);
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}
