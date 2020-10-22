'use strict';

function HtmlWebpackInjectStylePlugin (options) {
  var userOptions = options || {};
  this.isRtl = userOptions.isRtl;
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
  if ('hooks' in compilation) {
    if (!compilation.hooks.htmlWebpackPluginAlterAssetTags) {
      throw new Error('The expected HtmlWebpackPlugin hook was not found! Ensure HtmlWebpackPlugin is installed and' +
        ' was initialized before this plugin.');
    }
    compilation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(this.PluginName, self.processPluginData.bind(self));
  } else {
    compilation.plugin('html-webpack-plugin-alter-asset-tags', self.processPluginData.bind(self));
  }
};

HtmlWebpackInjectStylePlugin.prototype.processPluginData = function (htmlPluginData, callback) {
  var self = this;

  // validate the `isRtl`
  // throw a error if the `isRtl` is invalid
  if (!self.isRtl) {
    throw new Error('The isRtl option is required.');
  }
  if (self.isRtl.constructor !== RegExp) {
    throw new Error('The isRtl must be a Regexp.');
  }

  var result = self.injectScript(htmlPluginData);
  if (callback) {
    callback(null, result);
  } else {
    return Promise.resolve(result);
  }
};

HtmlWebpackInjectStylePlugin.prototype.injectScript = function (pluginData) {
  var { head, styleAssets } = this.filterStyleAssets(pluginData);
  var styleAssetsHref = JSON.stringify(styleAssets.map(tag => tag.attributes.href.match(/(.*)\.css$/)[1]));
  var scriptNode = {
    tagName: 'script',
    closeTag: true,
    attributes: {
      type: 'text/javascript'
    },
    innerHTML: `
      (function (){
        var isRTL = ${this.isRtl}.test(document.cookie);
        var head = document.querySelector('head');
        ${styleAssetsHref}.forEach(function (href) {
          var fullhref = isRTL ? href + '.rtl.css' : href + '.css';
          var linkTag = document.createElement("link");
          linkTag.rel = "stylesheet";
          linkTag.type = "text/css";
          linkTag.href = fullhref;
          head.appendChild(linkTag);
        })
      })();
    `
  };

  return {
    head: [scriptNode, ...head],
    body: pluginData.body,
    plugin: pluginData.plugin,
    chunks: pluginData.chunks,
    outputName: pluginData.outputName
  };
};

HtmlWebpackInjectStylePlugin.prototype.filterStyleAssets = function (pluginData) {
  var head = [];
  var styleAssets = [];
  pluginData.head.forEach(tag => {
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

module.exports = HtmlWebpackInjectStylePlugin;
