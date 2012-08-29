var ALMCSS = function() {

	'use strict';

	var AlmcssError = function(message) {
		this.message = message;
	};

	AlmcssError.prototype = Object.create(Error.prototype);

	return {
		AlmcssError: AlmcssError
	};

}();