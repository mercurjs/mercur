import { spawn } from "node:child_process";
import os from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "path";

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

// import packageJson from "../../package.json";
import {
  sendTelemetryEvent,
  setTelemetryEmail,
  showTelemetryNoticeIfNeeded,
} from "../telemetry";
import { setupDatabase, type SetupDatabaseResult } from "../utils/create-db";
import {
  resolveProjectPackageManager,
  type PackageManager,
} from "../utils/get-package-manager";
import { handleError } from "../utils/handle-error";
import { highlighter } from "../utils/highlighter";
import { logger } from "../utils/logger";
import { manageEnvFiles } from "../utils/manage-env-files";
import { spinner } from "../utils/spinner";

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
  .option("--skip-storefront", "skip adding the Next.js storefront.", false)
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
        // todo: re-enable template selection once more templates are ready
        // const { selectedTemplate } = await prompts({
        //   type: "select",
        //   name: "selectedTemplate",
        //   message: `Which ${highlighter.info(
        //     "template"
        //   )} would you like to use?`,
        //   choices: Object.entries(CREATE_TEMPLATES).map(([key, tmpl]) => ({
        //     title: key,
        //     value: key,
        //     description: tmpl.description,
        //   })),
        // });
        //
        // if (!selectedTemplate) {
        //   process.exit(0);
        // }
        //
        // template = selectedTemplate;
        template = "basic";
      }

      let addStorefront = false;
      if (template === "basic" && !opts.skipStorefront) {
        const { wantsStorefront } = await prompts({
          type: "confirm",
          name: "wantsStorefront",
          message: `Add a ${highlighter.info("Next.js storefront")}?`,
          initial: true,
        });

        addStorefront = Boolean(wantsStorefront);
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
      // Fetch the repo tarball once, then extract each subpath from it locally
      // so opting into the storefront doesn't trigger a second network download.
      const tarballPath = await downloadRepoTarball();
      try {
        await extractTemplate({ tarballPath, projectDir, template });
        downloadSpinner.succeed("Template downloaded successfully.");

        if (addStorefront) {
          const storefrontSpinner = spinner("Adding Next.js storefront...").start();
          try {
            await extractStorefront({ tarballPath, projectDir });
            storefrontSpinner.succeed("Next.js storefront added successfully.");
          } catch (error) {
            storefrontSpinner.fail(
              `Failed to add storefront${error instanceof Error ? `: ${error.message}` : ""}.`
            );
          }
        }
      } finally {
        await fs.remove(tarballPath).catch(() => null);
      }

      const packageManager = await resolveProjectPackageManager();
      await updateRootPackageJson(projectDir, projectName, packageManager);

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

// Downloads the repo tarball once to a temp file. Callers then extract whichever
// subpaths they need from it locally, avoiding a network fetch per directory.
async function downloadRepoTarball(): Promise<string> {
  const url = `https://codeload.github.com/mercurjs/mercur/tar.gz/${DEFAULT_BRANCH}`;
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`);
  }

  const tarballPath = path.join(os.tmpdir(), `mercur-${DEFAULT_BRANCH.replaceAll("/", "-")}-${process.pid}.tar.gz`);
  await pipeline(
    Readable.from(res.body as unknown as NodeJS.ReadableStream),
    fs.createWriteStream(tarballPath)
  );

  return tarballPath;
}

// Extracts a single directory out of the local tarball. `strip` controls how many
// leading path segments are removed so files land at the right place under `cwd`.
async function extractRepoDir({
  tarballPath,
  cwd,
  repoPath,
  strip,
}: {
  tarballPath: string;
  cwd: string;
  repoPath: string;
  strip: number;
}) {
  const branchDir = `mercur-${DEFAULT_BRANCH.replace(/^v/, "").replaceAll("/", "-")}`;
  const filter = `${branchDir}/${repoPath}/`;

  await x({
    file: tarballPath,
    cwd,
    filter: (p) => p.includes(filter),
    strip,
  });
}

async function extractTemplate({
  tarballPath,
  projectDir,
  template,
}: {
  tarballPath: string;
  projectDir: string;
  template: keyof typeof CREATE_TEMPLATES;
}) {
  const templatePath = CREATE_TEMPLATES[template].path;
  const repoPath = `templates/${templatePath}`;

  // Drop the branch dir + every segment of `repoPath` so the template root
  // becomes the project root.
  await extractRepoDir({
    tarballPath,
    cwd: projectDir,
    repoPath,
    strip: 1 + repoPath.split("/").length,
  });
}

async function extractStorefront({
  tarballPath,
  projectDir,
}: {
  tarballPath: string;
  projectDir: string;
}) {
  await fs.ensureDir(path.join(projectDir, "apps"));

  // Drop only the branch dir so files keep their `apps/storefront/...` prefix
  // and land alongside the other workspace apps.
  await extractRepoDir({
    tarballPath,
    cwd: projectDir,
    repoPath: "apps/storefront",
    strip: 1,
  });
}

async function installDeps({
  projectDir,
  packageManager,
}: {
  projectDir: string;
  packageManager: PackageManager;
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
  packageManager: PackageManager
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

async function updateRootPackageJson(
  projectDir: string,
  projectName: string,
  packageManager: string
): Promise<void> {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = await fs.readJSON(packageJsonPath);

  packageJson.name = projectName;

  try {
    const { stdout: version } = await execa(packageManager, ["--version"]);
    packageJson.packageManager = `${packageManager}@${version.trim()}`;
  } catch {
    // A bare manager name is not a valid `packageManager` value — Turborepo and
    // corepack expect `name@version`. If the version lookup fails, keep the
    // template's default `packageManager` rather than writing an invalid value
    // that would break `turbo run` on the first command.
  }

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
