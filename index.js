'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

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

var StylModulesify = (function (_Transform) {
    _inherits(StylModulesify, _Transform);

    function StylModulesify(filename, options) {
        _classCallCheck(this, StylModulesify);

        _get(Object.getPrototypeOf(StylModulesify.prototype), 'constructor', this).call(this);
        this._filename = filename;
        this._data = '';
        this._options = Object.assign({
            paths: []
        }, options);
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
        key: '_renderer',
        value: function _renderer(callback, error, css) {
            var _this = this;

            if (error) return this.emit("error", error);
            var sourceString = css;
            var sourcePath = this._filename;
            var trace = "";
            var pathFetcher = function pathFetcher() {};
            var localByDefault = _cssModulesLoaderCore2['default'].localByDefault;
            var extractImports = _cssModulesLoaderCore2['default'].extractImports;
            var scope = _cssModulesLoaderCore2['default'].scope;

            scope = scope({
                generateScopedName: this._generateShortName
            });
            localByDefault = localByDefault({});
            extractImports = extractImports({});
            new _cssModulesLoaderCore2['default']([localByDefault, extractImports, scope]).load(sourceString, sourcePath, trace, pathFetcher).then(function (result) {
                var injectableSource = result.injectableSource;
                var exportTokens = result.exportTokens;

                _this.injectableSource = injectableSource;
                _this.exportTokens = exportTokens;
                _this.push('module.exports = ' + JSON.stringify(exportTokens));
                callback();
            })['catch'](function (error) {
                _this.emit("error", error);
            });
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
            var _this2 = this;

            var s = (0, _stylus2['default'])(this._data).set("filename", this._filename).set("paths", this._options.paths.concat(_nib2['default'].path))['import']("nib");
            if (typeof this._options.bypath === "function") {
                this._options.bypath(s, function (error) {
                    if (error) return _this2.emit("error", error);
                    s.render(_this2._renderer.bind(_this2, callback));
                });
            } else {
                s.render(this._renderer.bind(this, callback));
            }
        }
    }]);

    return StylModulesify;
})(_stream.Transform);

exports['default'] = function (browserify, options) {
    var transforms = {};
    return browserify.transform(function (filename) {
        if ((0, _path.extname)(filename) !== '.styl') return (0, _stream.PassThrough)();
        return transforms[filename] = new StylModulesify(filename, options);
    }).on('bundle', function (bundle) {
        bundle.on('end', function () {
            (0, _fs.writeFile)(options.output, Object.keys(transforms).map(function (filename) {
                return transforms[filename].injectableSource;
            }).join("\n"), function (error) {
                return error ? browserify.emit('error', error) : null;
            });
            transforms = {};
        });
    });
};

module.exports = exports['default'];
