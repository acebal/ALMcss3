// ALMCSS3

var ALMCSS = function() {

	'use strict';

	var AlmcssError = function(message) {
		this.name = 'AlmcssError';
		this.message = message;
	};

	AlmcssError.prototype = Object.create(Error.prototype);

	return {
		AlmcssError: AlmcssError
	};

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

	/*
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
	*/

	var include = function(files, whenDone) {

		var file = files[0];
		if (isAlreadyLoaded(file)) {
			return;
		}
		var script = document.getElementsByTagName('script')[0];
		var module = document.createElement('script');
		module.setAttribute('type', 'text/javascript');
		module.onload = function() {
			files.shift();
			if (files.length === 0) {
				whenDone.call(null);
			} else {
				include.apply(this, [files, whenDone]);
			}
		};
		module.setAttribute('src', file);
		script.parentNode.insertBefore(module, script);
		loadedModules.push(file);

	};


	return {
		include: include
	};

}();

var init = function() {

	ALMCSS.debug.init();
	var getLogger = ALMCSS.debug.getLogger;

	var css = ALMCSS.stylesheet.loadStyleSheets();
	lexer.init(css);
	var token;
	while ((token = lexer.nextToken()) !== Token.EOF) {
		log(token.toString());
	}
	log('Fin de fichero');
};

window.onload = function () {
	var include = ALMCSS.module.include;
	//include('js/almcss3/debug.js', init);
	include(['js/almcss3/debug.js', 'js/almcss3/stylesheet.js', 'js/almcss3/lexer.js'], init);
	//include(['js/almcss3/debug.js'], init);


};