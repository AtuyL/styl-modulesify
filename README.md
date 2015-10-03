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
        output: "www/modules.css" // <- it required
    })
```

in styl ( ex. my-button.styl )

```sass
.default
    display: block
    font-size: 14pt
    background-color: white
.normal
    composes: default
    color: black
.active
    composes: default
    color: red
.focus
    composes: default
    color: pink
.disabled
    composes: default
    color: gray
```

in react jsx

```jsx
import { normal, active, focus, disabled } from "my-button.styl"
...
<button className={normal} />
```
