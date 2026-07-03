#!/usr/bin/env node
import { Command } from "commander";

import packageJson from "../package.json";
import { create } from "./commands/create";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

const program = new Command()
  .name("create-mercur-app")
  .description("create a new Mercur project")
  .version(
    packageJson.version || "0.0.0",
    "-v, --version",
    "display the version number"
  );

program.addCommand(create, { isDefault: true });

program.parse();
