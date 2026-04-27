const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude .db files from Metro bundling to avoid packing them into the app bundle
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "db");

module.exports = withNativeWind(config, {
  input: "./src/global.css",
});
