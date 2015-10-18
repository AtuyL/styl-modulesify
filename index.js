'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _path = require('path');

var _stream = require('stream');

var _fs = require('fs');

var _through = require('through');

var _through2 = _interopRequireDefault(_through);

var _stylus = require('stylus');

var _stylus2 = _interopRequireDefault(_stylus);

var _nib = require('nib');

var _nib2 = _interopRequireDefault(_nib);

var _cssModulesLoaderCore = require('css-modules-loader-core');

var _cssModulesLoaderCore2 = _interopRequireDefault(_cssModulesLoaderCore);

var _stringHash = require('string-hash');

var _stringHash2 = _interopRequireDefault(_stringHash);

var _csso = require('csso');

var _csso2 = _interopRequireDefault(_csso);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var StylModulesify = (function (_Transform) {
    _inherits(StylModulesify, _Transform);

    function StylModulesify(filename, options, dictionary) {
        _classCallCheck(this, StylModulesify);

        _get(Object.getPrototypeOf(StylModulesify.prototype), 'constructor', this).call(this);
        this._filename = filename;
        this._data = '';
        this.trace = 0;
        this._options = options;
        this._dictionary = dictionary;

        var localByDefault = _cssModulesLoaderCore2['default'].localByDefault;
        var extractImports = _cssModulesLoaderCore2['default'].extractImports;
        var scope = _cssModulesLoaderCore2['default'].scope;

        scope = scope({
            generateScopedName: this._generateShortName
        });
        localByDefault = localByDefault({});
        extractImports = extractImports({});
        this._core = new _cssModulesLoaderCore2['default']([localByDefault, extractImports, scope]);
    }

    // fork from css-modulesify

    _createClass(StylModulesify, [{
        key: '_generateShortName',
        value: function _generateShortName(name, filename, css) {
            var hash = (0, _stringHash2['default'])(css).toString(36).substr(0, 5);
            var i = css.indexOf('.' + name);
            var numLines = css.substr(0, i).split(/[\r\n]/).length;
            return '_' + name + '_' + hash + '_' + numLines;
        }
    }, {
        key: 'pathFetcher',
        value: function pathFetcher(file, relativeTo, depTrace) {
            var _this = this;

            file = file.replace(/^["']|["']$/g, "");
            var dir = (0, _path.dirname)(relativeTo);
            var sourcePath = _glob2['default'].sync((0, _path.join)(dir, file))[0];
            if (!sourcePath) {
                this._options.paths.some(function (dir) {
                    return sourcePath = _glob2['default'].sync((0, _path.join)(dir, file))[0];
                });
            }
            if (!sourcePath) {
                return new Promise(function (resolve, reject) {
                    var errorMsg = "Not Found : " + file + " from " + dir;
                    if (_this._options.paths.length) {
                        errorMsg += " and " + _this._options.paths.join(" ");
                    }
                    reject(errorMsg);
                });
            }
            var trace = this.trace++;
            var pathFetcher = this.pathFetcher.bind(this);
            return new Promise(function (resolve, reject) {
                var cached = _this._dictionary[sourcePath];
                if (cached) return resolve(cached.exportTokens);
                (0, _fs.readFile)(sourcePath, "utf-8", function (error, sourceString) {
                    if (error) return reject(error);
                    _this._normalize(sourceString, sourcePath, function (error, sourceString) {
                        _this._core.load(sourceString, sourcePath, trace, pathFetcher).then(function (result) {
                            _this._dictionary[sourcePath] = result;
                            resolve(result.exportTokens);
                        })['catch'](reject);
                    });
                });
            });
        }
    }, {
        key: '_normalize',
        value: function _normalize(str, file, callback) {
            var _this2 = this;

            var ext = (0, _path.extname)(file).substr(1);
            if (ext === "css") return callback(null, str);
            var s = (0, _stylus2['default'])(str).set("filename", file).set("paths", this._options.paths.concat(_nib2['default'].path))['import']("nib");
            if (typeof this._options.bypath === "function") {
                this._options.bypath(s, function (error) {
                    if (error) return _this2.emit("error", error);
                    s.render(callback);
                });
            } else {
                s.render(callback);
            }
        }
    }, {
        key: '_transform',
        value: function _transform(buf, enc, callback) {
            this._data += buf;
            callback();
        }
    }, {
        key: '_flush',
        value: function _flush(callback) {
            var _this3 = this;

            // console.log("--------", this._filename)
            this._normalize(this._data, this._filename, function (error, sourceString) {
                if (error) return _this3.emit("error", error);
                var sourcePath = _this3._filename;
                var trace = _this3.trace++;
                var pathFetcher = _this3.pathFetcher.bind(_this3);
                _this3._core.load(sourceString, sourcePath, trace, pathFetcher).then(function (result) {
                    var injectableSource = result.injectableSource;
                    var exportTokens = result.exportTokens;

                    _this3.injectableSource = injectableSource;
                    _this3.exportTokens = exportTokens;
                    // console.log("------------------------", this._filename)
                    // console.log("| injectableSource :", this.injectableSource.replace("\n"," "))
                    // console.log("| exportTokens     :", this.exportTokens)
                    // console.log("------------------------", this._filename)
                    _this3.push('module.exports = ' + JSON.stringify(exportTokens));
                    callback();
                })['catch'](function (error) {
                    _this3.emit("error", error);
                });
            });
        }
    }]);

    return StylModulesify;
})(_stream.Transform);

exports['default'] = function (browserify) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var transforms = {};
    options = Object.assign({
        paths: [],
        bypath: null
    }, options);
    var dictionary = {};
    return browserify.transform(function (filename) {
        switch ((0, _path.extname)(filename)) {
            case ".styl":
            case ".css":
                return transforms[filename] = new StylModulesify(filename, options, dictionary);
            default:
                return (0, _stream.PassThrough)();
        }
    }).on('bundle', function (bundle) {
        bundle.on('end', function () {
            var css = "";
            css += Object.keys(dictionary).map(function (filename) {
                return dictionary[filename].injectableSource;
            }).join("\n");
            css += "\n\n";
            css += Object.keys(transforms).map(function (filename) {
                return transforms[filename].injectableSource;
            }).join("\n");
            (0, _fs.writeFile)(options.output, options.csso ? _csso2['default'].minify(css, options.csso) : css, function (error) {
                return error ? browserify.emit('error', error) : null;
            });
            transforms = {};
            dictionary = {};
        });
    });
};

module.exports = exports['default'];
