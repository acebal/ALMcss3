var ALMCSS = ALMCSS || {};

ALMCSS.template.dom = function() {

	'use strict';

	var assert = ALMCSS.debug.assert,
		AssertionError = ALMCSS.debug.AssertionError,
		LoggerLevel = ALMCSS.debug.LoggerLevel,
		logger = ALMCSS.debug.getLogger('Template DOM creation', LoggerLevel.all),
		log = logger.log,
		info = logger.info,
		warn = logger.warn,
		error = logger.error;

	var TEMPLATE_CLASS          = 'almcss-template',
		SLOT_CLASS              = 'almcss-slot',
		TEMPLATE_LABEL_CLASS    = 'almcss-template-label',
		SLOT_LABEL_CLASS        = 'almcss-slot-label';

	var createSlotElements = function(template) {
		var iterator, slot, slotElement, slotLabel;
		iterator = template.iterator();
		while (iterator.hasNext()) {
			slot = iterator.next();
			slotElement = document.createElement('div');
			slotElement.setAttribute('id', slot.slotId);
			slotElement.setAttribute('class', SLOT_CLASS);
			slotElement.style.position = 'relative'; // TODO: Change it to absolute later
			slotLabel = document.createElement('span');
			slotLabel.setAttribute('class', SLOT_LABEL_CLASS);
			slotLabel.innerHTML = slot.slotId;
			slotElement.appendChild(slotLabel);
			template.htmlElement.appendChild(slotElement);
			slot.htmlElement = slotElement;
		}
	};

	var createTemplateElement = function(template) {
		var templateElement, templateLabel;
		templateElement = document.createElement('div');
		templateElement.setAttribute('id', template.getId());
		templateElement.setAttribute('class', TEMPLATE_CLASS);
		templateElement.style.position = 'relative';
		templateLabel = document.createElement('span');
		templateLabel.setAttribute('class', TEMPLATE_LABEL_CLASS);
		templateLabel.innerHTML = template.getId();
		templateElement.appendChild(templateLabel);
		// Currently, it is assumed that templates are defined using a single selector per CSS rule
		var containerElement = document.querySelector(template.getSelectorText());
		containerElement.appendChild(templateElement);
		// The HtmlElement object of the DOM **is modified**
		containerElement.isTemplate = true;
		containerElement.template = template;
		template.htmlElement = containerElement;
		// Create the slots
		createSlotElements(template);
	};

	var createTemplateElements = function(templates) {
		var i;
		for (i = 0; i < templates.length; i++) {
			createTemplateElement(templates[i]);
		}
	};

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

	return {
		createTemplateElements: createTemplateElements,
		moveElementsIntoSlots: moveElementsIntoSlots
	};

}();