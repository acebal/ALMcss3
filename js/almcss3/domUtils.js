// DomUtils
// --------

var ALMCSS = ALMCSS || {};

ALMCSS.domUtils = function() {

	'use strict';

	var assert = ALMCSS.debug.assert,
		LoggerLevel = ALMCSS.debug.LoggerLevel,
		logger = ALMCSS.debug.getLogger('DOM Utils', LoggerLevel.all),
		log = logger.log,
		info = logger.info,
		warn = logger.warn;

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


	// Utility Functions
	// -----------------

	// This function simply returns, for a given `property` name and
	// an `element`, the numeric value of its current _computed style_, once
	// removed the unit from the string returned by the DOM function
	// `getComputedStyle`. Note that it is expected to receive a property
	// which value be of the form {number}{unit}, like <tt>134px</tt>;
	// otherwise, an assertion error will be thrown.
	//
	// _Can we guarantee a consistent behaviour among browsers?_ During the
	// tests, no one returned values like <tt>'auto'</tt> for either `width`
	// or `height` properties, but&hellip;

	var getComputedStyleOf = function(element, property) {
		var result, stringValue;
		stringValue = getComputedStyle(element, null).getPropertyValue(property);
		result = parseInt(stringValue.match(/\d+/), 10);
		assert(!isNaN(result), "The value of property '" + property + "' is not " +
			"something can be converted to a number (pixels was expected): " + stringValue);
		return result;
	};

	// Given a `Length` object (defined in `ALMCSS.template` module) and a
	// container HTML element, converts and returns a number that represents
	// that length in pixels. The container element is needed for 'em' lengths,
	// which depend on the font size of the parent element (_although currently
	// it is not being used: _all lengths are assumed to be pixels_).
	//
	// TODO: Test column widths and row heights with 'em' lengths
	//
	// (It is probably worth to have a look at [this question][convert_units]
	// when implementing a more reliable solution of this function.)
	//
	// [convert_units] http://stackoverflow.com/questions/4515406/convert-css-units

	var lengthToPixels = function(length, containerElement) {
		/*
		var result, unit;
		log('Converting %s to pixels...', length);
		result = parseInt(length.toString().match(/\d+/), 10);
		assert(!isNaN(result), "%d can not be converted to a numeric value in pixels",
			length.toString());
		unit = length.toString().match(/\D+$/);
		if (unit !== 'px') {
			warn('A unit other than pixels have been received: %s', unit);
		}
		log('The computed value of %s in pixels is %d', length, result);
		return result;
		*/

		var result, unit, element;
		log('Converting %s to pixels...', length);
		element = document.createElement('div');
		element.style.visibility = 'hidden';
		element.style.width = length.toString();
		containerElement.appendChild(element);
		result = getComputedWidth(element);
		unit = length.toString().match(/\D+$/);
		if (unit !== 'px') {
			info('A unit other than pixels have been received: %s', unit);
		}
		log('The computed value of %s in pixels is %d', length, result);
		containerElement.removeChild(element);
		return result;
	};

	// Computed Width
	// --------------

	// Returns the computed width of an element, using not only the value
	// of its _width_ property but also its <del>margins</del>, paddings
	// and borders.
	//
	// __Should margins be used?__ How do we want to behave margins applied
	// to the contents of the slots?

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

	// Computed Height
	// ---------------

	// Returns the computed height of an HTML element based on its contents.
	// Currently it is using the computed `height` of the element plus its
	// vertical padding (`padding-top` and `padding-bottom`) plus its
	// vertical borders (`border-top-width` and `border-bottom-width`). All
	// of these values are obtained through the `getComputedStyleOf`, which
	// in turn call to the standard DOM `getComputedStyle` function and
	// returns only its numeric value, without the <tt>px</tt> unit.
	//
	// In addition, this function also is currently using for height
	// calculation _the top margin of the first child of the element and
	// the bottom margin of its last child_. That is, currently we are
	// preventing vertical margins to collapse between adjacent slots.
	// Instead, that extra space is computed and added to the height of
	// the specified element.
	//
	// TODO: __Is this function (and its counterpart for widths) being called only for slots?__
	// TODO: __Test it works well not only the first time but also when resizing.__

	var getComputedHeight = function(element) {
		var result, height, marginTop, marginBottom, paddingTop, paddingBottom,
			borderTop, borderBottom;

		log('Getting the computed height of element %o', element);
		height = getComputedStyleOf(element, 'height');
		log('Computed height = %d px', height);
		paddingTop = getComputedStyleOf(element, 'padding-top');
		paddingBottom = getComputedStyleOf(element, 'padding-bottom');
		borderTop = getComputedStyleOf(element, 'border-top-width');
		borderBottom = getComputedStyleOf(element, 'border-bottom-width');
		result = height + paddingTop + paddingBottom + borderTop + borderBottom;
		if (!ALMCSS.Config.isResize) {
			info('Calculating also top and bottom margins of first and last child, respectively');
			marginTop = element.firstChild && element.firstChild.nodeType === 1 ?
				getComputedStyleOf(element.firstChild, 'margin-top') : 0;
			marginBottom = element.lastChild && element.lastChild.nodeType === 1 ?
				getComputedStyleOf(element.lastChild, 'margin-bottom') : 0;
			log('Top margin of first child (%o) is: %d pixels', element.firstChild, marginTop);
			log('Bottom margin of last child (%o) is: %d pixels', element.lastChild, marginBottom);
			result = result + marginTop + marginBottom;
		}
		info('Resultant computed height is: %d pixels', result);
		return result;
	};

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
		warn('Width has been set to %d pixels to compute its height', width);

		// __This should not be really necessary.__ But now it is (in some
		// place the computed height of slots is set to zero when there is
		// a resize operation. Nevertheless, some examples work better
		// without this line, and other worse. It is very related with the
		// using of vertical margins of first and last child in the
		// preceding function, `getComputedHeight`: if changing one of them,
		// it is essential to check the other, in the presence of collapsing
		// margins, and remember to review also the behaviour when resizing.
		//
		// TODO: __Review it!__

		element.style.height = 'auto';

		result = getComputedHeight(element);
		info('Computed content height of the element is: %d pixels', result);
		logger.groupEnd();
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