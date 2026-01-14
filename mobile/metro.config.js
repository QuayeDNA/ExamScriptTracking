const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Optimize for production builds
if (process.env.NODE_ENV === 'production') {
  config.minifierConfig = {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
    },
    mangle: {
      safari10: true,
    },
  };

  // Enable tree shaking
  config.transformer = {
    ...config.transformer,
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  };
}

module.exports = withNativeWind(config, { input: "./global.css" });
