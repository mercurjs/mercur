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
    "build a dashboard extensions entry (routes, widgets, custom fields, i18n) from a source directory"
  )
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .option("-a, --app <app>", "which panel the entry targets (admin|vendor)", "admin")
  .option("-s, --src <src>", "source directory to crawl", "src")
  .option("-o, --out <out>", "output file", "dist/admin-extensions.mjs")
  .option("-w, --watch", "rebuild on change", false)
  .action(async (opts) => {
    try {
      const cwd = path.resolve(opts.cwd);

      if (!APPS.includes(opts.app)) {
        logger.error(`--app must be one of: ${APPS.join(", ")}`);
        process.exit(1);
      }

      const buildSpinner = spinner(`Building ${opts.app} extensions...`);

      const ok = await buildDashboardExtensions({
        root: cwd,
        srcDir: opts.src,
        outFile: opts.out,
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
