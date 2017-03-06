import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
  context: path.resolve(__dirname, './app'),
  entry: ['babel-polyfill', './main.js'],
  output: {
    path: path.resolve('dist'),
    filename: '[name].js'
  },
  devtool: 'inline-source-map',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development'
    })
  ],
  resolve: {
    extensions: [ '*', '.js' ],
    modules: [
      path.resolve(__dirname, 'node_modules')
    ],
    alias: {
      lib: path.resolve(__dirname, './lib')
    }
  },
  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader'
    }]
  }
}