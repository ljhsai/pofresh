const EventEmitter = require('events');
const mqtt = require('mqtt');
const constants = require('../util/constants');
const MQTTSocket = require('./mqttsocket');
const Adaptor = require('./mqtt/mqttadaptor');
const generate = require('./mqtt/generate');
const logger = require('pofresh-logger').getLogger('pofresh', __filename);

let curId = 1;

/**
 * Connector that manager low level connection and protocol bewteen server and client.
 * Develper can provide their own connector to switch the low level prototol, such as tcp or probuf.
 */
class Connector extends EventEmitter {
    constructor(port, host, opts) {
        super();
        this.port = port;
        this.host = host;
        this.opts = opts || {};

        this.adaptor = new Adaptor(this.opts);
    }

    /**
     * Start connector to listen the specified port
     */
    start(cb) {
        let self = this;
        this.mqttServer = mqtt.createServer();
        this.mqttServer.on('client', function (client) {
            client.on('error', function (err) {
                client.stream.destroy();
            });

            client.on('close', function () {
                client.stream.destroy();
            });

            client.on('disconnect', function (packet) {
                client.stream.destroy();
            });

            if (self.opts.disconnectOnTimeout) {
                let timeout = self.opts.timeout * 1000 || constants.TIME.DEFAULT_MQTT_HEARTBEAT_TIMEOUT;
                client.stream.setTimeout(timeout, function () {
                    client.emit('close');
                });
            }

            client.on('connect', function (packet) {
                client.connack({returnCode: 0});
                let mqttsocket = new MQTTSocket(curId++, client, self.adaptor);
                self.emit('connection', mqttsocket);
            });
        });

        this.mqttServer.listen(this.port);

        process.nextTick(cb);
    }

    stop() {
        this.mqttServer.close();
        process.exit(0);
    }

    encode(reqId, route, msgBody) {
        if (!!reqId) {
            return composeResponse(reqId, route, msgBody);
        } else {
            return composePush(route, msgBody);
        }
    }

    close() {
        this.mqttServer.close();
    }
}


module.exports = Connector;


function composeResponse(msgId, route, msgBody) {
    return {
        id: msgId,
        body: msgBody
    };
}

function composePush(route, msgBody) {
    let msg = generate.publish(msgBody);
    if (!msg) {
        logger.error('invalid mqtt publish message: %j', msgBody);
    }

    return msg;
}


