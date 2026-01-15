import { Command } from "commander";
import path from "path";
import prompts from "prompts";
import { z } from "zod";
import { preFlightAdd } from "../preflights/preflight-add";
import { clearRegistryContext } from "../registry/context";
import { addBlocks } from "../utils/add-items";
import * as ERRORS from "../utils/errors";
import { createConfig, getConfig } from "../utils/get-config";
import { highlighter } from "../utils/highlighter";
import { logger } from "../utils/logger";
import { runInit } from "./init";
import { handleError } from "../utils/handle-error";

export const addOptionsSchema = z.object({
  blocks: z.array(z.string()).optional(),
  yes: z.boolean(),
  overwrite: z.boolean(),
  cwd: z.string(),
  silent: z.boolean(),
});

export const add = new Command()
  .name("add")
  .description("add blocks to your project")
  .argument("[blocks...]", "names of blocks to add")
  .option("-y, --yes", "skip confirmation prompt.", false)
  .option("-o, --overwrite", "overwrite existing files.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-s, --silent", "mute output.", false)
  .action(async (items, opts) => {
    try {
      const options = addOptionsSchema.parse({
        items,
        cwd: path.resolve(opts.cwd),
        ...opts,
      });

      let config = await getConfig(options.cwd);
      if (!config) {
        config = createConfig({
          resolvedPaths: {
            cwd: options.cwd,
          },
        });
      }

      if (!options.blocks?.length) {
        logger.error("Please specify at least one item to add.");
        process.exit(1);
      }

      const { errors } = await preFlightAdd(options);

      if (errors[ERRORS.MISSING_CONFIG]) {
        const { proceed } = await prompts({
          type: "confirm",
          name: "proceed",
          message: `You need to create a ${highlighter.info(
            "blocks.json"
          )} file to add items. Proceed?`,
          initial: true,
        });

        if (!proceed) {
          logger.break();
          process.exit(1);
        }

        config = await runInit({
          cwd: options.cwd,
          yes: true,
          defaults: false,
          silent: options.silent,
        });
      }

      if (!config) {
        throw new Error(
          `Failed to read config at ${highlighter.info(options.cwd)}.`
        );
      }

      await addBlocks(options.blocks, config, {
        overwrite: options.overwrite,
        silent: options.silent,
        yes: options.yes,
      });
    } catch (error) {
      logger.break();
      handleError(error);
    } finally {
      clearRegistryContext();
    }
  });
