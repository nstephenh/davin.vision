const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// App directory
const appDirectory = fs.realpathSync(process.cwd());

// Gets absolute path of file within app directory
const resolveAppPath = relativePath => path.resolve(appDirectory, relativePath);

// Host
const host = process.env.HOST || 'localhost';

// Required for babel-preset-react-app
process.env.NODE_ENV = 'development';


const config = {
    entry: resolveAppPath('src'),
    output: {

        // Development filename output
        filename: 'static/js/bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                use: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.ts(x)?$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
        ]
    },
    devServer: {

        // Serve index.html as the base

        // Enable compression
        compress: true,

        // Enable hot reloading
        hot: true,

        host,

        port: 3000,

        // Public path is root of content base
        static: {
            directory: '/public/',
            publicPath: '/public/',
        }

    },
    resolve: {
        extensions: [
            '.tsx',
            '.ts',
            '.js'
        ],
    },
    plugins: [
        // Re-generate index.html with injected script tag.
        // The injected script tag contains a src value of the
        // filename output defined above.
        new HtmlWebpackPlugin({
            inject: true,
            template: resolveAppPath('public/index.html'),
        }),
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
};

module.exports = config;