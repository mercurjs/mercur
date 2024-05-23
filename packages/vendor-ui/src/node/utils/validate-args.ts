import { CustomWebpackConfigArgs } from "../types";
import { logger } from "./logger";

function validateArgs(args: CustomWebpackConfigArgs) {
  const { options } = args;

  if (options.path) {
    if (!options.path.startsWith("/")) {
      logger.panic(
        "'path' in the options of `@mercurjs/vendor` must start with a '/'"
      );
    }

    if (options.path !== "/" && options.path.endsWith("/")) {
      logger.panic(
        "'path' in the options of `@mercurjs/vendor` cannot end with a '/'"
      );
    }

    if (typeof options.path !== "string") {
      logger.panic(
        "'path' in the options of `@mercurjs/vendor` must be a string"
      );
    }
  }
}

export { validateArgs };
