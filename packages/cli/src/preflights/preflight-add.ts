import { existsSync } from "fs";
import path from "path";
import { z } from "zod";
import * as ERRORS from "../utils/errors";
import { getConfig } from "../utils/get-config";
import { getProjectInfo } from "../utils/get-project-info";

export const addOptionsSchema = z.object({
  cwd: z.string(),
  blocks: z.array(z.string()).optional(),
  yes: z.boolean(),
  overwrite: z.boolean(),
  silent: z.boolean(),
});

export async function preFlightAdd(options: z.infer<typeof addOptionsSchema>) {
  const errors: Record<string, boolean> = {};
  const cwd = path.resolve(options.cwd);

  if (!existsSync(cwd)) {
    errors[ERRORS.MISSING_DIR_OR_EMPTY_PROJECT] = true;
    return {
      errors,
      config: null,
    };
  }

  const config = await getConfig(cwd);
  if (!config) {
    errors[ERRORS.MISSING_CONFIG] = true;
    return {
      errors,
      config: null,
    };
  }

  const projectInfo = await getProjectInfo(cwd);

  return {
    errors,
    config,
    projectInfo,
  };
}
