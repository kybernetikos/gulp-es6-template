'use strict';

var global = Function('return this')();
var es6Gulp = global.es6Gulp;
if (es6Gulp === undefined) {
	es6Gulp = require('../');
	delete require.cache[require.resolve('../')];
}


describe('this jasmine test', function() {
	it('should run unit test and pass', function () {
		expect(es6Gulp.fred).toEqual(66);
	});
});