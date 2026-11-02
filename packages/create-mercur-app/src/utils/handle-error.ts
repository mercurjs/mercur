import { logger } from "./logger";
import { finishCommand } from "../telemetry/command-tracking";

export async function handleError(error: unknown) {
  await finishCommand(1, error);
  logger.break();
  logger.error(
    `Something went wrong. Please check the error below for more details.`
  );
  logger.error(`If the problem persists, please open an issue on GitHub.`);
  logger.error("");

  if (typeof error === "string") {
    logger.error(error);
  } else if (error instanceof Error) {
    logger.error(error.message);
  }

  logger.break();
  process.exit(1);
}
