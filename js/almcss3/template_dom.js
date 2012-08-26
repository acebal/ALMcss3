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
		containerElement.isTemplate = true;
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

	return {
		createTemplateElements: createTemplateElements
	};

}();