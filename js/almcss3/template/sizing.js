var ALMCSS = ALMCSS || {};

ALMCSS.template.sizing = function () {

	'use strict';

	var assert = ALMCSS.debug.assert,
		LoggerLevel = ALMCSS.debug.LoggerLevel,
		logger = ALMCSS.debug.getLogger('Sizing Algorithms', LoggerLevel.all),
		log = logger.log,
		info = logger.info,
		getComputedWidth = ALMCSS.domUtils.getComputedWidth,
		Height = ALMCSS.template.Height;

	// Width Algorithm
	// ---------------

	var WidthAlgorithm = function () {

		// Returns the sum of the intrinsic minimum widths of the specified
		// columns, where `columns` must be an array of `Column` objects.

		var sumIntrinsicMinimumWidths = function (columns) {
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

		var wideColumns = function (elementWidth, columns) {

			var i, step, numberOfColumns, columnWidth, areAllWidened = false,
				intrinsicPreferredWidth, nonExpandableColumns, computedWidths,
				availableWidth, fixedWidth, message;

			nonExpandableColumns = [];
			computedWidths = [];

			var isExpandableColumn = function (column) {
				for (var i = 0; i < nonExpandableColumns.length; i++) {
					if (nonExpandableColumns[i] === column) {
						return false;
					}
				}
				return true;
			};

			var isThereAvailableWidth = function() {
				return availableWidth > 1;
			};

			numberOfColumns = columns.length;
			step = 1;
			availableWidth = elementWidth;
			fixedWidth = 0;

			while (isThereAvailableWidth() && !areAllWidened) {

				assert(step < 30, 'Ups, something had to went wrong: too many steps');
				availableWidth = elementWidth - fixedWidth;
				fixedWidth = 0;
				columnWidth = availableWidth / numberOfColumns;
				logger.group('Step %d: Widening columns to %d pixels...', step, columnWidth);

				// All columns are processed in each iteration.
				for (i = 0; i < columns.length; i++) {

					// If the column is not expandable (it has already reached its
					// intrinsic preferred width), there is nothing to do with it:
					// the widening process continues with the following one, if
					// there are left columns to be iterated in this step.
					if (!isExpandableColumn(columns[i])) {
						continue;
					}

					// Otherwise (the column may be widened), its intrinsic
					// preferred width is obtained
					intrinsicPreferredWidth = columns[i].getIntrinsicPreferredWidth();

					// __No column can be wider than its preferred minimum width__.
					// If the column that is being currently processed can not
					// expand to `columnWidth` without violating that constraint,
					// then it is set to its _preferred minimum width_. Note that
					// the difference between both values would have to be redistributed
					// in subsequent iterations among the rest of the columns that
					// may still be widen.

					if (columnWidth > intrinsicPreferredWidth) {
						computedWidths[i] = intrinsicPreferredWidth;
						fixedWidth = fixedWidth + computedWidths[i];
						nonExpandableColumns.push(columns[i]);
						info('Column ' + i + ' has been set to its intrinsic preferred width ' +
							'and is not more expandable');
					}

					// If the column width to be assigned in this step is less than
					// or equal to the intrinsic preferred width of the column that
					// is being processed, it simply sets its width to the previously
					// calculated `columnWidth` (remind: the result of dividing the
					// available width into all the columns).
					else {
						computedWidths[i] = columnWidth;
						log('Column ' + i + ' has been set a width of ' + columnWidth + ' pixels');
					}

					availableWidth = availableWidth - computedWidths[i];
				}
				if (!isThereAvailableWidth()) {
					log('There is no more available width');
				} else {
					log('After step %d, there are still %d pixels of available width', step, availableWidth);
					if (nonExpandableColumns.length === columns.length) {
						areAllWidened = true;
						log('But all columns have already be widened up to their maximum: we have to end');
					} else {
						numberOfColumns = columns.length - nonExpandableColumns.length;
						message = numberOfColumns === 1 ? 'is' : 'are';
						log('There %s still %d columns that can be widened', message, numberOfColumns);
					}
				}
				step = step + 1;
				logger.groupEnd();
			}
			info('All columns have been widened: ' + computedWidths);
			return computedWidths;
		};

		var computeTemplateWidth = function (template) {

			logger.group('Computing the width of the template ' + template.getId() + '...');
			info('(Currently, all templates are computed as is they had an a-priori width)');

			var columns, element, elementWidth, sumOfIntrinsicMinimumWidths, amount,
				computedWidths = [], i;

			assert(template.getColumns(), 'Columns must have been created before computing the width');

			columns = template.getColumns();
			element = template.htmlElement;

			elementWidth = getComputedWidth(element);
			sumOfIntrinsicMinimumWidths = sumIntrinsicMinimumWidths(columns);

			if (sumOfIntrinsicMinimumWidths > elementWidth) {
				log('The sum of the intrinsic minimum widths (' + sumOfIntrinsicMinimumWidths + ') ' +
					'is larger than the element width (' + elementWidth + '): ' +
					'setting columns to their intrinsic minimum width...');
				for (i = 0; i < columns.length; i++) {
					computedWidths[i] = columns[i].getIntrinsicMinimumWidth();
				}
			} else {
				log('The sum of the intrinsic minimum widths (' + sumOfIntrinsicMinimumWidths + ') ' +
					'is less than or equal to the element width (' + elementWidth + '): ' +
					'columns have to be widened');
				computedWidths = wideColumns(elementWidth, columns);
				for (i = 0; i < computedWidths.length; i++) {
					columns[i].setComputedWidth(computedWidths[i]);
				}
			}
			info('All widths have been computed: ' + computedWidths);
			logger.groupEnd();
			// TODO: What to do with computedWidths?
		};

		var computeWidths = function (templates) {
			for (var i = 0; i < templates.length; i++) {
				//computeTemplateWidth(templates[i]);
				templates[i].computeWidths();
			}
		};

		return {
			computeTemplateWidth:computeTemplateWidth,
			computeWidths:computeWidths
		};

	}();

	var HeightAlgorithm = function() {

		var computeTemplateHeights = function (template) {

			var rows = template.getRows();

			// Step 1. Computing Single-Row Slots
			// ----------------------------------
			// A first step of the algorithm for computing the height consists
			// on calculating the minimum height of every row, considering only
			// the slots of that row that do not span (rowspan=1). This step
			// must be only done for rows for which a height value other than a
			// explicit length have been set in the template definition. That
			// is, only rows with a defined height of auto or * (_asterisk_)
			// must be processed in this first step, since those with an explicit
			// length already have their height constrained to that value.
			//
			// Each row with a defined height of auto or * (_asterisk_) must be
			// at least as tall as the tallest slot of that row that do not
			// span (rowspan=1). The height of a slot, for the purpose of this
			// algorithm, is determined by its contents. Of course, it depends
			// on the width of the slot, so _computing the heights must
			// necessarily be done after computing the widths_.

			var computeSingleRowSlots = function() {
				var i, j, slots, slotHeight, columnWidth;

				// For each row in the template where `row.height` is auto or '*'
				for (i = 0; i < rows.length; i++) {
					if (rows[i].height === Height.auto || rows[i].height === Height.equal) {
						rows[i].computedHeight = 0;
					}
					// For each slot in that row for which `slot.colspan` is 1
					slots = template.getSlotsOfRow(i);
					for (j = 0; j < slots.length; j++) {
						if (slots[j].rowspan === 1) {
							slotHeight = slots[j].getContentHeight(columnWidth);
							columnWidth = template.getColumnWidth(j);
							if (slotHeight > rows[i].computedHeight) {
								rows[i].computedHeight = slotHeight;
							}
						}
					}
				}
			};

			// Step 2. Rows of Equal Height
			// ----------------------------
			// The Template Layout Module makes very easy to have equal‐height
			// rows, simply by assigning the selected rows a height of *
			// (_asterisk_). The first step of the algorithm did not took this
			// into consideration, and a minimum computed height was assigned
			// to each row considering only the height of their slots. Now
			// these rows must be traversed again, assigning to all of them a
			// height equal to the largest of the minimum heights computed in
			// the previous stage.

			var computeEqualHeightRows = function() {
				var i, largestHeight = 0;

				// For each row in the template where `row.height` is '*'
				for (i = 0; i < rows.length; i++) {
					if (rows[i].height === Height.equal) {
						// Get the largest of the minimum heights
						// that were computed on the previous step
						if (rows[i].computedHeight > largestHeight) {
							largestHeight = rows[i].computedHeight;
						}
					}
				}
				// For each row in the template where `row.height` is '*'
				for (i = 0; i < rows.length; i++) {
					if (rows[i].height === Height.equal) {
						rows[i].computedHeight = largestHeight;
					}
				}
			};

			// Step 3. Computing Multi-Row Slots
			// ---------------------------------

			var computeMultiRowSlots = function() {

			};



		};

		var computeHeights = function (templates) {
			for (var i = 0; i < templates.length; i++) {
				computeTemplateHeights(templates[i]);
			}
		};

	};


	return {
		computeWidths:WidthAlgorithm.computeWidths,
		computeTemplateWidth:WidthAlgorithm.computeTemplateWidth
	};

}();