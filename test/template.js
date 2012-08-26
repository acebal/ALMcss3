module('Template');

var readFile = ALMCSS.stylesheet.readFile;
var Row = ALMCSS.template.Row;
var createTemplate = ALMCSS.template.createTemplate;
var TemplateError = ALMCSS.template.TemplateError;
var Length = ALMCSS.template.Length;
var Height = ALMCSS.template.Height;
var Width = ALMCSS.template.Width;

var template, iterator;

test('Valid template: one single row, two slots', function() {

	'use strict';

	var row1 = new Row('aabb');
	var rows = [row1];
	try {
		template = createTemplate(rows);
		ok(true, 'OK, valid template...');
	} catch (e) {
		ok(false, 'The template is valid, no exception should have been raised');
	}
});

test('Illegal template: one single row, non adjacent slot', function() {

	'use strict';

	var row1 = new Row('aaba');
	var rows = [row1];
	try {
		createTemplate(rows);
		ok(false, 'The template is not valid, but it has not been detected as such');
	} catch (e) {
		ok(e instanceof TemplateError, 'OK, the template was invalid: non adjacent slot in a single row');
	}
});

test('Illegal template: non adjacent slot in the same row', function() {

	'use strict';

	var row1 = new Row('aaaa');
	var row2 = new Row('bbcb');
	var row3 = new Row('dddd');
	var rows = [row1, row2, row3];
	try {
		createTemplate(rows);
		ok(false, 'The template is not valid, but it has not been detected as such');
	} catch (e) {
		ok(e instanceof TemplateError, 'OK, the template was invalid: non adjacent slot in the same row');
	}
});

test('Valid template, similar to the last one, but in this case valid', function() {

	'use strict';

	var row1 = new Row('aaaa');
	var row2 = new Row('bbcc');
	var row3 = new Row('dddd');
	var rows = [row1, row2, row3];
	try {
		createTemplate(rows);
		ok(true, 'OK, valid template...');
	} catch (e) {
		ok(false, 'The template is valid, no exception should have been raised');
	}
});


test('Illegal template: non rectangular slot', function() {

	'use strict';

	var row1 = new Row('aaaa');
	var row2 = new Row('aabb');
	var rows = [row1, row2];
	try {
		createTemplate(rows);
	} catch (e) {
		ok(e instanceof TemplateError, 'A non reactangular slot has been detected');
	}

	row1 = new Row('aabb');
	rows = [row1];
	try {
		createTemplate(rows);
		ok(true, 'OK, valid template...');
	} catch (e) {
		ok(false, 'The template was right: no exception should have been raised');
	}

	row2 = new Row('aaab');
	rows = [row1, row2];
	try {
		createTemplate(rows);
	} catch (e) {
		ok(e instanceof TemplateError, 'A non rectangular slot has been detected');
	}
});

test('Illegal template: non rectangular slot (case 2)', function() {

	'use strict';

	var row1 = new Row('aabb');
	var row2 = new Row('aaac');
	var rows = [row1, row2];
	try {
		createTemplate(rows);
		ok(false, 'The template was not valid, but it has not been detected as such');
	} catch (e) {
		ok(true, 'OK, the template is not valid and an exception has been raised');
	}
});

test('Illegal template: non rectangular slot (case 3)', function() {

	'use strict';

	var row1 = new Row('aaaa');
	var row2 = new Row('aabb');
	var rows = [row1, row2];
	try {
		createTemplate(rows);
		ok(false, 'The template was not valid, but it has not been detected as such');
	} catch (e) {
		ok(true, 'OK, the template is not valid and an exception has been raised');
	}
});

test('Illegal template: non rectangular slot (case 3, but in vertical)', function() {

	'use strict';

	var row1 = new Row('aa');
	var row2 = new Row('aa');
	var row3 = new Row('ab');
	var row4 = new Row('ab');
	var rows = [row1, row2, row3, row4];
	try {
		createTemplate(rows);
		ok(false, 'The template was not valid, but it has not been detected as such');
	} catch (e) {
		ok(true, 'OK, the template is not valid and an exception has been raised');
	}
});

test('Be careful, this has to be valid!', function() {

	'use strict';

	var row1 = new Row('aaaa');
	var row2 = new Row('bbbb');
	var rows = [row1, row2];
	try {
		createTemplate(rows);
		ok(true);
	} catch (e) {
		ok(false);
	}
});

test('Testing the returned object model: slots', function() {

	'use strict';

	var row1 = new Row('aabb');
	var row2 = new Row('aacd');
	var row3 = new Row('aaee');
	var row4 = new Row('ffff');
	var rows = [row1, row2, row3, row4];
	try {
		template = createTemplate(rows);
		ok(true, 'OK, the template is valid, let us see if the returned object model is also right...');
		equal(template.numberOfRows(), 4);
		equal(template.numberOfColumns(), 4);
		iterator = template.iterator();
		var slotNames = [];
		var hasNext = iterator.hasNext();
		while (hasNext) {
			slotNames.push(iterator.next().name);
			hasNext = iterator.hasNext();
		}
		equal(slotNames.toString(), ['a', 'b', 'c', 'd', 'e', 'f'].toString());
	} catch (e) {
		ok(false, 'The template is valid, this error should not have been raised');
	}
});

test('Row heights', function() {

	var row1 = new Row('aaa', Height.auto);
	var row2 = new Row('bbc', Height.equal);
	var row3 = new Row('dec', Height.equal);
	var row4 = new Row('ffff', new Length(155, 'px'));
	var rows = [row1, row2, row3, row4];
	ok(true, 'To be done...');
});
