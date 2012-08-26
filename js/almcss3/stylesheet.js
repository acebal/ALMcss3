var ALMCSS = ALMCSS || {};

ALMCSS.stylesheet = function() {

	'use strict';

	var AlmcssError = ALMCSS.AlmcssError;
	var assert = ALMCSS.debug.assert;
	var logger = ALMCSS.debug.getLogger('Stylesheet loader');
	var log = logger.log;
	var warn = logger.warn;

	//var cssCache = {};
	var cssCache = '';
	var howManyLoaded = 0;

	// Initialise the `cssCache` object that will store the full text of all
	// the style sheets associated to this document, using as a property for
	// each style sheet the value of its `href` property, or `'inline'` for
	// the style included with the STYLE element.
	//
	// This function creates the properties for all the style sheets, which are
	// initially set to `false`, until the content of each style sheet is stored
	// in its associate property.
	//
	var init = function() {
		assert(document.styleSheets, 'This browser does not support document.styleSheets');
		for (var i = 0; i < document.styleSheets.length; i++) {
			var sheet = document.styleSheets[i];
			var key = sheet.href ? sheet.href : 'inline';
			cssCache[key] = false;
		}
	};

	var getPath = function() {
		var result = window.location.href.substr(0, (location.href).lastIndexOf('/') + 1);
		return result;
	};

	var readFile = function(file) {
		var path = getPath() + file;
		var result;
		var ajax = new XMLHttpRequest();
		ajax.onreadystatechange = function() {
			if (ajax.readyState === 4) {
				if (typeof ajax.status === 'undefined' || ajax.status === 200 || status === 304) {
					result = ajax.responseText;
				} else if (ajax.status === 0 && ajax.responseText !== '') {
					warn('An AJAX status 0 was returned, but the contents of the file seems to have been read');
					result = ajax.responseText;
				} else {
					throw new AlmcssError('The file ' +  file + ' could not be read');
				}
			}
		};
		ajax.open('GET', path, false);
		ajax.send(null);
		log('OK');
		return result;
	};

	// Checks whether the style sheet received as a parameter is inline, that
	// is, whether it has been associated to the document through the STYLE
	// element. To do that, the value of its `href` property is checked: if it
	// is null, the style sheet is inline, and this function returns `true`;
	// otherwise, it will contain the URI of the linked external sheet, and
	// therefore `false` will be returned.
	//
	// The same could also have been determined by checking the value of its
	// attribute `ownerNode`: for inline style sheets it should be a STYLE
	// element, whereas for external style sheets it should be a LINK element.

	var isInline = function(styleSheet) {
		if (styleSheet.href) {
			assert(styleSheet.ownerNode.nodeName.toLowerCase() === 'link',
				'Style sheets object for which the value of their \'href\' property ' +
				'is not null, are supposed to have \'link\' as their owner node');
			return false;
		}
		assert(styleSheet.ownerNode.nodeName.toLowerCase() === 'style',
			'Style sheets object for which the value of their \'href\' property ' +
			'is null, are supposed to have \'style\' as their owner node');
		return true;
	};

	// Checks whether the style sheet received as a parameter is external, that
	// is, whether it has been associated to the document through a LINK element.

	var isExternal = function(styleSheet) {
		return !isInline(styleSheet);
	};


	// What does it happen with imported style sheets?


	// Returns the contents of the inline style sheet received as a parameter.

	var readInlineStyleSheet = function(styleSheet) {
		assert(isInline(styleSheet), 'This functions expects an inline style sheet');
		var cssContent;
		if (styleSheet.cssText) { // IE
			log('Loading the CSS inside the STYLE element (via StyleSheet.cssText)...');
			cssContent = styleSheet.cssText;
		} else {
			// Otherwise (other browser different than IE), the content of the
			// STYLE element that contains this inline style sheet is obtained
			log('Loading the CSS inside the STYLE element (via STYLE.innerHTML)...');
			var htmlStyleElement = styleSheet.ownerNode;
			cssContent = htmlStyleElement.innerHTML;
		}
		log('OK');
		return cssContent;
	};

	// Return the contents of the external style sheet received as a parameter.

	var readExternalStyleSheet = function(styleSheet) {
		assert(isExternal(styleSheet), 'This functions expects an external style sheet');
		var cssCode;
		var url = styleSheet.href;
		// In IE, the entire content of the style sheet is available via the
		// `cssText` property of the `StyleSheet` object
		if (styleSheet.cssText) {
			log('Loading an external style sheet (' + url + ') [IE]...');
			cssCode = styleSheet.cssText;
		} else {
			log('Loading an external style sheet (' + url + ')...');
			var ajax = new XMLHttpRequest();
			ajax.onreadystatechange = function() {
				if (ajax.readyState === 4) {
					if (typeof ajax.status === 'undefined' || ajax.status === 200 || status === 304) {
						cssCode = ajax.responseText;
					} else if (ajax.status === 0 && ajax.responseText !== '') {
						warn('An AJAX status 0 was returned, but the contents of the file seems to have been read');
						cssCode = ajax.responseText;
					} else {
						throw new AlmcssError('The external style sheet ' +  url + ' could not be read');
					}
				}
			};
			ajax.open('GET', url, false);
			ajax.send(null);
			log('OK');
			return cssCode;
		}
	};

	var loadCssCache = function(styleSheet) {
		if (isInline(styleSheet)) {
			cssCache = cssCache + readInlineStyleSheet(styleSheet);
		} else {
			assert(isExternal(styleSheet));
			cssCache = cssCache + readExternalStyleSheet(styleSheet);
		}
	};

	// Loads all the style sheets associated with this document. This includes
	// the content of the STYLE element and every external style sheet included
	// with a LINK element.

	var loadStyleSheets = function() {
		//init();
		//assert(cssCache.length === document.styleSheets.length, "'init' has not been called");
		logger.group('Loading style sheets...');
		for (var i = 0; i < document.styleSheets.length; i++) {
			loadCssCache(document.styleSheets[i]);
		}
		log('All style sheets have been loaded.');
		logger.info(cssCache);
		logger.groupEnd();
		return cssCache;
	};

	return {
		readExternalStyleSheet: readExternalStyleSheet,
		readFile: readFile
	};

}();

