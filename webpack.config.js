const path = require('path')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

let minifiedOutput = process.env.WEBPACK_ENV === 'minified'

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: minifiedOutput ? 'gnosis-pm.min.js' : 'gnosis-pm.js',
        library: 'Gnosis'
    },
    plugins: [
        new LodashModuleReplacementPlugin()
    ],
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\/build\/contracts\/\w+\.json$/,
                use: ['json-x-loader?exclude=unlinked_binary+networks.*.events+networks.*.links']
            },
            {
                test: /\/gas-stats.json$/,
                use: ['json-x-loader?exclude=*.*.data']
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader'
            }
        ]
    },
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(__dirname, 'examples')
    }
}
