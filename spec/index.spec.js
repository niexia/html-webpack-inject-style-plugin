/* eslint-env jasmine */
var path = require('path');
var fs = require('fs');
var cheerio = require('cheerio');
var webpack = require('webpack');
var rm_rf = require('rimraf');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var WebpackRTLPlugin = require('webpack-rtl-plugin');
var HtmlWebpackInjectStylePlugin = require('../');

var OUTPUT_DIR = path.join(__dirname, '../dist');

describe('HtmlWebpackInjectStylePlugin', function () {
  beforeEach(function (done) {
    rm_rf(OUTPUT_DIR, done);
  });

  it('should inject style.css and style.rtl.css by default', function (done) {
    webpack({
      entry: path.join(__dirname, 'fixtures', 'entry.js'),
      output: {
        path: OUTPUT_DIR
      },
      module: {
        rules: [
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
          filename: 'style.css'
        }),
        new WebpackRTLPlugin(),
        new HtmlWebpackPlugin()
      ]
    }, function (err) {
      expect(err).toBeFalsy();
      var htmlFile = path.resolve(OUTPUT_DIR, 'index.html');
      fs.readFile(htmlFile, 'utf8', function (er, data) {
        expect(er).toBeFalsy();
        var $ = cheerio.load(data);
        expect($('link[href="style.css"]').toString()).toBe('<link href="style.css" rel="stylesheet">');
        expect($('link[href="style.rtl.css"]').toString()).toBe('<link href="style.rtl.css" rel="stylesheet">');
        expect($('script[src="main.js"]').toString()).toBe('<script type="text/javascript" src="main.js"></script>');
        done();
      });
    });
  });

  it('should get compilation error when the option `rtlRegexp` is not set', function (done) {
    webpack({
      entry: path.join(__dirname, 'fixtures', 'entry.js'),
      output: {
        path: OUTPUT_DIR
      },
      module: {
        rules: [{
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }]
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: 'style.css'
        }),
        new WebpackRTLPlugin(),
        new HtmlWebpackPlugin(),
        new HtmlWebpackInjectStylePlugin()
      ]
    }, function (err, stats) {
      expect(err).toBeFalsy();
      expect(stats.hasErrors()).toBe(true);
      done();
    });
  });

  it('should get compilation error when the option `rtlRegexp` is not a regular expression', function (done) {
    webpack({
      entry: path.join(__dirname, 'fixtures', 'entry.js'),
      output: {
        path: OUTPUT_DIR
      },
      module: {
        rules: [{
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }]
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: 'style.css'
        }),
        new WebpackRTLPlugin(),
        new HtmlWebpackPlugin(),
        new HtmlWebpackInjectStylePlugin({
          rtlRegexp: 'ar'
        })
      ]
    }, function (err, stats) {
      expect(err).toBeFalsy();
      expect(stats.hasErrors()).toBe(true);
      expect(stats.compilation.errors.toString()).toContain('The rtlRegexp must be a Regexp');
      done();
    });
  });

  it('should not inject any style link but a script to create links', function (done) {
    webpack({
      entry: path.join(__dirname, 'fixtures', 'entry.js'),
      output: {
        path: OUTPUT_DIR
      },
      module: {
        rules: [{
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }]
      },
      plugins: [
        new MiniCssExtractPlugin({
          filename: 'style.css'
        }),
        new WebpackRTLPlugin(),
        new HtmlWebpackPlugin(),
        new HtmlWebpackInjectStylePlugin({
          rtlRegexp: /lang_type=ar/
        })
      ]
    }, function (err) {
      expect(err).toBeFalsy();
      var htmlFile = path.resolve(OUTPUT_DIR, 'index.html');
      fs.readFile(htmlFile, 'utf8', function (er, data) {
        expect(er).toBeFalsy();
        var $ = cheerio.load(data);
        expect($('link[href="style.css"]').toString()).toBe('');
        expect($('link[href="style.rtl.css"]').toString()).toBe('');
        expect($('script[src="main.js"]').toString()).toBe('<script type="text/javascript" src="main.js"></script>');
        expect($('script:not([src])').html()).toContain('var isRTL = /lang_type=ar/.test(document.cookie);');
        done();
      });
      done();
    });
  });
});