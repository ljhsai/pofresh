/**
 * Filter for statistics.
 * Record used time for each request.
 */
let conLogger = require('pofresh-logger').getLogger('con-log', __filename);
let utils = require('../../util/utils');

module.exports = function() {
  return new Filter();
};

let Filter = function() {
};

Filter.prototype.before = function(msg, session, next) {
  session.__startTime__ = Date.now();
  next();
};

Filter.prototype.after = function(err, msg, session, resp, next) {
  let start = session.__startTime__;
  if(typeof start === 'number') {
    let timeUsed = Date.now() - start;
    let log = {
      route : msg.__route__,
      args : msg,
      time : utils.format(new Date(start)),
      timeUsed : timeUsed
    };
    conLogger.info(JSON.stringify(log));
  }
  next(err);
};
