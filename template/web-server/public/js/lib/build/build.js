/**
 * hasOwnProperty.
 */

let has = Object.prototype.hasOwnProperty;

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
    let resolved = require.resolve(path);

    // lookup failed
    if (null === resolved) {
        orig = orig || path;
        parent = parent || 'root';
        let err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
        err.path = orig;
        err.parent = parent;
        err.require = true;
        throw err;
    }

    let module = require.modules[resolved];

    // perform real require()
    // by invoking the module's
    // registered function
    if (!module.exports) {
        module.exports = {};
        module.client = module.component = true;
        module.call(this, module.exports, require.relative(resolved), module);
    }

    return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function (path) {
    if (path.charAt(0) === '/') {
        path = path.slice(1);
    }
    let index = path + '/index.js';

    let paths = [
        path,
        path + '.js',
        path + '.json',
        path + '/index.js',
        path + '/index.json'
    ];

    for (let i = 0; i < paths.length; i++) {
        let path = paths[i];
        if (has.call(require.modules, path)) {
            return path;
        }
    }

    if (has.call(require.aliases, index)) {
        return require.aliases[index];
    }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function (curr, path) {
    let segs = [];

    if ('.' !== path.charAt(0)) {
        return path;
    }

    curr = curr.split('/');
    path = path.split('/');

    for (let i = 0; i < path.length; ++i) {
        if ('..' === path[i]) {
            curr.pop();
        } else if ('.' !== path[i] && '' !== path[i]) {
            segs.push(path[i]);
        }
    }

    return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function (path, definition) {
    require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function (from, to) {
    if (!has.call(require.modules, from)) {
        throw new Error('Failed to alias "' + from + '", it does not exist');
    }
    require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function (parent) {
    let p = require.normalize(parent, '..');

    /**
     * lastIndexOf helper.
     */

    function lastIndexOf(arr, obj) {
        let i = arr.length;
        while (i--) {
            if (arr[i] === obj) {
                return i;
            }
        }
        return -1;
    }

    /**
     * The relative require() itself.
     */

    function localRequire(path) {
        let resolved = localRequire.resolve(path);
        return require(resolved, parent, path);
    }

    /**
     * Resolve relative to the parent.
     */

    localRequire.resolve = function (path) {
        let c = path.charAt(0);
        if ('/' == c) return path.slice(1);
        if ('.' == c) return require.normalize(p, path);

        // resolve deps by returning
        // the dep in the nearest "deps"
        // directory
        let segs = parent.split('/');
        let i = lastIndexOf(segs, 'deps') + 1;
        if (!i) i = 0;
        path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
        return path;
    };

    /**
     * Check if module is defined at `path`.
     */

    localRequire.exists = function (path) {
        return has.call(require.modules, localRequire.resolve(path));
    };

    return localRequire;
};
require.register("component-indexof/index.js", function (exports, require, module) {

    let indexOf = [].indexOf;

    module.exports = function (arr, obj) {
        if (indexOf) return arr.indexOf(obj);
        for (let i = 0; i < arr.length; ++i) {
            if (arr[i] === obj) return i;
        }
        return -1;
    };
});
require.register("component-emitter/index.js", function (exports, require, module) {

    /**
     * Module dependencies.
     */

    let index = require('indexof');

    /**
     * Expose `Emitter`.
     */

    module.exports = Emitter;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
        if (obj) return mixin(obj);
    };

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
        for (let key in Emitter.prototype) {
            obj[key] = Emitter.prototype[key];
        }
        return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on = function (event, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks[event] = this._callbacks[event] || [])
            .push(fn);
        return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function (event, fn) {
        let self = this;
        this._callbacks = this._callbacks || {};

        function on() {
            self.off(event, on);
            fn.apply(this, arguments);
        }

        fn._off = on;
        this.on(event, on);
        return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
        Emitter.prototype.removeListener =
            Emitter.prototype.removeAllListeners = function (event, fn) {
                this._callbacks = this._callbacks || {};

                // all
                if (0 === arguments.length) {
                    this._callbacks = {};
                    return this;
                }

                // specific event
                let callbacks = this._callbacks[event];
                if (!callbacks) return this;

                // remove all handlers
                if (1 == arguments.length) {
                    delete this._callbacks[event];
                    return this;
                }

                // remove specific handler
                let i = index(callbacks, fn._off || fn);
                if (~i) callbacks.splice(i, 1);
                return this;
            };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function (event) {
        this._callbacks = this._callbacks || {};
        let args = [].slice.call(arguments, 1), callbacks = this._callbacks[event];

        if (callbacks) {
            callbacks = callbacks.slice(0);
            for (let i = 0, len = callbacks.length; i < len; ++i) {
                callbacks[i].apply(this, args);
            }
        }

        return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function (event) {
        this._callbacks = this._callbacks || {};
        return this._callbacks[event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function (event) {
        return !!this.listeners(event).length;
    };

});
require.register("NetEase-pofresh-protocol/lib/protocol.js", function (exports, require, module) {
    (function (exports, ByteArray, global) {
        let Protocol = exports;

        let PKG_HEAD_BYTES = 4;
        let MSG_FLAG_BYTES = 1;
        let MSG_ROUTE_CODE_BYTES = 2;
        let MSG_ID_MAX_BYTES = 5;
        let MSG_ROUTE_LEN_BYTES = 1;

        let MSG_ROUTE_CODE_MAX = 0xffff;

        let MSG_COMPRESS_ROUTE_MASK = 0x1;
        let MSG_TYPE_MASK = 0x7;

        let Package = Protocol.Package = {};
        let Message = Protocol.Message = {};

        Package.TYPE_HANDSHAKE = 1;
        Package.TYPE_HANDSHAKE_ACK = 2;
        Package.TYPE_HEARTBEAT = 3;
        Package.TYPE_DATA = 4;
        Package.TYPE_KICK = 5;

        Message.TYPE_REQUEST = 0;
        Message.TYPE_NOTIFY = 1;
        Message.TYPE_RESPONSE = 2;
        Message.TYPE_PUSH = 3;

        /**
         * pomele client encode
         * id message id;
         * route message route
         * msg message body
         * socketio current support string
         */
        Protocol.strencode = function (str) {
            let byteArray = new ByteArray(str.length * 3);
            let offset = 0;
            for (let i = 0; i < str.length; i++) {
                let charCode = str.charCodeAt(i);
                let codes = null;
                if (charCode <= 0x7f) {
                    codes = [charCode];
                } else if (charCode <= 0x7ff) {
                    codes = [0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f)];
                } else {
                    codes = [0xe0 | (charCode >> 12), 0x80 | ((charCode & 0xfc0) >> 6), 0x80 | (charCode & 0x3f)];
                }
                for (let j = 0; j < codes.length; j++) {
                    byteArray[offset] = codes[j];
                    ++offset;
                }
            }
            let _buffer = new ByteArray(offset);
            copyArray(_buffer, 0, byteArray, 0, offset);
            return _buffer;
        };

        /**
         * client decode
         * msg String data
         * return Message Object
         */
        Protocol.strdecode = function (buffer) {
            let bytes = new ByteArray(buffer);
            let array = [];
            let offset = 0;
            let charCode = 0;
            let end = bytes.length;
            while (offset < end) {
                if (bytes[offset] < 128) {
                    charCode = bytes[offset];
                    offset += 1;
                } else if (bytes[offset] < 224) {
                    charCode = ((bytes[offset] & 0x3f) << 6) + (bytes[offset + 1] & 0x3f);
                    offset += 2;
                } else {
                    charCode = ((bytes[offset] & 0x0f) << 12) + ((bytes[offset + 1] & 0x3f) << 6) + (bytes[offset + 2] & 0x3f);
                    offset += 3;
                }
                array.push(charCode);
            }
            let res = '';
            let chunk = 8 * 1024;
            let i;
            for (i = 0; i < array.length / chunk; i++) {
                res += String.fromCharCode.apply(null, array.slice(i * chunk, (i + 1) * chunk));
            }
            res += String.fromCharCode.apply(null, array.slice(i * chunk));
            return res;
        };

        /**
         * Package protocol encode.
         *
         * pofresh package format:
         * +------+-------------+------------------+
         * | type | body length |       body       |
         * +------+-------------+------------------+
         *
         * Head: 4bytes
         *   0: package type,
         *      1 - handshake,
         *      2 - handshake ack,
         *      3 - heartbeat,
         *      4 - data
         *      5 - kick
         *   1 - 3: big-endian body length
         * Body: body length bytes
         *
         * @param  {Number}    type   package type
         * @param  {ByteArray} body   body content in bytes
         * @return {ByteArray}        new byte array that contains encode result
         */
        Package.encode = function (type, body) {
            let length = body ? body.length : 0;
            let buffer = new ByteArray(PKG_HEAD_BYTES + length);
            let index = 0;
            buffer[index++] = type & 0xff;
            buffer[index++] = (length >> 16) & 0xff;
            buffer[index++] = (length >> 8) & 0xff;
            buffer[index++] = length & 0xff;
            if (body) {
                copyArray(buffer, index, body, 0, length);
            }
            return buffer;
        };

        /**
         * Package protocol decode.
         * See encode for package format.
         *
         * @param  {ByteArray} buffer byte array containing package content
         * @return {Object}           {type: package type, buffer: body byte array}
         */
        Package.decode = function (buffer) {
            let bytes = new ByteArray(buffer);
            let type = bytes[0];
            let index = 1;
            let length = ((bytes[index++]) << 16 | (bytes[index++]) << 8 | bytes[index++]) >>> 0;
            let body = length ? new ByteArray(length) : null;
            copyArray(body, 0, bytes, PKG_HEAD_BYTES, length);
            return {'type': type, 'body': body};
        };

        /**
         * Message protocol encode.
         *
         * @param  {Number} id            message id
         * @param  {Number} type          message type
         * @param  {Number} compressRoute whether compress route
         * @param  {Number|String} route  route code or route string
         * @param  {Buffer} msg           message body bytes
         * @return {Buffer}               encode result
         */
        Message.encode = function (id, type, compressRoute, route, msg) {
            // caculate message max length
            let idBytes = msgHasId(type) ? caculateMsgIdBytes(id) : 0;
            let msgLen = MSG_FLAG_BYTES + idBytes;

            if (msgHasRoute(type)) {
                if (compressRoute) {
                    if (typeof route !== 'number') {
                        throw new Error('error flag for number route!');
                    }
                    msgLen += MSG_ROUTE_CODE_BYTES;
                } else {
                    msgLen += MSG_ROUTE_LEN_BYTES;
                    if (route) {
                        route = Protocol.strencode(route);
                        if (route.length > 255) {
                            throw new Error('route maxlength is overflow');
                        }
                        msgLen += route.length;
                    }
                }
            }

            if (msg) {
                msgLen += msg.length;
            }

            let buffer = new ByteArray(msgLen);
            let offset = 0;

            // add flag
            offset = encodeMsgFlag(type, compressRoute, buffer, offset);

            // add message id
            if (msgHasId(type)) {
                offset = encodeMsgId(id, idBytes, buffer, offset);
            }

            // add route
            if (msgHasRoute(type)) {
                offset = encodeMsgRoute(compressRoute, route, buffer, offset);
            }

            // add body
            if (msg) {
                offset = encodeMsgBody(msg, buffer, offset);
            }

            return buffer;
        };

        /**
         * Message protocol decode.
         *
         * @param  {Buffer|Uint8Array} buffer message bytes
         * @return {Object}            message object
         */
        Message.decode = function (buffer) {
            let bytes = new ByteArray(buffer);
            let bytesLen = bytes.length || bytes.byteLength;
            let offset = 0;
            let id = 0;
            let route = null;

            // parse flag
            let flag = bytes[offset++];
            let compressRoute = flag & MSG_COMPRESS_ROUTE_MASK;
            let type = (flag >> 1) & MSG_TYPE_MASK;

            // parse id
            if (msgHasId(type)) {
                let byte = bytes[offset++];
                id = byte & 0x7f;
                while (byte & 0x80) {
                    id <<= 7;
                    byte = bytes[offset++];
                    id |= byte & 0x7f;
                }
            }

            // parse route
            if (msgHasRoute(type)) {
                if (compressRoute) {
                    route = (bytes[offset++]) << 8 | bytes[offset++];
                } else {
                    let routeLen = bytes[offset++];
                    if (routeLen) {
                        route = new ByteArray(routeLen);
                        copyArray(route, 0, bytes, offset, routeLen);
                        route = Protocol.strdecode(route);
                    } else {
                        route = '';
                    }
                    offset += routeLen;
                }
            }

            // parse body
            let bodyLen = bytesLen - offset;
            let body = new ByteArray(bodyLen);

            copyArray(body, 0, bytes, offset, bodyLen);

            return {
                'id': id, 'type': type, 'compressRoute': compressRoute,
                'route': route, 'body': body
            };
        };

        let copyArray = function (dest, doffset, src, soffset, length) {
            if ('function' === typeof src.copy) {
                // Buffer
                src.copy(dest, doffset, soffset, soffset + length);
            } else {
                // Uint8Array
                for (let index = 0; index < length; index++) {
                    dest[doffset++] = src[soffset++];
                }
            }
        };

        let msgHasId = function (type) {
            return type === Message.TYPE_REQUEST || type === Message.TYPE_RESPONSE;
        };

        let msgHasRoute = function (type) {
            return type === Message.TYPE_REQUEST || type === Message.TYPE_NOTIFY ||
                type === Message.TYPE_PUSH;
        };

        let caculateMsgIdBytes = function (id) {
            let len = 0;
            do {
                len += 1;
                id >>= 7;
            } while (id > 0);
            return len;
        };

        let encodeMsgFlag = function (type, compressRoute, buffer, offset) {
            if (type !== Message.TYPE_REQUEST && type !== Message.TYPE_NOTIFY &&
                type !== Message.TYPE_RESPONSE && type !== Message.TYPE_PUSH) {
                throw new Error('unkonw message type: ' + type);
            }

            buffer[offset] = (type << 1) | (compressRoute ? 1 : 0);

            return offset + MSG_FLAG_BYTES;
        };

        let encodeMsgId = function (id, idBytes, buffer, offset) {
            let index = offset + idBytes - 1;
            buffer[index--] = id & 0x7f;
            while (index >= offset) {
                id >>= 7;
                buffer[index--] = id & 0x7f | 0x80;
            }
            return offset + idBytes;
        };

        let encodeMsgRoute = function (compressRoute, route, buffer, offset) {
            if (compressRoute) {
                if (route > MSG_ROUTE_CODE_MAX) {
                    throw new Error('route number is overflow');
                }

                buffer[offset++] = (route >> 8) & 0xff;
                buffer[offset++] = route & 0xff;
            } else {
                if (route) {
                    buffer[offset++] = route.length & 0xff;
                    copyArray(buffer, offset, route, 0, route.length);
                    offset += route.length;
                } else {
                    buffer[offset++] = 0;
                }
            }

            return offset;
        };

        let encodeMsgBody = function (msg, buffer, offset) {
            copyArray(buffer, offset, msg, 0, msg.length);
            return offset + msg.length;
        };

        module.exports = Protocol;
    })('object' === typeof module ? module.exports : (this.Protocol = {}), 'object' === typeof module ? Buffer : Uint8Array, this);

});
require.register("pofreshnode-pofresh-protobuf/lib/client/protobuf.js", function (exports, require, module) {
    /* ProtocolBuffer client 0.1.0*/

    /**
     * pofresh-protobuf
     * @author <zhang0935@gmail.com>
     */

    /**
     * Protocol buffer root
     * In browser, it will be window.protbuf
     */
    (function (exports, global) {
        let Protobuf = exports;

        Protobuf.init = function (opts) {
            //On the serverside, use serverProtos to encode messages send to client
            Protobuf.encoder.init(opts.encoderProtos);

            //On the serverside, user clientProtos to decode messages receive from clients
            Protobuf.decoder.init(opts.decoderProtos);
        };

        Protobuf.encode = function (key, msg) {
            return Protobuf.encoder.encode(key, msg);
        };

        Protobuf.decode = function (key, msg) {
            return Protobuf.decoder.decode(key, msg);
        };

        // exports to support for components
        module.exports = Protobuf;
    })('object' === typeof module ? module.exports : (this.protobuf = {}), this);

    /**
     * constants
     */
    (function (exports, global) {
        let constants = exports.constants = {};

        constants.TYPES = {
            uInt32: 0,
            sInt32: 0,
            int32: 0,
            double: 1,
            string: 2,
            message: 2,
            float: 5
        };

    })('undefined' !== typeof protobuf ? protobuf : module.exports, this);

    /**
     * util module
     */
    (function (exports, global) {

        let Util = exports.util = {};

        Util.isSimpleType = function (type) {
            return (type === 'uInt32' ||
                type === 'sInt32' ||
                type === 'int32' ||
                type === 'uInt64' ||
                type === 'sInt64' ||
                type === 'float' ||
                type === 'double');
        };

    })('undefined' !== typeof protobuf ? protobuf : module.exports, this);

    /**
     * codec module
     */
    (function (exports, global) {

        let Codec = exports.codec = {};

        let buffer = new ArrayBuffer(8);
        let float32Array = new Float32Array(buffer);
        let float64Array = new Float64Array(buffer);
        let uInt8Array = new Uint8Array(buffer);

        Codec.encodeUInt32 = function (n) {
            n = parseInt(n);
            if (isNaN(n) || n < 0) {
                return null;
            }

            let result = [];
            do {
                let tmp = n % 128;
                let next = Math.floor(n / 128);

                if (next !== 0) {
                    tmp = tmp + 128;
                }
                result.push(tmp);
                n = next;
            } while (n !== 0);

            return result;
        };

        Codec.encodeSInt32 = function (n) {
            n = parseInt(n);
            if (isNaN(n)) {
                return null;
            }
            n = n < 0 ? (Math.abs(n) * 2 - 1) : n * 2;

            return Codec.encodeUInt32(n);
        };

        Codec.decodeUInt32 = function (bytes) {
            let n = 0;

            for (let i = 0; i < bytes.length; i++) {
                let m = parseInt(bytes[i]);
                n = n + ((m & 0x7f) * Math.pow(2, (7 * i)));
                if (m < 128) {
                    return n;
                }
            }

            return n;
        };


        Codec.decodeSInt32 = function (bytes) {
            let n = this.decodeUInt32(bytes);
            let flag = ((n % 2) === 1) ? -1 : 1;

            n = ((n % 2 + n) / 2) * flag;

            return n;
        };

        Codec.encodeFloat = function (float) {
            float32Array[0] = float;
            return uInt8Array;
        };

        Codec.decodeFloat = function (bytes, offset) {
            if (!bytes || bytes.length < (offset + 4)) {
                return null;
            }

            for (let i = 0; i < 4; i++) {
                uInt8Array[i] = bytes[offset + i];
            }

            return float32Array[0];
        };

        Codec.encodeDouble = function (double) {
            float64Array[0] = double;
            return uInt8Array.subarray(0, 8);
        };

        Codec.decodeDouble = function (bytes, offset) {
            if (!bytes || bytes.length < (8 + offset)) {
                return null;
            }

            for (let i = 0; i < 8; i++) {
                uInt8Array[i] = bytes[offset + i];
            }

            return float64Array[0];
        };

        Codec.encodeStr = function (bytes, offset, str) {
            for (let i = 0; i < str.length; i++) {
                let code = str.charCodeAt(i);
                let codes = encode2UTF8(code);

                for (let j = 0; j < codes.length; j++) {
                    bytes[offset] = codes[j];
                    offset++;
                }
            }

            return offset;
        };

        /**
         * Decode string from utf8 bytes
         */
        Codec.decodeStr = function (bytes, offset, length) {
            let array = [];
            let end = offset + length;

            while (offset < end) {
                let code = 0;

                if (bytes[offset] < 128) {
                    code = bytes[offset];

                    offset += 1;
                } else if (bytes[offset] < 224) {
                    code = ((bytes[offset] & 0x3f) << 6) + (bytes[offset + 1] & 0x3f);
                    offset += 2;
                } else {
                    code = ((bytes[offset] & 0x0f) << 12) + ((bytes[offset + 1] & 0x3f) << 6) + (bytes[offset + 2] & 0x3f);
                    offset += 3;
                }

                array.push(code);

            }

            let str = '';
            for (let i = 0; i < array.length;) {
                str += String.fromCharCode.apply(null, array.slice(i, i + 10000));
                i += 10000;
            }

            return str;
        };

        /**
         * Return the byte length of the str use utf8
         */
        Codec.byteLength = function (str) {
            if (typeof (str) !== 'string') {
                return -1;
            }

            let length = 0;

            for (let i = 0; i < str.length; i++) {
                let code = str.charCodeAt(i);
                length += codeLength(code);
            }

            return length;
        };

        /**
         * Encode a unicode16 char code to utf8 bytes
         */
        function encode2UTF8(charCode) {
            if (charCode <= 0x7f) {
                return [charCode];
            } else if (charCode <= 0x7ff) {
                return [0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f)];
            } else {
                return [0xe0 | (charCode >> 12), 0x80 | ((charCode & 0xfc0) >> 6), 0x80 | (charCode & 0x3f)];
            }
        }

        function codeLength(code) {
            if (code <= 0x7f) {
                return 1;
            } else if (code <= 0x7ff) {
                return 2;
            } else {
                return 3;
            }
        }
    })('undefined' !== typeof protobuf ? protobuf : module.exports, this);

    /**
     * encoder module
     */
    (function (exports, global) {

        let protobuf = exports;
        let MsgEncoder = exports.encoder = {};

        let codec = protobuf.codec;
        let constant = protobuf.constants;
        let util = protobuf.util;

        MsgEncoder.init = function (protos) {
            this.protos = protos || {};
        };

        MsgEncoder.encode = function (route, msg) {
            //Get protos from protos map use the route as key
            let protos = this.protos[route];

            //Check msg
            if (!checkMsg(msg, protos)) {
                return null;
            }

            //Set the length of the buffer 2 times bigger to prevent overflow
            let length = codec.byteLength(JSON.stringify(msg));

            //Init buffer and offset
            let buffer = new ArrayBuffer(length);
            let uInt8Array = new Uint8Array(buffer);
            let offset = 0;

            if (!!protos) {
                offset = encodeMsg(uInt8Array, offset, protos, msg);
                if (offset > 0) {
                    return uInt8Array.subarray(0, offset);
                }
            }

            return null;
        };

        /**
         * Check if the msg follow the defination in the protos
         */
        function checkMsg(msg, protos) {
            if (!protos) {
                return false;
            }

            for (let name in protos) {
                let proto = protos[name];

                //All required element must exist
                switch (proto.option) {
                    case 'required' :
                        if (typeof (msg[name]) === 'undefined') {
                            return false;
                        }
                    case 'optional' :
                        if (typeof (msg[name]) !== 'undefined') {
                            if (!!protos.__messages[proto.type]) {
                                checkMsg(msg[name], protos.__messages[proto.type]);
                            }
                        }
                        break;
                    case 'repeated' :
                        //Check nest message in repeated elements
                        if (!!msg[name] && !!protos.__messages[proto.type]) {
                            for (let i = 0; i < msg[name].length; i++) {
                                if (!checkMsg(msg[name][i], protos.__messages[proto.type])) {
                                    return false;
                                }
                            }
                        }
                        break;
                }
            }

            return true;
        }

        function encodeMsg(buffer, offset, protos, msg) {
            for (let name in msg) {
                if (!!protos[name]) {
                    let proto = protos[name];

                    switch (proto.option) {
                        case 'required' :
                        case 'optional' :
                            offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
                            offset = encodeProp(msg[name], proto.type, offset, buffer, protos);
                            break;
                        case 'repeated' :
                            if (msg[name].length > 0) {
                                offset = encodeArray(msg[name], proto, offset, buffer, protos);
                            }
                            break;
                    }
                }
            }

            return offset;
        }

        function encodeProp(value, type, offset, buffer, protos) {
            switch (type) {
                case 'uInt32':
                    offset = writeBytes(buffer, offset, codec.encodeUInt32(value));
                    break;
                case 'int32' :
                case 'sInt32':
                    offset = writeBytes(buffer, offset, codec.encodeSInt32(value));
                    break;
                case 'float':
                    writeBytes(buffer, offset, codec.encodeFloat(value));
                    offset += 4;
                    break;
                case 'double':
                    writeBytes(buffer, offset, codec.encodeDouble(value));
                    offset += 8;
                    break;
                case 'string':
                    let length = codec.byteLength(value);

                    //Encode length
                    offset = writeBytes(buffer, offset, codec.encodeUInt32(length));
                    //write string
                    codec.encodeStr(buffer, offset, value);
                    offset += length;
                    break;
                default :
                    if (!!protos.__messages[type]) {
                        //Use a tmp buffer to build an internal msg
                        let tmpBuffer = new ArrayBuffer(codec.byteLength(JSON.stringify(value)));
                        let length = 0;

                        length = encodeMsg(tmpBuffer, length, protos.__messages[type], value);
                        //Encode length
                        offset = writeBytes(buffer, offset, codec.encodeUInt32(length));
                        //contact the object
                        for (let i = 0; i < length; i++) {
                            buffer[offset] = tmpBuffer[i];
                            offset++;
                        }
                    }
                    break;
            }

            return offset;
        }

        /**
         * Encode reapeated properties, simple msg and object are decode differented
         */
        function encodeArray(array, proto, offset, buffer, protos) {
            let i = 0;

            if (util.isSimpleType(proto.type)) {
                offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
                offset = writeBytes(buffer, offset, codec.encodeUInt32(array.length));
                for (i = 0; i < array.length; i++) {
                    offset = encodeProp(array[i], proto.type, offset, buffer);
                }
            } else {
                for (i = 0; i < array.length; i++) {
                    offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
                    offset = encodeProp(array[i], proto.type, offset, buffer, protos);
                }
            }

            return offset;
        }

        function writeBytes(buffer, offset, bytes) {
            for (let i = 0; i < bytes.length; i++, offset++) {
                buffer[offset] = bytes[i];
            }

            return offset;
        }

        function encodeTag(type, tag) {
            let value = constant.TYPES[type] || 2;
            return codec.encodeUInt32((tag << 3) | value);
        }
    })('undefined' !== typeof protobuf ? protobuf : module.exports, this);

    /**
     * decoder module
     */
    (function (exports, global) {
        let protobuf = exports;
        let MsgDecoder = exports.decoder = {};

        let codec = protobuf.codec;
        let util = protobuf.util;

        let buffer;
        let offset = 0;

        MsgDecoder.init = function (protos) {
            this.protos = protos || {};
        };

        MsgDecoder.setProtos = function (protos) {
            if (!!protos) {
                this.protos = protos;
            }
        };

        MsgDecoder.decode = function (route, buf) {
            let protos = this.protos[route];

            buffer = buf;
            offset = 0;

            if (!!protos) {
                return decodeMsg({}, protos, buffer.length);
            }

            return null;
        };

        function decodeMsg(msg, protos, length) {
            while (offset < length) {
                let head = getHead();
                let type = head.type;
                let tag = head.tag;
                let name = protos.__tags[tag];

                switch (protos[name].option) {
                    case 'optional' :
                    case 'required' :
                        msg[name] = decodeProp(protos[name].type, protos);
                        break;
                    case 'repeated' :
                        if (!msg[name]) {
                            msg[name] = [];
                        }
                        decodeArray(msg[name], protos[name].type, protos);
                        break;
                }
            }

            return msg;
        }

        /**
         * Test if the given msg is finished
         */
        function isFinish(msg, protos) {
            return (!protos.__tags[peekHead().tag]);
        }

        /**
         * Get property head from protobuf
         */
        function getHead() {
            let tag = codec.decodeUInt32(getBytes());

            return {
                type: tag & 0x7,
                tag: tag >> 3
            };
        }

        /**
         * Get tag head without move the offset
         */
        function peekHead() {
            let tag = codec.decodeUInt32(peekBytes());

            return {
                type: tag & 0x7,
                tag: tag >> 3
            };
        }

        function decodeProp(type, protos) {
            switch (type) {
                case 'uInt32':
                    return codec.decodeUInt32(getBytes());
                case 'int32' :
                case 'sInt32' :
                    return codec.decodeSInt32(getBytes());
                case 'float' :
                    let float = codec.decodeFloat(buffer, offset);
                    offset += 4;
                    return float;
                case 'double' :
                    let double = codec.decodeDouble(buffer, offset);
                    offset += 8;
                    return double;
                case 'string' :
                    let length = codec.decodeUInt32(getBytes());

                    let str = codec.decodeStr(buffer, offset, length);
                    offset += length;

                    return str;
                default :
                    if (!!protos && !!protos.__messages[type]) {
                        let length = codec.decodeUInt32(getBytes());
                        let msg = {};
                        decodeMsg(msg, protos.__messages[type], offset + length);
                        return msg;
                    }
                    break;
            }
        }

        function decodeArray(array, type, protos) {
            if (util.isSimpleType(type)) {
                let length = codec.decodeUInt32(getBytes());

                for (let i = 0; i < length; i++) {
                    array.push(decodeProp(type));
                }
            } else {
                array.push(decodeProp(type, protos));
            }
        }

        function getBytes(flag) {
            let bytes = [];
            let pos = offset;
            flag = flag || false;

            let b;

            do {
                b = buffer[pos];
                bytes.push(b);
                pos++;
            } while (b >= 128);

            if (!flag) {
                offset = pos;
            }
            return bytes;
        }

        function peekBytes() {
            return getBytes(true);
        }

    })('undefined' !== typeof protobuf ? protobuf : module.exports, this);


});
require.register("pofreshnode-pofresh-jsclient-websocket/lib/pofresh-client.js", function (exports, require, module) {
    (function () {
        let JS_WS_CLIENT_TYPE = 'js-websocket';
        let JS_WS_CLIENT_VERSION = '0.0.1';

        let Protocol = window.Protocol;
        let Package = Protocol.Package;
        let Message = Protocol.Message;
        let EventEmitter = window.EventEmitter;

        let RES_OK = 200;
        let RES_FAIL = 500;
        let RES_OLD_CLIENT = 501;

        if (typeof Object.create !== 'function') {
            Object.create = function (o) {
                function F() {
                }

                F.prototype = o;
                return new F();
            };
        }

        let root = window;
        let pofresh = Object.create(EventEmitter.prototype); // object extend from object
        root.pofresh = pofresh;
        let socket = null;
        let reqId = 0;
        let callbacks = {};
        let handlers = {};
        //Map from request id to route
        let routeMap = {};

        let heartbeatInterval = 0;
        let heartbeatTimeout = 0;
        let nextHeartbeatTimeout = 0;
        let gapThreshold = 100;   // heartbeat gap threashold
        let heartbeatId = null;
        let heartbeatTimeoutId = null;

        let handshakeCallback = null;

        let handshakeBuffer = {
            'sys': {
                type: JS_WS_CLIENT_TYPE,
                version: JS_WS_CLIENT_VERSION
            },
            'user': {}
        };

        let initCallback = null;

        pofresh.init = function (params, cb) {
            initCallback = cb;
            let host = params.host;
            let port = params.port;

            let url = 'ws://' + host;
            if (port) {
                url += ':' + port;
            }

            handshakeBuffer.user = params.user;
            handshakeCallback = params.handshakeCallback;
            initWebSocket(url, cb);
        };

        let initWebSocket = function (url, cb) {
            console.log('connect to ' + url);
            let onopen = function (event) {
                let obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
                send(obj);
            };
            let onmessage = function (event) {
                processPackage(Package.decode(event.data), cb);
                // new package arrived, update the heartbeat timeout
                if (heartbeatTimeout) {
                    nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
                }
            };
            let onerror = function (event) {
                pofresh.emit('io-error', event);
                console.error('socket error: ', event);
            };
            let onclose = function (event) {
                pofresh.emit('close', event);
                console.error('socket close: ', event);
            };
            socket = new WebSocket(url);
            socket.binaryType = 'arraybuffer';
            socket.onopen = onopen;
            socket.onmessage = onmessage;
            socket.onerror = onerror;
            socket.onclose = onclose;
        };

        pofresh.disconnect = function () {
            if (socket) {
                if (socket.disconnect) socket.disconnect();
                if (socket.close) socket.close();
                console.log('disconnect');
                socket = null;
            }

            if (heartbeatId) {
                clearTimeout(heartbeatId);
                heartbeatId = null;
            }
            if (heartbeatTimeoutId) {
                clearTimeout(heartbeatTimeoutId);
                heartbeatTimeoutId = null;
            }
        };

        pofresh.request = function (route, msg, cb) {
            if (arguments.length === 2 && typeof msg === 'function') {
                cb = msg;
                msg = {};
            } else {
                msg = msg || {};
            }
            route = route || msg.route;
            if (!route) {
                return;
            }

            reqId++;
            sendMessage(reqId, route, msg);

            callbacks[reqId] = cb;
            routeMap[reqId] = route;
        };

        pofresh.notify = function (route, msg) {
            msg = msg || {};
            sendMessage(0, route, msg);
        };

        let sendMessage = function (reqId, route, msg) {
            let type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

            //compress message by protobuf
            let protos = !!pofresh.data.protos ? pofresh.data.protos.client : {};
            if (!!protos[route]) {
                msg = protobuf.encode(route, msg);
            } else {
                msg = Protocol.strencode(JSON.stringify(msg));
            }


            let compressRoute = 0;
            if (pofresh.dict && pofresh.dict[route]) {
                route = pofresh.dict[route];
                compressRoute = 1;
            }

            msg = Message.encode(reqId, type, compressRoute, route, msg);
            let packet = Package.encode(Package.TYPE_DATA, msg);
            send(packet);
        };

        let send = function (packet) {
            socket.send(packet.buffer);
        };


        let handler = {};

        let heartbeat = function (data) {
            if (!heartbeatInterval) {
                // no heartbeat
                return;
            }

            let obj = Package.encode(Package.TYPE_HEARTBEAT);
            if (heartbeatTimeoutId) {
                clearTimeout(heartbeatTimeoutId);
                heartbeatTimeoutId = null;
            }

            if (heartbeatId) {
                // already in a heartbeat interval
                return;
            }

            heartbeatId = setTimeout(function () {
                heartbeatId = null;
                send(obj);

                nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
                heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
            }, heartbeatInterval);
        };

        let heartbeatTimeoutCb = function () {
            let gap = nextHeartbeatTimeout - Date.now();
            if (gap > gapThreshold) {
                heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
            } else {
                console.error('server heartbeat timeout');
                pofresh.emit('heartbeat timeout');
                pofresh.disconnect();
            }
        };

        let handshake = function (data) {
            data = JSON.parse(Protocol.strdecode(data));
            if (data.code === RES_OLD_CLIENT) {
                pofresh.emit('error', 'client version not fullfill');
                return;
            }

            if (data.code !== RES_OK) {
                pofresh.emit('error', 'handshake fail');
                return;
            }

            handshakeInit(data);

            let obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
            send(obj);
            if (initCallback) {
                initCallback(socket);
                initCallback = null;
            }
        };

        let onData = function (data) {
            //probuff decode
            let msg = Message.decode(data);

            if (msg.id > 0) {
                msg.route = routeMap[msg.id];
                delete routeMap[msg.id];
                if (!msg.route) {
                    return;
                }
            }

            msg.body = deCompose(msg);

            processMessage(pofresh, msg);
        };

        let onKick = function (data) {
            pofresh.emit('onKick', data);
        };

        handlers[Package.TYPE_HANDSHAKE] = handshake;
        handlers[Package.TYPE_HEARTBEAT] = heartbeat;
        handlers[Package.TYPE_DATA] = onData;
        handlers[Package.TYPE_KICK] = onKick;

        let processPackage = function (msg) {
            handlers[msg.type](msg.body);
        };

        let processMessage = function (pofresh, msg) {
            if (!msg.id) {
                // server push message
                pofresh.emit(msg.route, msg.body);
                return;
            }

            //if have a id then find the callback function with the request
            let cb = callbacks[msg.id];

            delete callbacks[msg.id];
            if (typeof cb !== 'function') {
                return;
            }

            cb(msg.body);
            return;
        };

        let processMessageBatch = function (pofresh, msgs) {
            for (let i = 0, l = msgs.length; i < l; i++) {
                processMessage(pofresh, msgs[i]);
            }
        };

        let deCompose = function (msg) {
            let protos = !!pofresh.data.protos ? pofresh.data.protos.server : {};
            let abbrs = pofresh.data.abbrs;
            let route = msg.route;

            //Decompose route from dict
            if (msg.compressRoute) {
                if (!abbrs[route]) {
                    return {};
                }

                route = msg.route = abbrs[route];
            }
            if (!!protos[route]) {
                return protobuf.decode(route, msg.body);
            } else {
                return JSON.parse(Protocol.strdecode(msg.body));
            }

            return msg;
        };

        let handshakeInit = function (data) {
            if (data.sys && data.sys.heartbeat) {
                heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
                heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
            } else {
                heartbeatInterval = 0;
                heartbeatTimeout = 0;
            }

            initData(data);

            if (typeof handshakeCallback === 'function') {
                handshakeCallback(data.user);
            }
        };

        //Initilize data used in pofresh client
        let initData = function (data) {
            if (!data || !data.sys) {
                return;
            }
            pofresh.data = pofresh.data || {};
            let dict = data.sys.dict;
            let protos = data.sys.protos;

            //Init compress dict
            if (dict) {
                pofresh.data.dict = dict;
                pofresh.data.abbrs = {};

                for (let route in dict) {
                    pofresh.data.abbrs[dict[route]] = route;
                }
            }

            //Init protobuf protos
            if (protos) {
                pofresh.data.protos = {
                    server: protos.server || {},
                    client: protos.client || {}
                };
                if (!!protobuf) {
                    protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
                }
            }
        };

        module.exports = pofresh;
    })();

});
require.register("boot/index.js", function (exports, require, module) {
    let Emitter = require('emitter');
    window.EventEmitter = Emitter;

    let protocol = require('pofresh-protocol');
    window.Protocol = protocol;

    let protobuf = require('pofresh-protobuf');
    window.protobuf = protobuf;

    let pofresh = require('pofresh-jsclient-websocket');
    window.pofresh = pofresh;

});
require.alias("boot/index.js", "pofresh-client/deps/boot/index.js");
require.alias("component-emitter/index.js", "boot/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("NetEase-pofresh-protocol/lib/protocol.js", "boot/deps/pofresh-protocol/lib/protocol.js");
require.alias("NetEase-pofresh-protocol/lib/protocol.js", "boot/deps/pofresh-protocol/index.js");
require.alias("NetEase-pofresh-protocol/lib/protocol.js", "NetEase-pofresh-protocol/index.js");

require.alias("pofreshnode-pofresh-protobuf/lib/client/protobuf.js", "boot/deps/pofresh-protobuf/lib/client/protobuf.js");
require.alias("pofreshnode-pofresh-protobuf/lib/client/protobuf.js", "boot/deps/pofresh-protobuf/index.js");
require.alias("pofreshnode-pofresh-protobuf/lib/client/protobuf.js", "pofreshnode-pofresh-protobuf/index.js");

require.alias("pofreshnode-pofresh-jsclient-websocket/lib/pofresh-client.js", "boot/deps/pofresh-jsclient-websocket/lib/pofresh-client.js");
require.alias("pofreshnode-pofresh-jsclient-websocket/lib/pofresh-client.js", "boot/deps/pofresh-jsclient-websocket/index.js");
require.alias("pofreshnode-pofresh-jsclient-websocket/lib/pofresh-client.js", "pofreshnode-pofresh-jsclient-websocket/index.js");

