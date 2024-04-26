#!/usr/bin/env node

const { execSync } = require("child_process");

const runCommand = (command) => {
  try {
    execSync(`${command}`, { stdio: "inherit" });
  } catch (error) {
    console.error(`Failed to execute command: ${command}`, error);
    return false;
  }

  return true;
};

const folderName = process.argv[2];
const gitCheckoutCommand = `git clone --depth 1 https://github.com/mercurjs/mercur.git ${folderName}`;

const checkedOut = runCommand(gitCheckoutCommand);
if (!checkedOut) {
  process.exit(-1);
}

console.log(
  `Congratulations 🎉! Succesfuly initialized Mercur. Run follow commands to start`
);
console.log(`cd ${folderName} && npm install`);
