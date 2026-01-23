import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "path";

import { clearRegistryContext } from "@/src/registry/context";
import { sendTelemetryEvent, setTelemetryEmail } from "@/src/telemetry";
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

// todo: change to main after new release
const DEFAULT_BRANCH = "new";
const MIN_SUPPORTED_NODE_VERSION = 20;

const CREATE_TEMPLATES = {
  basic: "basic",
  registry: "registry",
} as const;

export const create = new Command()
  .name("create")
  .description("create a new Mercur project")
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
  .option("--no-deps", "skip installing dependencies.", false)
  .option("--skip-db", "skip database configuration.", false)
  .option("--skip-email", "skip email prompt.", false)
  .option("--db-connection-string <string>", "PostgreSQL connection string.")
  .action(async (name, opts) => {
    try {
      validateNodeVersion();

      // Prompt for project name if not provided.
      let projectName = name;
      if (!projectName) {
        const { enteredName } = await prompts({
          type: "text",
          name: "enteredName",
          message: "What is your project named?",
          initial: opts.template ? `${opts.template}-app` : "my-mercur",
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
          spinner("Dependency installation skipped.").warn();
        } else {
          const installSpinner = spinner("Installing dependencies...").start();
          const result = await installDeps({
            projectDir,
            packageManager,
          });
          if (result) {
            installSpinner.succeed("Dependencies installed successfully.");
          } else {
            spinner("Failed to install dependencies.").fail();
            logger.log(feedbackOutro());
            await sendTelemetryEvent({
              type: 'create',
              payload: {
                outcome: 'dependency_installation_failed',
                packageManager,
              }
            }, {
              cwd: projectDir,
            })
            process.exit(1);
          }
        }

        // Database setup
        let dbConnectionString: string | undefined = opts.dbConnectionString;
        if (!opts.skipDb) {
          const dbSpinner = spinner("Setting up database...").start();
          const dbResult = await setupDatabase({
            projectDir,
            projectName,
            dbConnectionString: opts.dbConnectionString,
            spinner: dbSpinner,
          });
          if (dbResult.success) {
            if (dbResult.alreadyExists) {
              dbSpinner.warn(
                `Database ${highlighter.info(dbResult.dbName)} already exists. Skipping database setup.`
              );
            } else {
              dbSpinner.succeed(
                `Database ${highlighter.info(dbResult.dbName)} setup successfully.`
              );
            }
            dbConnectionString = dbResult.connectionString!;
          } else {
            dbSpinner.fail("Failed to setup database.");
            logger.log(feedbackOutro());
            await sendTelemetryEvent({
              type: 'create',
              payload: {
                outcome: 'database_setup_failed',
              }
            }, {
              cwd: projectDir,
            })
            process.exit(1);
          }
        } else {
          spinner("Database setup skipped.").warn();
        }

        if (!opts.skipEmail) {
          const { wantsEmail } = await prompts({
            type: "confirm",
            name: "wantsEmail",
            message: "Mind sharing your email? We reach out for priority support, community events, and invite-only meetups. We never spam.",
            initial: false,
          });

          if (wantsEmail) {
            const { email } = await prompts({
              type: "text",
              name: "email",
              message: "Enter your email:",
              format: (value: string) => value.trim(),
            });

            if (email) {
              setTelemetryEmail(email);
            }
          }
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

        await initGit(projectDir);

        await sendTelemetryEvent({
          type: 'create',
          payload: {
            outcome: 'created'
          }
        }, {
          cwd: projectDir,
        })
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
  let cmd = "npm";
  let args = ["install"];

  if (packageManager === "yarn") {
    cmd = "yarn";
    args = [];
  } else if (packageManager === "pnpm") {
    cmd = "pnpm";
    args = ["install"];
  } else if (packageManager === "bun") {
    cmd = "bun";
    args = ["install"];
  }

  try {
    await execa(cmd, args, { cwd: path.resolve(projectDir) });
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
    fallback: (text, url) => `${text}: ${kleur.cyan().underline(url)}`,
  });
}

async function initGit(projectDir: string): Promise<void> {
  try {
    await execa("git", ["init"], { cwd: projectDir });
    logger.info("Initialized a git repository.");
  } catch {
    throw new Error("Failed to initialize git repository.");
  }
}

function getNodeVersion(): number {
  const [major] = process.versions.node.split(".").map(Number);
  return major;
}

function validateNodeVersion(): void {
  const nodeVersion = getNodeVersion();
  if (nodeVersion < MIN_SUPPORTED_NODE_VERSION) {
    throw new Error(
      `Mercur requires at least v${MIN_SUPPORTED_NODE_VERSION} of Node.js. You're using v${nodeVersion}. Please install at least v${MIN_SUPPORTED_NODE_VERSION} and try again: https://nodejs.org/en/download`
    );
  }
}
