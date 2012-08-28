var ALMCSS = ALMCSS || {};

ALMCSS.sizing = function() {

    'use strict';

    var assert = ALMCSS.debug.assert,
        LoggerLevel = ALMCSS.debug.LoggerLevel,
        logger = ALMCSS.debug.getLogger('Sizing Algorithms', LoggerLevel.all),
        log = logger.log,
        info = logger.info;

    // Width Algorithm
    // ---------------

    var WidthAlgorithm = function() {

        // Returns the sum of the intrinsic minimum widths of the specified
        // columns, where `columns` must be an array of `Column` objects.

        var sumIntrinsicMinimumWidths = function(columns) {
            var i, result = 0;
            for (i = 0; i < columns.length; i++) {
                result = result + columns[i].getIntrinsicMinimumWidth();
            }
            return result;
        };

	    // In the case of templates for which its HTML element has an a-priori
        // width and the sum of the intrinsic minimum widths of the columns is
        // less than or equal to the element width, the columns have to be
        // _widened_ until the total width is equal to element width, as follows
        // (<cite>W3C CSS Template Layout Module <a
        // href="http://www.w3.org/TR/css3-layout/#colwidth")>§ 5</a></cite>):
        //
        // > All columns get the same width, except that no column or span of
        // > columns [†] may be wider than its _intrinsic preferred width_. If
        // > the columns cannot be widened enough, the template is left or right
        // > aligned in the element's content area, depending on whether 'direction'
        // > is 'ltr' or 'rtl', respectively. [‡]
        //
        // [†] What does it mean?
        // [‡] ALMcss does not support the concept of direction, and a left-to-right
        // language is always assumed.
        //
        // But some clarifications need yet to be done:
        // - What does it happen with equal-width columns? The specification does
        //   not say anything about the constraint that they impose on the sizing
        //   algorithm for computing the widths.
        // - What does _span of columns_ mean?
        // - What "element" is exactly referring the specification to?
        //
        // TODO: Resolve this questions with Bert.
        //

        var wideColumns = function(availableWidth, columns) {

			var i, numberOfColumns, columnWidth, areAllWidened = false,
				intrinsicPreferredWidth, nonExpandableColumns = [],
				computedWiths = [];

	        var isExpandableColumn = function(column) {
		        for (var i = 0; i < nonExpandableColumns.length; i++) {
			        if (nonExpandableColumns[i] === column) {
				        return false;
			        }
		        }
		        return true;
	        };

	        numberOfColumns = columns.length;
	        columnWidth = availableWidth / numberOfColumns;
	        logger.group('Widening columns to ' + columnWidth + ' pixels...');

	        i = 0;
	        while (availableWidth && !areAllWidened) {
		        if (isExpandableColumn(columns[i])) {
					intrinsicPreferredWidth = columns[i].getIntrinsicPreferredWidth();
					if (columnWidth > intrinsicPreferredWidth) {
						computedWiths[i] = intrinsicPreferredWidth;
						availableWidth = availableWidth - intrinsicPreferredWidth;
						nonExpandableColumns.push(columns[i]);
						info('Column ' + i + ' has been set to its intrinsic preferred width ' +
							'and is not more expandable');
					} else {
						computedWiths[i] = columnWidth;
						availableWidth = availableWidth - columnWidth;
						log('Column ' + i + ' has been set a width of ' + columnWidth + ' pixels');
					}
		        }
		        if (i === columns.length - 1) {
			        logger.groupEnd();
			        if (nonExpandableColumns.length === columns.length) {
				        areAllWidened = true;
			        } else {
				        i = 0;
				        numberOfColumns = columns.length - nonExpandableColumns.length;
				        columnWidth = availableWidth / numberOfColumns;
				        logger.group('Widening columns to ' + columnWidth + ' pixels...');
			        }
		        }
	        }
		    info('All columns have been widened: ' + computedWiths);
	        return computedWiths;
        };

        var computeTemplateWidth = function(template) {

            logger.group('Computing the width of the template ' + template.getId() + '...');
            info('(Currently, all templates are computed as is they had an a-priori width)');

            var columns, element, elementWidth, sumOfIntrinsicMinimumWidths, amount,
	            computedWidths = [];

            assert(template.getColumns(), 'Columns must have been created before computing the width');

            columns = template.getColumns();
	        element = template.htmlElement;

	        // TODO: Review other occurrences in the code
            elementWidth = getComputedStyle(element, null).getPropertyValue('width');
	        elementWidth = parseInt(elementWidth.match(/\d+/), 10);
	        sumOfIntrinsicMinimumWidths = sumIntrinsicMinimumWidths(columns);

            if (sumOfIntrinsicMinimumWidths > elementWidth) {
                log('The sum of the intrinsic minimum widths (' + sumOfIntrinsicMinimumWidths + ') ' +
                    'is larger than the element width (' + elementWidth + '): ' +
                    'setting columns to their intrinsic minimum width...');
				for (var i = 0; i < columns.length; i++) {
					computedWidths[i] = columns[i].getIntrinsicMinimumWidth();
                }
            } else {
                log('The sum of the intrinsic minimum widths (' + sumOfIntrinsicMinimumWidths + ') ' +
                    'is less than or equal to the element width (' + elementWidth + '): ' +
                    'columns have to be widened');
                amount = elementWidth - sumOfIntrinsicMinimumWidths;
                computedWidths = wideColumns(amount, columns);
	            for (i = 0; i < computedWidths.length; i++) {
		            columns[i].setComputedWidth(computedWidths[i]);
	            }
            }
            logger.groupEnd();
	        // TODO: What to do with computedWidths?
	        // TODO: Is there an easy way to test this automatically?
        };

	    var computeWidths = function(templates) {
			for (var i = 0; i < templates.length; i++) {
				//computeTemplateWidth(templates[i]);
				templates[i].computeWidths();
			}
	    };

        return {
            computeTemplateWidth: computeTemplateWidth,
	        computeWidths: computeWidths
        };

    }();

	return {
		computeWidths: WidthAlgorithm.computeWidths,
		computeTemplateWidth: WidthAlgorithm.computeTemplateWidth
	}

}();