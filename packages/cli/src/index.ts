#!/usr/bin/env bun
import { Command } from "commander";
import packageJson from "../package.json";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

async function main() {
  const program = new Command()
    .name("@mercurjs/cli")
    .description(
      "Add workflows, API endpoints, UI from registries to your project"
    )
    .version(
      packageJson.version || "0.0.0",
      "-v, --version",
      "display the version number"
    );

  program;

  program.parse();
}

main();
