// ALMCSS3

var ALMCSS = function() {

	'use strict';

	var AlmcssException = function(message) {
		Error.call(this, 'AlmcssException', message);
	};

	AlmcssException.prototype = Object.create(Error.prototype);

	return {};

}();

ALMCSS.module = function() {

	'use strict';

	var loadedModules = [];

	var isAlreadyLoaded = function(file) {
		return loadedModules.indexOf(file) !== -1;
	};

	var include = function(file, callback) {
		callback = callback || function () {};
		if (isAlreadyLoaded(file)) {
			callback();
			return;
		}
		var script = document.getElementsByTagName('script')[0];
		var module = document.createElement('script');
		module.onload = function() {
			callback();
		};
		module.src = file;
		script.parentNode.insertBefore(module, script);
	};

	return {
		include: include
	};

}();

/*
function prueba() {
	var List = ALMCSS.basis.collections.List;
	var numbers = new List(['monday', 'tuesday', 'wednesday']);
	console.log(numbers.indexOf('monday'));
	console.log(numbers.contains('tuesday'));
	console.log(numbers.contains('february'));
}
*/

var init = function() {

	ALMCSS.debug.init();
	var getLogger = ALMCSS.debug.getLogger;

	var logger = getLogger("MyLogger");
	logger.log("Hello, world!");

};

window.onload = function () {
	var include = ALMCSS.module.include;
	include('js/almcss3/debug.js', init);


};