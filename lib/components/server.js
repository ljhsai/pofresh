/**
 * Component for server starup.
 */
const Server = require('../server/server');

/**
 * Component factory function
 *
 * @param {Object} app  current application context
 * @return {Object}     component instance
 */
module.exports = function (app, opts) {
    return new Component(app, opts);
};

/**
 * Server component class
 *
 * @param {Object} app  current application context
 */
class Component {
    constructor(app, opts) {
        this.name = '__server__';
        this.server = Server.create(app, opts);
    }

    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    start(cb) {
        this.server.start();
        process.nextTick(cb);
    }

    /**
     * Component lifecycle callback
     *
     * @param {Function} cb
     * @return {Void}
     */
    afterStart(cb) {
        this.server.afterStart();
        process.nextTick(cb);
    }

    /**
     * Component lifecycle function
     *
     * @param {Boolean}  force whether stop the component immediately
     * @param {Function}  cb
     * @return {Void}
     */
    stop(force, cb) {
        this.server.stop();
        process.nextTick(cb);
    }

    /**
     * Proxy server handle
     */
    handle(msg, session, cb) {
        this.server.handle(msg, session, cb);
    }

    /**
     * Proxy server global handle
     */
    globalHandle(msg, session, cb) {
        this.server.globalHandle(msg, session, cb);
    }

}