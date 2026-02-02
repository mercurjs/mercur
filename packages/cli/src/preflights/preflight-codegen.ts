import { codegenOptionsSchema } from "@/src/commands/codegen";
import * as ERRORS from "@/src/utils/errors";
import { getConfig } from "@/src/utils/get-config";
import { getProjectInfo } from "@/src/utils/get-project-info";
import { z } from "zod";

export async function preFlightCodegen(
  options: z.infer<typeof codegenOptionsSchema>
) {
  const errors: Record<string, boolean> = {};

  const [config, projectInfo] = await Promise.all([
    getConfig(options.cwd),
    getProjectInfo(options.cwd),
  ]);

  if (!config) {
    errors[ERRORS.MISSING_CONFIG] = true;
    return {
      errors,
      config: null,
      projectInfo: null,
    };
  }

  if (!projectInfo.medusaDir) {
    errors[ERRORS.CODGEN_MISSING_MEDUSA_CONFIG_FILE] = true;
    return {
      errors,
      config,
      projectInfo: null,
    };
  }

  return {
    errors,
    config,
    projectInfo,
  };
}
