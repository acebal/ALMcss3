var ALMCSS = ALMCSS || {};

ALMCSS.util = function() {

	'use strict';

	var assert = ALMCSS.debug.assert;

	// This function simply returns the computed value of the `width` property
	// of CSS for the specified HTML element. The reason for using a function
	// for that instead of simply calling directly to the `getComputedStyle`
	// function of the DOM from those places in the code where this value is
	// needed is not (only) for brevity, but because `getComputedStyle` returns
	// a string that contains both the value and the unit (we are assuming that
	// the unit is always pixels). So this function performs the additional
	// task of extracting the part of the string which is a number and converting
	// it to a numeric value, which is what it returns.

	var getComputedWidth = function(element) {
		var result;
		result = getComputedStyle(element, null).getPropertyValue('width');
		result = parseInt(result.match(/\d+/), 10);
		assert(!isNaN(result));
		return result;
	};

	return {
		getComputedWidth: getComputedWidth
	};

}();