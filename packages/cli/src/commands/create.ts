import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "path";

import { clearRegistryContext } from "@/src/registry/context";
import { sendTelemetryEvent, setTelemetryEmail, showTelemetryNoticeIfNeeded } from "@/src/telemetry";
import { setupDatabase, type SetupDatabaseResult } from "@/src/utils/create-db";
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
import open from "open";
import prompts from "prompts";
import { x } from "tar";
import terminalLink from "terminal-link";
import validateProjectName from "validate-npm-package-name";
import waitOn from "wait-on";

const DEFAULT_BRANCH = "main";
const MIN_SUPPORTED_NODE_VERSION = 20;

const CREATE_TEMPLATES = {
  basic: {
    path: "basic",
    description: "Full marketplace starter — sellers, products, orders, admin & vendor panels",
  },
  // todo: uncomment registry template
  // registry: {
  //   path: "registry",
  //   description: "Create and publish your own block registry",
  // },
  plugin: {
    path: "plugin",
    description: "MedusaJS plugin template — for building reusable marketplace extensions",
  },
} as const;

export const create = new Command()
  .name("create")
  .description("create a new Mercur project")
  .argument("[name]", "the name of your project")
  .option(
    "-t, --template <template>",
    "the template to use. e.g. basic, registry, or plugin"
  )
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("--no-deps", "skip installing dependencies.")
  .option("--skip-db", "skip database configuration.", false)
  .option("--skip-email", "skip email prompt.", false)
  .option("--db-connection-string <string>", "PostgreSQL connection string.")
  .option("--db-host <host>", "PostgreSQL host.", "localhost")
  .option("--db-port <port>", "PostgreSQL port.", "5432")
  .action(async (name, opts) => {
    try {
      const createStart = Date.now();
      validateNodeVersion();
      showTelemetryNoticeIfNeeded();

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
      }

      let template = opts.template;
      if (!template) {
        const { selectedTemplate } = await prompts({
          type: "select",
          name: "selectedTemplate",
          message: `Which ${highlighter.info(
            "template"
          )} would you like to use?`,
          choices: Object.entries(CREATE_TEMPLATES).map(([key, tmpl]) => ({
            title: key,
            value: key,
            description: tmpl.description,
          })),
        });

        if (!selectedTemplate) {
          process.exit(0);
        }

        template = selectedTemplate;
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

      const projectDir = path.resolve(opts.cwd, projectName);

      await createOrFindProjectDir(projectDir);

      const downloadSpinner = spinner("Downloading template...").start();
      await downloadTemplate({
        projectDir,
        template: template,
      });
      downloadSpinner.succeed("Template downloaded successfully.");

      const packageManager = await getPackageManager(projectDir);
      await setPackageManagerField(projectDir, packageManager);

      if (!opts.deps) {
        spinner("Dependency installation skipped.").warn();
      } else {
        const initialInstallSpinner = spinner("Installing dependencies...").start();
        const installStart = Date.now();
        const result = await installDeps({
          projectDir,
          packageManager,
        });
        const installDuration = ((Date.now() - installStart) / 1000).toFixed(1);
        if (result) {
          initialInstallSpinner.succeed(`Dependencies installed successfully in ${installDuration}s.`);
        } else {
          initialInstallSpinner.fail(`Failed to install dependencies`);
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

      let dbConnectionString: string | undefined = opts.dbConnectionString;
      let dbResult: SetupDatabaseResult | undefined;

      if (!opts.skipDb) {
        const dbSpinner = spinner("Setting up database...").start();
        dbResult = await setupDatabase({
          projectDir,
          projectName,
          dbConnectionString,
          dbHost: opts.dbHost,
          dbPort: parseInt(opts.dbPort, 10),
          spinner: dbSpinner,
        });

        if (dbResult.success) {
          if (dbResult.alreadyExists) {
            dbSpinner.warn(
              `Database ${highlighter.info(dbResult.dbName)} already exists. Skipping database creation.`
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
          }, { cwd: projectDir });
          process.exit(1);
        }
      } else {
        spinner("Database setup skipped.").warn();
      }

      await manageEnvFiles({
        projectDir,
        databaseUri: dbConnectionString,
      });

      await initGit(projectDir);

      await sendTelemetryEvent({
        type: 'create',
        payload: {
          outcome: 'created'
        }
      }, {
        cwd: projectDir,
      });

      const totalDuration = ((Date.now() - createStart) / 1000).toFixed(1);
      spinner(`Mercur project successfully created! (${totalDuration}s)`).succeed();

      if (dbResult?.success) {
        spinner("Starting development server...").info();

        const inviteUrl = dbResult.inviteToken
          ? `http://localhost:9000/dashboard/invite?token=${dbResult.inviteToken}&first_run=true`
          : "http://localhost:9000/dashboard";

        const devCmd = packageManager === "npm" ? "npm" : packageManager;
        const devArgs = packageManager === "npm" ? ["run", "dev"] : ["dev"];

        const serverProcess = spawn(devCmd, devArgs, {
          cwd: projectDir,
          stdio: "inherit",
          env: process.env,
        });

        const printRestartHint = () => {
          logger.break();
          logger.log(kleur.bgGreen(kleur.black(" Project stopped. To start again: ")));
          logger.log(successMessage(projectDir, packageManager));
          logger.log(feedbackOutro());
          logger.break();
        };

        // Ctrl+C sends SIGINT to the whole process group (parent + child).
        // Suppress Node's default exit so we can wait for the child to close first.
        process.on("SIGINT", () => { });

        serverProcess.on("close", () => {
          printRestartHint();
          process.exit(0);
        });

        waitOn({
          resources: ["http://localhost:9000/health"],
          timeout: 60000,
        }).then(async () => {
          logger.break();
          logger.log(serverUrls());
          try {
            await open(inviteUrl);
            spinner("Admin panel opened in your browser.").succeed();
          } catch {
            spinner("Open this URL in your browser to create your admin account:").info();
            logger.log(highlighter.info(inviteUrl));
          }
        }).catch(() => {
          spinner("To create your admin account, visit:").info();
          logger.log(highlighter.info(inviteUrl));
        });
      } else {
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
    return;
  }

  const files = await fs.readdir(projectDir);
  const nonHidden = files.filter((f) => !f.startsWith("."));
  if (nonHidden.length > 0) {
    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: `Directory ${highlighter.info(path.basename(projectDir))} already exists and contains ${nonHidden.length} file(s). Continue and overwrite?`,
      initial: false,
    });

    if (!proceed) {
      process.exit(0);
    }
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
  const templatePath = CREATE_TEMPLATES[template].path;
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
    await execa(cmd, args, {
      cwd: path.resolve(projectDir),
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
      env: { ...process.env, npm_config_yes: "true" },
    });
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

${header("Create your first seller:")}

  Once the server is running, open the Vendor Panel and register at:
  ${highlighter.info("http://localhost:9000/seller/register")}

${header("Documentation:")}

  - ${createTerminalLink("Getting Started", "https://docs.mercurjs.com/welcome")}
`;
}

function serverUrls(): string {
  const header = (message: string) => kleur.bold(message);
  return `
${header("Your marketplace is running:")}

  API:          ${highlighter.info("http://localhost:9000")}
  Admin Panel:  ${highlighter.info("http://localhost:9000/dashboard")}
  Vendor Panel: ${highlighter.info("http://localhost:9000/seller")}

${header("Create your first seller:")}

  Open the Vendor Panel and register a new account at:
  ${highlighter.info("http://localhost:9000/seller/register")}
`;
}

function feedbackOutro(): string {
  return `${kleur.bgCyan(kleur.black(" Have feedback? "))} Visit us on ${createTerminalLink("GitHub", "https://github.com/mercurjs/mercur")}.\n${kleur.bgMagenta(kleur.black(" Join the community! "))} Chat with us on ${createTerminalLink("Discord", "https://discord.gg/hnZBzc4NJU")}.`;
}

function createTerminalLink(text: string, url: string) {
  return terminalLink(text, url, {
    fallback: (text, url) => `${text}: ${kleur.cyan().underline(url)}`,
  });
}

async function setPackageManagerField(
  projectDir: string,
  packageManager: string
): Promise<void> {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = await fs.readJSON(packageJsonPath);
  const { stdout: version } = await execa(packageManager, ["--version"]);
  packageJson.packageManager = `${packageManager}@${version.trim()}`;
  await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
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
