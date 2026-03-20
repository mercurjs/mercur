import { toggleTelemetry, TELEMETRY_DOCS_URL } from "@/src/telemetry";
import { configStore } from "@/src/telemetry/store";
import { handleError } from "@/src/utils/handle-error";
import { logger } from "@/src/utils/logger";
import { Command } from "commander";

export const telemetry = new Command()
  .name("telemetry")
  .description(
    "manage the collection of anonymous usage data"
  )
  .option("--enable", "enable telemetry")
  .option("--disable", "disable telemetry")
  .action(async (opts) => {
    try {
      if (opts.enable && opts.disable) {
        logger.error("Cannot use --enable and --disable together.");
        return;
      }

      // No flags — show current status
      if (!opts.enable && !opts.disable) {
        const configEnabled = configStore.get("telemetry_enabled");
        const envDisabled = process.env.MERCUR_DISABLE_TELEMETRY === 'true';
        const enabled = configEnabled && !envDisabled;
        const status = enabled ? "enabled" : "disabled";
        logger.log(`Telemetry is currently ${status}.`);
        if (envDisabled && configEnabled) {
          logger.log(`(Disabled via MERCUR_DISABLE_TELEMETRY environment variable)`);
        }
        logger.log(
          enabled
            ? `Run "mercurjs telemetry --disable" to opt out.`
            : `Run "mercurjs telemetry --enable" to opt in.`
        );
        logger.log(`Learn more: ${TELEMETRY_DOCS_URL}`);
        return;
      }

      const enabled = !!opts.enable;
      toggleTelemetry(enabled);

      if (enabled) {
        logger.success(`Telemetry enabled. Learn more: ${TELEMETRY_DOCS_URL}`);
      } else {
        logger.success("Telemetry disabled. No data will be collected.");
      }
    } catch (error) {
      handleError(error);
    }
  });
