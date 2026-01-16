import { logger } from "@/src/utils/logger";
import fs from "fs-extra";
import path from "path";

const sanitizeEnv = ({
  contents,
  databaseUri,
}: {
  contents: string;
  databaseUri?: string;
}): string => {
  const seenKeys = new Set<string>();

  let withDefaults = contents;

  // Add DATABASE_URL if not present
  if (!contents.includes("DATABASE_URL")) {
    withDefaults += "\nDATABASE_URL=your-connection-string-here";
  }

  const updatedEnv = withDefaults
    .split("\n")
    .map((line) => {
      if (line.startsWith("#") || !line.includes("=")) {
        return line;
      }

      const [key] = line.split("=");

      if (!key) {
        return;
      }

      if (key === "DATABASE_URL") {
        const placeholderUri =
          databaseUri || "postgresql://localhost:5432/your-database-name";
        line = `DATABASE_URL=${placeholderUri}`;
      }

      // Handle duplicates
      if (seenKeys.has(key)) {
        return null;
      }

      seenKeys.add(key);

      return line;
    })
    .filter(Boolean)
    .join("\n");

  return updatedEnv;
};

const APP_PATHS = [
  { path: "apps/api", isApi: true },
  { path: "apps/vendor", isApi: false },
  { path: "apps/admin", isApi: false },
];

export async function manageEnvFiles({
  projectDir,
  databaseUri,
}: {
  projectDir: string;
  databaseUri?: string;
}): Promise<void> {
  try {
    await Promise.all(
      APP_PATHS.map(async ({ path: appPath, isApi }) => {
        const appDir = path.join(projectDir, appPath);

        if (!fs.existsSync(appDir)) {
          return;
        }

        const envTemplatePath = path.join(appDir, ".env.template");
        const envPath = path.join(appDir, ".env");

        // if not API, just copy the .env.template file
        if (!isApi) {
          if (fs.existsSync(envTemplatePath) && !fs.existsSync(envPath)) {
            await fs.copy(envTemplatePath, envPath);
          }
          return;
        }

        let templateEnv = "";

        if (fs.existsSync(envTemplatePath)) {
          const envTemplateContents = await fs.readFile(envTemplatePath, "utf8");
          templateEnv = sanitizeEnv({
            contents: envTemplateContents,
            databaseUri,
          });
        }

        if (!fs.existsSync(envPath)) {
          const envContent = sanitizeEnv({
            contents: templateEnv,
            databaseUri,
          });
          await fs.writeFile(envPath, envContent);
        } else {
          const envContents = await fs.readFile(envPath, "utf8");
          const updatedEnvContents = sanitizeEnv({
            contents: envContents,
            databaseUri,
          });
          await fs.writeFile(envPath, updatedEnvContents);
        }
      })
    );
  } catch (err: unknown) {
    logger.error("Unable to manage environment files");
    if (err instanceof Error) {
      logger.error(err.message);
    }
    process.exit(1);
  }
}
