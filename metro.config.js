const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase v12 uses package exports for subpath imports like `firebase/firestore`.
// Some Metro setups need this flag explicitly enabled to resolve those paths.
config.resolver.unstable_enablePackageExports = true;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/firestore/lite') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/@firebase/firestore/dist/lite/index.rn.esm.js',
      ),
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
