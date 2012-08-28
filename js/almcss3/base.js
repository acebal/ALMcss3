var ALMCSS = function() {

	'use strict';

	// AlmcssError
	// -----------
	//
	// This is the base `Error` object for all the other types of errors that
	// may be thrown by ALMcss.

	var AlmcssError = function(message) {
		this.message = message;
	};

	AlmcssError.prototype = Object.create(Error.prototype);

}();