const path = require('path')
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

let minifiedOutput = process.env.WEBPACK_ENV === 'minified'

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: minifiedOutput ? 'gnosis.min.js' : 'gnosis.js',
        library: 'Gnosis'
    },
    plugins: [
        new LodashModuleReplacementPlugin()
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\.json$/,
                use: ['json-loader', './truffle-artifact-loader?exclude=unlinked_binary']
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
