const logger = require('pofresh-logger').getLogger('pofresh', __filename);
const utils = require('../util/utils');
const events = require('../util/events');
const Constants = require('../util/constants');

module.exports = function (opts, consoleService) {
    return new Module(opts, consoleService);
};

module.exports.moduleId = Constants.KEYWORDS.MONITOR_WATCHER;

class Module {
    constructor(opts, consoleService) {
        this.app = opts.app;
        this.service = consoleService;
        this.id = this.app.getServerId();

        this.app.event.on(events.START_SERVER, finishStart.bind(null, this));
    }

    start(cb) {
        subscribeRequest(this, this.service.agent, this.id, cb);
    }

    monitorHandler(agent, msg, cb) {
        if (!msg || !msg.action) {
            return;
        }
        let func = monitorMethods[msg.action];
        if (!func) {
            logger.info('monitorwatcher unknown action: %j', msg.action);
            return;
        }
        func(this, agent, msg, cb);
    }

}

// ----------------- monitor start method -------------------------

function subscribeRequest(self, agent, id, cb) {
    let msg = {action: 'subscribe', id: id};
    agent.request(Constants.KEYWORDS.MASTER_WATCHER, msg, function (err, servers) {
        if (err) {
            logger.error('subscribeRequest request to master with error: %j', err.stack);
            utils.invokeCallback(cb, err);
        }
        let res = [];
        for (let id in servers) {
            res.push(servers[id]);
        }
        addServers(self, res);
        utils.invokeCallback(cb);
    });
}

// ----------------- monitor request methods -------------------------

function addServer(self, agent, msg, cb) {
    logger.debug('[%s] receive addServer signal: %j', self.app.serverId, msg);
    if (!msg || !msg.server) {
        logger.warn('monitorwatcher addServer receive empty message: %j', msg);
        utils.invokeCallback(cb, Constants.SIGNAL.FAIL);
        return;
    }
    addServers(self, [msg.server]);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
}

function removeServer(self, agent, msg, cb) {
    logger.debug('%s receive removeServer signal: %j', self.app.serverId, msg);
    if (!msg || !msg.id) {
        logger.warn('monitorwatcher removeServer receive empty message: %j', msg);
        utils.invokeCallback(cb, Constants.SIGNAL.FAIL);
        return;
    }
    removeServers(self, [msg.id]);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
}

function replaceServer(self, agent, msg, cb) {
    logger.debug('%s receive replaceServer signal: %j', self.app.serverId, msg);
    if (!msg || !msg.servers) {
        logger.warn('monitorwatcher replaceServer receive empty message: %j', msg);
        utils.invokeCallback(cb, Constants.SIGNAL.FAIL);
        return;
    }
    replaceServers(self, msg.servers);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
}

function startOver(self, agent, msg, cb) {
    let fun = self.app.lifecycleCbs[Constants.LIFECYCLE.AFTER_STARTALL];
    if (!!fun) {
        fun.call(null, self.app);
    }
    self.app.event.emit(events.START_ALL);
    utils.invokeCallback(cb, Constants.SIGNAL.OK);
}

// ----------------- common methods -------------------------

function addServers(self, servers) {
    if (!servers || !servers.length) {
        return;
    }
    self.app.addServers(servers);
}

function removeServers(self, ids) {
    if (!ids || !ids.length) {
        return;
    }
    self.app.removeServers(ids);
}

function replaceServers(self, servers) {
    self.app.replaceServers(servers);
}

// ----------------- bind methods -------------------------

function finishStart(self, id) {
    let msg = {action: 'record', id: id};
    self.service.agent.notify(Constants.KEYWORDS.MASTER_WATCHER, msg);
}

let monitorMethods = {
    'addServer': addServer,
    'removeServer': removeServer,
    'replaceServer': replaceServer,
    'startOver': startOver
};
