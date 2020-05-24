/**
 * Filter for rpc log.
 * Reject rpc request when toobusy
 */
const rpcLogger = require('pofresh-logger').getLogger('rpc-log', __filename);
let toobusy = null;

const DEFAULT_MAXLAG = 70;

module.exports = function (maxLag) {
    return new Filter(maxLag || DEFAULT_MAXLAG);
};

class Filter {
    constructor(maxLag) {
        this.name = 'toobusy';
        try {
            toobusy = require('toobusy');
        } catch (e) {
        }
        if (!!toobusy) {
            toobusy.maxLag(maxLag);
        }
    }

    /**
     * Before filter for rpc
     */
    before(serverId, msg, opts, next) {
        opts = opts || {};
        if (!!toobusy && toobusy()) {
            rpcLogger.warn('Server too busy for rpc request, serverId:' + serverId + ' msg: ' + msg);
            let err = new Error('Backend server ' + serverId + ' is too busy now!');
            err.code = 500;
            next(err);
        } else {
            next();
        }
    }

    after(serverId, msg, opts, next) {
        next();
    }
}