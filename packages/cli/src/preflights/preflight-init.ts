import { existsSync } from "fs";
import path from "path";
import { z } from "zod";
import { getProjectInfo } from "../utils/get-project-info";

export const initOptionsSchema = z.object({
  cwd: z.string(),
  yes: z.boolean(),
  defaults: z.boolean(),
  silent: z.boolean(),
});

export async function preFlightInit(
  options: z.infer<typeof initOptionsSchema>
) {
  const errors: Record<string, boolean> = {};
  const cwd = path.resolve(options.cwd);

  if (!existsSync(cwd)) {
    errors.MISSING_DIR = true;
  }

  const projectInfo = await getProjectInfo(cwd);

  return {
    errors,
    projectInfo,
  };
}
