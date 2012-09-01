var ALMCSS = ALMCSS || {};

ALMCSS.template.dom = function() {

	'use strict';

	var assert = ALMCSS.debug.assert,
		LoggerLevel = ALMCSS.debug.LoggerLevel,
		logger = ALMCSS.debug.getLogger('Template DOM creation', LoggerLevel.all),
		getComputedStyleOf = ALMCSS.domUtils.getComputedStyleOf,
		log = logger.log,
		info = logger.info,
		warn = logger.warn;

	var TEMPLATE_CLASS          = ALMCSS.Config.TEMPLATE_CLASS,
		SLOT_CLASS              = ALMCSS.Config.SLOT_CLASS,
		TEMPLATE_LABEL_CLASS    = ALMCSS.Config.TEMPLATE_LABEL_CLASS,
		SLOT_LABEL_CLASS        = ALMCSS.Config.SLOT_LABEL_CLASS,
		TEMPLATE_COLOR          = ALMCSS.Config.TEMPLATE_COLOR,
		SLOT_COLOR              = ALMCSS.Config.SLOT_COLOR,
		TEMPLATE_BORDER_WIDTH   = ALMCSS.Config.TEMPLATE_BORDER_WIDTH,
		SLOT_BORDER_WIDTH       = ALMCSS.Config.SLOT_BORDER_WIDTH,
		VISUAL_DEBUG            = ALMCSS.Config.VISUAL_DEBUG;

	var createLabels = function(element, id, className, color) {
		info("Elements are set to 'position: relative' when they are " +
			"created: they will be changed to 'absolute' later, " +
			"during the painting stage");
		element.style.position = 'relative';
		var label = document.createElement('span');
		label.setAttribute('class',className);
		label.style.backgroundColor = color;
		label.innerHTML = id;
		element.appendChild(label);
	};

	var paintBorders = function(element, color, width) {
		element.style.borderColor = color;
		element.style.borderWidth = width;
		element.style.borderStyle = 'solid';
	};

	// Creation of Slots and Templates HTML Elements
	// ---------------------------------------------

	var createSlotElements = function(template) {
		var iterator, slot, slotElement, slotLabel;
		iterator = template.iterator();
		while (iterator.hasNext()) {
			slot = iterator.next();
			slotElement = document.createElement('div');
			slotElement.setAttribute('id', slot.slotId);
			slotElement.setAttribute('class', SLOT_CLASS);
			if (VISUAL_DEBUG) {
				createLabels(slotElement, slot.slotId, SLOT_LABEL_CLASS, SLOT_COLOR);
				paintBorders(slotElement, SLOT_COLOR, SLOT_BORDER_WIDTH);
			}
			template.htmlElement.appendChild(slotElement);
			slot.htmlElement = slotElement;
		}
	};

	var reset = function(template) {
		var slotsIterator, slot;
		slotsIterator = template.iterator();
		while (slotsIterator.hasNext()) {
			slot = slotsIterator.next();
			slot.htmlElement.style.left = 'auto';
			slot.htmlElement.style.top = 'auto';
			slot.htmlElement.style.position = 'static';
			slot.htmlElement.style.width = 'auto';
			slot.htmlElement.style.height = 'auto';
		}
		template.htmlElement.style.width = 'auto';
		template.htmlElement.style.height = 'auto';
	};

	var createTemplateElement = function(template) {
		var templateElement, templateLabel;
		templateElement = document.createElement('div');
		templateElement.setAttribute('id', template.getId());
		templateElement.setAttribute('class', TEMPLATE_CLASS);
		templateElement.style.position = 'relative';
		if (VISUAL_DEBUG) {
			if (VISUAL_DEBUG) {
				createLabels(templateElement, template.getId(), TEMPLATE_LABEL_CLASS, TEMPLATE_COLOR);
				paintBorders(templateElement, TEMPLATE_COLOR, TEMPLATE_BORDER_WIDTH);
			}
		}
		// __Currently, it is assumed that templates are defined using a single selector per CSS rule.__
		var containerElement = document.querySelector(template.getSelectorText());
		containerElement.appendChild(templateElement);
		// The HTMLElement object of the DOM __is modified__.
		containerElement.isTemplate = true;
		// The DOM HTMLElement also stores a reference to the template it belongs.
		containerElement.template = template;
		// And, of course, the template stores a reference to the HTMLElement created.
		template.htmlElement = templateElement;
		// And to the container element.
		template.containerElement = containerElement;
		// Create the slots.
		createSlotElements(template);
	};

	var createTemplateElements = function(templates) {
		var i;
		for (i = 0; i < templates.length; i++) {
			createTemplateElement(templates[i]);
		}
	};

	// Getting the Ancestor Template
	// -----------------------------

	var getTemplateAncestor = function(element, slotName) {
		var template;
		log("Looking for a template ancestor for the slot '" + slotName + "'...")
		while (element.parentNode) {
			element = element.parentNode;
			if (element.isTemplate) {
				template = element.template;
				if (template.hasSlot(slotName)) {
					info('A template ancestor was found');
					log('The ancestor template is:\n' + template);
					return template;
				} else {
					log("A template ancestor was found, but it did not contain a slot named '" +
						slotName + "', so we continue traversing up the DOM tree...");
				}
			}
		}
		warn("No template ancestor with a slot '" + slotName + "' was found");
	};

	// Moving Elements into Slots
	// --------------------------

	var moveElementsIntoSlots = function(positionedElements) {
		var i, j, elements, slotName, templateAncestor, slotElement;
		for (i = 0; i < positionedElements.length; i++) {
			slotName = positionedElements[i].slotName;
			elements = document.querySelectorAll(positionedElements[i].selectorText);
			for (j = 0; j < elements.length; j++) {
				templateAncestor = getTemplateAncestor(elements[j], slotName);
				if (templateAncestor) {
					slotElement = templateAncestor.getSlot(slotName).htmlElement;
					slotElement.appendChild(elements[j].parentNode.removeChild(elements[j]));
				}
			}
		}
	};

	// Painting
	// --------

	var paintTemplate = function (template) {

		var getColumnOffset = function (column) {
			var computedWidths = template.computedWidths,
				result = 0, i;
			for (i = 0; i < column; i++) {
				result = result + computedWidths[i];
			}
			return result;
		};

		var getRowOffset = function (row) {
			var rows = template.getRows(),
				result = 0, i;
			for (i = 0; i < row; i++) {
				result = result + rows[i].computedHeight;
			}
			return result;
		};

		var slot, htmlElement, slotsIterator = template.iterator();

		template.htmlElement.style.width = template.computedWidth + 'px';
		template.htmlElement.style.height = template.computedHeight + 'px';

		while (slotsIterator.hasNext()) {
			slot = slotsIterator.next();
			htmlElement = slot.htmlElement;
			htmlElement.style.left = getColumnOffset(slot.startColumn) + 'px';
			htmlElement.style.top = getRowOffset(slot.startRow) + 'px';
			htmlElement.style.width = slot.computedWidth + 'px';
			htmlElement.style.height = slot.computedHeight + 'px';
			htmlElement.style.position = 'absolute';
		}

	};

	var camelCase = function(s) {
		return s.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase() });
	};

	var applyStyleToSlotPseudoElements = function(slotPseudoElements) {

		var i, j, k, pseudoSlot, elements, element, slotElement, declaration;

		logger.group('Applying style to slot pseudo-elements...');
		for (i = 0; i < slotPseudoElements.length; i++) {
			pseudoSlot = slotPseudoElements[i];
			logger.group('Applying styles to %s...', pseudoSlot);
			elements = document.querySelectorAll(pseudoSlot.selector);
			for (j = 0; j < elements.length; j++) {
				element = elements[j];
				if (!element.isTemplate) {
					warn('%s is not a template element', pseudoSlot);
					continue;
				}
				slotElement = element.template.getSlot(pseudoSlot.slotName).htmlElement;
				for (k = 0; k < pseudoSlot.declarations.length; k++) {
					declaration = pseudoSlot.declarations[k];
					log(declaration.toString());
					slotElement.style[camelCase(declaration.property)] =
						declaration.value;
				}
			}
			logger.groupEnd();
		}
		logger.groupEnd();
	};

	return {
		createTemplateElements: createTemplateElements,
		moveElementsIntoSlots: moveElementsIntoSlots,
		applyStyleToSlotPseudoElements: applyStyleToSlotPseudoElements,
		paint: paintTemplate,
		reset: reset
	};

}();