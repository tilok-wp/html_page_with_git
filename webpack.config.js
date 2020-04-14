const taskProcess = process.env.npm_lifecycle_event
const path = require('path')
const autopreficter = require('autoprefixer')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FileClone = require('fs-extra')

const postCSSPlugins = [
    // Post css plugin 
    require('postcss-import'),
    require('postcss-mixins'),
    require('postcss-simple-vars'),
    require('postcss-nested'),
    require('postcss-hexrgba'),
    // Remove if not nessery postcss 
    require('autoprefixer')
  ]


class AfterCompile {
    apply(compiler) {
        compiler.hooks.done.tap('Assets copy', function() {
            FileClone.copySync('./app/assets/images','./dist/assets/images')
        })
    }
}


let cssconfiger = {
    test: /\.css$/i, 
    use: ['css-loader',{loader: 'postcss-loader', options: {plugins: postCSSPlugins}} ]
}

let sassconfiger = {
    test: /\.(scss|sass)$/i,
    use:['css-loader?url=false',{loader: 'postcss-loader', options: {plugins: postCSSPlugins}},'sass-loader']
}


let pages = FileClone.readdirSync('./app').filter(function(file){
    return file.endsWith('.html')
  }).map(function(page){
    return new HtmlWebpackPlugin ({
      minify: false,
      filename: page,
      template: `./app/${page}`
    })
  })
  

let config = {
    entry: './app/assets/scripts/app.js',
    plugins: pages,
    module: {
        rules: [
            cssconfiger,
            sassconfiger
        ]
    }
}

if (taskProcess == 'dev'){
    cssconfiger.use.unshift('style-loader')
    sassconfiger.use.unshift('style-loader')
    config.output = {
        filename: 'bundled.js',
        path: path.resolve(__dirname, 'app')
    },
    config.devServer = {
        before: function(app, server){
            server._watch('./app/**/*.html')
        },
        contentBase: path.join(__dirname, 'app'),
        hot: true,
        port: 3300,
        host: '127.0.0.1'
    },
    config.mode = 'development'

}

if (taskProcess == 'build') {
    
    config.module.rules.push({
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      })


    cssconfiger.use.unshift(MiniCssExtractPlugin.loader)
    sassconfiger.use.unshift(MiniCssExtractPlugin.loader)
    postCSSPlugins.push(require('cssnano'))
    config.output = {
        filename: '[name].[chunkhash].js',
        path: path.resolve(__dirname, 'dist')
    },
    config.mode = 'production',
    config.optimization = {
        splitChunks: {chunks: 'all'}
    }
    config.plugins.push(
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({filename: '[name].[chunkhash].css'}),
        new AfterCompile()
    )
}





module.exports = config