const pofresh = require('../../pofresh');
const Package = require('pofresh-protocol').Package;

const CODE_OK = 200;
const CODE_USE_ERROR = 500;
const CODE_OLD_CLIENT = 501;

/**
 * Process the handshake request.
 *
 * @param {Object} opts option parameters
 *                      opts.handshake(msg, cb(err, resp)) handshake callback. msg is the handshake message from client.
 *                      opts.hearbeat heartbeat interval (level?)
 *                      opts.version required client level
 */
class Command {
    constructor(opts) {
        opts = opts || {};
        this.userHandshake = opts.handshake;

        if (opts.heartbeat) {
            this.heartbeatSec = opts.heartbeat;
            this.heartbeat = opts.heartbeat * 1000;
        }

        this.checkClient = opts.checkClient;

        this.useDict = opts.useDict;
        this.useProtobuf = opts.useProtobuf;
        this.useCrypto = opts.useCrypto;
    }

    handle(socket, msg) {
        if (!msg.sys) {
            processError(socket, CODE_USE_ERROR);
            return;
        }

        if (typeof this.checkClient === 'function') {
            if (!msg || !msg.sys || !this.checkClient(msg.sys.type, msg.sys.version)) {
                processError(socket, CODE_OLD_CLIENT);
                return;
            }
        }

        let opts = {
            heartbeat: this.heartbeatSec
        };

        if (this.useDict) {
            let dictVersion = pofresh.app.components.__dictionary__.getVersion();
            if (!msg.sys.dictVersion || msg.sys.dictVersion !== dictVersion) {

                // may be deprecated in future
                opts.dict = pofresh.app.components.__dictionary__.getDict();

                opts.routeToCode = pofresh.app.components.__dictionary__.getDict();
                opts.codeToRoute = pofresh.app.components.__dictionary__.getAbbrs();
                opts.dictVersion = dictVersion;
            }
            opts.useDict = true;
        }

        if (this.useProtobuf) {
            let protoVersion = pofresh.app.components.__protobuf__.getVersion();
            if (!msg.sys.protoVersion || msg.sys.protoVersion !== protoVersion) {
                opts.protos = pofresh.app.components.__protobuf__.getProtos();
            }
            opts.useProto = true;
        }

        if (!!pofresh.app.components.__decodeIO__protobuf__) {
            if (!!this.useProtobuf) {
                throw new Error('protobuf can not be both used in the same project.');
            }
            let version = pofresh.app.components.__decodeIO__protobuf__.getVersion();
            if (!msg.sys.protoVersion || msg.sys.protoVersion < version) {
                opts.protos = pofresh.app.components.__decodeIO__protobuf__.getProtos();
            }
            opts.useProto = true;
        }

        if (this.useCrypto) {
            pofresh.app.components.__connector__.setPubKey(socket.id, msg.sys.rsa);
        }

        if (typeof this.userHandshake === 'function') {
            this.userHandshake(msg, function (err, resp) {
                if (err) {
                    process.nextTick(function () {
                        processError(socket, CODE_USE_ERROR);
                    });
                    return;
                }
                process.nextTick(function () {
                    response(socket, opts, resp);
                });
            }, socket);
            return;
        }

        process.nextTick(function () {
            response(socket, opts);
        });
    }
}

module.exports = Command;

function response(socket, sys, resp) {
    let res = {
        code: CODE_OK,
        sys: sys
    };
    if (resp) {
        res.user = resp;
    }
    socket.handshakeResponse(Package.encode(Package.TYPE_HANDSHAKE, Buffer.from(JSON.stringify(res))));
};

function processError(socket, code) {
    let res = {
        code: code
    };
    socket.sendForce(Package.encode(Package.TYPE_HANDSHAKE, Buffer.from(JSON.stringify(res))));
    process.nextTick(() => {
        socket.disconnect();
    });
};
