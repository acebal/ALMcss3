// ALMCSS3

var ALMCSS = function() {

	'use strict';

	var SCRIPT_NAME = 'almcss.js';

	// AlmcssError

	var AlmcssError = function(message) {
		this.name = 'AlmcssError';
		this.message = message;
	};

	AlmcssError.prototype = Object.create(Error.prototype);

	// basePath

	// http://stackoverflow.com/questions/2161159/get-script-path
	var getBasePath = function() {
		var scripts = document.getElementsByTagName('script'),
			i, length;

		for (i = 0; i < scripts.length; i++) {
			var src = scripts[i].getAttribute('src');
			length = src.length - SCRIPT_NAME.length;
			var name = src.substr(length);
			if (name === SCRIPT_NAME) {
				return src.substr(0, length);
			}
		}
	};

	var basePath = getBasePath();

	var module = function() {

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
			module.setAttribute('src', basePath + file);
			script.parentNode.insertBefore(module, script);
			loadedModules.push(file);
		};

		return {
			include: include
		};

	}(); // module

	var init = function() {
		var LoggerLevel = ALMCSS.debug.LoggerLevel,
			logger = ALMCSS.debug.getLogger('ALMCSS3 Main Function', LoggerLevel.all),
			parser = ALMCSS.parser.Parser,
			log = logger.log,
			info = logger.info,
			templates = ALMCSS.template.templates,
			createTemplateElements = ALMCSS.template.dom.createTemplateElements,
			positionedElements = ALMCSS.template.positionedElements,
			moveElementsIntoSlots = ALMCSS.template.dom.moveElementsIntoSlots,
			i;

		info('Starting the main function of ALMCSS3...');
		var cssCache = ALMCSS.stylesheet.loadStyleSheets();
		parser.parse(cssCache);
		if (templates.length) {
			info(templates.length + ' templates were found:\n');
			for (i = 0; i < templates.length; i++) {
				info(templates[i] + '\n');
				if (i < templates.length - 1) {
					info('---------------------------\n');
				}
			}
		} else {
			info('No templates were found');
		}
		createTemplateElements(templates);
		moveElementsIntoSlots(positionedElements);
	};

	var loadModules = function() {

		var include = module.include;

		include([
			'debug.js',
			'stylesheet.js',
			'css.js',
			'parser.js',
			'width.js',
			'template.js',
			'template_dom.js'
		], init);
	};

	return {
		module: module,
		AlmcssError: AlmcssError,
		start: loadModules
	};

}();

window.onload = function () {

	'use strict';

	ALMCSS.start();

};