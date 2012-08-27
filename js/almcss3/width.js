var ALMCSS = ALMCSS || {};

ALMCSS.width = function() {

	'use strict';

	var getWidth = function(element) {
		return getComputedStyle(element).getPropertyValue('width');
	};

	var computeIntrinsicPreferredWidth = function(element) {
		var priorWidth = getWidth(element),
			intrinsicPreferredWidth;
		element.style.cssFloat = 'left';
		intrinsicPreferredWidth = getWidth(element);
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

	return {
		getWidth: getWidth,
		computeIntrinsicPreferredWidth: computeIntrinsicPreferredWidth,
		computeIntrinsicMinimumWidth: computeIntrinsicMinimumWidth
	};

}();

function preferredWidth(element) {

	'use strict';

	var width = ALMCSS.width.getWidth,
		preferred = ALMCSS.width.computeIntrinsicPreferredWidth,
		minimum = ALMCSS.width.computeIntrinsicMinimumWidth;

	console.info(element.id);
	console.info('Current width: ' + width(element));
	console.info('Preferred width: ' + preferred(element));
	console.info('Minimum width: ' + minimum(element));

}

function minimumWidth(element) {

	'use strict';

	var width = ALMCSS.width.getWidth,
		minimum = ALMCSS.width.computeIntrinsicMinimumWidth;

	console.info(element.id);
	console.info('Current width: ' + width(element));
	console.info('Preferred width: ' + minimum(element));
}


window.onload = function() {

	'use strict';

	var divs = document.getElementsByTagName('div');
	for (var i = 0; i < divs.length; i++) {
		preferredWidth(divs[i]);
	}

	/*
	for (var i = 0; i < divs.length; i++) {
		minimumWidth(divs[i]);
	}
	*/

};