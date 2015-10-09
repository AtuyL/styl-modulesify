import { extname, dirname, resolve, relative } from 'path'
import { Transform, PassThrough } from 'stream'
import { writeFile } from 'fs'
import through from 'through'
import stylus from 'stylus'
import nib from 'nib'
import Core from 'css-modules-loader-core'
import strHash from 'string-hash'

class StylModulesify extends Transform {
    constructor(filename, options){
        super()
        this._filename = filename
        this._data = ''
        this._options = Object.assign({
            paths: []
        }, options)
    }
    // fork from css-modulesify
    _generateShortName(name, filename, css){
        var hash = strHash(css).toString(36).substr(0, 5)
        var i = css.indexOf('.' + name)
        var numLines = css.substr(0, i).split(/[\r\n]/).length
        return '_' + name + '_' + hash + '_' + numLines
    }
    _renderer(callback, error, css) {
        if (error) return this.emit("error", error)
        var sourceString = css
        var sourcePath = this._filename
        var trace = ""
        var pathFetcher = function(){}
        var { localByDefault, extractImports, scope } = Core
        scope = scope({
            generateScopedName:this._generateShortName
        })
        localByDefault = localByDefault({})
        extractImports = extractImports({})
        new Core([ localByDefault, extractImports, scope ])
            .load(sourceString, sourcePath, trace, pathFetcher)
                .then( result => {
                    var { injectableSource, exportTokens } = result
                    this.injectableSource = injectableSource
                    this.exportTokens = exportTokens
                    this.push('module.exports = ' + JSON.stringify(exportTokens))
                    callback()
                })
                .catch( error => {
                    this.emit("error", error)
                })
    }
    _transform(buf, enc, callback) {
        this._data += buf
        callback()
    }
    _flush(callback) {
        var s = stylus(this._data)
            .set("filename", this._filename)
            .set("paths", this._options.paths.concat(nib.path))
            .import("nib")
        if ( typeof this._options.bypath === "function" ) {
            this._options.bypath(s, error => {
                if (error) return this.emit("error", error)
                s.render(this._renderer.bind(this, callback))
            })
        } else {
            s.render(this._renderer.bind(this, callback))
        }
    }
}

export default function (browserify, options) {
    var transforms = {}
    return browserify
        .transform((filename) => {
            if (extname(filename) !== '.styl') return PassThrough()
            return transforms[filename] = new StylModulesify(filename, options)
        })
        .on('bundle', (bundle) => {
            bundle.on('end', () => {
                writeFile(
                    options.output,
                    Object.keys(transforms).map( filename => transforms[filename].injectableSource ).join("\n"),
                    error => error ? browserify.emit('error', error) : null
                )
                transforms = {}
            })
        })
}