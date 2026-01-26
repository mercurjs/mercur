import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import path from "path";

import { clearRegistryContext } from "@/src/registry/context";
import { sendTelemetryEvent, setTelemetryEmail } from "@/src/telemetry";
import { setupDatabase } from "@/src/utils/create-db";
import { getDefaultDbProvider, type DbProvider } from "@/src/utils/db-provider";
import { startPostgresContainer } from "@/src/utils/docker-postgres";
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
  .option("--no-deps", "skip installing dependencies.")
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
          logger.info(`Installing dependencies with ${packageManager}...`);
          logger.break();
          const installStart = Date.now();
          const result = await installDeps({
            projectDir,
            packageManager,
          });
          const installDuration = ((Date.now() - installStart) / 1000).toFixed(1);
          logger.break();
          if (result) {
            spinner(`Dependencies installed successfully in ${installDuration}s.`).succeed();
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
        let dbProvider: DbProvider = "skip";

        if (!opts.skipDb) {
          // If connection string provided via CLI, use it directly
          if (opts.dbConnectionString) {
            dbProvider = "connection_string";
            dbConnectionString = opts.dbConnectionString;
          } else {
            // Detect available options
            const detectionSpinner = spinner("Detecting database options...").start();
            const detection = await getDefaultDbProvider();
            detectionSpinner.stop();

            // Check for DATABASE_URL in environment
            if (detection.envDatabaseUrl) {
              const { useEnvUrl } = await prompts({
                type: "confirm",
                name: "useEnvUrl",
                message: `Found DATABASE_URL in environment. Use it?`,
                initial: true,
              });

              if (useEnvUrl) {
                dbProvider = "connection_string";
                dbConnectionString = detection.envDatabaseUrl;
              }
            }

            // If no connection string yet, show provider selection
            if (!dbConnectionString) {
              const choices = [];

              if (detection.dockerAvailable) {
                choices.push({
                  title: "Docker (recommended)",
                  description: "Start PostgreSQL in a Docker container",
                  value: "docker",
                });
              }

              choices.push({
                title: "I already have PostgreSQL",
                description: detection.localPostgresAvailable
                  ? "Local PostgreSQL detected on port 5432"
                  : "Enter your connection string",
                value: "local",
              });

              choices.push({
                title: "Skip for now",
                description: "Configure database later",
                value: "skip",
              });

              const { selectedProvider } = await prompts({
                type: "select",
                name: "selectedProvider",
                message: "How do you want to run PostgreSQL?",
                choices,
                initial: 0,
              });

              if (!selectedProvider) {
                process.exit(0);
              }

              dbProvider = selectedProvider;
            }
          }

          // Handle selected provider
          if (dbProvider === "docker") {
            const dockerSpinner = spinner("Starting PostgreSQL container...").start();
            const dockerResult = await startPostgresContainer({
              projectName,
              projectDir,
              onProgress: (message) => dockerSpinner.text = message,
            });

            if (dockerResult.success) {
              const dbName = projectName.replace(/[^a-zA-Z0-9-]/g, "-");
              dockerSpinner.succeed(`PostgreSQL container started. Database: ${highlighter.info(dbName)}`);
              dbConnectionString = dockerResult.connectionString;

              // Create .env file BEFORE running migrations (Medusa needs DATABASE_URL)
              await manageEnvFiles({
                projectDir,
                databaseUri: dbConnectionString,
              });

              // Run migrations and seed
              const dbSpinner = spinner("Running migrations...").start();
              const dbResult = await setupDatabase({
                projectDir,
                projectName,
                dbConnectionString: dockerResult.connectionString,
                spinner: dbSpinner,
                skipDbCreation: true,
              });

              if (dbResult.success) {
                dbSpinner.succeed("Database setup completed.");
              } else {
                dbSpinner.fail("Failed to run migrations.");
                logger.log(feedbackOutro());
                await sendTelemetryEvent({
                  type: 'create',
                  payload: {
                    outcome: 'database_setup_failed',
                    db_provider: 'docker',
                    db_setup_step: 'migration',
                  }
                }, { cwd: projectDir });
                process.exit(1);
              }
            } else {
              dockerSpinner.fail(dockerResult.error || "Failed to start PostgreSQL container.");
              logger.log(feedbackOutro());
              await sendTelemetryEvent({
                type: 'create',
                payload: {
                  outcome: 'database_setup_failed',
                  db_provider: 'docker',
                  db_setup_step: 'container_start',
                }
              }, { cwd: projectDir });
              process.exit(1);
            }
          } else if (dbProvider === "local" || dbProvider === "connection_string") {
            // Ask for connection string if not already set
            if (!dbConnectionString) {
              const { connectionString } = await prompts({
                type: "text",
                name: "connectionString",
                message: "Enter your PostgreSQL connection string:",
                initial: "postgres://postgres:postgres@localhost:5432/postgres",
              });

              if (!connectionString) {
                process.exit(0);
              }

              dbConnectionString = connectionString;
            }

            // Create .env file BEFORE running migrations (Medusa needs DATABASE_URL)
            await manageEnvFiles({
              projectDir,
              databaseUri: dbConnectionString,
            });

            const dbSpinner = spinner("Setting up database...").start();
            const dbResult = await setupDatabase({
              projectDir,
              projectName,
              dbConnectionString,
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
                  db_provider: dbProvider,
                }
              }, { cwd: projectDir });
              process.exit(1);
            }
          } else if (dbProvider === "skip") {
            spinner("Database setup skipped.").warn();
            logger.info("Run 'mercurjs db setup' later to configure your database.");
            dbConnectionString = undefined;
          }
        } else {
          dbProvider = "skip";
          spinner("Database setup skipped.").warn();
        }

        // Create admin user (only if database was set up)
        if (dbProvider !== "skip") {
          const { wantsAdmin } = await prompts({
            type: "confirm",
            name: "wantsAdmin",
            message: "Create an admin user?",
            initial: true,
          });

          if (wantsAdmin) {
            const adminAnswers = await prompts([
              {
                type: "text",
                name: "email",
                message: "Admin email:",
                initial: "admin@example.com",
                validate: (value: string) =>
                  value.includes("@") ? true : "Please enter a valid email",
              },
              {
                type: "password",
                name: "password",
                message: "Admin password:",
              },
            ]);

            if (adminAnswers.email && adminAnswers.password) {
              const adminSpinner = spinner("Creating admin user...").start();
              const adminCreated = await createAdminUser({
                projectDir,
                email: adminAnswers.email,
                password: adminAnswers.password,
              });

              if (adminCreated) {
                adminSpinner.succeed(`Admin user created: ${adminAnswers.email}`);
              } else {
                adminSpinner.fail("Failed to create admin user.");
              }
            }
          }
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

async function createAdminUser({
  projectDir,
  email,
  password,
}: {
  projectDir: string;
  email: string;
  password: string;
}): Promise<boolean> {
  const apiDir = path.join(projectDir, "packages", "api");

  try {
    await execa("npx", ["medusa", "user", "-e", email, "-p", password], {
      cwd: apiDir,
    });
    return true;
  } catch (err: unknown) {
    logger.error(
      `Error creating admin user${err instanceof Error ? `: ${err.message}` : ""}.`
    );
    return false;
  }
}
