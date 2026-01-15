import { Command } from "commander";
import path from "path";
import { z } from "zod";
import { clearRegistryContext } from "../registry/context";
import { createConfig, getConfig } from "../utils/get-config";
import { handleError } from "../utils/handle-error";
import { getRegistry } from "../registry/api";

const searchOptionsSchema = z.object({
  cwd: z.string(),
  query: z.string().optional(),
  registry: z.string().optional(),
});

export const search = new Command()
  .name("search")
  .description("search blocks from registries")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-q, --query <query>", "query string")
  .option(
    "-r, --registry <registry>",
    "the registry to search from (default: @mercurjs)",
    "@mercurjs"
  )
  .action(async (opts) => {
    try {
      const options = searchOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        query: opts.query,
        type: opts.type,
        registry: opts.registry,
      });

      let config = await getConfig(options.cwd);
      if (!config) {
        config = createConfig({
          resolvedPaths: {
            cwd: options.cwd,
          },
        });
      }

      const registry = await getRegistry(options.registry ?? "@mercurjs", {
        config,
      });

      let items = registry.items;
      if (options.query) {
        const query = options.query.toLowerCase();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        );
      }

      console.log(JSON.stringify(items, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    } finally {
      clearRegistryContext();
    }
  });
