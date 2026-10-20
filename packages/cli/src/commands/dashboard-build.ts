import fs from "fs";
import path from "path";
import { handleError } from "@/src/utils/handle-error";
import {
  buildDashboardExtensions,
  type DashboardApp,
} from "@/src/utils/build-dashboard-extensions";
import { logger } from "@/src/utils/logger";
import { spinner } from "@/src/utils/spinner";
import { Command } from "commander";

const APPS: DashboardApp[] = ["admin", "vendor"];

export const dashboardBuild = new Command()
  .name("dashboard:build")
  .description(
    "build a dashboard extensions entry (routes, widgets, custom fields, gates, layouts, i18n) from a source directory"
  )
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-a, --app <app>", "which panel the entry targets (admin|vendor)", "admin")
  .option(
    "-s, --src <src>",
    "source directory to crawl. defaults to src/<app> when it exists, else src."
  )
  .option("-o, --out <out>", "output file. defaults to dist/<app>-extensions.mjs.")
  .option("-w, --watch", "rebuild on change", false)
  .action(async (opts) => {
    try {
      const cwd = path.resolve(opts.cwd);

      if (!APPS.includes(opts.app)) {
        logger.error(`--app must be one of: ${APPS.join(", ")}`);
        process.exit(1);
      }

      const srcDir =
        opts.src ??
        (fs.existsSync(path.join(cwd, "src", opts.app)) ? path.join("src", opts.app) : "src");
      const outFile = opts.out ?? `dist/${opts.app}-extensions.mjs`;

      const buildSpinner = spinner(`Building ${opts.app} extensions...`);

      const ok = await buildDashboardExtensions({
        root: cwd,
        srcDir,
        outFile,
        watch: opts.watch,
      });

      if (ok) {
        buildSpinner.succeed(`Built ${opts.app} extensions.`);
      } else {
        buildSpinner.fail(`Failed to build ${opts.app} extensions.`);
        process.exit(1);
      }
    } catch (error) {
      logger.break();
      handleError(error);
    }
  });
