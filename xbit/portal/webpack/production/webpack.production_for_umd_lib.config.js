var webpack = require('webpack');
var config = require('./../webpack.base.config.js');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
const specificConfig = require('./../specificConfig');

config.output = Object.assign({}, config.output, {
  library: '[name]',
  libraryTarget: 'umd'
});

// better to open source map
if (specificConfig.useSourceMapInProd) {
  config.devtool = 'source-map';
}

config.plugins = config.plugins.concat([
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify('production')
    }
  }),
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }),

  new ExtractTextPlugin('assets/styles/[name].css?[hash]-[chunkhash]-[contenthash]-[name]', {
    allChunks: true
  })
]);

config.module.loaders = config.module.loaders.concat(
    {
      // inline base64 URLs for <=8k images, direct URLs for the rest
      test: /\.(png|woff|woff2|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/, loader: 'url-loader?limit=8192'
    },
    {
      test: /\.png|gif/, loader: 'url-loader?limit=1000&name=assets/images/[sha512:hash:base64:7].[ext]'
    },
    {
      test: /\.jpg/, loader: 'file-loader?name=assets/images/[sha512:hash:base64:7].[ext]'
    },
    {
      test: /\.s?css$/,
      loader: ExtractTextPlugin.extract('style-loader', specificConfig.useCssModules
          ? 'css-loader?modules&importLoaders=1&localIdentName=__[local]__[hash:base64:5]!postcss-loader'
          : 'css-loader?sourceMap!postcss-loader!sass-loader', {publicPath: '../../'})
    }
);

delete config.output.publicPath;

module.exports = config;