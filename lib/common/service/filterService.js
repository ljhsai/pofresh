const logger = require('pofresh-logger').getLogger('pofresh', __filename);

/**
 * Filter service.
 * Register and fire before and after filters.
 */
class Service {
    constructor() {
        this.name = 'filter';
        this.befores = [];    // before filters
        this.afters = [];     // after filters
    }

    /**
     * Add before filter into the filter chain.
     *
     * @param filter {Object|Function} filter instance or filter function.
     */
    before(filter) {
        this.befores.push(filter);
    }

    /**
     * Add after filter into the filter chain.
     *
     * @param filter {Object|Function} filter instance or filter function.
     */
    after(filter) {
        this.afters.unshift(filter);
    }

    /**
     * Do the before filter.
     * Fail over if any filter pass err parameter to the next function.
     *
     * @param msg {Object} clienet request msg
     * @param session {Object} a session object for current request
     * @param cb {Function} cb(err) callback function to invoke next chain node
     */
    beforeFilter(msg, session, cb) {
        let index = 0, self = this;
        let next = function (err, resp, opts) {
            if (err || index >= self.befores.length) {
                cb(err, resp, opts);
                return;
            }

            let handler = self.befores[index++];
            if (typeof handler === 'function') {
                handler(msg, session, next);
            } else if (typeof handler.before === 'function') {
                handler.before(msg, session, next);
            } else {
                logger.error('meet invalid before filter, handler or handler.before should be function.');
                next(new Error('invalid before filter.'));
            }
        }; //end of next

        next();
    }

    /**
     * Do after filter chain.
     * Give server a chance to do clean up jobs after request responsed.
     * After filter can not change the request flow before.
     * After filter should call the next callback to let the request pass to next after filter.
     *
     * @param err {Object} error object
     * @param session {Object} session object for current request
     * @param {Object} resp response object send to client
     * @param cb {Function} cb(err) callback function to invoke next chain node
     */
    afterFilter(err, msg, session, resp, cb) {
        let index = 0, self = this;

        function next(err) {
            //if done
            if (index >= self.afters.length) {
                cb(err);
                return;
            }

            let handler = self.afters[index++];
            if (typeof handler === 'function') {
                handler(err, msg, session, resp, next);
            } else if (typeof handler.after === 'function') {
                handler.after(err, msg, session, resp, next);
            } else {
                console.log(handler);
                logger.error('meet invalid after filter, handler or handler.after should be function.');
                next(new Error('invalid after filter.'));
            }
        } //end of next

        next(err);
    }

}

module.exports = Service;