var ALMCSS = ALMCSS || {};

ALMCSS.template = function() {

	'use strict';

	var assert = ALMCSS.debug.assert,
		AlmcssError = ALMCSS.AlmcssError,
		logger = ALMCSS.debug.getLogger('Template Object Model'),
		log = logger.log,
		info = logger.info,
		warn = logger.warn,
		error = logger.error;

	var templates = [],
		positionedElements = [];

	// TemplateError
	// -------------

	var TemplateError = function(message) {
		AlmcssError.call(this, message);
		error(message);
	};

	TemplateError.prototype = Object.create(AlmcssError);

	// Slot
	// ----

	var Slot = function(slotId, slotName, startRow, startColumn) {
		this.slotId = slotId;
		this.name = slotName;
		this.startRow = startRow;
		this.startColumn = startColumn;
		this.rowspan = 1;
		this.colspan = 1;
		this.computedWidth = 0;
		this.computedHeight = 0;
	};

	Slot.emptySlot = '.';

	Slot.prototype.endRow = function() {
		return this.startRow + this.rowspan - 1;
	};

	Slot.prototype.endColumn = function() {
		return this.startColumn + this.colspan - 1;
	};

	Slot.prototype.isRectangular = function(lastRow, lastColumn) {
		return (lastRow === this.endRow() && lastColumn === this.endColumn() + 1) ||
			(lastRow === this.endRow() + 1 && lastColumn === 0);
	};

	Slot.prototype.isAdjacentRow = function(row) {
		return (row >= this.startRow) && (row <= this.startRow + this.rowspan);
	};

	Slot.prototype.isAdjacentColumn = function(column) {
		return (column >= this.startColumn) && (column <= this.startColumn + this.colspan);
	};

	Slot.prototype.isAdjacentTo = function(row, column) {
		assert(row >= this.startRow, 'Templates are top down and left right parsed: ' +
				'row ' + row + ' is less than the initial row of this slot (' + this.startRow +
				'), which violates that precondition (at slot ' + this.name + ')');
		// If this is the initial row, it suffices to check that it is an adjacent column
		if (row === this.startRow) {
			return this.isAdjacentColumn(column);
		}
		// If the row is not adjacent, we do not need to look forward: the template is invalid
		if (!this.isAdjacentRow(row)) {
			throw new TemplateError('A non adjacent row was found for the slot ' + this.name +
				' (at ' + row + ', ' + column + ')');
		}
		// Otherwise (another row different than the first), the column must not
		// be less than the start column or greater than the end one
		assert (row >= this.startRow && row <= this.startRow + this.rowspan);
		//assert(row === this.startRow + this.rowspan + 1, 'At this point, row is ' +
		//	'supposed to be the following to the last row of this slot');
		return column >= this.startColumn && column <= this.endColumn();
	};

	Slot.prototype.expandTo = function(row, column) {
		if (!this.isAdjacentTo(row, column)) {
			throw new TemplateError('Slot ' + this.name + ' can not expand to (' +
				row + ', ' + column + '), since it is not an adjacent position');
		}
		if (row > this.endRow()) {
			this.rowspan = this.rowspan + 1;
			assert(this.endRow() === row);
		}
		if (column > this.endColumn()) {
			this.colspan = this.colspan + 1;
			assert(this.endColumn() === column);
		}
	};

	Slot.prototype.getIntrinsicMinimumWidth = function() {

		var minimumWidth = ALMCSS.domUtils.computeIntrinsicMinimumWidth;

		assert(this.htmlElement, 'For computing the intrinsic minimum width of a slot ' +
			'first it is needed to have done the process of moving the elements into it');

		if (this.intrinsicMinimumWidth) {
			return this.intrinsicMinimumWidth;
		}

		if (this.name === Slot.emptySlot) {
			return 0;
		}
		// It is a letter or '@'
		if (this.colspan > 1) {
			return 0;
		}
		// Otherwise (it is a letter or '@' slot of a single column) we need
		// to do some DOM manipulation to calculate its intrinsic minimum width
		this.intrinsicMinimumWidth = minimumWidth(this.htmlElement);
		return this.intrinsicMinimumWidth;
	};

	Slot.prototype.getIntrinsicPreferredWidth = function() {

		var preferredWidth = ALMCSS.domUtils.computeIntrinsicPreferredWidth;

		assert(this.htmlElement, 'For computing the intrinsic minimum width of a slot ' +
			'first it is needed to have done the process of moving the elements into it');

		if (this.intrinsicPreferredWidth) {
			return this.intrinsicPreferredWidth;
		}

		// The intrinsic preferred width of a '.' is 0
		if (this.name === Slot.emptySlot) {
			return 0;
		}
		// The intrinsic preferred width of a letter or '@' is the intrinsic
		// preferred width as defined by the CSS3 Box Module
		// preferred width as defined by the CSS3 Box Module
		this.intrinsicPreferredWidth = preferredWidth(this.htmlElement);
		return this.intrinsicPreferredWidth;
	};

	// Returns the height in pixels of the contents of this slot. Note that
	// the height of any HTML element is obviously dependant on its width.
	// Therefore, this method requires that a _computed width_ has been set
	// for this slot.
	//
	// The value returned by this method is always a number representing the
	// height of the content of this slot _in pixels_. That is, the height
	// that should have the slots for its content not to overflow.

	Slot.prototype.getContentHeight = function() {

		var contentHeight = ALMCSS.domUtils.computeContentHeight;

		assert(this.htmlElement, 'For computing the height of a slot first it ' +
			'is needed to have done the process of moving the elements into it');
		assert(arguments.length === 0, 'This method no longer needs an explicit ' +
			'width as a parameter');
		assert(this.computedWidth !== undefined, 'For computing the height of ' +
			'a slot first it is needed to have set its computed width');

		return contentHeight(this.htmlElement, this.computedWidth);
	};

	Slot.prototype.valueOf = function() {
		return this.name;
	};

	Slot.prototype.toString = function() {
		return this.name + '{\n' +
			'   startRow    : ' + this.startRow + ',\n' +
			'   startColumn : ' + this.startColumn + ',\n' +
			'   rowspan     : ' + this.rowspan + ',\n' +
			'   colspan     : ' + this.colspan + ',\n' +
			'}';
	};

	// Slots
	// -----

	var Slots = function() {

		var slots = [];

		var that = {

			size: function() {
				return slots.length;
			},

			contains: function(slotName) {
				for (var i = 0; i < slots.length; i++) {
					if (slots[i].name === slotName) {
						return true;
					}
				}
				return false;
			},

			get: function(slotName) {
				for (var i = 0; i < slots.length; i++) {
					if (slots[i].name === slotName) {
						return slots[i];
					}
				}
			},

			add: function(slot) {
				assert(!this.contains(slot.name),
					'A slot of that name already exists and can not be added: ' + slot.name);
				slots.push(slot);
			},

			iterator: function() {
				var position = 0;
				return {
					hasNext: function() {
						var numberOfElements = that.size();
						return position < numberOfElements;
					},
					next: function() {
						if (!this.hasNext()) {
							throw new AlmcssError('All the slots have already been traversed');
						}
						var result = slots[position];
						position = position + 1;
						return result;
					}
				};
			},

			toString: function() {
				var i, result = '[';
				for (i = 0; i < slots.length; i++) {
					result = result + slots[i].name;
					if (i === slots.length - 1) {
						result = result + ', ';
					}
				}
				result = result + ']';
				return result;
			}
		};

		return that;
	};

	// Position
	// --------

	var Position = function(selectorText, slotName) {
		this.selectorText = selectorText;
		this.slotName = slotName;
	};

	// Length
	// ------

	var Length = function(value, unit) {
		if (this.value < 0) {
			throw new TemplateError('Negative values are not allowed neither for ' +
				'row heights nor column widths, and make the template illegal: ' + value + unit);
		}
		this.value = value;
		this.unit = unit ? unit : '';
	};

	Length.prototype.isLength = function() {
		return true;
	};

	Length.prototype.valueOf = function() {
		return this.value + this.unit;
	};

	Length.prototype.toString = function() {
		return this.value + this.unit;
	};

	// Height
	// ------

	var Height = function(value) {
		assert(value instanceof Length || value === 'auto' || value === '*');
		this.value = value;
	};

	Height.auto = new Height('auto');
	Height.equal = new Height('*');

	Height.prototype.isLength = function() {
		return this.value instanceof Length;
	};

	Height.prototype.valueOf = function() {
		return this.value;
	};

	Height.prototype.toString = function() {
		return this.value.toString();
	};

	// Width
	// -----

	var Width = function(value) {
		assert(value instanceof Length || value === '*' || value === 'max-content' ||
			value === 'min-content' || value === 'min-max' || value === 'fit-content');
		this.value = value;
	};

	Width.equal = new Width('*');
	Width.maxContent = new Width('max-content');
	Width.minContent = new Width('min-content');
	Width.fitContent = new Width('fit-content');

	Width.prototype.isLength = function() {
		return this.value instanceof Length;
	};

	Width.prototype.valueOf = function() {
		return this.value;
	};

	Width.prototype.toString = function() {
		return this.valueOf();
	};

	var MinMax = function(p, q) {
		Width.call(this, 'minmax');
		this.p = p;
		this.q = q;
	};

	MinMax.prototype.toString = function() {
		return 'minmax(' + this.p + ', ' + this.q + ')';
	};

	// Auxiliary functions
	// -------------------

	// Removes spaces from a string representing a row in the template, as
	// it was defined in the style sheet declaration. This is in conformance
	// with the specification, which states that [in each string of the
	// template]: <q>Spaces have no meaning. They can be added for
	// readability.</q>
	//
	// NOTE: Is this also applicable to tabs and new line characters?
	// Currently, this function only removes whitespaces (' ').

	var removeSpaces = function(row) {
		var result = row;
		result.replace(/\s+/g, ' ');
		return result;
	};

    var containsSlot = function(array, slotName) {
        for (var i = 0; i < array.length; i++) {
            assert(array[i].name, 'This was supposed to be an array of slots ' +
                '(with valid names): ' + array);
            if (array[i].name === slotName) {
                return true;
            }
        }
        return false;
    };

	// Row
	// ---

	// The constructor of a `Row` object that represents a row of a template.
	//
	// It receives two parameters: the first one, `columns`, is a string
	// consisting of one or more at signs ('@'), letters (or digits, or any
	// Unicode character), periods ('.') and spaces.  Each character other than
	// a space represents one column in that row.
	//
	// The second parameter, `height`, is optional. If present, it must be an
	// instance of a `Height` object, which can be either a length, 'auto' or
	// asterisk ('*'). These last two cases have to be represented with the
	// `Height.auto` and `Height.equal` objects. If no height has been specified
	// for this row, it is automatically assigned the default value of 'auto'.
	// Thus, all the rows of the template are assured to have an explicit height
	// assigned.
	//
	// In addition, this constructor automatically removes the spaces from the
	// `columns` string that represent this row.

	var Row = function(columns, height) {
		this.columns = removeSpaces(columns);
		this.height = height || Height.auto;
		this.computedHeight = 0;
	};

	Row.prototype.toString = function() {
		return '"' + this.columns + '" /' + this.height;
	};

	var Column = function(index, columnWidth, slots, htmlElement) {

		var intrinsicMinimumWidth,
			intrinsicPreferredWidth;

		var computeIntrinsicMinimumAndIntrinsicPreferredWidths = function() {

            info('Computing the intrinsic minimum and preferred widths from column: ' + index +
                ' (' + columnWidth + ')');

            var lengthToPixels = ALMCSS.domUtils.lengthToPixels;

			var i, largestIntrinsicMinimumWidth = 0, largestIntrinsicPreferredWidth = 0;

			// A column with a `columnWidth` of a given length has intrinsic minimum and
			// intrinsic preferred widths both equal to that length.

			if (columnWidth instanceof Length) {
				intrinsicMinimumWidth = lengthToPixels(columnWidth, htmlElement);
				intrinsicPreferredWidth = lengthToPixels(columnWidth, htmlElement);
			}

			// A column with a `columnWidth` of '*' has an infinite intrinsic preferred
			// width. Its intrinsic minimum width is 0.

			else if (columnWidth === Width.equal) {
				intrinsicMinimumWidth = 0;
				intrinsicPreferredWidth = Number.MAX_VALUE;
			}

			// A column with a `columnWidth` of 'min-content' has an intrinsic minimum
			// width and intrinsic preferred width that are both equal to the largest
			// of the *intrinsic minimum* widths of all the slots in that column.

			else if (columnWidth === Width.minContent) {
				for (i = 0; i < slots.length; i++) {
					if (slots[i].getIntrinsicMinimumWidth() > largestIntrinsicMinimumWidth) {
						largestIntrinsicMinimumWidth = slots[i].getIntrinsicMinimumWidth();
					}
				}
				intrinsicMinimumWidth = intrinsicPreferredWidth = largestIntrinsicMinimumWidth;
			}

			// A column with a `columnWidth` of 'max-content' has an intrinsic minimum
			// width and intrinsic preferred width that are both equal to the largest
			// of the *intrinsic preferred* widths of all the slots in that column.

			else if (columnWidth === Width.maxContent) {
				for (i = 0; i < slots.length; i++) {
					if (slots[i].getIntrinsicPreferredWidth() > largestIntrinsicPreferredWidth) {
						largestIntrinsicPreferredWidth = slots[i].getIntrinsicPreferredWidth();
					}
				}
				intrinsicMinimumWidth = intrinsicPreferredWidth = largestIntrinsicPreferredWidth;
			}

			// A column with a `columnWidth` of 'minmax(p, q)' has an intrinsic
			// minimum width equal to p and an intrinsic preferred width equal to q.

			else if (columnWidth instanceof MinMax) {
				intrinsicMinimumWidth = columnWidth.p;
				intrinsicPreferredWidth = columnWidth.q;
			}

			else if (columnWidth === Width.fitContent) {
				for (i = 0; i < slots.length; i++) {
					if (slots[i].getIntrinsicMinimumWidth() > largestIntrinsicMinimumWidth) {
						largestIntrinsicMinimumWidth = slots[i].getIntrinsicMinimumWidth();
					}
				}
				for (i = 0; i < slots.length; i++) {
					if (slots[i].getIntrinsicPreferredWidth() > largestIntrinsicPreferredWidth) {
						largestIntrinsicPreferredWidth = slots[i].getIntrinsicPreferredWidth();
					}
				}
				intrinsicMinimumWidth = largestIntrinsicMinimumWidth;
				intrinsicPreferredWidth = largestIntrinsicPreferredWidth;
			}

			else {
				assert(false, 'A non recognised value for column width: ' + columnWidth);
			}

            info('Intrinsic minimum width = ' + intrinsicMinimumWidth);
			if (intrinsicPreferredWidth === Number.MAX_VALUE) {
				info('Intrinsic preferred width = infinite');
			} else {
                info('Intrinsic preferred width = ' + intrinsicPreferredWidth);
			}
		};

        return {
            getIndex: function() {
                return index;
            },
            getWidth: function() {
                return columnWidth;
            },
            getComputedWidth: function() {
                assert(this.computedWidth !== undefined, 'The computed width for this ' +
                    'column has not yet been set (this method can not be called before ' +
                    'the template has performed the layout algorithm)');
                return this.computedWidth;
            },
            setComputedWidth: function(width) {
                log('Setting column ' + index + ' width to ' + width + ' px');
                this.computedWidth = width;
            },
            getIntrinsicMinimumWidth: function() {
                if (intrinsicMinimumWidth === undefined) {
                    computeIntrinsicMinimumAndIntrinsicPreferredWidths();
                }
                return intrinsicMinimumWidth;
            },
            getIntrinsicPreferredWidth: function() {
                if (intrinsicPreferredWidth === undefined) {
                    computeIntrinsicMinimumAndIntrinsicPreferredWidths();
                }
                return intrinsicPreferredWidth;
            },
            toString: function() {
                return 'Column ' + index + '{\n' +
                    '  columnWidth: ' + columnWidth + ',\n' +
                    '  computedWidth: ' + this.computedWidth + '\n' +
                    '  intrinsicMinimumWidth: ' + intrinsicMinimumWidth + ',\n' +
                    '  intrinsicPreferredWidth: ' + intrinsicPreferredWidth + '\n' +
                    '}';
            }
        };

	};

	// Template
	// --------


	// A `Template` object represents a template in the CSS object model.
	// Apart from other parameters like a `templateId` created by the factory
	// method `createTemplate` to identify the template (useful for logging),
	// it receives a template definition as it was recognised by the parser.
	// This template definition is represented by the parameters `rows` and
	// `columnWidths`. The first one is an array of `Row` objects that have
	// other two properties: `columns` and `rowHeight`, where `columns` is a
	// string representing that row in in the template, as it appears in the
	// style sheet, and `rowHeight` is the value expressed in the style sheet
	// for that row (it must be either a valid CSS length value, the character
	// symbol that represents equal-height columns (currently, an 'at' symbol
	// ('@') instead of the asterisk ('*') proposed in the specification), or
	// the `auto` keyword. Note that the `Row` object automatically sets this
	// property to `Height.auto` if no column height was specified in the
	// style sheet, so it is guaranteed that it always has an explicit height.
	//
	// In addition, this constructor already receives a `columnWidths` parameter,
	// which is an array of `Width` objects that represent the values of the
	// column widths specified in the template declaration in the style sheet.
	//
	//     templateDefinition {
	//         rows: an array of `Row` objects
	//                  { columns: a string representing a row
	//                    rowHeight [optional]: the height of this row (a `Height`)
	//                  }
	//         columnWidths: an array of `Width` objects with the column widths
	//

	var Template = function(templateId, rows, columnWidths, slots, selectorText, cssText) {

        var sizing = ALMCSS.template.layout;

        // An array of `Column` objects
        var columns = [],
	        computedWidths;

        var getSlotsOfColumn = function(columnIndex) {
            var i, j, row, slotName, result = [];
            for (i = 0; i < rows.length; i++) {
                slotName = rows[i].columns.charAt(columnIndex);
                if (!containsSlot(result, slotName)) {
                    result.push(slots.get(slotName));
                }
            }
			return result;
        };

        var createColumns = function(htmlElement) {
            var i, slots, column;
            for (i = 0; i < columnWidths.length; i++) {
                slots = getSlotsOfColumn(i);
                column = new Column(i, columnWidths[i], slots, htmlElement);
                columns.push(column);
            }
        };

		return {
			/* htmlElement: null, */
			/* computedWidths: null, */
			getId: function() {
				return templateId;
			},
			hasSlot: function(slotName) {
				return slots.contains(slotName);
			},
			getColumns: function() {
				return columns;
			},
			getSlot: function(slotName) {
				return slots.get(slotName);
			},
			getSlotsOfRow: function(rowIndex) {
				var i, row, slotName, result = [];
				row = rows[rowIndex];
				for (i = 0; i < row.columns.length; i++) {
					slotName = row.columns.charAt(i);
					if (!containsSlot(result, slotName)) {
						result.push(slots.get(slotName));
					}
				}
				return result;
			},
			getColumnWidth: function(columnIndex) {
				return columnWidths[columnIndex];
			},
			iterator: function() {
				return slots.iterator();
			},
			numberOfRows: function() {
				return rows.length;
			},
			numberOfColumns: function() {
				return columnWidths.length;
			},
			howManySlots: function() {
				return slots.size();
			},
			getRow: function(rowIndex) {
				return rows[rowIndex];
			},
			getRows: function() {
				return rows;
			},
			getSelectorText: function() {
				return selectorText;
			},
			getCssText: function() {
				return cssText;
			},
			toString: function() {
				var i, result = '';
				for (i = 0; i < rows.length; i++) {
					result = result + rows[i] + '\n';
				}
				for (i = 0; i < columnWidths.length; i++) {
					result = result + columnWidths[i] + ' ';
				}
				return result;
			},
            computeWidths: function() {
                assert(this.htmlElement, 'computeWidths can not be called before ' +
                    'having created the associated DOM elements for the template');
                info('Computing widths for template ' + templateId);
                log('First, column objects must be created for this template...');
                createColumns(this.htmlElement);
                log('OK, they have been created:\n' + columns);
                log('Now, computing the widths...');
                this.computedWidths = sizing.computeTemplateWidths(this);
	            // TODO: Review and refactor this code (it probably shouldn't be here)
	            var templateWidth = 0, i;
	            for (i = 0; i < this.computedWidths.length; i++) {
		            templateWidth = templateWidth + this.computedWidths[i];
	            }
	            this.computedWidth = templateWidth;
            }
		};

	}; // Template




	// Factory Method for Creating Templates
	// -------------------------------------

	var createTemplate = function(rows, columnWidths, selectorText, cssText) {

		var template,
			numberOfRows = rows.length,
			numberOfColumns = 0,
			slots = new Slots(),
			templateId = ALMCSS.Config.TEMPLATE_ID + templates.length + 1,
			slotId;

		var computerNumberOfColumns = function() {
			var i;
			for (i = 0; i < rows.length; i++) {
				if (rows[i].columns.length > numberOfColumns) {
					numberOfColumns = rows[i].columns.length;
				}
			}
		};

		// Fill a row with periods ('.') or whatever other character has been
		// defined in the specification (it uses the `Slot.emptySlot` constant)
		// as the symbol for white-space, or empty slot. This is necessary in
		// the case of those rows that have fewer columns than others, and that
		// have to be <q>implicitly padded with periods (".") (that will thus
		// not contain any elements)</q>, according to the specification.
		//
		// The received `row` parameter is supposed to be a string as it was
		// defined in the style sheet, *but once the spaces (which have no
		// meaning, that is, do not represent a column in that row) have been
		// removed from it*.

		var fillRow = function(row) {
			var i, columnsToFill;
			if (row.length === numberOfColumns) {
				return;
			}
			assert(row.length < numberOfColumns);
			columnsToFill = numberOfColumns - row.length;
			for (i = 0; i < columnsToFill; i++) {
				row = row + Slot.emptySlot.name;
			}
			assert(row.length === numberOfColumns);
		};

		// "Normalise" all the rows in the template. This step consists on
		// filling those rows with fewer columns than others (which is allowed
		// in the specification) with characters representing the empty slot.
		// To do that, first the maximum number of columns has to be calculated
		// (it initialise the value of the `numberOfColumns` variable of this
		// `createTemplate` function).
		//
		// Note that it is assumed that the spaces that might there be in the
		// strings representing each row have already been removed.

		var normalizeRows = function() {
			var i;
			computerNumberOfColumns();
			for (i = 0; i < rows.length; i++) {
				fillRow(rows[i].columns);
			}
		};

		var normalizeWidths = function() {
			var i, result = [];
			for (i = 0; i < numberOfColumns; i++) {
				if (columnWidths && i < columnWidths.length) {
					result[i] = columnWidths[i];
				} else {
					result[i] = Width.equal;
				}
			}
			columnWidths = result;
		};

		var createSlots = function() {
			var row, column, slotName, lastSlot, slot;
			for (row = 0; row < numberOfRows; row = row + 1) {
				for (column = 0; column < numberOfColumns; column = column + 1) {
					slotName = rows[row].columns.charAt(column);
					if (lastSlot && (slotName !== lastSlot.name)) {
						if (!lastSlot.isRectangular(row, column)) {
							throw new TemplateError('Slot ' + lastSlot.name +
								' is not rectangular (at ' + row + ', ' + column + ')');
						}
						lastSlot = slots.get(slotName);
					}
					if (!slots.contains(slotName)) {
						slotId = templateId + '_' + ALMCSS.Config.SLOT_ID + slotName;
						slot = new Slot(slotId, slotName, row, column);
						slots.add(slot);
					} else {
						slot = slots.get(slotName);
						slot.expandTo(row, column);
					}
					if (!lastSlot) {
						lastSlot = slot;
					}
				}
			}
		};

		normalizeRows();
		normalizeWidths();
		createSlots();

		template = new Template(templateId, rows, columnWidths, slots, selectorText, cssText);
		templates.push(template);
		return template;

	};


	// Adding Positioned Elements
	// --------------------------

	var addPositionedElement = function(selectorText, slotName) {
		positionedElements.push(new Position(selectorText, slotName));
	};

	return {
		templates: templates,
		positionedElements: positionedElements,
		TemplateError: TemplateError,
		Slot: Slot,
		Length: Length,
		Height: Height,
		Width: Width,
		Row: Row,
		createTemplate: createTemplate,
		addPositionedElement: addPositionedElement
	};

}();