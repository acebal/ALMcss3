var ALMCSS = ALMCSS || {};

ALMCSS.template.dom = function() {

	'use strict';

	var assert = ALMCSS.debug.assert,
		LoggerLevel = ALMCSS.debug.LoggerLevel,
		logger = ALMCSS.debug.getLogger('Template DOM creation', LoggerLevel.all),
		log = logger.log,
		info = logger.info,
		warn = logger.warn;

	var TEMPLATE_CLASS          = ALMCSS.Config.TEMPLATE_CLASS,
		SLOT_CLASS              = ALMCSS.Config.SLOT_CLASS,
		TEMPLATE_LABEL_CLASS    = ALMCSS.Config.TEMPLATE_LABEL_CLASS,
		SLOT_LABEL_CLASS        = ALMCSS.Config.SLOT_LABEL_CLASS,
		VISUAL_DEBUG            = ALMCSS.Config.VISUAL_DEBUG;

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
				info("Slots are set to 'position: relative' when they are " +
					"created: they will be changed to 'absolute' later, " +
					"during the painting stage");
				slotElement.style.position = 'relative';
				slotLabel = document.createElement('span');
				slotLabel.setAttribute('class', SLOT_LABEL_CLASS);
				slotLabel.innerHTML = slot.slotId;
				slotElement.appendChild(slotLabel);
			}
			template.htmlElement.appendChild(slotElement);
			slot.htmlElement = slotElement;
		}
	};

	var createTemplateElement = function(template) {
		var templateElement, templateLabel;
		// __Currently, it is assumed that templates are defined using a single selector per CSS rule.__
		var templateElement = document.querySelector(template.getSelectorText());
		templateElement.setAttribute('id', template.getId());
		templateElement.setAttribute('class', TEMPLATE_CLASS);
		if (VISUAL_DEBUG) {
			templateElement.style.position = 'relative';
			templateLabel = document.createElement('span');
			templateLabel.setAttribute('class', TEMPLATE_LABEL_CLASS);
			templateLabel.innerHTML = template.getId();
			templateElement.appendChild(templateLabel);
		}
		// The HTMLElement object of the DOM __is modified__.
		templateElement.isTemplate = true;
		// The DOM HTMLElement also stores a reference to the template it belongs.
		templateElement.template = template;
		// And, of course, the template stores a reference to the HTMLElement created.
		template.htmlElement = templateElement;
		// Create the slots.
		createSlotElements(template);
	};

	/*
	var createTemplateElement = function(template) {
		var templateElement, templateLabel;
		templateElement = document.createElement('div');
		templateElement.setAttribute('id', template.getId());
		templateElement.setAttribute('class', TEMPLATE_CLASS);
		templateElement.style.position = 'relative';
		if (VISUAL_DEBUG) {
			templateLabel = document.createElement('span');
			templateLabel.setAttribute('class', TEMPLATE_LABEL_CLASS);
			templateLabel.innerHTML = template.getId();
			templateElement.appendChild(templateLabel);
		}
		// __Currently, it is assumed that templates are defined using a single selector per CSS rule.__
		var containerElement = document.querySelector(template.getSelectorText());
		containerElement.appendChild(templateElement);
		// The HTMLElement object of the DOM __is modified__.
		containerElement.isTemplate = true;
		// The DOM HTMLElement also stores a reference to the template it belongs.
		containerElement.template = template;
		// And, of course, the template stores a reference to the HTMLElement created.
		template.htmlElement = htmlElement;
		// Create the slots.
		createSlotElements(template);
	};
	*/

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

	var paint = function (templates) {
		for (var i = 0; i < templates.length; i++) {
			paintTemplate(templates[i]);
		}
	};

	return {
		createTemplateElements: createTemplateElements,
		moveElementsIntoSlots: moveElementsIntoSlots,
		paint: paint
	};

}();