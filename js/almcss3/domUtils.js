// DomUtils
// --------

var ALMCSS = ALMCSS || {};

ALMCSS.domUtils = function() {

	'use strict';

	var assert = ALMCSS.debug.assert,
		LoggerLevel = ALMCSS.debug.LoggerLevel,
		logger = ALMCSS.debug.getLogger('DOM Utils', LoggerLevel.all),
		log = logger.log,
		info = logger.info;

	// Computed Height and Widths
	// --------------------------
	//
	// The `getComputedWidth` and `getComputedHeight` functions of this module
	// return the computed value for the `width` and `height` respectively of
	// a given element. There are several reasons for using these functions
	// instead of simple calling directly to the `getComputedStyle` function
	// of the DOM from those places in the code where theses values are needed
	// (apart from brevity and legibility of the code):
	//
	// - First, `getComputedStyle` returns a string that contains both the
	//   value and the unit. So this functions extract the part of the string
	//   that is a number, which is what they return, ignoring the unit. Note
	//   that __they are assuming that it is always pixels__. If it were not
	//   so, there have been to call to do an extra step to convert it to the
	//   correct numeric value in pixels for a given length (or percentage).
	// - More important, these functions take into consideration not only the
	//   _width_ of the element, but also its related horizontal _margins,
	//   paddings and borders_ (the specified element is supposed to be part
	//   of the contents of a slot).


	var getComputedStyleOf = function(element, property) {
		var result, stringValue;
		stringValue = getComputedStyle(element, null).getPropertyValue(property);
		result = parseInt(stringValue.match(/\d+/), 10);
		assert(!isNaN(result), "The value of property '" + property + "' is not " +
			"something can be converted to a number (pixels was expected): " + stringValue);
		return result;
	};

	// Returns the computed width of an element, using not only the value
	// of its _width_ property but also its margins, paddings and borders.

	var getComputedWidth = function(element) {
		var width, marginLeft, marginRight, paddingLeft, paddingRight,
			borderLeft, borderRight;

		width = getComputedStyleOf(element, 'width');
		//marginLeft = getComputedStyleOf(element, 'margin-left');
		//marginRight = getComputedStyleOf(element, 'margin-right');
		paddingLeft = getComputedStyleOf(element, 'padding-left');
		paddingRight = getComputedStyleOf(element, 'padding-right');
		borderLeft = getComputedStyleOf(element, 'border-left-width');
		borderRight = getComputedStyleOf(element, 'border-right-width');
		return width + /* marginLeft + marginRight */ +
				paddingLeft + paddingRight + borderLeft + borderRight;
	};

	// The same function than above, but for the computed height of a given
	// HTML element.

	var getComputedHeight = function(element) {
		var height, marginTop, marginBottom, paddingTop, paddingBottom,
			borderTop, borderBottom;

		log('Getting the computed height of element %o', element);

		height = getComputedStyleOf(element, 'height');
		log('Computed height = %d px', height);
		paddingTop = getComputedStyleOf(element, 'padding-top');
		paddingBottom = getComputedStyleOf(element, 'padding-bottom');
		borderTop = getComputedStyleOf(element, 'border-top-width');
		borderBottom = getComputedStyleOf(element, 'border-bottom-width');
		return height + /* marginTop + marginBottom + */
			paddingTop + paddingBottom + borderTop + borderBottom;

	};



	// Length to Pixels
	// ----------------

	// Given a `Length` object (defined in `ALMCSS.template` module) and a
	// container HTML element, converts and returns a number that represents
	// that length in pixels. The container element is needed for 'em' lengths,
	// which depend on the font size of the parent element.

	var lengthToPixels = function(length, containerElement) {
		var result, element;
		element = document.createElement('div');
		element.style.visibility = 'hidden';
		element.style.width = length.toString();
		containerElement.appendChild(element);
		result = getComputedWidth(element);
		log('Length %o was converted to %d pixels', length, result);
		containerElement.removeChild(element);
		return result;
	};



	// Intrinsic Minimum and Intrinsic Preferred Widths
	// ------------------------------------------------

	var computeIntrinsicPreferredWidth = function(element) {
		var floatValue, intrinsicPreferredWidth;
		floatValue = getComputedStyle(element, null).getPropertyValue('float');
		element.style.cssFloat = 'left';
		intrinsicPreferredWidth = getComputedWidth(element);
		element.style.cssFloat = floatValue;
		return intrinsicPreferredWidth;
	};

	var computeIntrinsicPreferredWidth2 = function(element) {
		var intrinsicPreferredWidth;
		element.style.cssFloat = 'left';
		intrinsicPreferredWidth = getComputedWidth(element);
		element.style.cssFloat = 'none';
		return intrinsicPreferredWidth;
	};

	// http://james.padolsey.com/javascript/find-and-replace-text-with-javascript/
	var replaceSpacesByBr = function(element) {

		var TEXT_NODE = 3, ELEMENT_NODE = 1;

		var i, j, children = element.childNodes, currentNode, words, html, span;
		for (i = 0; i < children.length; i++) {
			currentNode = children[i];
			if (currentNode.nodeType === ELEMENT_NODE) {
				replaceSpacesByBr(currentNode);
			}
			if (currentNode.nodeType === TEXT_NODE) {
				// http://stackoverflow.com/questions/2817646/javascript-split-string-on-space-or-on-quotes-to-array
				words = currentNode.data.match(/\w+/g);
				span = document.createElement('span');
				if (words) {
					html = '';
					for (j = 0; j < words.length; j++) {
						html = html + words[j] + '<br/>';
					}
					span.innerHTML = html;
					// http://www.dzone.com/snippets/javascript-dom-method
					currentNode.parentNode.replaceChild(span, currentNode);
				}
			}
		}
	};

	var computeIntrinsicMinimumWidth = function(element) {
		var result, currentContent = element.innerHTML;
		replaceSpacesByBr(element);
		result = computeIntrinsicPreferredWidth(element);
		element.innerHTML = currentContent;
		return result;
	};



	// Content Height of an Element
	// ----------------------------

	// Returns the height of an HTML element for a given width. It is used
	// for computing the height of the slots once all the width computations
	// have finished. Note that this function has the secondary effect of
	// setting the value of the `element` `style.width` property to the
	// specified `width`.
	//
	// __Can this be done without changing its width?__

	var computeContentHeight = function(element, width) {
		var result;
		logger.group('Computing the contents height of an element...');
		log('Current width of %o is %d pixels',
			element, getComputedWidth(element));
		element.style.width = width + 'px';
		log('Width set to %d pixels to compute its height', width);
		result = getComputedHeight(element);
		info('Contents height of the element is: %d pixels', result);
		logger.groupEnd();
		return result;
	};



	// Add Event
	// ---------

	var addEvent = function(obj, event, whenDone) {
		if (obj && obj.addEventListener) { // W3C
			obj.addEventListener(event, whenDone, false);
		} else if (obj && obj.attachEvent) { // Older IE
			obj.attachEvent("on" + event, whenDone);
		}
	};



	// Public Functions Exported by This Module
	// ----------------------------------------

	return {
		getComputedStyleOf: getComputedStyleOf,
		getComputedWidth: getComputedWidth,
		getComputedHeight: getComputedHeight,
		lengthToPixels: lengthToPixels,
		computeIntrinsicPreferredWidth: computeIntrinsicPreferredWidth,
		computeIntrinsicMinimumWidth: computeIntrinsicMinimumWidth,
		computeContentHeight: computeContentHeight,
		addEvent: addEvent
	};

}();