import { Command } from "commander";
import { promises as fs } from "fs";
import path from "path";
import prompts from "prompts";
import { z } from "zod";
import { preFlightInit } from "../preflights/preflight-init";
import { BUILTIN_REGISTRIES, REGISTRY_SCHEMA_URL } from "../registry/constants";
import { clearRegistryContext } from "../registry/context";
import { rawConfigSchema } from "../schema";
import { getConfig, resolveConfigPaths } from "../utils/get-config";
import { handleError } from "../utils/handle-error";
import { highlighter } from "../utils/highlighter";
import { logger } from "../utils/logger";
import { spinner } from "../utils/spinner";
import { sendTelemetryEvent } from "../telemetry";

export const initOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  defaults: z.boolean(),
  silent: z.boolean(),
});

export const init = new Command()
  .name("init")
  .description("initialize your project and install dependencies")
  .option("-y, --yes", "skip confirmation prompt.", true)
  .option("-d, --defaults", "use default configuration.", false)
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-s, --silent", "mute output.", false)
  .action(async (opts) => {
    try {
      const options = initOptionsSchema.parse({
        cwd: path.resolve(opts.cwd),
        ...opts,
      });

      await runInit(options);

      logger.log(
        `${highlighter.success(
          "Success!"
        )} Project initialization completed.\nYou may now add blocks.`
      );
      logger.break();

      await sendTelemetryEvent({
        type: 'init',
        payload: {
          outcome: 'success'
        }
      }, {
        cwd: options.cwd,
      })
    } catch (error) {
      logger.break();
      handleError(error);
    } finally {
      clearRegistryContext();
    }
  });

export async function runInit(options: z.infer<typeof initOptionsSchema>) {
  await preFlightInit(options);

  const existingConfig = await getConfig(options.cwd);

  const config = existingConfig
    ? await promptForMinimalConfig(existingConfig, options)
    : await promptForConfig(options);

  if (!options.yes) {
    const { proceed } = await prompts({
      type: "confirm",
      name: "proceed",
      message: `Write configuration to ${highlighter.info(
        "blocks.json"
      )}. Proceed?`,
      initial: true,
    });

    if (!proceed) {
      process.exit(0);
    }
  }

  const configSpinner = spinner(`Writing blocks.json.`).start();
  const targetPath = path.resolve(options.cwd, "blocks.json");

  config.registries = Object.fromEntries(
    Object.entries(config.registries || {}).filter(
      ([key]) => !Object.keys(BUILTIN_REGISTRIES).includes(key)
    )
  );

  await fs.writeFile(
    targetPath,
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8"
  );
  configSpinner.succeed();

  return await resolveConfigPaths(options.cwd, config);
}

async function promptForConfig(opts: z.infer<typeof initOptionsSchema>) {
  // Skip prompts if defaults flag is set
  if (opts.defaults) {
    return rawConfigSchema.parse({
      $schema: REGISTRY_SCHEMA_URL,
      aliases: {
        workflows: "packages/api/src/workflows",
        api: "packages/api/src/api",
        links: "packages/api/src/links",
        modules: "packages/api/src/modules",
        vendor: "apps/vendor/src",
        admin: "apps/admin/src",
        lib: "packages/api/src/lib",
      },
      registries: BUILTIN_REGISTRIES,
    });
  }

  logger.info("");
  const options = await prompts(
    [
      {
        type: "text",
        name: "workflows",
        message: `Configure the import alias for ${highlighter.info("workflows")}:`,
        initial: "packages/api/src/workflows",
      },
      {
        type: "text",
        name: "api",
        message: `Configure the import alias for ${highlighter.info("api")}:`,
        initial: "packages/api/src/api",
      },
      {
        type: "text",
        name: "links",
        message: `Configure the import alias for ${highlighter.info("links")}:`,
        initial: "packages/api/src/links",
      },
      {
        type: "text",
        name: "modules",
        message: `Configure the import alias for ${highlighter.info("modules")}:`,
        initial: "packages/api/src/modules",
      },
      {
        type: "text",
        name: "vendor",
        message: `Configure the import alias for ${highlighter.info("vendor")}:`,
        initial: "apps/vendor/src",
      },
      {
        type: "text",
        name: "admin",
        message: `Configure the import alias for ${highlighter.info("admin")}:`,
        initial: "packages/api/src/admin",
      },
      {
        type: "text",
        name: "lib",
        message: `Configure the import alias for ${highlighter.info("lib")}:`,
        initial: "packages/api/src/lib",
      },
    ],
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  return rawConfigSchema.parse({
    $schema: REGISTRY_SCHEMA_URL,
    aliases: {
      workflows: options.workflows ?? "packages/api/src/workflows",
      api: options.api ?? "packages/api/src/api",
      links: options.links ?? "packages/api/src/links",
      modules: options.modules ?? "packages/api/src/modules",
      vendor: options.vendor ?? "apps/vendor/src",
      admin: options.admin ?? "packages/api/src/admin",
      lib: options.lib ?? "packages/api/src/lib",
    },
    registries: BUILTIN_REGISTRIES,
  });
}

async function promptForMinimalConfig(
  existingConfig: z.infer<typeof rawConfigSchema>,
  opts: z.infer<typeof initOptionsSchema>
) {
  // If --defaults is passed, use default values
  if (opts.defaults) {
    return rawConfigSchema.parse({
      $schema: REGISTRY_SCHEMA_URL,
      aliases: {
        workflows: "packages/api/src/workflows",
        api: "packages/api/src/api",
        links: "packages/api/src/links",
        modules: "packages/api/src/modules",
        vendor: "apps/vendor/src",
        admin: "apps/admin/src",
        lib: "packages/api/src/lib",
      },
      registries: BUILTIN_REGISTRIES,
    });
  }

  const options = await prompts(
    [
      {
        type: "text",
        name: "workflows",
        message: `Configure the import alias for ${highlighter.info("workflows")}:`,
        initial: existingConfig.aliases.workflows,
      },
      {
        type: "text",
        name: "api",
        message: `Configure the import alias for ${highlighter.info("api")}:`,
        initial: existingConfig.aliases.api,
      },
      {
        type: "text",
        name: "links",
        message: `Configure the import alias for ${highlighter.info("links")}:`,
        initial: existingConfig.aliases.links,
      },
      {
        type: "text",
        name: "modules",
        message: `Configure the import alias for ${highlighter.info("modules")}:`,
        initial: existingConfig.aliases.modules,
      },
      {
        type: "text",
        name: "vendor",
        message: `Configure the import alias for ${highlighter.info("vendor")}:`,
        initial: existingConfig.aliases.vendor,
      },
      {
        type: "text",
        name: "admin",
        message: `Configure the import alias for ${highlighter.info("admin")}:`,
        initial: existingConfig.aliases.admin,
      },
      {
        type: "text",
        name: "lib",
        message: `Configure the import alias for ${highlighter.info("lib")}:`,
        initial: existingConfig.aliases.lib,
      },
    ],
    {
      onCancel: () => {
        process.exit(0);
      },
    }
  );

  return rawConfigSchema.parse({
    $schema: existingConfig.$schema,
    aliases: {
      workflows: options.workflows ?? existingConfig.aliases.workflows,
      api: options.api ?? existingConfig.aliases.api,
      links: options.links ?? existingConfig.aliases.links,
      modules: options.modules ?? existingConfig.aliases.modules,
      vendor: options.vendor ?? existingConfig.aliases.vendor,
      admin: options.admin ?? existingConfig.aliases.admin,
      lib: options.lib ?? existingConfig.aliases.lib,
    },
  });
}
