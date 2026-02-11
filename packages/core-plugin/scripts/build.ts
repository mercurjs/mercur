/**
 * Build script for @mercurjs/core-plugin backend
 *
 * This script compiles the plugin backend using Medusa's build tools.
 * It loads the TypeScript configuration and compiles the source files
 * into the .medusa/server directory.
 */

import { Compiler } from "@medusajs/framework/build-tools"
import { logger } from "@medusajs/framework/logger"
import path from "path"

async function build() {
  const directory = path.resolve(__dirname, "..")

  logger.info("Starting build...")

  const compiler = new Compiler(directory, logger)

  const tsConfig = await compiler.loadTSConfigFile()
  if (!tsConfig) {
    logger.error("Unable to compile plugin - tsconfig.json not found or invalid")
    process.exit(1)
  }

  try {
    await compiler.buildPluginBackend(tsConfig)
    logger.info("Build completed successfully")
    process.exit(0)
  } catch (error) {
    logger.error("Build failed:", error)
    process.exit(1)
  }
}

// Execute the build
build().catch((error) => {
  logger.error("Unexpected error during build:", error)
  process.exit(1)
})
