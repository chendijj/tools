const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    
    return {
        entry: {
            main: './static/js/main.js',
            style: './static/css/style.css'
        },
        output: {
            path: path.resolve(__dirname, 'static/dist'),
            filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
            clean: true
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader'
                    ]
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: isDevelopment ? '[name].css' : '[name].[contenthash].css'
            })
        ],
        devtool: isDevelopment ? 'source-map' : false,
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            }
        },
        resolve: {
            extensions: ['.js', '.css']
        }
    };
};