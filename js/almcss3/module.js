var ALMCSS = ALMCSS || {};

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