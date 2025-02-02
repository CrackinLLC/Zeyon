const path = require('path');
const { ZeyonWebpack } = require('zeyon/build');
// const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = ZeyonWebpack({
  mode: 'development',
  entry: './src/main.ts',

  // plugins: [
  //   new CircularDependencyPlugin({
  //     failOnError: true,
  //     // onDetected: ...
  //   }),
  // ],

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  target: ['web', 'es2020'],
});
