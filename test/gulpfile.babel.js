import { join, relative, dirname, extname, resolve } from "path"
import { readFileSync } from "fs"
// -----------------------------------------------------------------------------
import gulp from "gulp"
import rimraf from "rimraf"
// -----------------------------------------------------------------------------
import browserify from "browserify"
import source from "vinyl-source-stream"
import stylModulesify from "../index.es6"
// -----------------------------------------------------------------------------
const params = {
    src: "src",
    lib: "lib",
    out: "www",
    tmp: ".tmp"
}

gulp.task("default", function (done) {
    rimraf.sync(params.tmp)
    rimraf.sync(join(params.out, "**/*"))
    return browserify({
            entries: ["src/index.js"],
            paths: [params.src, params.lib]
        })
        .plugin(stylModulesify, {
            output: "modules.css",
            paths: [resolve(params.src), resolve(params.lib)],
            bypath: (s, cb) => {
                cb()
            }
        })
        .bundle()
        .pipe(source("modules.js"))
        .on("error", console.error)
        .pipe(gulp.dest(params.out))
})
