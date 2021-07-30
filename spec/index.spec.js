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
        expect($('script[src="main.js"]').toString()).toMatch(/<script .*src="main.js"><\/script>/);
        done();
      });
    });
  });

  it('should get compilation error when the option `isRtl` is not set', function (done) {
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

  it('should get compilation error when the option `isRtl` is not a regular expression or function', function (done) {
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
          isRtl: 'ar'
        })
      ]
    }, function (err, stats) {
      expect(err).toBeFalsy();
      expect(stats.hasErrors()).toBe(true);
      expect(stats.compilation.errors.toString()).toContain('The isRtl must be a Regexp');
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
          isRtl: /lang_type=ar/
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
        expect($('script[src="main.js"]').toString()).toMatch(/<script .*src="main.js"><\/script>/);
        expect($('script:not([src])').html()).toContain('new Function("return /lang_type=ar/.test(document.cookie)")');
        done();
      });
      done();
    });
  });

  it('isRtl is a function and should not inject any style link but a script to create links', function (done) {
    function isRtl () {
      return true;
    }
    function modifyTag (link) {
      link.setAttribute('crossorigin', 'anonymous');
      return link;
    }
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
          isRtl: isRtl,
          modifyTag: modifyTag
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
        expect($('script[src="main.js"]').toString()).toMatch(/<script .*src="main.js"><\/script>/);
        expect($('script:not([src])').html()).toContain(isRtl.toString().split('\n').join('\\n'));
        done();
      });
      done();
    });
  });

  it('modifyTag sets the value but is not a function', function (done) {
    function isRtl () {
      return true;
    }
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
          isRtl: isRtl,
          modifyTag: 1
        })
      ]
    },
    function (err, stats) {
      expect(err).toBeFalsy();
      expect(stats.hasErrors()).toBe(true);
      expect(stats.compilation.errors.toString()).toContain('The modifyTag must be a Function');
      done();
    });
  });

  it('modifyTag is a function and should not inject any style link but a script to create links', function (done) {
    function isRtl (window, href) {
      return !/test/.test(href) && /lang=(ar|he)/.test(window.location.href);
    }
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
          isRtl: isRtl,
          modifyTag: function (link) {
            link.setAttribute('crossorigin', 'anonymous');
            return link;
          }
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
        expect($('script[src="main.js"]').toString()).toMatch(/<script .*src="main.js"><\/script>/);
        expect($('script:not([src])').html()).toContain(isRtl.toString().split('\n').join('\\n'));
        done();
      });
      done();
    });
  });
});
