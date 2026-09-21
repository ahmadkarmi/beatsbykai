// Metro in an npm workspace.
//
// Without this, Metro only watches apps/mobile and only resolves from its own
// node_modules — so @beatsbykai/core (a symlinked workspace package) and every
// hoisted dependency would fail to resolve.
//
// Hierarchical lookup is deliberately left at Expo's default: expo-doctor
// flags overriding it, and the duplicate-React risk it would guard against is
// already handled by the react override in the workspace root, which keeps a
// single hoisted copy.

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
