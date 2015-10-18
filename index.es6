import { join, extname, dirname, resolve, relative } from 'path'
import { Transform, PassThrough } from 'stream'
import { writeFile, readFile } from 'fs'
import through from 'through'
import stylus from 'stylus'
import nib from 'nib'
import Core from 'css-modules-loader-core'
import strHash from 'string-hash'
import csso from 'csso'
import glob from 'glob'

class StylModulesify extends Transform {
    constructor(filename, options, dictionary){
        super()
        this._filename = filename
        this._data = ''
        this.trace = 0
        this._options = options
        this._dictionary = dictionary

        let { localByDefault, extractImports, scope } = Core
        scope = scope({
            generateScopedName: this._generateShortName
        })
        localByDefault = localByDefault({})
        extractImports = extractImports({})
        this._core = new Core([ localByDefault, extractImports, scope ])
    }
    // fork from css-modulesify
    _generateShortName(name, filename, css){
        var hash = strHash(css).toString(36).substr(0, 5)
        var i = css.indexOf('.' + name)
        var numLines = css.substr(0, i).split(/[\r\n]/).length
        return '_' + name + '_' + hash + '_' + numLines
    }
    pathFetcher(file, relativeTo, depTrace) {
        file = file.replace(/^["']|["']$/g, "")
        let dir = dirname(relativeTo)
        let sourcePath = glob.sync(join(dir, file))[0]
        if (!sourcePath) {
            this._options.paths.some(dir => {
                return sourcePath = glob.sync(join(dir, file))[0]
            })
        }
        if (!sourcePath) {
            return new Promise((resolve, reject) => {
                let errorMsg = "Not Found : " + file + " from " + dir
                if (this._options.paths.length) {
                    errorMsg += " and " + this._options.paths.join(" ")
                }
                reject(errorMsg)
            })
        }
        let trace = this.trace++
        let pathFetcher = this.pathFetcher.bind(this)
        return new Promise((resolve, reject) => {
            let cached = this._dictionary[sourcePath]
            if (cached) return resolve(cached.exportTokens)
            readFile(sourcePath, "utf-8", (error, sourceString) => {
                if (error) return reject(error)
                this._normalize(sourceString, sourcePath, (error, sourceString)=>{
                    this._core.load(sourceString, sourcePath, trace, pathFetcher)
                        .then( result => {
                            this._dictionary[sourcePath] = result
                            resolve(result.exportTokens)
                        })
                        .catch(reject)
                })
            })
        })
    }
    _normalize(str, file, callback){
        let ext = extname(file).substr(1)
        if (ext === "css") return callback(null, str)
        var s = stylus(str)
            .set("filename", file)
            .set("paths", this._options.paths.concat(nib.path))
            .import("nib")
        if ( typeof this._options.bypath === "function" ) {
            this._options.bypath(s, error => {
                if (error) return this.emit("error", error)
                s.render(callback)
            })
        } else {
            s.render(callback)
        }
    }
    _transform(buf, enc, callback) {
        this._data += buf
        callback()
    }
    _flush(callback) {
        // console.log("--------", this._filename)
        this._normalize(this._data, this._filename, (error, sourceString) => {
            if (error) return this.emit("error", error)
            let sourcePath = this._filename
            let trace = this.trace++
            let pathFetcher = this.pathFetcher.bind(this)
            this._core.load(sourceString, sourcePath, trace, pathFetcher)
                .then( result => {
                    let { injectableSource, exportTokens } = result
                    this.injectableSource = injectableSource
                    this.exportTokens = exportTokens
                    // console.log("------------------------", this._filename)
                    // console.log("| injectableSource :", this.injectableSource.replace("\n"," "))
                    // console.log("| exportTokens     :", this.exportTokens)
                    // console.log("------------------------", this._filename)
                    this.push('module.exports = ' + JSON.stringify(exportTokens))
                    callback()
                })
                .catch( error => {
                    this.emit("error", error)
                })
        })
    }
}

export default function (browserify, options = {}) {
    var transforms = {}
    options = Object.assign(
        {
            paths: [],
            bypath: null
        },
        options
    )
    var dictionary = {}
    return browserify
        .transform((filename) => {
            switch (extname(filename)) {
                case ".styl":
                case ".css":
                    return transforms[filename] = new StylModulesify(filename, options, dictionary)
                default: return PassThrough()
            }
        })
        .on('bundle', (bundle) => {
            bundle.on('end', () => {
                let css = ""
                css += Object.keys(dictionary)
                    .map( filename => dictionary[filename].injectableSource )
                    .join("\n")
                css += "\n\n"
                css += Object.keys(transforms)
                    .map( filename => transforms[filename].injectableSource )
                    .join("\n")
                writeFile(
                    options.output,
                    options.csso ? csso.minify(css, options.csso) : css,
                    error => error ? browserify.emit('error', error) : null
                )
                transforms = {}
                dictionary = {}
            })
        })
}
