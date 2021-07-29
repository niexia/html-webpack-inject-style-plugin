'use strict';
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isFunction = fun => typeof fun === 'function';

function HtmlWebpackInjectStylePlugin (options) {
  var userOptions = options || {};
  this.isRtl = userOptions.isRtl;
  this.modifyTag = userOptions.modifyTag;
  this.PluginName = 'HtmlWebpackInjectStylePlugin';
}

HtmlWebpackInjectStylePlugin.prototype.apply = function (compiler) {
  if ('hooks' in compiler) {
    // setup hooks for webpack 4
    compiler.hooks.compilation.tap(this.PluginName, this.applyCompilation.bind(this));
  } else {
    // legacy approach
    compiler.plugin('compilation', this.applyCompilation.bind(this));
  }
};

HtmlWebpackInjectStylePlugin.prototype.applyCompilation = function applyCompilation (compilation) {
  var self = this;

  // process
  if (HtmlWebpackPlugin.getHooks) {
    // HtmlWebpackPlugin version 4.0.0-beta.5
    HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(this.PluginName, self.processPluginGroup.bind(self));
  } else if ('hooks' in compilation) {
    // HtmlWebpackPlugin version ^3.2.0
    if (!compilation.hooks.htmlWebpackPluginAlterAssetTags) {
      throw new Error('The expected HtmlWebpackPlugin hook was not found! Ensure HtmlWebpackPlugin is installed and' +
        ' was initialized before this plugin.');
    }
    compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(this.PluginName, self.processPluginData.bind(self));
  } else {
    // HtmlWebpackPlugin version 3.2.0
    compilation.plugin('html-webpack-plugin-alter-asset-tags', self.processPluginData.bind(self));
  }
};

HtmlWebpackInjectStylePlugin.prototype.processPluginGroup = function (htmlPluginData, callback) {
  this.validateOptions();
  var { head, styleAssets } = this.filterStyleAssets(htmlPluginData, 'headTags');
  var scriptNode = this.generateScriptNode(styleAssets, this.isRtl, this.modifyTag);
  var result = {
    ...htmlPluginData,
    headTags: [scriptNode, ...head]
  };
  if (callback) {
    callback(null, result);
  } else {
    return Promise.resolve(result);
  }
};

HtmlWebpackInjectStylePlugin.prototype.processPluginData = function (htmlPluginData, callback) {
  this.validateOptions();
  var { head, styleAssets } = this.filterStyleAssets(htmlPluginData);
  var scriptNode = this.generateScriptNode(styleAssets, this.isRtl, this.modifyTag);
  var result = {
    ...htmlPluginData,
    head: [scriptNode, ...head]
  };
  if (callback) {
    callback(null, result);
  } else {
    return Promise.resolve(result);
  }
};

HtmlWebpackInjectStylePlugin.prototype.validateOptions = function () {
  // validate the Options
  // throw a error if the `isRtl` is invalid
  if (!this.isRtl) {
    throw new Error('The isRtl option is required.');
  }
  if (
    this.isRtl.constructor !== RegExp &&
    !isFunction(this.isRtl)
  ) {
    throw new Error('The isRtl must be a Regexp or Function.');
  }
  // throw a error if the `modifyTag` is invalid
  if (
    this.modifyTag &&
    !isFunction(this.modifyTag)
  ) {
    throw new Error('The modifyTag must be a Function.');
  }
};

HtmlWebpackInjectStylePlugin.prototype.filterStyleAssets = function (pluginData, headKey = 'head') {
  var head = [];
  var styleAssets = [];
  pluginData[headKey].forEach(tag => {
    var tagName = tag.tagName;
    var href = tag.attributes.href;
    if (tagName === 'link' && /\.css/.test(href)) {
      if (/(?<!\.rtl).css$/.test(href)) {
        styleAssets.push(tag);
      }
    } else {
      head.push(tag);
    }
  });
  return {
    head,
    styleAssets
  };
};

HtmlWebpackInjectStylePlugin.prototype.generateScriptNode = function (styleAssets, isRtl, modifyTag) {
  var styleAssetsHref = JSON.stringify(styleAssets.map(tag => tag.attributes.href.match(/(.*)\.css$/)[1]));
  var genRtlFun = isFunction(isRtl)
    ? `new Function("href","return (${isRtl.toString().split('\n').join('\\n')})(window, href)")`
    : `new Function("return ${isRtl}.test(document.cookie)")`;
  var modifyTagFun = isFunction(modifyTag)
    ? `new Function("link","return (${modifyTag.toString().split('\n').join('\\n')})(link)")`
    : undefined;
  return {
    tagName: 'script',
    closeTag: true,
    attributes: {
      type: 'text/javascript'
    },
    innerHTML: `
      (function (){
        var isRTL = ${genRtlFun};
        var modifyTag = ${modifyTagFun};
        var head = document.querySelector('head');
        ${styleAssetsHref}.forEach(function (href) {
          var fullhref = isRTL(href) ? href + '.rtl.css' : href + '.css';
          var linkTag = document.createElement("link");
          linkTag.rel = "stylesheet";
          linkTag.type = "text/css";
          linkTag.href = fullhref;
          if (modifyTag) {
            linkTag = modifyTag(linkTag);
          }
          head.appendChild(linkTag);
        })
      })();
    `
  };
};

module.exports = HtmlWebpackInjectStylePlugin;
