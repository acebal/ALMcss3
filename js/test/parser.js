module('Parser');

var parser = ALMCSS.stylesheet.parser.Parser,
	readFile = ALMCSS.stylesheet.parser.readFile,
	Declaration = ALMCSS.stylesheet.css.Declaration,
	templates = ALMCSS.template.templates;

var input, ruleSet, rule, declarations, declaration, template,
	colorRed = new Declaration('color', 'red');


test('Parsing a single rule with just one declaration', function() {

	'use strict';

	input = readFile('./css/parser-single-rule-000.css');
	ruleSet = parser.parse(input);

	equal(ruleSet.length, 1);
	rule = ruleSet[0];
	equal(rule.selectorText, 'h1');
	equal(rule.getNumberOfDeclarations(), 1);
	equal(rule.getValueOf('color'), 'red');

});

test('Parsing a single rule with just one declaration, without semicolon', function() {

	'use strict';

	input = readFile('./css/parser-single-rule-001.css');
	ruleSet = parser.parse(input);

	equal(ruleSet.length, 1);
	rule = ruleSet[0];
	equal(rule.selectorText, 'h1');
	equal(rule.getNumberOfDeclarations(), 1);
	equal(rule.getValueOf('color'), 'red');

});

test('Parsing a rule set', function() {

	'use strict';

	input = readFile('./css/parser-ruleset-000.css');
	ruleSet = parser.parse(input);

	equal(ruleSet.length, 2);
	rule = ruleSet[0];
	ok(rule.hasProperty('background-color'));
	equal(rule.getValueOf('font-family'), 'Arial, Helvetica, Verdana, sans-serif');
	rule = ruleSet[1];
	equal(rule.selectorText, 'h1');
	equal(rule.getNumberOfDeclarations(), 1);
	equal(rule.getValueOf('color'), 'red');

});

test('Pseudo elements y pseudo classes', function() {

	'use strict';

	ruleSet = parser.parse('a:link { color: red; }');
	equal(ruleSet.length, 1);
	rule = ruleSet[0];
	equal(rule.selectorText, 'a:link');
	ok(rule.hasProperty('color'));
	ok(!rule.hasProperty('font'));

	ruleSet = parser.parse('p::first-line { color: red; }');
	equal(ruleSet.length, 1);
	rule = ruleSet[0];
	equal(rule.selectorText, 'p::first-line');
	ok(rule.hasProperty('color'));
	ok(!rule.hasProperty('font'));

});


test('Templates: Basic template', function() {

	'use strict';

	input = readFile('./css/template-definition-000.css');
	ruleSet = parser.parse(input);
	equal(ruleSet.length, 1);
	rule = ruleSet[0];
	equal(rule.selectorText, 'div#one');
	ok(rule.hasProperty('display'));

	equal(templates.length, 1, 'One template should have been defined');
	template = templates[0];
	equal(template.howManySlots(), 8, 'It should have 8 slots');

	/*
	if (console && console.info) {
		console.info(template.getCssText());
		console.info(template.toString());
		console.info(template);
	}
	*/
});