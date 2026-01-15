#!/usr/bin/env bun
import { Command } from "commander";
import packageJson from "../package.json";
import { add } from "./commands/add";
import { build } from "./commands/build";
import { create } from "./commands/create";
import { diff } from "./commands/diff";
import { info } from "./commands/info";
import { init } from "./commands/init";
import { search } from "./commands/search";
import { view } from "./commands/view";

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

  program
    .addCommand(add)
    .addCommand(build)
    .addCommand(create)
    .addCommand(diff)
    .addCommand(info)
    .addCommand(init)
    .addCommand(search)
    .addCommand(view);

  program.parse();
}

main();
