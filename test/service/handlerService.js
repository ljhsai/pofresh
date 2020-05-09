let should = require('should');
let HandlerService = require('../../lib/common/service/handlerService');

let mockApp = {
  serverType: 'connector',

  get: function(key) {
    return this[key];
  }
};

let mockSession = {
  exportSession: function() {
    return this;
  }
};

let mockMsg = {key: 'some request message'};
let mockRouteRecord = {serverType: 'connector', handler: 'testHandler', method: 'testMethod'};

describe('handler service test', function() {
  describe('handle', function() {
    it('should dispatch the request to the handler if the route match current server type', function(done) {
      let invoke1Count = 0, invoke2Count = 0;
      // mock datas
      let mockHandlers = {
        testHandler: {
          testMethod: function(msg, session, next) {
            invoke1Count++;
            msg.should.eql(mockMsg);
            next();
          }
        },
        test2Handler: {
          testMethod: function(msg, session, next) {
            invoke2Count++;
            next();
          }
        }
      };

      let mockOpts = {};

      let service = new HandlerService(mockApp, mockOpts);
      service.handlerMap = {connector: mockHandlers};

      service.handle(mockRouteRecord, mockMsg, mockSession, function() {
        invoke1Count.should.equal(1);
        invoke2Count.should.equal(0);
        done();
      });
    });

    it('should return an error if can not find the appropriate handler locally', function(done) {
      let mockHandlers = {};
      let mockOpts = {};
      let service = new HandlerService(mockApp, mockOpts);
      service.handlerMap = {connector: mockHandlers};

      service.handle(mockRouteRecord, mockMsg, mockSession, function(err) {
        should.exist(err);
        done();
      });
    });
  });
});
