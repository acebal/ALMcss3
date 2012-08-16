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

	var load = function(file, whenDone) {
		var script = document.getElementsByTagName('script')[0];
		var module = document.createElement('script');
		module.setAttribute('type', 'text/javascript');
		module.onload = function() {
			loadedModules.push(file);
			whenDone.call(null);
		};
		module.setAttribute('src', file);
		script.parentNode.insertBefore(module, script);
	};

	// http://www.denys-klymenko.com/blog/loading-external-javascript-files-dynamically-and-synchronously/
	var include = function(files, whenDone) {

		function whenLoaded() {
			files.shift();
			if (files.length === 0) {
				whenDone.call(null);
			} else {
				include.apply(this, [files, whenDone]);
			}
		}

		var file = files[0];

		if (!isAlreadyLoaded(file)) {
			load(file, whenLoaded);
		}
	};


	return {
		include: include
	};

}();

var init = function() {

	ALMCSS.debug.init();
	var getLogger = ALMCSS.debug.getLogger;
	var parser = ALMCSS.parser;

	var logger = getLogger("MyLogger");
	logger.log("Hello, world!");
	parser.init(
"h1 {
  color: red;
}");


};

window.onload = function () {
	var include = ALMCSS.module.include;
	//include('js/almcss3/debug.js', init);
	include(['js/almcss3/debug.js', 'js/almcss3/parser.js'], init);
	//include(['js/almcss3/debug.js'], init);


};