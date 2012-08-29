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

		var computeColumnWidths = function (template) {
			logger.group('Computing the width of the template ' + template.getId() + '...');
			info('(Currently, all templates are computed as is they had an a-priori width)');

			var columns, element, elementWidth, sumOfIntrinsicMinimumWidths,
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
			info('All column widths have been computed: ' + computedWidths);
			logger.groupEnd();
			return computedWidths;
		};

		// Calculates the computed width of a slot (the sum of the previously
		// computed width of the columns which this slot belongs to). It receives
		// both the `Slot` object and an array with the numeric values of the
		// computed width of the columns of the template.
		//
		// This method modifies the `slot.computedWidth` property of the `Slot`
		// instance.

		var computeSlotWidth = function (slot, computedColumnWidths) {
			info('Setting the computed width of slot ' + slot.name + '...');
			log('Current slot.computedWidth = %d pixels', slot.computedWidth);
			slot.computedWidth = 0;
			for (var i = slot.startColumn; i < slot.startColumn + slot.colspan; i++) {
				slot.computedWidth = slot.computedWidth + computedColumnWidths[i];
			}
			info('Slot %s has been set a computed width of %d pixels',
					slot.name, slot.computedWidth);
		};

		// Calculates the computed width of all slots of the template, modifying
		// each `slot.computedWidth` property of each `Slot` object.

		var computeSlotsWidths = function (template, computedColumnWidths) {
			var slotsIterator, slot;

			logger.group('Computing the widths of each slot in the template');
			slotsIterator = template.iterator();
			while (slotsIterator.hasNext()) {
				slot = slotsIterator.next();
				computeSlotWidth(slot, computedColumnWidths);
			}
			logger.groupEnd();
		};

		var computeTemplateWidth = function (template) {
			var computedColumnWidths;
			logger.group('Computing widths of template %o...', template);
			computedColumnWidths = computeColumnWidths(template);
			computeSlotsWidths(template, computedColumnWidths);
			log('All widths (for columns and for every slot in the template) have been computed');
			logger.groupEnd();
		};

		// This is the public method that will be called by the main function
		// of ALMcss, which computes all the widths in the template.

		var computeWidths = function (templates) {
			for (var i = 0; i < templates.length; i++) {
				// Instead of calling directly to `computeTemplateWidth` a level
				// of indirection is introduced by letting the template itself
				// be which invoke that method, passing itself to it as a
				// parameter. That allows the template object to perform some
				// additional tasks immediately before and after the widths are
				// computed, if it were necessary.
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
			// on the width of the slot (`slot.computedWidth`), so _computing
			// the heights must necessarily be done after computing the widths_.

			var computeSingleRowSlots = function() {
				var i, j, slots, slotHeight;

				log.group('Step 1: Computing single-row slots...');

				// For each row in the template where `row.height` is auto or '*'
				for (i = 0; i < rows.length; i++) {
					log("First, the computed height of 'auto' and '*' rows is set to 0");
					if (rows[i].height === Height.auto || rows[i].height === Height.equal) {
						rows[i].computedHeight = 0;
					}
					// For each slot in that row for which `slot.colspan` is 1
					slots = template.getSlotsOfRow(i);
					for (j = 0; j < slots.length; j++) {
						if (slots[j].rowspan === 1) {
							slotHeight = slots[j].getContentHeight();
							if (slotHeight > rows[i].computedHeight) {
								info('Computed height of row %d is set to %d pixels ' +
									'(the height of its single-row slot %s',
									i, slots[j].name);
								rows[i].computedHeight = slotHeight;
							}
						}
					}
				}

				log.groupEnd();
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

				log.group('Step 2: Computing equal-height rows...');

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
				info("The computed height of all '*' row has been set to the largest " +
					"of the heights of all the '*' rows computed in the step 1: ' +" +
					"'%d pixels", largestHeight);

				log.groupEnd();
			};

			// Step 3. Computing Multi-Row Slots
			// ---------------------------------

			// Calculates the computed width of a slot (the sum of the previously
			// computed width of the columns which this slot belongs to). It receives
			// both the `Slot` object and an array with the numeric values of the
			// computed width of the columns of the template.
			//
			// This method modifies the `slot.computedWidth` property of the `Slot`
			// instance.


			// This function is used by `computeMultiRowSlots' to obtain the sum
			// of the computed height of a given span of rows. It will be used
			// to get the sum of the rows that a certain slot spans, and thus
			// determine whether the `contentHeight` of the slot is less or
			// greater than that value and if it must be made _taller_ to have
			// the same height than the sum of its spanned rows, or if are
			// those rows which should be enlarged.

			var sumComputedHeightOfRowspan = function (startRow, endRow) {
				var i, result = 0;

				log.group('Computing the sum of the computed height of span of rows %d-%d...',
							startRow, endRow);

				for (i = startRow; i < endRow + 1; i++) {
					log('Computed height of row %d is %d pixels', rows[i].computedHeight);
					result = result + rows[i].computedHeight;
				}
				info('The sum of the computed heights of rows from %d to %d is %d pixels',
					startRow, endRow, result);

				log.groupEnd();
				return result;
			};

			var sumComputedHeightOfAutoAndEqualRows = function (startRow, endRow) {
				var i, row, result = 0;

				log.group("Getting the sum of the computed height of 'auto' " +
						"and '*' rows in %d-%d...", startRow, endRow);

				for (i = startRow; i < endRow + 1; i++) {
					row = template.getRows()[i];
					if (row.height === Height.auto || row.height === Height.equal) {
						log('Computed height of non-length row %d = %d pixels',
							i, row.computedHeight);
						result = result + row.computedHeight;
					}
				}
				if (result) {
					info("The sum of computed heights of 'auto' and '*' rows " +
						"from %d to %d is %d pixels", startRow, endRow, result);
				} else {
					info('There are not expandable rows in the range %d-%d', startRow, endRow);
				}

				log.groupEnd();
				return result;
			};


			var distributeExcessOfHeightAmongRows = function(excess, startRow, endRow) {
				var i, row, amount, totalHeight;

				log.group("Distributing %d pixels among 'auto' and '*' rows in %d-%d...",
						excess, startRow, endRow);

				totalHeight = sumComputedHeightOfAutoAndEqualRows(startRow, endRow);

				for (i = startRow; i < endRow + 1; i++) {
					row = template.getRows()[i];
					if (row.height !== Height.auto && row.height !== Height.equal) {
						log('Row %d has been defined with an explicit height: it can not be enlarged');
						amount = row.computedHeight *  excess / totalHeight;
						log('For row %d, height = %d × %d / %d = %d pixels',
								i, row.computedHeight, excess, totalHeight);
						info('Enlarged row %d from % d to % pixels', i, row.computedHeight, amount);
						row.computedHeight = amount;
					} else {
						info('No expandable rows were in the range %d-%d', startRow, endRow,
							' (the content will overflow');
					}
				}

				log.groupEnd();
			};

			var computeMultiRowSlots = function() {
				var slot, slotHeight, sumOfComputedHeightOfRows,
					excessOfHeight, slotsIterator = template.iterator();

				log.group('Step 3: Computing the height of multi-row slots...');

				while (slotsIterator.hasNext()) {
					slot = slotsIterator.next();
					if (slot.rowspan === 1) {
						continue;
					}
					// <del>TO DO: Review the getContentHeight method of Slot</del>
					//
					// In this case, it would not be necessary to pass the
					// computed width of the slot as a parameter, since it
					// is evident that it is stored in the `Slot` itself
					// (it should have been set during the process of
					// computing widths). But... _is the `getContentHeight`
					// method of `Slot` object called from some other place
					// where this computed width could not have being
					// calculates yet?
					//
					//     <del>slotHeight = slot.getContentHeight(slot.computedWidth);</del>
					//
					// <ins>No, it is not needed. It was also used (and it still
					// is) by the `computeSingleRowSlots` method, in the first
					// step of computing heights, where the computed column width
					// was used. But now computed widths are also explicitly set
					// and stored in each `Slot` object.

					slotHeight = slot.getContentHeight();

					// If the slot content height is less than the sum of the
					// computed heights of the rows it span, the computed height
					// of the slot must be set to be equal to the sum of the
					// height of its rows.

					sumOfComputedHeightOfRows = sumComputedHeightOfRowspan(
						slot.startRow, slot.rowspan - 1);
					if (slotHeight < sumOfComputedHeightOfRows) {
						info('The content height of slot %s (%d) is less than ' +
							'the sum of the height of the rows it spans (%d): ' +
							'it is changed to tha value', slot.name, slotHeight,
							sumOfComputedHeightOfRows);
						slot.computedHeight = sumOfComputedHeightOfRows;
						continue;
					}

					if (slotHeight == sumOfComputedHeightOfRows) {
						continue;
					}

					assert(slotHeight >= sumOfComputedHeightOfRows);

					// If the slot content height is larger than that of the
					// rows it spans, those rows (obviously, only those with
					// a height of 'auto' or '*', since those with an explicit
					// length will have always that height) needs to be enlarged
					// to accommodate this slot.

					excessOfHeight = slotHeight - sumOfComputedHeightOfRows;

					info('There is a difference of %d pixels between the height ' +
						'of the contents of the slot %s (%d pixels) and the sum ' +
						'of the current computed height of the rows it spans (%d ' +
						'pixels): rows need to be enlarged',
						excessOfHeight, slot.name, slotHeight, sumOfComputedHeightOfRows);

					distributeExcessOfHeightAmongRows(slot.startRow, slot.rowspan - 1);

				}

				log.groupEnd();

			};

			// Step 4. Processing again equal-height rows

			// There is nothing to implement here: it merely consists on carrying
			// on again the step 2 to equalise the computed height of all '*' rows
			// (in case that some of them had been changed during the processing
			// of multi-row slots).

			// The Height Algorithm
			// --------------------

			var computeHeights = function (template) {

				log.group('Computing the heights of template %d...', template.getId());

				computeSingleRowSlots();
				computeEqualHeightRows();
				computeMultiRowSlots();
				computeSingleRowSlots();

				log.groupEnd();

			};

		};

		var computeHeights = function (templates) {

			log.groupCollapsed('Computing heights...');

			for (var i = 0; i < templates.length; i++) {
				computeTemplateHeights(templates[i]);
			}

			log.groupEnd();
		};

	};

	return {
		computeWidths: WidthAlgorithm.computeWidths,
		computeTemplateWidth: WidthAlgorithm.computeTemplateWidth,
		computeHeights: HeightAlgorithm.computeHeights
	};

}();