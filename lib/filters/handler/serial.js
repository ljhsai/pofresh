/**
 * Filter to keep request sequence.
 */
let logger = require('pofresh-logger').getLogger('pofresh', __filename);
let taskManager = require('../../common/manager/taskManager');

module.exports = function(timeout) {
  return new Filter(timeout);
};

let Filter = function(timeout) {
  this.timeout = timeout;
};

/**
 * request serialization after filter
 */
Filter.prototype.before = function(msg, session, next) {
  taskManager.addTask(session.id, function(task) {
    session.__serialTask__ = task;
    next();
  }, function() {
    logger.error('[serial filter] msg timeout, msg:' + JSON.stringify(msg));
  }, this.timeout);
};

/**
 * request serialization after filter
 */
Filter.prototype.after = function(err, msg, session, resp, next) {
  let task = session.__serialTask__;
  if(task) {
    if(!task.done() && !err) {
      err = new Error('task time out. msg:' + JSON.stringify(msg));
    }
  }
  next(err);
};
