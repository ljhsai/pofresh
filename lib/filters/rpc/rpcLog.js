/**
 * Filter for rpc log.
 * Record used time for remote process call.
 */
let rpcLogger = require('pofresh-logger').getLogger('rpc-log', __filename);
let utils = require('../../util/utils');

module.exports = function() {
  return new Filter();
};

let Filter = function () {
}; 

Filter.prototype.name = 'rpcLog';

/**
 * Before filter for rpc
 */

Filter.prototype.before = function(serverId, msg, opts, next) {
  opts = opts||{};
  opts.__start_time__ = Date.now();
  next();
};

/**
 * After filter for rpc
 */
Filter.prototype.after = function(serverId, msg, opts, next) {
  if(!!opts && !!opts.__start_time__) {
    let start = opts.__start_time__;
    let end = Date.now();
    let timeUsed = end - start;
    let log = {
      route: msg.service,
      args: msg.args,
      time: utils.format(new Date(start)),
      timeUsed: timeUsed
    };
    rpcLogger.info(JSON.stringify(log));
  }
  next();
};
