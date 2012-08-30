// DomUtils
// --------

var ALMCSS = ALMCSS || {};

ALMCSS.domUtils = function() {

	'use strict';

	var assert = ALMCSS.debug.assert;



	// Computed Height and Widths
	// --------------------------

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

	// The same function than above, but for the computed height of a given
	// HTML element.

	var getComputedHeight = function(element) {
		var result;
		result = getComputedStyle(element, null).getPropertyValue('height');
		result = parseInt(result.match(/\d+/), 10);
		assert(!isNaN(result));
		return result;
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
		containerElement.removeChild(element);
		return result;
	};



	// Intrinsic Minimum and Intrinsic Preferred Widths
	// ------------------------------------------------

	var computeIntrinsicPreferredWidth = function(element) {
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
		element.style.width = width;
		result = getComputedHeight(element);
		return result;
	};



	// Public Functions Exported by This Module
	// ----------------------------------------

	return {
		getComputedWidth: getComputedWidth,
		getComputedHeight: getComputedHeight,
		lengthToPixels: lengthToPixels,
		computeIntrinsicPreferredWidth: computeIntrinsicPreferredWidth,
		computeIntrinsicMinimumWidth: computeIntrinsicMinimumWidth,
		computeContentHeight: computeContentHeight
	};

}();