var main = require('./es5/app');
if (main.default) {
	module.exports = main.default;
} else {
	module.exports = main;
}