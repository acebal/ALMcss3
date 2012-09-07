var ALMCSS = ALMCSS || {};

ALMCSS.template.layout = function () {

	'use strict';

	// Imports
	// -------

	var assert = ALMCSS.debug.assert,
		LoggerLevel = ALMCSS.debug.LoggerLevel,
		logger = ALMCSS.debug.getLogger('Sizing Algorithms', LoggerLevel.all),
		log = logger.log,
		info = logger.info,
		getComputedWidth = ALMCSS.domUtils.getComputedWidth,
		lengthToPixels = ALMCSS.domUtils.lengthToPixels,
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
		// - <del>What does it happen with equal-width columns? The specification does
		//   not say anything about the constraint that they impose on the layout
		//   algorithm for computing the widths.</del>
		// - What does _span of columns_ mean in this context?
		// - What "element" is exactly referring the specification to?
		// - __What does "all columns get the same width" mean?__
		//
		// TODO: Resolve this questions with Bert.
		//

		// Widening Columns (current algorithm)
		// ----------------

		var wideColumns = function (elementWidth, columns) {

			var i, step, numberOfColumns, amount, areAllWidened = false,
				intrinsicPreferredWidth, nonExpandableColumns, computedWidths,
				availableWidth, message;

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

			for (i = 0; i < columns.length; i++) {
				computedWidths[i] = columns[i].getIntrinsicMinimumWidth();
			}

			while (isThereAvailableWidth() && !areAllWidened) {

				assert(step < 30, 'Oops, something had to went wrong: too many steps');
				amount = availableWidth / numberOfColumns;
				logger.group('Step %d: Widening columns with an increment of %d pixels...',
					step, amount);

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
					// expand by the previously computed `amount` without
					// violating that constraint, then it is set to its
					// _preferred minimum width_. Note that the difference
					// between both values (`computedWidths[i] + amount` and
					// `intrinsicPreferredWidth`) would have to be
					// redistributed in subsequent iterations among the rest of
					// the columns that may still be widen.

					if (computedWidths[i] + amount > intrinsicPreferredWidth) {
						computedWidths[i] = intrinsicPreferredWidth;
						nonExpandableColumns.push(columns[i]);
						info('Column ' + i + ' has been set to its intrinsic preferred width ' +
							'and is not more expandable');
					}

					// If the sum of the column width (`computedWidths[i]`)
					// plus the `amount` to be added in this step (remind:
					// the result of dividing the available width into the
					// number of expandable columns that was previously
					// calculated) _is less than or equal to the intrinsic
					// preferred width_ of the column that is being processed,
					// that would be the new computed width of this column.
					else {
						computedWidths[i] = computedWidths[i] + amount;
						log('Column %d has been set a width of %d pixels', i, computedWidths[i]);
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
				sumOfCurrentComputedWidths, computedWidths = [], i;

			assert(template.getColumns(), 'Columns must have been created before computing the width');

			columns = template.getColumns();
			//element = template.htmlElement;
			element = template.containerElement;


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

		var computeTemplateWidths = function (template) {
			var computedColumnWidths;
			logger.group('Computing widths of template %o...', template);
			computedColumnWidths = computeColumnWidths(template);
			computeSlotsWidths(template, computedColumnWidths);
			log('All widths (for columns and for every slot in the template) have been computed');
			logger.groupEnd();
			return computedColumnWidths;
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
			//computeTemplateWidths: computeTemplateWidths,
			//computeWidths: computeWidths
			computeTemplateWidths: computeTemplateWidths
		};

	}();

	// Height Algorithm
	// ----------------

	var HeightAlgorithm = function() {

		var computeTemplateHeights = function (template) {

			var rows = template.getRows(),
				templateHeight = 0;


			// 1. Computing Rows with an Explicit Height
			// -----------------------------------------
			// First, the algorithm looks for rows defined with a height
			// set an explicit _length_. That value will be the computed
			// height of the row, and it will not be changed by any other
			// phase of the height algorithm.

			var computeLengthRows = function() {
				var i, j, computedRows, rowHeight, slots;

				logger.group('Computing rows with an explicit height...');

				computedRows = 0;
				for (i = 0; i < rows.length; i++) {
					if (rows[i].height.isLength()) {
						computedRows = computedRows + 1;
						info('Row %d has been defined with an explicit height of %s', i, rows[i].height);
						rowHeight = lengthToPixels(rows[i].height, template.htmlElement);
						log('%s has been converted to a computed value of %d pixels', rows[i].height, rowHeight);
						rows[i].computedHeight = rowHeight;
						info('Computed height of row %d has been set to %d pixels', i, rows[i].computedHeight);

						logger.group('Assigning that height to all single-row slots in the row');
						slots = template.getSlotsOfRow(i);
							for (j = 0; j < slots.length; j++) {
								slots[j].computedHeight = rowHeight;
								log('Slot %s now has a computed height of %d pixels', slots[j].name, rowHeight);
						}
						logger.groupEnd();
					}
				}

				if (computedRows) {
					info('%d rows with an explicit height have been processed', computedRows);
				} else {
					info('There were no rows with a height set to an explicit length');
				}

				logger.groupEnd();
			};

			// 2. Computing the Minimum Height of Each Row
			// -------------------------------------------
			// A second step of the algorithm for computing the height consists
			// on calculating the minimum height of every row, considering only
			// the slots of that row that do not span (`slot.rowspan === 1`).
			// This must be only done for rows for which a height value other
			// than a explicit length has been set in the template definition.
			// That is, only rows with a defined height of auto or * (_asterisk_)
			// must be processed in this step, since those with an explicit
			// length already have their height constrained to that value.
			//
			// Each row with a defined height of auto or * (_asterisk_) must be
			// at least as tall as the tallest slot of that row that do not
			// span. The height of a slot, for the purpose of this algorithm,
			// _is determined by its contents_. Of course, it depends on the
			// width of the slot (`slot.computedWidth`), so _computing the
			// heights must necessarily be done after computing the widths_.

			var computeMinimumHeights = function() {
				var i, j, computedRows, slots, slotHeight, largestSlot, rowHeight;

				logger.group('Computing the minimum height of each row...');

				computedRows = 0;

				// For each row in the template where `row.height` is auto or '*'
				for (i = 0; i < rows.length; i++) {

					if (rows[i].height !== Height.auto && rows[i].height !== Height.equal) {
						continue;
					}
					computedRows = computedRows + 1;

					// Find the tallest of the single-row slots in that row.
					slots = template.getSlotsOfRow(i);
					rowHeight = 0;
					for (j = 0; j < slots.length; j++) {
						if (slots[j].rowspan === 1) {
							// Is the height of the contents of this slot
							// larger than the maximum height found so far?
							// If so, setting it as the new maximum height
							// of all the single-row slots of this row.
							slotHeight = slots[j].getContentHeight();
							if (slotHeight > rowHeight) {
								rowHeight = slotHeight;
								largestSlot = slots[j];
							}
						}
					}
					if (!largestSlot) {
						logger.warn('Empty row: no slots were defined');
					} else {
						info('Computed height of row %d has been set to %d ' +
							'(the height of its taller single-row slot: %s)',
							i, rowHeight, largestSlot.name);
					}
					rows[i].computedHeight = rowHeight;

					// Once the row has been set a computed height equal to
					// the content height of its tallest slot that spans
					// exactly this single row, it is traversed again to
					// assign that height to all its slots (well, obviously,
					// only those for which `slot.startRow` is this row and
					// `slot.colspan === 1`).

					for (j = 0; j < slots.length; j++) {
						if (slots[j].rowspan === 1) {
							slots[j].computedHeight = rows[i].computedHeight;
						}
					}
				}

				if (computedRows) {
					info("%d rows with 'auto' or '*' as height have been processed", computedRows);
				} else {
					info("There were no 'auto' or '*' rows");
				}

				logger.groupEnd();
			};

			// 3. Rows of Equal Height
			// -----------------------
			// The Template Layout Module makes very easy to have equal‐height
			// rows, simply by assigning the selected rows a height of *
			// (_asterisk_). The first step of the algorithm did not took this
			// into consideration, and a minimum computed height was assigned
			// to each row considering only the height of their slots. Now
			// these rows must be traversed again, assigning to all of them a
			// height equal to the largest of the minimum heights computed in
			// the previous stage.

			var computeEqualHeightRows = function() {
				var i, computedRows, largestHeight;

				logger.group('Computing equal-height rows...');

				computedRows = 0;

				// Get the largest of the minimum heights of rows with a
				// '*' height that were computed on the previous step.
				largestHeight = 0;
				for (i = 0; i < rows.length; i++) {
					if (rows[i].height === Height.equal) {
						if (rows[i].computedHeight > largestHeight) {
							computedRows = computedRows + 1;
							largestHeight = rows[i].computedHeight;
						}
					}
				}

				// For each row in the template where `row.height` is '*',
				// it is set to the largest height of all _equal_ rows.
				for (i = 0; i < rows.length; i++) {
					if (rows[i].height === Height.equal) {
						rows[i].computedHeight = largestHeight;
					}
				}

				if (computedRows) {
					info("The computed height of %d '*' rows has been set to " +
						"the largest of the heights of all the '*' rows " +
						"computed in the step 1: %d pixels",
						computedRows, largestHeight);
				} else {
					info("There were no '*' rows");
				}

				logger.groupEnd();
			};

			// 4. Computing Multi-Row Slots
			// ----------------------------

			// This function is used by `computeMultiRowSlots' to obtain the
			// sum of the computed height of a given span of rows. It will be
			// used to get the sum of the rows that a certain slot spans, and
			// thus determine whether the `contentHeight` of the slot is less
			// or  greater than that value and if it must be made _taller_ to
			// have the same height than the sum of its spanned rows, or if
			// are those rows which should be enlarged.

			var sumComputedHeightOfRowspan = function (startRow, endRow) {
				var i, result = 0;

				logger.group('Computing the sum of the computed height of span of rows %d-%d...',
							startRow, endRow);

				for (i = startRow; i < endRow + 1; i++) {
					log('Computed height of row %d is %d pixels', i, rows[i].computedHeight);
					result = result + rows[i].computedHeight;
				}

				info('The sum of the computed heights of rows from %d to %d is %d pixels',
					startRow, endRow, result);

				logger.groupEnd();
				return result;
			};

			var sumComputedHeightOfAutoAndEqualRows = function (startRow, endRow) {
				var i, row, result = 0;

				logger.group("Getting the sum of the computed height of 'auto' " +
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

				logger.groupEnd();
				return result;
			};

			var areThereExpandableRows = function(startRow, endRow) {
				var i, row;
				for (i = startRow; i < endRow + 1; i++) {
					row = template.getRow(i);
					if (row.height = Height.auto || row.height === Height.equal) {
						return true;
					}
				}
				return false;
			};

			var distributeExcessOfHeightAmongRows = function(excess, startRow, endRow) {
				var i, row, amount, totalHeight;

				logger.group("Distributing %d pixels among 'auto' and '*' rows in %d-%d...",
						excess, startRow, endRow);

				if (!areThereExpandableRows(startRow, endRow)) {
					info("There are not 'auto' or '*' rows in %d-%d to be expanded: " +
						"the content will overflow");
					return;
				}

				totalHeight = sumComputedHeightOfAutoAndEqualRows(startRow, endRow);

				for (i = startRow; i < endRow + 1; i++) {
					row = template.getRows()[i];
					if (row.height !== Height.auto && row.height !== Height.equal) {
						log('Row %d has been defined with an explicit height: it can not be enlarged');
					} else {
						amount = row.computedHeight *  excess / totalHeight;
						log('For row %d, increment of height = %d × %d / %d = %d pixels',
								i, row.computedHeight, excess, totalHeight, amount);
						row.computedHeight = row.computedHeight + amount;
						info('Enlarged row %d from %d to %d pixels', i, row.computedHeight, amount);
					}
				}

				logger.groupEnd();
			};

			var computeMultiRowSlots = function() {
				var slot, slotHeight, sumOfComputedHeightOfRows,
					excessOfHeight, slotsIterator = template.iterator();

				logger.group('Computing the height of multi-row slots...');

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
						slot.startRow, slot.endRow());
					if (slotHeight < sumOfComputedHeightOfRows) {
						info('The content height of slot %s (%d) is less than ' +
							'the sum of the height of the rows it spans (%d): ' +
							'it is changed to that value', slot.name, slotHeight,
							sumOfComputedHeightOfRows);
						slot.computedHeight = sumOfComputedHeightOfRows;
						continue;
					} else {
						slot.computedHeight = slotHeight;
						info('The height of the contents of the slot is larger ' +
							'than the sum of the rows it spans:\n' +
							'Its computed height is set to that of its contents (%d pixels)',
							slot.computedHeight);
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

					distributeExcessOfHeightAmongRows(excessOfHeight, slot.startRow, slot.endRow());

				}

				logger.groupEnd();

			};

			// 5. Processing (Again) Equal-Height Rows
			// ---------------------------------------
			// Rows with a defined height of '*' (_asterisk_) must be
			// traversed again to equalise their computed height to
			// the tallest of all of them (in case that some of them
			// had been changed during the processing of multi-row slots).
			//
			// There is nothing to implement here: the height algorithm
			// simply has to call again the `computeEqualHeightRows`
			// function.

			// 6. Compute Single-Row Slots
			// ---------------------------
			// So far, we have computed the height of multi-row slots,
			// but a final step must yet be done: it is necessary to
			// assign to every single-row slot (those that span exactly
			// one row) the height of its row.

			var computeSingleRowSlots = function() {
				var i, j, slots;

				logger.group('Setting the height of the slots themselves...');

				// For each row in the template
				for (i = 0; i < rows.length; i++) {
					slots = template.getSlotsOfRow(i);
					// For each slot in this which `slot.colspan` is 1
					for (j = 0; j < slots.length; j++) {
						if (slots[j].rowspan === 1) {
							slots[j].computedHeight = rows[i].computedHeight;
							info('Computed height of slot %s has been set to %d pixels ',
									slots[j].name, slots[j].computedHeight);
						}
					}
				}

				info('Every single-row slot has been set to the height of its row');

				logger.groupEnd();
			};

			// 7. Computing the Height of the Template Itself
			// ----------------------------------------------

			var computeTemplateHeight = function() {
				logger.group('Computing the height of the template itself...');
				for (var i = 0; i < rows.length; i++) {
					templateHeight = templateHeight + rows[i].computedHeight;
				}
				info('The template has been set a height of %d pixels', templateHeight);
				logger.groupEnd();
				template.computedHeight = templateHeight;
			};



			// The Height Algorithm
			// --------------------

			logger.group('Computing the heights of template %d...', template.getId());

			computeLengthRows();
			computeMinimumHeights();
			computeEqualHeightRows();
			computeMultiRowSlots();
			computeEqualHeightRows();
			computeSingleRowSlots();
			computeTemplateHeight();

			log('Computing heights of template %d finished', template.getId());
			logger.groupEnd();

		};

		var computeHeights = function (templates) {

			logger.group('Computing heights...');

			for (var i = 0; i < templates.length; i++) {
				computeTemplateHeights(templates[i]);
			}

			logger.info('All done!');

			logger.groupEnd();
		};

		return {
			computeTemplateHeights: computeTemplateHeights,
			computeHeights: computeHeights
		};

	}();

	return {
		computeTemplateWidths: WidthAlgorithm.computeTemplateWidths,
		//computeWidths: WidthAlgorithm.computeWidths,
		computeTemplateHeights: HeightAlgorithm.computeTemplateHeights
		//computeHeights: HeightAlgorithm.computeHeights
	};

}();