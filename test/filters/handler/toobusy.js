const should = require('should');
const toobusyFilter = require('../../../lib/filters/handler/toobusy');
const FilterService = require('../../../lib/common/service/filterService');
const mockSession = {
    key: "123"
};

describe("#toobusyFilter", function () {
    it("should do before filter ok", function (done) {
        const service = new FilterService();
        const filter = toobusyFilter();
        service.before(filter);

        service.beforeFilter(null, mockSession, function (err) {
            should.not.exist(err);
            should.exist(mockSession);
            done();
        });
    });

    it("should do before filter error because of too busy", function (done) {
        const service = new FilterService();
        const filter = toobusyFilter();
        service.before(filter);

        let exit = false;

        function load() {
            service.beforeFilter(null, mockSession, function (err, resp) {
                should.exist(mockSession);
                if (!!err) {
                    exit = true;
                }
            });

            if (exit) {
                return done();
            }
            let start = new Date();
            while ((new Date() - start) < 250) {
                for (let i = 0; i < 1e5;) i++;
            }
            setTimeout(load, 0);
        }

        load();

    }).timeout(3000);
});
