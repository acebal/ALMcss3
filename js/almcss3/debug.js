// Debug
// -----
// File: `debug.js`
//
// This module provides some debugging facilities (assertions and logging) to
// all the other ALMCSS modules. It is basically a wrapper of the Firebug
// `console` object and its methods `log`, `debug`, `info`, `warn`, and `error`
// methods, as well as `assert` for assertions. It also adds some other
// functionality, such as the ability to create different named loggers that
// can be enabled and disabled individually. Thus, instead of relaying on a
// single global logger object, ALMCSS will typically create one logger per
// module. This is also convenient for displaying the name of the logger that
// is writing each message on the console.

var ALMCSS = ALMCSS || {};

ALMCSS.module.include(['lib/firebug-lite.js']);

ALMCSS.debug = function () {

	'use strict';

	var debug = true;
	var loggers = {};

	var init = function () {

		var console = window.console;

		// This array contains the names of the method that are going to be
		// automatically implemented in the `Logger` object, ensuring that
		// if a `console` object is available and contains each method, they
		// are delegated to it, but that they do not cause an error when they
		// are invoked if there is not a `console` object of it does not
		// provide a certain method.

		var methods = ['log', 'debug', 'info', 'warn', 'error', 'group',
			'groupCollapsed', 'groupEnd', 'trace'];

		// Dynamically generates the methods provided by the `Logger` object:
		// `log`, `debug`, `info`, `warn`, `error`, `group`, `groupCollapsed`,
		// `groupEnd`, and `trace`. If the `console` object exists and contains
		// the method of that name, the logger method simply delegates on it.
		// Thus, for example, the implementation of the `log` method would be:
		//
		//     Logger.property.log = function() {
		//         if (debug)
		//             console.log.apply(console, arguments);
		//     };
		//
		// Otherwise (if the `console` object is not available, or it does not
		// contain a certain method), an empty method will be generated:
		//
		//     Logger.property.log = function() {};

		for (var i = 0; i < methods.length; i++) {
			createLoggerMethod(methods[i]);
		}

		// Each method has to be generated wrapping the method creation in this
		// other function, to avoid the problems with creating functions inside
		// loops and closures in JavaScript.

		function createLoggerMethod(method) {
			if (console && console[method]) {
				Logger.prototype[method] = function () {
					if (debug) {
						console[method].apply(console, arguments);
					} else {
						Logger.prototype[method] = function () {
						};
					}
				};
			}
		}
	};

	// Returns the previously created logger of that name, if it exists, or
	// creates and returns a new one, adding it to the list of created
	// loggers.

	var getLogger = function (name) {

		Assert.isString(name, 'A valid name must be provided for getting a logger');

		if (!loggers[name]) {
			loggers[name] = new Logger(name);
		}
		return loggers[name];
	};

	// Logger
	// ------
	//

	var Logger = function (name) {
		this.name = name;
	};

	// Assertions
	// ----------

	var AssertionError = function (message) {
		Error.call(this, 'AssertionError', message);
	};

	AssertionError.prototype = Object.create(Error.prototype);

	var Assert = {

		isTrue:function (condition, message) {
			if (debug && !condition) {
				throw new AssertionError(message);
			}
		},

		// Checks that the received string is actually a valid string. That is,
		// whether it is a `string` object and it is not empty. That includes
		// removing whitespaces from the beginning and the end of the string,
		// so, for example, the string `"   "` would not be valid. Otherwise,
		// an `AssertionException` is thrown.
		isString:function (string, message) {
			this.isTrue(typeof string === 'string' && string.trim().length > 0, message);
		}
	};

	return {
		init: init,
		getLogger: getLogger,
		Assert: Assert,
		assert: Assert.isTrue,
		AssertionError: AssertionError
	};

}();