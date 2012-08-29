module('Lexer');

var Token = ALMCSS.stylesheet.parser.Token,
	t = ALMCSS.stylesheet.parser.TokenType,
	lexer = ALMCSS.stylesheet.parser.Lexer,
	nextToken = lexer.nextToken,
	readFile = ALMCSS.stylesheet.parser.readFile;

var input, token;


test('End of file', function() {

	'use strict';

	lexer.init('');
	var token = nextToken();
	equal(token.type, t.EOF);

});

test('Invalid character in the middle of an identifier', function() {

	'use strict';

	lexer.init("st'Class");
	token = nextToken();
	equal(token.type, t.IDENT);
	//equal(token.lexeme, "st'Class");
	equal(token.lexeme, "st", "An apostrophe (') is not a character valid for an identifier");

	// I am not sure about if this is the right thing to do when an invalid
	// character is found while scanning an identifier. At this moment, what
	// the lexer does is to return the identifier matched until that point,
	// and the invalid character will be returned later in the following
	// call to `nextToken`, as part of the following matched token.

	token = nextToken();
	// TODO
	/*
	equal(token.type, t.CHAR);
	equal(token.lexeme, "'");

	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, "Class", 'The rest of the identifier after the invalid character');

	// EOF
	equal(nextToken(), Token.EOF);
	*/
});


test('Keywords v. Strings (background)', function() {

	'use strict';

	input = readFile('./css/keywords-000.css');
	lexer.init(input);

	// p { background: green; }
	ok(nextToken().isIdent('p'));
	equal(nextToken(), Token.S, 'Whitespace');
	equal(nextToken(), Token.LBRACE, '{');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isIdent('background'));
	equal(nextToken(), Token.COLON, ':');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isIdent('green'));
	equal(nextToken(), Token.SEMICOLON, ';');
	equal(nextToken(), Token.S, 'Whitespace');
	equal(nextToken(), Token.RBRACE, '}');
	equal(nextToken(), Token.S, 'Whitespace');

	// p { background: "red"; }
	ok(nextToken().isIdent('p'));
	equal(nextToken(), Token.S, 'Whitespace');
	equal(nextToken(), Token.LBRACE, '{');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isIdent('background'));
	equal(nextToken(), Token.COLON, ':');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isString('red'));
	equal(nextToken(), Token.SEMICOLON, ';');
	equal(nextToken(), Token.S, 'Whitespace');
	equal(nextToken(), Token.RBRACE, '}');
	equal(nextToken(), Token.S, 'Whitespace');

	// p { color: white; }
	ok(nextToken().isIdent('p'));
	equal(nextToken(), Token.S, 'Whitespace');
	equal(nextToken(), Token.LBRACE, '{');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isIdent('color'));
	equal(nextToken(), Token.COLON, ':');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isIdent('white'));
	equal(nextToken(), Token.SEMICOLON, ';');
	equal(nextToken(), Token.S, 'Whitespace');
	equal(nextToken(), Token.RBRACE, '}');

	// EOF
	equal(nextToken(), Token.EOF, 'EOF');

});

test('Parsing escaped identifiers as selectors, property and value: ' +
	'Escaped characters are treated as normal characters.', function() {

	'use strict';

	// 'di\\v { c\\o\\l\\o\\r: green; } ';
	input = ALMCSS.stylesheet.readFile('./css/escaped-ident-char-001.css');
	lexer.init(input);

	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'div');
	nextToken(); // S (Whitespace)
	nextToken(); // '{'
	nextToken(); // S (Whitespace)
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'color');
	nextToken(); // ':';
	nextToken(); // S (Whitespace)
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'green');
	nextToken(); // ';';
	nextToken(); // S (Whitespace)
	nextToken(); // '}'
	nextToken(); // S (Whitespace)

	// EOF
	equal(nextToken(), Token.EOF, 'EOF');

});

test('Parsing escaped identifiers as selectors, property and value: ' +
	'Escaped identifiers are parsed and applied.', function() {

	'use strict';

	input = ALMCSS.stylesheet.readFile('./css/escaped-ident-001.css');
	lexer.init(input);

	ok(nextToken().isIdent('div'));
	equal(nextToken(), Token.LBRACE, '{');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isIdent('color'), 'color');
	equal(nextToken(), Token.COLON, ':');
	equal(nextToken(), Token.S, 'Whitespace');
	ok(nextToken().isIdent('green'), 'green');
	equal(nextToken(), Token.SEMICOLON, ';');
	equal(nextToken(), Token.S, 'Whitespace');
	equal(nextToken(), Token.RBRACE, '}');

	// EOF
	equal(nextToken(), Token.EOF, 'EOF');

});

test('Parsing escaped special CSS characters: ' +
	'Escaped special CSS characters are no longer meaningful.', function() {

	'use strict';

	input = ALMCSS.stylesheet.readFile('./css/escaped-ident-002.css');
	lexer.init(input);

	equal(nextToken().type, t.PERIOD, '.');
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, "1st'Class'");

});

test('Syntactic White Space: ' +
	'Only the characters U+0020, U+0009, U+000A, U+000D, and U+000C are considered white space.', function() {

	'use strict';

	input = readFile('css/core-syntax-009.css');
	lexer.init(input);

	token = nextToken();
	equal(token.type, t.COMMENT);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.ASTERISK);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.LBRACE);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('color'));
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('red'));
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.RBRACE);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('div'));
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('p'));
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.LBRACE);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('color'));
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('green'));
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.RBRACE);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('div'));
	//equal(nextToken().type, t.S);
	equal(nextToken().type, t.CHAR);
	ok(nextToken().isIdent('p'));
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.LBRACE);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('color'));
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	ok(nextToken().isIdent('red'));
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.RBRACE);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.EOF);

});

test('Unicode Escapes: ', function() {

	'use strict';

	input = ALMCSS.stylesheet.readFile('./css/escapes-004.css');
	lexer.init(input);

	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'p');
	equal(nextToken().type, t.PERIOD);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'class');
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.LBRACE);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'background');
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'red');
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'color');
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'white');
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.RBRACE);
	equal(nextToken().type, t.S);

	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'p');
	equal(nextToken().type, t.PERIOD);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'class');

	// According to CSS3 Syntax Module,
	// <a href="http://www.w3.org/TR/css3-syntax/#characters"
	// title="Characters and case">§ 4.1</a>, only one whitespace
	// character is ignored after a hexadecimal escape; <q>note
	// that this means that a "real" space after the scape sequence
	// must itself either be escaped or doubled</q>.

	//equal(nextToken().type, t.S);

	equal(nextToken().type, t.LBRACE);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'background');
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'green');
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.RBRACE);

	// EOF
	equal(nextToken().type, t.EOF);

});

test('At-rules', function() {

	'use strict';

	input = ALMCSS.stylesheet.readFile('./css/at-keywords-000.css');
	lexer.init(input);

	// @import "support/import-green.css";
	token = nextToken();
	equal(token.type, t.ATKEYWORD);
	equal(token.lexeme, 'import');
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.STRING);
	equal(token.lexeme, 'support/import-green.css');
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);

	// p { color: red; }
	for (var i = 0; i < 12; i++) {
		nextToken();
	}

	// EOF
	equal(nextToken().type, t.EOF);

});

test('URLs and URIs - Basic Containment', function() {

	'use strict';

	input = ALMCSS.stylesheet.readFile('./css/c11-import-000.css');
	lexer.init(input);

	//  @import url(support/a-green.css);
	token = nextToken();
	equal(token.type, t.ATKEYWORD);
	equal(token.lexeme, 'import');
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.URI);
	equal(token.lexeme, 'support/a-green.css');
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);

	//@import "support/b-green.css";
	token = nextToken();
	equal(token.type, t.ATKEYWORD);
	equal(token.lexeme, 'import');
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.STRING);
	equal(token.lexeme, 'support/b-green.css');
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);

	// .c { color: green; }
	for (var i = 0; i < 13; i++) {
		nextToken();
	}

	// @import url(support/c-red.css);
	token = nextToken();
	equal(token.type, t.ATKEYWORD);
	equal(token.lexeme, 'import');
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.URI);
	equal(token.lexeme, 'support/c-red.css');
	equal(nextToken().type, t.SEMICOLON);
	equal(nextToken().type, t.S);

	// <!-- .d { color: green; } -->
	equal(nextToken().type, t.CDO);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.PERIOD);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'd');
	equal(nextToken().type, t.S);
	for (i = 0; i < 10; i++) {
		nextToken();
	}
	equal(nextToken().type, t.CDC);

	// EOF
	equal(nextToken().type, t.EOF);

});

test('Length Units', function() {
	// numbers-units-005

	'use strict';

	lexer.init('table { margin: 1em 5em; }');
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'table');
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.LBRACE);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'margin');
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.DIMENSION);
	equal(token.value, '1');
	equal(token.unit, 'em');
	equal(token.lexeme, '1em');

	lexer.init('td { padding: 4px; vertical-align: top; }');
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'td');
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.LBRACE);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.IDENT);
	equal(token.lexeme, 'padding');
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.DIMENSION);
	equal(token.value, '4');
	equal(token.unit, 'px');
	equal(token.lexeme, '4px');

	// Other tests added by me
	lexer.init('80% 0.3em 120.33%');
	token = nextToken();
	equal(token.type, t.PERCENTAGE);
	equal(token.value, '80');
	equal(token.lexeme, '80%');
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.DIMENSION);
	equal(token.value, '0.3');
	equal(token.unit, 'em');
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.PERCENTAGE);
	equal(token.value, '120.33');
	equal(token.lexeme, '120.33%');
	lexer.init('+40cm -.3em');
	token = nextToken();
	equal(token.type, t.DIMENSION);
	equal(token.value, '+40');
	equal(token.unit, 'cm');
	equal(token.lexeme, '+40cm');
	nextToken(); // S
	token = nextToken();
	equal(token.type, t.DIMENSION);
	equal(token.value, '-.3');
	equal(token.unit, 'em');
	equal(token.lexeme, '-.3em');

});

test('Optional unit identifier after 0: ' +
	'After a zero length, the unit identifier is not necessary.', function() {

	lexer.init('height: 0');
	ok(nextToken().isIdent('height'));
	equal(nextToken().type, t.COLON);
	equal(nextToken().type, t.S);
	token = nextToken();
	equal(token.type, t.NUMBER);
	equal(token.value, '0');
	equal(token.unit, undefined);
	equal(token.lexeme, '0');

});

test('Colors: RGB and hexadecimal color values syntax', function() {

	'use strict';

	input = ALMCSS.stylesheet.readFile('./css/color-000.css');
	lexer.init(input);

	lexer.init('rgb(255, 0, 0%)');
	token = nextToken();
	equal(token.type, t.FUNCTION);
	equal(token.name, 'rgb');
	token = nextToken();
	equal(token.type, t.NUMBER);
	equal(nextToken(), Token.COMMA);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.NUMBER);
	equal(nextToken(), Token.COMMA);
	equal(nextToken().type, t.S);
	equal(nextToken().type, t.PERCENTAGE);

	lexer.init('#ccc)');
	token = nextToken();
	equal(token.type, t.HASH);
	equal(token.name, 'ccc');

	lexer.init('#11bb00)');
	token = nextToken();
	equal(token.type, t.HASH);
	equal(token.name, '11bb00');

	lexer.init('.one {color: #0f0;}');
	equal(nextToken(), Token.PERIOD);
	equal(nextToken().type, t.IDENT);
	equal(nextToken(), Token.S);
	equal(nextToken(), Token.LBRACE);
	equal(nextToken().type, t.IDENT);
	equal(nextToken(), Token.COLON);
	equal(nextToken(), Token.S);
	token = nextToken();
	equal(token.type, t.HASH);
	equal(token.name, '0f0');

});