const fs = require('fs')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    app: './app/javascripts/app.js',
    gnosis: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].[chunkhash].js',
    library: '[name]'
  },
  plugins: [new HtmlWebpackPlugin({
    template: 'app/index.ejs'
  })],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      { test: /\.json$/, use: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: JSON.parse(fs.readFileSync(path.resolve(__dirname, '.babelrc')))
      }
    ]
  },
  devtool: 'source-map'
}
