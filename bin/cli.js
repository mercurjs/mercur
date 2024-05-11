#!/usr/bin/env node

const inquirer = require("inquirer");
const fs = require("fs");
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

if (!fs.existsSync(folderName)) {
  fs.mkdirSync(folderName);
} else {
  console.log("Folder already exists:", folderName);
  process.exit(-1);
}

const API_CHECKOUT = `git clone --depth 1 https://github.com/mercurjs/mercur-api-starter.git ${folderName}/api`;
const VENDOR_CHECKOUT = `git clone --depth 1 https://github.com/mercurjs/mercur-vendor-starter.git ${folderName}/vendor`;
const ADMIN_CHECKOUT = `git clone --depth 1 https://github.com/mercurjs/mercur-admin-starter.git ${folderName}/admin`;
const STORE_CHECKOUT = `git clone --depth 1 https://github.com/mercurjs/mercur-storefront-starter.git ${folderName}/store-front`;

const checkoutMap = {
  Admin: ADMIN_CHECKOUT,
  Vendor: VENDOR_CHECKOUT,
  "Store-front": STORE_CHECKOUT,
  API: API_CHECKOUT,
};

async function main() {
  const components = await inquirer
    .prompt([
      {
        type: "checkbox",
        message: "Select components to include in your project:",
        name: "components",
        choices: [
          { name: "Admin", checked: true },
          { name: "Vendor", checked: true },
          { name: "Store-front" },
          {
            name: "API",
            checked: true,
            disabled: "Default",
          },
        ],
      },
    ])
    .then((answers) => {
      return answers.components;
    })
    .catch((error) => {
      if (error.isTtyError) {
        console.log("Prompt cannot be rendered in the current environment");
      } else {
        console.error("Error during the prompt:", error);
      }
      process.exit(-1);
    });

  for (const component of [...components, "API"]) {
    const checkedOut = runCommand(checkoutMap[component]);
    if (!checkedOut) {
      process.exit(-1);
    }
  }

  console.log(`Congratulations 🎉! Succesfuly initialized Mercur.`);
  console.log(`cd ${folderName}`);
}

main();
