import { Command } from "commander";
import { type Change, diffLines } from "diff";
import { existsSync, promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { getRegistryBlocks } from "../registry/api";
import { clearRegistryContext } from "../registry/context";
import { createConfig, getConfig } from "../utils/get-config";
import { handleError } from "../utils/handle-error";
import { highlighter } from "../utils/highlighter";
import { logger } from "../utils/logger";
import { transformImports } from "../utils/transform-import";
import { resolveFilePath } from "../utils/file-type";
import { getProjectInfo } from "../utils/get-project-info";

const diffOptionsSchema = z.object({
  blocks: z.array(z.string()).optional(),
  cwd: z.string(),
});

export const diff = new Command()
  .name("diff")
  .description("check for updates against the registry")
  .argument("[blocks...]", "the block names to diff")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (name, opts) => {
    try {
      const options = diffOptionsSchema.parse({
        item: name,
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

      if (!options.blocks?.length) {
        logger.error("Please specify at least one block to diff.");
        process.exit(1);
      }

      const blocks = await getRegistryBlocks(options.blocks, {
        config,
      });

      const missingBlocks = options.blocks.filter(
        (block) => !blocks.some((b) => b.name === block)
      );

      if (missingBlocks.length > 0) {
        logger.error(
          `Blocks ${missingBlocks.join(", ")} not found in registry.`
        );
        process.exit(1);
      }

      const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);

      for (const block of blocks) {
        for (const file of block.files) {
          const filePath = resolveFilePath(file, config, {
            isSrcDir: projectInfo?.isSrcDir ?? false,
            path: options.cwd
          });

          if (!existsSync(filePath)) {
            logger.info(`File ${filePath} does not exist locally.`);
            continue;
          }

          const localContent = await fs.readFile(filePath, "utf-8");
          const transformedContent = await transformImports({
            filename: file.path,
            raw: file.content,
            config,
            isRemote: false,
          });

          const diff = diffLines(localContent, transformedContent);
          if (diff.length > 1) {
            logger.info(`\nFile: ${highlighter.info(file.path)}`);
            printDiff(diff);
          }
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      clearRegistryContext();
    }
  });

function printDiff(diff: Change[]) {
  for (const part of diff) {
    if (part) {
      if (part.added) {
        process.stdout.write(highlighter.success(part.value));
      } else if (part.removed) {
        process.stdout.write(highlighter.error(part.value));
      } else {
        process.stdout.write(part.value);
      }
    }
  }
}
