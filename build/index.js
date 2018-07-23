(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("chalk"), require("websocket-driver"), require("lodash"), require("webpack-sources"));
	else if(typeof define === 'function' && define.amd)
		define(["chalk", "websocket-driver", "lodash", "webpack-sources"], factory);
	else {
		var a = typeof exports === 'object' ? factory(require("chalk"), require("websocket-driver"), require("lodash"), require("webpack-sources")) : factory(root["chalk"], root["websocket-driver"], root["lodash"], root["webpack-sources"]);
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_6__, __WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_9__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = ".";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __webpack_require__(5);
let prefix = '[WCER]: ';
exports.log = (message) => console.log(prefix + message);
exports.info = (message) => console.info(chalk_1.default.green(prefix + message));
exports.warn = (message) => console.warn(chalk_1.default.yellow(prefix + message));
exports.error = (message) => console.error(chalk_1.default.red(prefix + message));
exports.debug = (message) => console.debug(chalk_1.default.white(prefix + message));


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const ReloadPlugin_1 = __webpack_require__(2);
module.exports = ReloadPlugin_1.default;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const socketServer_1 = __webpack_require__(3);
const logger_1 = __webpack_require__(0);
const lodash_1 = __webpack_require__(7);
const abstractPlugin_1 = __webpack_require__(8);
const webpack_sources_1 = __webpack_require__(9);
const tools_1 = __webpack_require__(10);
const client = __webpack_require__(13);
let chunkVersions = {};
let manifestTimestamp;
class ReloadPlugin extends abstractPlugin_1.default {
    constructor({ port, manifest }) {
        super();
        this.server = null;
        this.port = port || 9090;
        this.manifestPath = manifest || null;
    }
    sourceFactory(...sources) {
        return new webpack_sources_1.ConcatSource(...sources);
    }
    watcher(comp, done) {
        if (!this.server && this.manifestPath) {
            this.server = new socketServer_1.default(this.port);
        }
        return done();
    }
    compile(comp) {
        try {
            this.manifest = tools_1.requirePath(`${this.manifestPath}`);
        }
        catch (err) {
            logger_1.error(err.message);
        }
    }
    injector(comp, chunks) {
        let WSHost = `ws://localhost:${this.port}/`;
        if (!this.server || !this.manifest)
            return false;
        let { background } = this.manifest;
        let assets = chunks.reduce((res, chunk) => {
            let [filename] = chunk.files;
            if (/\.js$/.test(filename)) {
                let source = lodash_1.template(client)({
                    filename,
                    id: chunk.id,
                    name: chunk.name || null,
                    WSHost
                });
                res[filename] = this.sourceFactory(source, comp.assets[filename]);
            }
            return res;
        }, {});
        if (!background || !(background.page || background.scripts)) {
            let scripts = 'background.reload.js';
            let source = lodash_1.template(client)({
                filename: [scripts],
                id: '-1',
                name: scripts,
                WSHost
            });
            this.manifest.background = { scripts: [scripts], persistent: false };
            assets[scripts] = {
                source: () => source,
                size: () => source.length
            };
        }
        comp.assets = Object.assign({}, comp.assets, assets);
    }
    triggered(comp, done) {
        if (!this.server || !this.manifest)
            return done();
        let { content_scripts, background } = this.manifest;
        let scripts = background.scripts ? background.scripts : [];
        if (content_scripts && content_scripts.length) {
            content_scripts.forEach(content => scripts = scripts.concat(content.js));
        }
        logger_1.info(' Starting the Chrome Hot Plugin Reload Server...');
        comp.chunks.forEach(function (chunk, name) {
            var hash = chunkVersions[chunk.name];
            chunkVersions[chunk.name] = chunk.hash;
            if (chunk.hash !== hash) {
                let changed = chunk.files.filter(file => scripts.indexOf(file) !== -1);
                if (changed.length) {
                    this.server.signRestart();
                }
                else {
                    this.server.signReload(chunk.id, chunk.id);
                }
            }
        }.bind(this));
        let manifest = comp.fileTimestamps[this.manifestPath];
        if ((manifestTimestamp || 1) < (manifest || Infinity)) {
            manifestTimestamp = Date.now();
            console.log('manifestTimestamp');
            this.server.signRestart();
        }
        return done();
    }
    generate(comp, done) {
        if (!this.manifest)
            return done();
        const { fileDependencies } = comp;
        if (fileDependencies instanceof Set) {
            fileDependencies.add(this.manifestPath);
        }
        else {
            fileDependencies.push(this.manifestPath);
        }
        let source = JSON.stringify(this.manifest);
        comp.assets['manifest.json'] = {
            source: () => source,
            size: () => source.length
        };
        return done();
    }
    apply(compiler) {
        compiler.plugin("watch-run", (comp, done) => this.watcher(comp, done));
        compiler.plugin("compile", (comp) => this.compile(comp));
        compiler.plugin('compilation', (comp) => comp.plugin('after-optimize-chunk-assets', (chunks) => this.injector(comp, chunks)));
        compiler.plugin('after-emit', (comp, done) => this.triggered(comp, done));
        compiler.plugin('emit', (comp, done) => this.generate(comp, done));
    }
}
exports.default = ReloadPlugin;


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const http = __webpack_require__(4);
const logger_1 = __webpack_require__(0);
const websocket = __webpack_require__(6);
class HotReloaderServer {
    constructor(port, host = 'localhost') {
        this.sockets = {};
        this.server = http.createServer(function (req, res) {
            let data = '<h1>WCER</h1><p>Webpack plugin to enable reloading while developing Chrome extensions.</p>';
            res.writeHead(200, { 'Content-Type': 'text/html', 'Content-Length': data.length });
            res.write(data);
            res.end();
        });
        this.server.on('error', err => logger_1.error(err.message));
        this.server.on('upgrade', (req, socket, head) => this.handleUpgrade(req, socket, head));
        this.server.listen(port, host);
    }
    handleUpgrade(req, socket, head) {
        if (!websocket.isWebSocket(req))
            return;
        let driver = websocket.http(req);
        let id = req.url.match(/^\/([^\/]*)/)[1];
        driver.io.write(head);
        this.sockets[id] = driver;
        socket.pipe(driver.io).pipe(socket);
        driver.messages.on('data', data => this.message(data, id));
        driver.on('close', () => delete this.sockets[id]);
        driver.start();
    }
    message(json, id) {
        let { type, data } = JSON.parse(json);
        if (type === 'error')
            return logger_1.error(`${data}`);
        if (type === 'warn')
            return logger_1.warn(`${data}`);
        logger_1.info(`${data}`);
    }
    sign(type, data, sockets) {
        if (typeof sockets !== 'undefined') {
            let socks = Array.isArray(sockets) ? sockets : [sockets];
            for (let sock of socks) {
                if (this.sockets[sock]) {
                    this.sockets[sock].text(JSON.stringify({ type, data }));
                }
            }
        }
        else {
            for (let sock in this.sockets) {
                this.sockets[sock].text(JSON.stringify({ type, data }));
            }
        }
        return Promise.resolve();
    }
    signRestart(sock) {
        return this.sign('restart', true, sock);
    }
    signReload(id, sock) {
        return this.sign('reload', { id }, sock);
    }
}
exports.default = HotReloaderServer;


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_6__;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_7__;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class AbstractPlugin {
}
exports.default = AbstractPlugin;


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_9__;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const fs = __webpack_require__(11);
var Module = __webpack_require__(12);
function requirePath(filename) {
    if (!fs.existsSync(filename)) {
        throw new TypeError('Not found manifest file!');
    }
    let code = fs.readFileSync(filename, 'utf8');
    let mod = new Module(filename);
    mod.filename = filename;
    mod._compile(code, filename);
    mod.paths = Module._nodeModulePaths(filename);
    return mod.exports;
}
exports.requirePath = requirePath;


/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("module");

/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = "/* -------------------------------------------------- */\r\n/*  Start of Webpack Chrome Hot Extension Middleware  */\r\n/* ================================================== */\r\n/*  This will be converted into a lodash templ., any  */\r\n/*  external argument must be provided using it       */\r\n/* -------------------------------------------------- */\r\nvar WebpackReloadPlugin = false;\r\n(function (chrome, window) {\r\n    const name = '<%= name %>';\r\n    const id = parseInt('<%= id %>');\r\n    const wsHost = '<%= WSHost %>';\r\n    const filename = '<%= filename %>';\r\n    const { runtime, tabs } = chrome;\r\n    const logger = (msg, level = 'info') => console[level]('[ WCER: ' + msg + ' ]');\r\n    const manifest = (runtime && runtime.getManifest) ? runtime.getManifest() : undefined;\r\n    var path = (manifest ? manifest.name + ' | ' : '') + (name || filename);\r\n    if (path.length > 43)\r\n        path = path.slice(0, 20) + '...' + path.slice(-20);\r\n    function init() {\r\n        let timerId = null;\r\n        let socket = null;\r\n        try {\r\n            socket = new WebSocket(wsHost + id.toString());\r\n        }\r\n        catch (err) {\r\n            console.log(err);\r\n        }\r\n        let send = (type, data) => {\r\n            if (typeof data === 'string') {\r\n                data = (new Date()).toTimeString().replace(/.*(\\d{2}:\\d{2}:\\d{2}).*/, \"$1\") + ' - ' + path + ' | ' + data;\r\n            }\r\n            socket.send(JSON.stringify({ type, data }));\r\n        };\r\n        socket.onopen = () => {\r\n            logger(wsHost);\r\n            clearTimeout(timerId);\r\n            WebpackReloadPlugin = true;\r\n        };\r\n        socket.onmessage = ({ data: json }) => {\r\n            const { type, data } = JSON.parse(json);\r\n            if (runtime.reload && type === 'restart') {\r\n                send('restart', 'successfully restart');\r\n                runtime.reload();\r\n                runtime.restart();\r\n            }\r\n            if (type === 'reload' && id === data.id) {\r\n                send('reloaded', 'successfully reloaded');\r\n                window.location.reload();\r\n            }\r\n        };\r\n        socket.onclose = ({ code }) => {\r\n            logger(\"Socket connection closed.\", 'warn');\r\n            timerId = setTimeout(() => {\r\n                logger('WEPR Attempting to reconnect ...');\r\n                init();\r\n                logger('Reconnected. Reloading plugin');\r\n            }, 2000);\r\n        };\r\n        window.onbeforeunload = () => socket.close();\r\n    }\r\n    !WebpackReloadPlugin ? init() : logger('WebpackReloadPlugin: Socket already started !');\r\n})(chrome, window);\r\n/* ----------------------------------------------- */\r\n/* End of Webpack Chrome Hot Extension Middleware  */\r\n/* ----------------------------------------------- */ \r\n"

/***/ })
/******/ ]);
});
//# sourceMappingURL=index.js.map