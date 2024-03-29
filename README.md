# html-webpack-inject-style-plugin

Enhances [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin)
functionality by changing the default inject assets method to dynamically inject css style assets.

[webpack-rtl-plugin](https://github.com/romainberger/webpack-rtl-plugin) is plugin to use to create a second css bundle, processed to be rtl, rtl css bundle default filename is `xxx.rtl.css`. When html-webpack-plugin will generate an HTML5 file, they are all included with <link> tags in the HTML head by default.

It is expected that the corresponding styles can be loaded according to the language type, instead of all styles being injected into index.html by default.This plugin is used to help us complete this work. It uses cookies to determine the language type, and then decides which style to load.

Installation
------------
You must be running webpack on Node v3.0.0 or higher.

Install the plugin with npm:
```shell
$ npm install --save-dev html-webpack-inject-style-plugin
```


Usage
-----------
Require the plugin in your webpack config, and add the plugin to your webpack config as follows:

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackRTLPlugin = require('webpack-rtl-plugin');
const HtmlWebpackInjectStylePlugin = require('html-webpack-inject-style-plugin');

module.exports ={
  entry: './entry.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
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
    new HtmlWebpackPlugin(),
    new HtmlWebpackInjectStylePlugin({
      // isRtl: /lang_type=ar/ // is a RegExp
      isRtl: function (window, href) {  // is a Function
        return true
      },
      modifyTag: function (link) {
        link.setAttribute('crossorigin', 'anonymous');
        return link;
      }
    })
  ]
}
```

The above configuration will inject a script in the head, When the page is parsed, execute to determine whether the current language is an RTL language, such as Arabic. If it is RTL language, inject `xxx.rtl.css` style otherwise inject `xxx.css` style. You can also modify the attributes of the link by the function `modifyTag`.

```html
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <link href="style.css" rel="stylesheet">
    <link href="style.rtl.css" rel="stylesheet">
  </head>
  <body>
    <script type="text/javascript" src="main.js"></script>
  </body>
</html>
```

The above is the `index.html` file generated by default, it will be processed into the following

```html
<html>
  <head>
    <meta charset="UTF-8">
    <title>Webpack App</title>
    <script type="text/javascript">
      (function () {
        // if `isRTL` is a RegExp
        // var isRTL = new Function("return /lang_type=ar/.test(document.cookie)");
        // if `isRTL` is a Function
        var isRTL = new Function("href","return (function isRtl (window, href) {\n      return !/test/.test(href) && /lang=(ar|he)/.test(window.location.href);\n    })(window, href)");
        var modifyTag = new Function("link","return (function (link) {\n            link.setAttribute('crossorigin', 'anonymous');\n            return link;\n          })(link)");
        var head = document.querySelector('head');
        ["style"].forEach(function (href) {
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
    </script>
  </head>
  <body>
    <script type="text/javascript" src="main.js"></script>
  </body>
</html>
```

Options
----------
|Name|Type|Default|required|Description|
|:--:|:--:|:-----:|:----:|:----------|
|**`isRtl`**|`{RegExp\|Function}`|`/`| `true` |The regexp to use to process cookies to determine whether the current page is in RTL language, and you can also set it as a function, accepts two parameters window and href (css path),if the execution result of the function is `true`, it is a RTL language.|
|**`modifyTag`**|`Function`|`/`|`false`|Used to modify the style link attribute, accepts one parameter `link`, you can add other properties to it, e.g. `crossorigin`|
