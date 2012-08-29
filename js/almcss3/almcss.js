var ALMCSS = function() {

	'use strict';

	// If the name of this JavaScript file, which is the entry point and main
	// function of ALMcss, is changed, this variable needs also be modified to
	// represent the actual name of the file, since it is used by the `getBasePath`
	// function to extract from it the base path of ALMcss with respect to the
	// HTML document when it has been included, which is required to be able to
	// load all the other JavaScript files of ALMcss.

	var SCRIPT_NAME = 'almcss.js';

	// AlmcssError
	// -----------
	//
	// This is the base `Error` object for all the other types of errors that
	// may be thrown by ALMcss.

	var AlmcssError = function(message) {
		this.message = message;
	};

	AlmcssError.prototype = Object.create(Error.prototype);

	// getBasePath
	// -----------
	//
	// See <a href="http://stackoverflow.com/questions/2161159/get-script-path">
	// http://stackoverflow.com/questions/2161159/get-script-path</a>.

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

	// The base path of this script (regarding to the HTML document that has
	// included it) is obtained and saved in `basePath`, and this variable
	// will be passed to the `module` function responsible of loading all the
	// other external JavaScript files of ALMcss.

	var basePath = getBasePath();

	// Module
	// ------
	//
	// This module encapsulates the logic needed to dynamically load external
	// JavaScript files. It exports a single function, `include`, which may be
	// called from other modules to _import_ all the other modules that they
	// need (which they _depend_ on) that resides in different JavaScript files.
	//
	// It does not check dependencies, though, so the caller is responsible of
	// specifying the required modules in the appropriate order. However, it
	// performs a very simple checking to avoid load again a file that had
	// already been previously loaded.

	var module = function(basePath) {

		var loadedModules = [];

		var isAlreadyLoaded = function(file) {
			return loadedModules.indexOf(file) !== -1;
		};

		// This function is the responsible of dynamically loading all the specified
		// files and calling the received callback function, `whenDone`, once all
		// files have been successfully loaded by the browser. It is basically the
		// same function written by Denys Klymenko ([Loading external JavaScript
		// files dynamically and synchronously"][Klymenko]), with some minor
		// modifications.
		//
		// Param `files` must be an array of strings with the name (and the relative
		// path, if they reside in a different folder than that where this module
		// is being defined, that is, if they are not in the same folder than this
		// file) of the scripts to be loaded.
		//
		// [Klymenko]: http://www.denys-klymenko.com/blog/loading-external-javascript-files-dynamically-and-synchronously/

		var include = function(files, whenDone) {

			var file = files[0];
			if (isAlreadyLoaded(file)) {
				return;
			}
			var script = document.getElementsByTagName('script')[0];
			var module = document.createElement('script');
			module.setAttribute('type', 'text/javascript');
			module.setAttribute('src', basePath + file);
			module.onload = function() {
				files.shift();
				if (files.length === 0) {
					whenDone.call(null);
				} else {
					include.apply(this, [files, whenDone]);
				}
			};
			script.parentNode.insertBefore(module, script);
			loadedModules.push(file);
		};

		return {
			include: include
		};

	}(basePath);

	// Main Function
	// -------------
	var init = function() {

		var LoggerLevel = ALMCSS.debug.LoggerLevel,
			logger = ALMCSS.debug.getLogger('ALMCSS3 Main Function', LoggerLevel.all),
			parser = ALMCSS.stylesheet.parser.Parser,
			log = logger.log,
			info = logger.info,
			templates = ALMCSS.template.templates,
			createTemplateElements = ALMCSS.template.dom.createTemplateElements,
			positionedElements = ALMCSS.template.positionedElements,
			moveElementsIntoSlots = ALMCSS.template.dom.moveElementsIntoSlots,
			computeWidths = ALMCSS.template.sizing.computeWidths,
			computeHeights = ALMCSS.template.sizing.computeHeights,
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
		computeWidths(templates);
		computeHeights(templates);
	};

	// Loading Modules
	// ---------------

	var loadModules = function() {

		var include = module.include;

		include([
			'config.js',                // Global configuration parameters.
			'debug.js',                 // Assertions and logging.

			'stylesheet/stylesheet.js', // Loads all the style information (<style> element
										// and external stylesheets).
			'stylesheet/css.js',        // A simple CSS Object Model (used by the CSS parser).
			'stylesheet/parser.js',     // A CSS parser that recognised the Template Layout
										// Module properties and values.

			'domUtils.js',              // Several DOM utility functions for computing
										// intrinsic minimum and intrinsic preferred widths,
										// computed widths and heights and that sort of things.

			'template/template.js',
			'template/sizing.js',
			'template/dom.js'
		], init);
	};

	var setOnloadEvent = function(start) {
		var obj = window, event = 'load';
		if (obj && obj.addEventListener) { // W3C
			obj.addEventListener(event, start, false);
		} else if (obj && obj.attachEvent) { // Older IE
			obj.attachEvent("on" + event, start);
		} else {
			throw new AlmcssError('The load event could not be added');
		}
	};

	setOnloadEvent(loadModules);

	return {
		AlmcssError: AlmcssError,
		include: module.include,
		loadModules: loadModules
	};

}();
