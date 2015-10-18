# styl-modulesify

[stylus](https://learnboost.github.io/stylus/) injector for [browserify](http://browserify.org/).  
powered by [css modules](http://glenmaddern.com/articles/css-modules).

## Usage

### in browserify

```javascript
//es6// import stylModulesify from "styl-modulesify"
var stylModulesify = require("styl-modulesify")
browserify()
    .plugin(stylModulesify, {// <- options
        output: "www/modules.css", // <- This is required.
        paths: ["src"], // <- Please see this: https://learnboost.github.io/stylus/docs/js.html#setsetting-value
        csso: true, // default: false. if you set `true`, you get an compressed "modules.css".
        bypath: function(s, cb) { // <- This will called before the rendering. s == stylus() instance.
            cb(null) // <- nodejs idiom.
        }
    })
```

### in styl ( ex. my-button.styl )

```stylus
.common
    composes: rounded from "theme.styl"
    composes: large from "sizes.css"
    &:hover
    	border-color: orange
.default
    composes: common
.disabled
    composes: common
    color: gray
    border-color: gray
```

### in js ( browserified )

```javascript
//es6// import myButtonTheme from "my-button.styl"
var myButtonTheme = require("my-button.styl")
...
'<button class="' + myButtonTheme.default + '" />'
'<button class="' + myButtonTheme.default + '" disabled />'
```

## Options

### options.output

Output path of css-modules.  
This is **REQUIRED**

> type: string  
> required: true

### options.csso

If you set `true`, You will get an compressed `options.output`.  
If you not need an restructured-css, set an object `{ restructure: false }`.

> type: boolean or object  
> required: false  
> default: false
