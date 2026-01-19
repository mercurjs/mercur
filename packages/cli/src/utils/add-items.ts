import { configWithDefaults } from "../registry/config";
import { resolveRegistryTree } from "../registry/resolver";
import type { Config } from "../schema";
import { handleError } from "./handle-error";
import { logger } from "./logger";
import { spinner } from "./spinner";
import { updateDependencies } from "./update-dependencies";
import { updateFiles } from "./update-files";

export async function addBlocks(
  items: string[],
  config: Config,
  options: {
    overwrite?: boolean;
    silent?: boolean;
    path?: string;
    yes?: boolean;
  }
) {
  options = {
    overwrite: false,
    silent: false,
    yes: false,
    ...options,
  };

  if (!items.length) {
    return;
  }

  const registrySpinner = spinner(`Checking registry.`, {
    silent: options.silent,
  })?.start();

  const tree = await resolveRegistryTree(items, configWithDefaults(config));

  if (!tree) {
    registrySpinner?.fail();
    return handleError(new Error("Failed to fetch items from registry."));
  }

  registrySpinner?.succeed();

  const { filesCreated, filesUpdated } = await updateFiles(tree.files, config, {
    overwrite: options.overwrite,
    silent: options.silent,
    path: options.path,
    yes: options.yes,
  });

  // Only install dependencies if files were actually created or updated
  if (filesCreated.length || filesUpdated.length) {
    await updateDependencies(tree.dependencies, tree.devDependencies, config, {
      silent: options.silent,
    });
  }

  if (tree.docs) {
    logger.info(tree.docs);
  }
}
