'use strict';

var global = Function('return this')();
var es6Gulp = global.gulpEs6Template;
if (es6Gulp === undefined) {
	es6Gulp = require('../');
	delete require.cache[require.resolve('../')];
}

describe('this jasmine test', function() {
	it('should run unit test and pass', function () {
		expect(es6Gulp.fred).toEqual(66);
	});
	it('should run another unit test and pass', function () {
		expect(true).toEqual(true);
	});

});