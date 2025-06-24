#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

try {
  // Get the directory where this script is located
  const scriptDir = __dirname;

  // Change to the mercur directory
  process.chdir(scriptDir);

  console.log(`Starting Mercur development server from: ${scriptDir}`);

  // Start the development server
  const child = spawn("yarn", ["dev"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (error) => {
    console.error("Failed to start Mercur development server:", error.message);
    console.log(
      "Make sure yarn is installed and all dependencies are properly installed."
    );
    process.exit(1);
  });
} catch (error) {
  console.error("Error starting Mercur:", error.message);
  process.exit(1);
}
