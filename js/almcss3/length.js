var ALMCSS = ALMCSS || {};

ALMCSS.length = function() {

    'use strict';

    var lengthToPixels = function(length, containerElement) {
        var result, element;
        element = document.createElement('div');
        element.style.visibility = 'hidden';
        element.style.width = length.toString();
        containerElement.appendChild(element);
        result = getComputedStyle(element, null).getPropertyValue('width');
        containerElement.removeChild(element);
        return result;
    };

    return {
        lengthToPixels: lengthToPixels
    };

}();