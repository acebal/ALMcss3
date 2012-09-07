/*
INTELLECTUAL PROPERTY

    ALMcss is a Javascript browser plugin whose aim is to provide an
    experimental implementation of the CSS3 Template Layout Module
    (http://www.w3.org/TR/css3-layout/). It has been rewritten by the
	scratch in 2012 by César Acebal (University of Oviedo). A first
	version was due to María Rodríguez and Miguel García, as a part
	of the project "Extensión al estándar CSS3 que permita la adaptación
	multidispositivo de contenidos web" funded by Fundación CTIC
    (www.fundacionctic.org), directed by César Acebal as a part of his
    Ph. D. Thesis at University of Oviedo, advised by Juan M. Cueva
    (University of Oviedo) and Bert Bos (W3C).
    
    ALMcss is licensed to any third party world wide under the provisions
    of the W3C Software License annexed below, including the provisions of
    the DISCLAIMER below that also benefits the authors of ALMcss.
    
    Copyright © 2012 César Acebal (University of Oviedo). All Rights Reserved.
                          
W3C IPR SOFTWARE NOTICE

    http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231

    This W3C work (and included software, documentation such as READMEs,
    or other related items) is being provided by the copyright holders under
    the following license. By obtaining, using and/or copying this work, you
    (the licensee) agree that you have read, understood, and will comply with
    the following terms and conditions:

    Permission to copy, modify, and distribute
    this software and its documentation, with or without modification,  for
    any purpose and without fee or royalty is hereby granted, provided that you
    include the following on ALL copies of the software and documentation or
    portions thereof, including modifications, that you make:

       1. The full text of this NOTICE in a location viewable to users of the
          redistributed or derivative work.
       2. Any pre-existing intellectual property disclaimers, notices, or
          terms and conditions. If none exist, a short notice of the following
          form (hypertext is preferred, text is permitted) should be used
          within the body of any redistributed or derivative code: "Copyright
          (c) World Wide Web Consortium, (Massachusetts Institute of
          Technology, Institut National de Recherche en Informatique et en
          Automatique, Keio University). All Rights Reserved.
          http://www.w3.org/Consortium/Legal/"
       3. Notice of any changes or modifications to the W3C files, including
          the date changes were made. (We recommend you provide URIs to the
          location from which the code is derived).

    In addition, creators of derivitive works must include the full text of
    this NOTICE in a location viewable to users of the derivitive work.

    THIS SOFTWARE AND DOCUMENTATION IS PROVIDED "AS IS," AND COPYRIGHT HOLDERS
    MAKE NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT
    NOT LIMITED TO, WARRANTIES OF MERCHANTABILITY OR FITNESS FOR ANY
    PARTICULAR PURPOSE OR THAT THE USE OF THE SOFTWARE OR DOCUMENTATION WILL
    NOT INFRINGE ANY THIRD PARTY PATENTS, COPYRIGHTS, TRADEMARKS OR OTHER
    RIGHTS.

    COPYRIGHT HOLDERS WILL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, SPECIAL OR
    CONSEQUENTIAL DAMAGES ARISING OUT OF ANY USE OF THE SOFTWARE OR
    DOCUMENTATION.

    The name and trademarks of copyright holders may NOT be used in
    advertising or publicity pertaining to the software without specific,
    written prior permission. Title to copyright in this software and any
    associated documentation will at all times remain with copyright holders. 
*/

var ALMCSS = function() {

	'use strict';

	// If the name of this JavaScript file, which is the entry point and main
	// function of ALMcss, is changed, this variable needs also be modified to
	// represent the actual name of the file, since it is used by the `getBasePath`
	// function to extract from it the base path of ALMcss with respect to the
	// HTML document when it has been included, which is required to be able to
	// load all the other JavaScript files of ALMcss.

	var SCRIPT_NAME = 'almcss.js';


	var isResize = function() {
		return isResize;
	};

	if (!Object.create) {
		Object.create = function(o) {
			var F = function() {};
			F.prototype = o;
			return new F();
		}
	}

	if (!String.prototype.trim) {
		String.prototype.trim = function() {
			return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
		};
	}

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
			for (var i = 0; i < loadedModules.length; i++) {
				if (loadedModules[i] === file) {
					return true;
				}
			}
			return false;
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


	// The Full Layout Process
	// -----------------------

	var doLayout = function() {

		var	templates = ALMCSS.template.templates,
			LoggerLevel = ALMCSS.debug.LoggerLevel,
			logger = ALMCSS.debug.getLogger('Layout', LoggerLevel.all);

		var i;

		logger.group('Starting layout...');
		for (i = 0; i < templates.length; i++) {
			templates[i].doLayout();
		}
		logger.info('All done!');
		logger.groupEnd();

		ALMCSS.Config.isResize = true;

	};

	// Events
	// ------

	var addEvent = function(obj, event, whenDone) {
		if (obj && obj.addEventListener) { // W3C
			obj.addEventListener(event, whenDone, false);
		} else if (obj && obj.attachEvent) { // Older IE
			obj.attachEvent("on" + event, whenDone);
		}
	};

	var resizeTimer;

	var whenResize = function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(doLayout, 30);
	};

	// Main Function
	// -------------
	var init = function() {

		var templates = ALMCSS.template.templates,
			createTemplateElements = ALMCSS.template.dom.createTemplateElements,
			positionedElements = ALMCSS.template.positionedElements,
			slotPseudoElements = ALMCSS.template.slotPseudoElements,
			moveElementsIntoSlots = ALMCSS.template.dom.moveElementsIntoSlots,
			applyStyleToSlots = ALMCSS.template.dom.applyStyleToSlotPseudoElements,
			LoggerLevel = ALMCSS.debug.LoggerLevel,
			logger = ALMCSS.debug.getLogger('ALMCSS3 Main Function', LoggerLevel.all),
			parser = ALMCSS.stylesheet.parser.Parser,
			log = logger.log,
			info = logger.info,
			i;

		info('Starting the main function of ALMCSS3...');
		var cssCache = ALMCSS.stylesheet.loadStyleSheets();
		parser.parse(cssCache);
		if (templates.length) {
			info(templates.length + ' templates were found:\n');
			for (i = 0; i < templates.length; i++) {
				logger.group('Template %d:', i);
				info(templates[i] + '\n');
				logger.groupEnd();
			}
		} else {
			info('No templates were found');
		}

		createTemplateElements(templates);
		moveElementsIntoSlots(positionedElements);
		applyStyleToSlots(slotPseudoElements);
		doLayout();

		addEvent(window, 'resize', whenResize);

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
			'template/template.js',
			'stylesheet/parser.js',     // A CSS parser that recognised the Template Layout
										// Module properties and values.

			'domUtils.js',              // Several DOM utility functions for computing
										// intrinsic minimum and intrinsic preferred widths,
										// computed widths and heights and that sort of things.

			'template/layout.js',
			'template/dom.js'
		], init);
	};

	addEvent(window, 'load', loadModules);

	return {
		AlmcssError: AlmcssError,
		include: module.include,
		loadModules: loadModules
	};

}();
