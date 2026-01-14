import { type Change, diffLines } from "diff";
import { existsSync, promises as fs, statSync } from "fs";
import path, { basename } from "path";
import prompts from "prompts";
import type { RegistryItem, RegistryItemCategory } from "../registry/schema";
import type { Config } from "../schema";
import { isContentSame } from "./compare";
import { getRelativePath, getTargetDir } from "./file-type";
import { getProjectInfo } from "./get-project-info";
import { highlighter } from "./highlighter";
import { logger } from "./logger";
import { spinner } from "./spinner";
import { transformImports } from "./transform-import";

export async function updateFiles(
  files: RegistryItem["files"],
  type: RegistryItemCategory,
  config: Config,
  options: {
    overwrite?: boolean;
    silent?: boolean;
    path?: string;
    yes?: boolean;
  }
) {
  if (!files?.length) {
    return {
      filesCreated: [],
      filesUpdated: [],
      filesSkipped: [],
      filesDeclined: [],
    };
  }

  options = {
    overwrite: false,
    silent: false,
    yes: false,
    ...options,
  };

  const filesCreatedSpinner = spinner(`Updating files.`, {
    silent: options.silent,
  })?.start();

  const projectInfo = await getProjectInfo(config.resolvedPaths.cwd);

  const filesCreated: string[] = [];
  const filesUpdated: string[] = [];
  const filesSkipped: string[] = [];
  const filesDeclined: string[] = [];

  for (const file of files) {
    const fileType = getTargetDir(file, type);
    const relativePath = getRelativePath(file.path);
    const basePath = options.path || config.resolvedPaths[fileType];

    let filePath = path.resolve(basePath, relativePath);

    if (projectInfo?.isSrcDir && !filePath.includes("src")) {
      const srcPath = path.resolve(config.resolvedPaths.cwd, "src");
      filePath = path.resolve(srcPath, relativePath);
    }

    const fileName = basename(file.path);
    const targetDir = path.dirname(filePath);

    const existingFile = existsSync(filePath);

    if (existingFile && statSync(filePath).isDirectory()) {
      throw new Error(
        `Cannot write to ${filePath}: path exists and is a directory. Please provide a file path instead.`
      );
    }

    const content = await transformImports({
      filename: file.path,
      raw: file.content,
      config,
      isRemote: false,
    });

    if (existingFile && !options.overwrite) {
      const existingFileContent = await fs.readFile(filePath, "utf-8");

      if (isContentSame(existingFileContent, content)) {
        filesSkipped.push(path.relative(config.resolvedPaths.cwd, filePath));
        continue;
      }

      if (!options.yes) {
        filesCreatedSpinner.stop();

        const diff = diffLines(existingFileContent, content);
        logger.info(`\nFile: ${highlighter.info(fileName)}`);
        printDiff(diff);

        const { overwrite } = await prompts({
          type: "confirm",
          name: "overwrite",
          message: `The file ${highlighter.info(
            fileName
          )} already exists. Would you like to overwrite?`,
          initial: false,
        });

        if (!overwrite) {
          filesDeclined.push(path.relative(config.resolvedPaths.cwd, filePath));
          continue;
        }
      }
    }

    if (!existsSync(targetDir)) {
      await fs.mkdir(targetDir, { recursive: true });
    }

    await fs.writeFile(filePath, content, "utf-8");

    if (!existingFile) {
      filesCreated.push(path.relative(config.resolvedPaths.cwd, filePath));
    } else {
      filesUpdated.push(path.relative(config.resolvedPaths.cwd, filePath));
    }
  }

  const totalUpdated = filesCreated.length + filesUpdated.length;
  const totalSkipped = filesSkipped.length + filesDeclined.length;

  if (totalUpdated > 0) {
    filesCreatedSpinner?.succeed();

    // Show summary if there was a mix of updated and skipped
    if (totalSkipped > 0 && !options.silent) {
      const parts: string[] = [];
      if (totalUpdated === 1) {
        parts.push("1 file updated");
      } else {
        parts.push(`${totalUpdated} files updated`);
      }
      if (totalSkipped === 1) {
        parts.push("1 file skipped");
      } else {
        parts.push(`${totalSkipped} files skipped`);
      }
      logger.info(`${parts.join(", ")}.`);
    }
  } else if (filesDeclined.length) {
    filesCreatedSpinner?.info("No files were updated.");
  } else if (filesSkipped.length) {
    filesCreatedSpinner?.info("Already up to date.");
  } else {
    filesCreatedSpinner?.info("No files to update.");
  }

  return {
    filesCreated,
    filesUpdated,
    filesSkipped,
    filesDeclined,
  };
}

const CONTEXT_LINES = 3;

/**
 * Format a diff with context lines, hiding unchanged sections.
 * Returns an array of formatted lines.
 */
export function formatDiffWithContext(
  diff: Change[],
  contextLines = CONTEXT_LINES
): string[] {
  const output: string[] = [];

  // Find indices of changed parts
  const changedIndices = new Set<number>();
  for (let i = 0; i < diff.length; i++) {
    if (diff[i]?.added || diff[i]?.removed) {
      changedIndices.add(i);
    }
  }

  // If no changes, nothing to format
  if (changedIndices.size === 0) return output;

  // Track which parts to show (changed + context)
  const partsToShow = new Map<number, "full" | "start" | "end" | "both">();

  for (let i = 0; i < diff.length; i++) {
    const part = diff[i];
    if (!part) continue;

    if (part.added || part.removed) {
      // Always show changed parts fully
      partsToShow.set(i, "full");
    } else {
      // For unchanged parts, check if they're adjacent to changes
      const prevChanged = changedIndices.has(i - 1);
      const nextChanged = changedIndices.has(i + 1);

      if (prevChanged && nextChanged) {
        partsToShow.set(i, "both");
      } else if (prevChanged) {
        partsToShow.set(i, "start");
      } else if (nextChanged) {
        partsToShow.set(i, "end");
      }
    }
  }

  for (let i = 0; i < diff.length; i++) {
    const part = diff[i];
    const showType = partsToShow.get(i);

    if (!part || !showType) continue;

    if (part.added) {
      // Added lines - prefix with +
      const lines = part.value.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      for (const line of lines) {
        output.push(`+ ${line}`);
      }
    } else if (part.removed) {
      // Removed lines - prefix with -
      const lines = part.value.split("\n");
      if (lines[lines.length - 1] === "") lines.pop();
      for (const line of lines) {
        output.push(`- ${line}`);
      }
    } else {
      // Unchanged context - show limited lines
      const lines = part.value.split("\n");
      // Remove last empty element if the value ends with newline
      if (lines[lines.length - 1] === "") lines.pop();

      let contextOutput: string[] = [];

      if (showType === "full" || lines.length <= contextLines * 2 + 1) {
        contextOutput = lines.map((line) => `  ${line}`);
      } else if (showType === "start") {
        // Show first N lines after a change
        contextOutput = lines.slice(0, contextLines).map((line) => `  ${line}`);
        if (lines.length > contextLines) {
          contextOutput.push(
            `  ... ${lines.length - contextLines} lines hidden ...`
          );
        }
      } else if (showType === "end") {
        // Show last N lines before a change
        if (lines.length > contextLines) {
          contextOutput.push(
            `  ... ${lines.length - contextLines} lines hidden ...`
          );
        }
        contextOutput.push(
          ...lines.slice(-contextLines).map((line) => `  ${line}`)
        );
      } else if (showType === "both") {
        // Between two changes - show start and end context
        if (lines.length <= contextLines * 2 + 1) {
          contextOutput = lines.map((line) => `  ${line}`);
        } else {
          contextOutput = [
            ...lines.slice(0, contextLines).map((line) => `  ${line}`),
            `  ... ${lines.length - contextLines * 2} lines hidden ...`,
            ...lines.slice(-contextLines).map((line) => `  ${line}`),
          ];
        }
      }

      output.push(...contextOutput);
    }
  }

  return output;
}

function printDiff(diff: Change[]) {
  const lines = formatDiffWithContext(diff);
  if (lines.length === 0) return;

  for (const line of lines) {
    if (line.startsWith("+ ")) {
      process.stdout.write(`${highlighter.success(line)}\n`);
    } else if (line.startsWith("- ")) {
      process.stdout.write(`${highlighter.error(line)}\n`);
    } else if (line.includes("lines hidden")) {
      process.stdout.write(`${highlighter.info(line)}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  }
}
