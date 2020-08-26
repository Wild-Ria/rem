const webpack = require('webpack');

const webpackConfig = {
  node: { global: true, fs: 'empty' }, // Fix: "Uncaught ReferenceError: global is not defined", and "Can't resolve 'fs'".
  output: {
    libraryTarget: 'umd' // Fix: "Uncaught ReferenceError: exports is not defined".
  },
  plugins: [
    // janus.js does not use 'import' to access to the functionality of webrtc-adapter,
    // instead it expects a global object called 'adapter' for that.
    // Let's make that object available.
    new webpack.ProvidePlugin({ adapter: 'webrtc-adapter' })
  ],
  module: {
    rules: [
      // janus.js does not use 'export' to provide its functionality to others, instead
      // it creates a global variable called 'Janus' and expects consumers to use it.
      // Let's use 'exports-loader' to simulate it uses 'export'.
      {
        test: require.resolve('janus-gateway'),
        loader: 'exports-loader',
        options: {
          exports: 'Janus',
        },
      }
    ]
  }
};

module.exports = webpackConfig;
