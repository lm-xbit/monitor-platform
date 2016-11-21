var inspect = require("util").inspect;
var config = require('./webpack.base.config.js');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var specificConfig = require('./specificConfig');

console.log("Base dir is - " + __dirname);


config.entry = {
    index: [__dirname + '/../front-end/index.js', 'webpack-hot-middleware/client?reload=true'],
    login: [__dirname + '/../front-end/login.js', 'webpack-hot-middleware/client?reload=true'],
    signup: [__dirname + '/../front-end/signup.js', 'webpack-hot-middleware/client?reload=true']
};

// https://github.com/webpack/webpack/issues/2393
// For in conjunction with webpack-dev-server --hot --inline:
config.output = {
    path: __dirname + '/../public/',
    publicPath: '/',
    filename: '[name].js'
};

config.devtool = 'eval-source-map';
config.debug = true;

config.devServer = {
    contentBase: '../front-end',
    stats: 'minimal'
};

config.module.loaders = config.module.loaders.concat(
    {
        test: /\.png|gif/, loader: 'url-loader?limit=8192'
    },
    {
        test: /\.jpg/, loader: 'url-loader?limit=8192'
    },
    {
        // test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader'
        test: /\.scss$/, loader: 'style!css?modules!sass'
    },
    {
        test: /\.less$/, loader: 'style-loader!css-loader!less-loader' // use ! to chain loaders
    },
    {
        test: /\.css$/, loader: 'style-loader!css-loader'
    },
    {
        // inline base64 URLs for <=8k images, direct URLs for the rest
        test: /\.(png|woff|woff2|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/, loader: 'url-loader?limit=8192'
    }
);

config.module.preLoaders = [
  {
    test: /\.jsx?$/,
    loader: 'eslint-loader',
    exclude: [/node_modules/ , /src\/libs/],
  }
];

config.eslint = {
  fix: false,
};

config.plugins = config.plugins.concat(
    new webpack.HotModuleReplacementPlugin()
    /*
    new HtmlWebpackPlugin({
        title: 'Xbit',
        template: 'front-end/indexTemplate.html',
        filename: 'front-end/resources/index.html',
        inject: true,
    })
    */
);

config.resolve = {
    root: [
        path.resolve(__dirname + '/../front-end')
    ],
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.Gjson']
};


console.log("Created config object:\n" + inspect(config, {depth: 4}));

module.exports = config;
