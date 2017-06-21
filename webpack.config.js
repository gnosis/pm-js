const path = require('path')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'gnosis.js',
        library: 'Gnosis'
    },
    plugins: [
        new LodashModuleReplacementPlugin
    ],
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
            }
        ]
    },
    devtool: 'source-map'
}
