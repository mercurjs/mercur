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

// todo: comeback to this because we would have multiple folders for env files
export async function manageEnvFiles({
  projectDir,
  databaseUri,
}: {
  projectDir: string;
  databaseUri?: string;
}): Promise<void> {
  const envExamplePath = path.join(projectDir, ".env.example");
  const envPath = path.join(projectDir, ".env");

  let exampleEnv = "";

  try {
    // If there's a .env.example file, use it to create or update the .env file
    if (fs.existsSync(envExamplePath)) {
      const envExampleContents = await fs.readFile(envExamplePath, "utf8");

      exampleEnv = sanitizeEnv({
        contents: envExampleContents,
        databaseUri,
      });
    }

    // If there's no .env file, create it using the .env.example content (if it exists)
    if (!fs.existsSync(envPath)) {
      const envContent = sanitizeEnv({
        contents: exampleEnv,
        databaseUri,
      });

      await fs.writeFile(envPath, envContent);
    } else {
      // If the .env file already exists, sanitize it as-is
      const envContents = await fs.readFile(envPath, "utf8");

      const updatedEnvContents = sanitizeEnv({
        contents: envContents,
        databaseUri,
      });

      await fs.writeFile(envPath, updatedEnvContents);
    }
  } catch (err: unknown) {
    logger.error("Unable to manage environment files");
    if (err instanceof Error) {
      logger.error(err.message);
    }
    process.exit(1);
  }
}
