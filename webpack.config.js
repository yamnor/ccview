const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    viewer: './src/webview/viewer.js'
  },
  output: {
    path: path.resolve(__dirname, 'media'),
    filename: '[name].js',
    clean: true,
    library: {
      type: 'window'
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'node_modules/miew/dist/Miew.min.css',
          to: 'miew.min.css'
        },
        {
          from: 'node_modules/lodash/lodash.js',
          to: 'lodash.js'
        },
        {
          from: 'node_modules/xterm/lib/xterm.js',
          to: 'xterm.js'
        },
        {
          from: 'node_modules/xterm/css/xterm.css',
          to: 'xterm.css'
        },
        {
          from: 'node_modules/xterm-addon-fit/lib/xterm-addon-fit.js',
          to: 'xterm-addon-fit.js'
        },
        {
          from: 'node_modules/xterm-addon-web-links/lib/xterm-addon-web-links.js',
          to: 'xterm-addon-web-links.js'
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.ts']
  }
}; 