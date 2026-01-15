import { Command } from "commander";
import path from "path";
import { z } from "zod";
import { getRegistryBlocks } from "../registry/api";
import { clearRegistryContext } from "../registry/context";
import { createConfig, getConfig } from "../utils/get-config";
import { handleError } from "../utils/handle-error";

const viewOptionsSchema = z.object({
  cwd: z.string(),
});

export const view = new Command()
  .name("view")
  .description("view block details from the registry")
  .argument("<blocks...>", "the block names to view")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (items: string[], opts) => {
    try {
      const options = viewOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        type: opts.type,
      });

      let config = await getConfig(options.cwd);
      if (!config) {
        config = createConfig({
          resolvedPaths: {
            cwd: options.cwd,
          },
        });
      }

      const payload = await getRegistryBlocks(items, {
        config,
      });
      console.log(JSON.stringify(payload, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    } finally {
      clearRegistryContext();
    }
  });
