import { toggleTelemetry } from "@/src/telemetry";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import { Command } from "commander";

export const telemetry = new Command()
  .name("telemetry")
  .description(
    "enable or disable the collection of anonymous usage data. If no option is provided, the command enables the collection of anonymous usage data."
  )
  .option("--enable", "enable telemetry (default)")
  .option("--disable", "disable telemetry")
  .action(async (opts) => {
    try {
      const enabled = !opts.disable;
      toggleTelemetry(enabled);

      if (enabled) {
        logger.success("Telemetry enabled.");
      } else {
        logger.success("Telemetry disabled.");
      }
    } catch (error) {
      handleError(error);
    }
  });
