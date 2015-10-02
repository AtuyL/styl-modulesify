# styl-modulesify
stylus injector for css modules

# This wrote by ES6. not supported pure js (maybe yet).

# Usage

in gulp-browserify

```javascript
import stylModulesify from "styl-modulesify"
browserify()
    .plugin(stylModulesify, {
        output: "www/modules.css" // <- it required
    })
```

in react jsx

```jsx
import { normal, active, focus, disabled } from "my-button.styl"
...
<button className={normal} />
```
