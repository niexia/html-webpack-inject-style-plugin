# html-webpack-inject-style-plugin

Enhances [html-webpack-plugin](https://github.com/ampedandwired/html-webpack-plugin)
functionality by changing the default inject assets method to dynamically inject css style assets.

[webpack-rtl-plugin](https://github.com/romainberger/webpack-rtl-plugin) is plugin to use to create a second css bundle, processed to be rtl, rtl css bundle default filename is `xxx.rtl.css`. When html-webpack-plugin will generate an HTML5 file, they are all included with <link> tags in the HTML head by default.

Loading all styles may affect the page display, so it is expected that the corresponding styles can be loaded according to the language type, instead of being injected into index.html by default.

This plugin is used to help us complete this work. It uses cookies to determine the language type, and then decides which style to load.

Installation
------------
You must be running webpack on Node v4.0.0 or higher.

Install the plugin with npm:
```shell
$ npm install --save-dev html-webpack-inject-style-plugin
```


Usage
-----------
Require the plugin in your webpack config:

```javascript
var HtmlWebpackExcludeAssetsPlugin = require('html-webpack-inject-style-plugin');
```

Add the plugin to your webpack config as follows:

```javascript
plugins: [
  new HtmlWebpackPlugin(),
  new HtmlWebpackExcludeAssetsPlugin({
    rtlRegexp: /lang_type=ar/
  })
]  
```

The above configuration will inject a script in the head, When the page is parsed, execute to determine whether the current language is an RTL language, such as Arabic. If it is RTL language, load `xxx.rtl.css` style otherwise load `xxx.css` style.

Options
----------
|Name|Type|Default|required|Description|
|:--:|:--:|:-----:|:----:|:----------|
|**`rtlRegexp`**|`{RegExp}`|`/`| `true` |The regexp to use to process cookies to determine whether the current page is in RTL language.|