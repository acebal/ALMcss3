var ALMCSS = ALMCSS || {};

ALMCSS.length = function() {

    'use strict';

	var getComputedWidth = ALMCSS.util.getComputedWidth;

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

    return {
        lengthToPixels: lengthToPixels
    };

}();