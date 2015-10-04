# styl-modulesify
stylus injector for css modules

### This wrote by ES6.
### not supported pure js (maybe yet).

# Usage

in browserify

```javascript
import stylModulesify from "styl-modulesify"
browserify()
    .plugin(stylModulesify, {
        output: "www/modules.css", // <- This is required.
        paths: ["src"], // <- Please see this: https://learnboost.github.io/stylus/docs/js.html#setsetting-value
        bypath: (s, cb) => { // <- This will called before the rendering. s == stylus() instance.
            cb(null) // <- nodejs idiom.
        }
    })
```

in styl ( ex. my-button.styl )

```stylus
.default
    display: block
    font-size: 14pt
    background-color: white
    padding: 0.5em
    border: 1px solid black
    color: black
.normal
    composes: default
.active
    composes: default
    color: red
    border-color: red
.focus
    composes: default
    border-color: red
.disabled
    composes: default
    color: gray
    border-color: gray
```

in react jsx

```javascript
import { normal, active, focus, disabled } from "my-button.styl"
...
<button className={normal} />
```
