const path = require('path');
const { ZeyonWebpack } = require('zeyon');

module.exports = ZeyonWebpack({
  mode: 'development',
  entry: './src/main.ts',
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
        test: /\.hbs$/,
        use: 'raw-loader', // or handlebar-specific loader?
      },
    ],
  },
  target: ['web', 'es2020'],
});
