import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "path";

import { clearRegistryContext } from "@/src/registry/context";
import { setupDatabase } from "@/src/utils/create-db";
import { getPackageManager } from "@/src/utils/get-package-manager";
import { handleError } from "@/src/utils/handle-error";
import { highlighter } from "@/src/utils/highlighter";
import { logger } from "@/src/utils/logger";
import { manageEnvFiles } from "@/src/utils/manage-env-files";
import { spinner } from "@/src/utils/spinner";
import { Command } from "commander";
import { execa } from "execa";
import fs from "fs-extra";
import kleur from "kleur";
import prompts from "prompts";
import { x } from "tar";
import terminalLink from "terminal-link";
import validateProjectName from "validate-npm-package-name";

const DEFAULT_BRANCH = "main";

const CREATE_TEMPLATES = {
  basic: "basic",
  registry: "registry",
} as const;

export const create = new Command()
  .name("create")
  .description("create a new project with shadcn/ui")
  .argument("[name]", "the name of your project")
  .option(
    "-t, --template <template>",
    "the template to use. e.g. basic or registry"
  )
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-y, --yes", "skip confirmation prompt.", true)
  .option("--no-deps", "skip installing dependencies.", false)
  .option("--skip-db", "skip database configuration.", false)
  .option("--db-connection-string <string>", "PostgreSQL connection string.")
  .action(async (name, opts) => {
    try {
      // Prompt for project name if not provided.
      let projectName = name;
      if (!projectName) {
        const { enteredName } = await prompts({
          type: "text",
          name: "enteredName",
          message: "What is your project named?",
          initial: opts.template ? `${opts.template}-app` : "my-app",
          format: (value: string) => value.trim(),
          validate: (name) => {
            const validation = validateProjectName(
              path.basename(path.resolve(name))
            );
            if (validation.validForNewPackages) {
              return true;
            }
            return "Invalid project name. Name should be lowercase, URL-friendly, and not start with a period or underscore.";
          },
        });

        if (!enteredName) {
          process.exit(0);
        }

        projectName = enteredName;

        // Prompt for template if not provided.
        let template = opts.template;
        if (!template) {
          const { selectedTemplate } = await prompts({
            type: "select",
            name: "selectedTemplate",
            message: `Which ${highlighter.info(
              "template"
            )} would you like to use?`,
            choices: Object.entries(CREATE_TEMPLATES).map(([key, value]) => ({
              title: value,
              value: key,
            })),
          });

          if (!selectedTemplate) {
            process.exit(0);
          }

          template = selectedTemplate;
        }

        const projectDir = path.resolve(opts.cwd, projectName);

        await createOrFindProjectDir(projectDir);

        const downloadSpinner = spinner("Downloading template...").start();
        await downloadTemplate({
          projectDir,
          template: template,
        });
        downloadSpinner.succeed("Template downloaded successfully.");

        const packageManager = await getPackageManager(projectDir);

        if (!opts.deps) {
          logger.info("Dependency installation skipped.");
        } else {
          logger.info(`Using ${highlighter.info(packageManager)}.`);
          const installSpinner = spinner("Installing dependencies...").start();
          const result = await installDeps({
            projectDir,
            packageManager,
          });
          if (result) {
            installSpinner.succeed("Dependencies installed successfully.");
          } else {
            installSpinner.fail("Failed to install dependencies.");
          }
        }

        // Database setup
        let dbConnectionString: string | undefined;
        if (!opts.skipDb) {
          const dbSpinner = spinner("Setting up database...").start();
          const dbResult = await setupDatabase({
            projectName,
            dbConnectionString: opts.dbConnectionString,
          });
          if (dbResult.success) {
            dbSpinner.succeed(
              `Database "${dbResult.dbName}" created successfully.`
            );
            dbConnectionString = dbResult.connectionString;
          } else {
            dbSpinner.fail("Failed to create database.");
          }
        } else {
          logger.info("Database setup skipped.");
        }

        await manageEnvFiles({
          projectDir,
          databaseUri: dbConnectionString,
        });

        logger.break();
        logger.info("Mercur project successfully created!");
        logger.log(kleur.bgGreen(kleur.black(" Next Steps ")));
        logger.log(successMessage(projectDir, packageManager));
        logger.log(feedbackOutro());
        logger.break();
      }
    } catch (error) {
      logger.break();
      handleError(error);
    } finally {
      clearRegistryContext();
    }
  });

async function createOrFindProjectDir(projectDir: string): Promise<void> {
  const pathExists = await fs.pathExists(projectDir);
  if (!pathExists) {
    await fs.mkdir(projectDir);
  }
}

async function downloadTemplate({
  projectDir,
  template,
}: {
  projectDir: string;
  template: keyof typeof CREATE_TEMPLATES;
}) {
  // todo: make sure the link is correct
  const url = `https://codeload.github.com/mercurjs/mercur/tar.gz/${DEFAULT_BRANCH}`;
  const templatePath = CREATE_TEMPLATES[template];
  const filter = `mercur-${DEFAULT_BRANCH.replace(/^v/, "").replaceAll("/", "-")}/templates/${templatePath}/`;

  await pipeline(
    await downloadTarStream(url),
    x({
      cwd: projectDir,
      filter: (p) => p.includes(filter),
      strip: 2 + templatePath.split("/").length,
    })
  );
}

async function downloadTarStream(url: string) {
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`);
  }

  return Readable.from(res.body as unknown as NodeJS.ReadableStream);
}

async function installDeps({
  projectDir,
  packageManager,
}: {
  projectDir: string;
  packageManager: Awaited<ReturnType<typeof getPackageManager>>;
}): Promise<boolean> {
  let installCmd = "npm install --legacy-peer-deps";

  if (packageManager === "yarn") {
    installCmd = "yarn";
  } else if (packageManager === "pnpm") {
    installCmd = "pnpm install";
  } else if (packageManager === "bun") {
    installCmd = "bun install";
  }

  try {
    await execa({ cwd: path.resolve(projectDir) })`${installCmd}`;
    return true;
  } catch (err: unknown) {
    logger.error(
      `Error installing dependencies${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return false;
  }
}

function successMessage(
  projectDir: string,
  packageManager: Awaited<ReturnType<typeof getPackageManager>>
): string {
  const relativePath = path.relative(process.cwd(), projectDir);
  const header = (message: string) => kleur.bold(message);

  // todo: make sure the links are correct
  return `
${header("Launch Application:")}

  - cd ./${relativePath}
  - ${packageManager === "npm" ? "npm run" : packageManager} dev

${header("Documentation:")}

  - ${createTerminalLink("Getting Started", "https://mercurjs.com/docs/getting-started")}
  - ${createTerminalLink("Configuration", "https://mercurjs.com/docs/configuration")}
`;
}

function feedbackOutro(): string {
  return `${kleur.bgCyan(kleur.black(" Have feedback? "))} Visit us on ${createTerminalLink("GitHub", "https://github.com/mercurjs/mercur")}.`;
}

function createTerminalLink(text: string, url: string) {
  return terminalLink(text, url, {
    fallback: (text, url) => `${text}: ${url}`,
  });
}
