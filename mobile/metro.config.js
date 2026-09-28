const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /node_modules\/[^/]+\/node_modules/,
  /\.expo/,
  /\.git/,
];

module.exports = config;
