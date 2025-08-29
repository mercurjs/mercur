// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const vendorRoot = path.resolve(workspaceRoot, 'vendor/nosh');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot, vendorRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.disableHierarchicalLookup = true;
config.resolver.unstable_enableSymlinks = true;

config.resolver.blockList = [
  // Prevent Metro from watching native build folders
  /.*\android\/\/build\/.*/,
  /.*\ios\/\/build\/.*/,
];

module.exports = config;