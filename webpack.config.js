var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
var execFileSync = require('child_process').execFileSync;
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require('path');

module.exports = {
  entry: path.join(__dirname, 'src/index.js'),
  target: 'node',
  output: {
    filename: 'index.js',
    path: path.join(__dirname, 'build'),
    library: "[name]",
    libraryTarget: "commonjs2",
  },
  externals: [
    nodeExternals()
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        }
      }
    ]
  },
  noParse: [
    /aws\-sdk/,
  ],
}
