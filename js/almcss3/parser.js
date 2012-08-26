var ALMCSS = ALMCSS || {};

ALMCSS.parser = function() {

	'use strict';

	var assert = ALMCSS.debug.assert,
		AssertionError = ALMCSS.debug.AssertionError,
		LoggerLevel = ALMCSS.debug.LoggerLevel;

	var ASTERISK = '@';

	var IS_HEX_DIGIT  =  1;
    var START_IDENT   =  2;
    var IS_IDENT      =  4;
    var IS_WHITESPACE =  8;
    var IS_URL_CHAR   = 16;

    var W    = IS_WHITESPACE;
    var I    = IS_IDENT;
    var U    =                                   IS_URL_CHAR;
    var S    =          START_IDENT;
    var UI   = IS_IDENT                         |IS_URL_CHAR;
    var USI  = IS_IDENT|START_IDENT             |IS_URL_CHAR;
    var UXI  = IS_IDENT            |IS_HEX_DIGIT|IS_URL_CHAR;
    var UXSI = IS_IDENT|START_IDENT|IS_HEX_DIGIT|IS_URL_CHAR;


    var lexTable = [
        //                                     TAB LF      FF  CR
           0,  0,  0,  0,  0,  0,  0,  0,  0,  W,  W,  0,  W,  W,  0,  0,
        //
           0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
        // SPC !   "   #   $   %   &   '   (   )   *   +   ,   -   .   /
           W,  U,  0,  U,  U,  U,  U,  0,  0,  0,  U,  U,  U,  UI, U,  U,
        // 0   1   2   3   4   5   6   7   8   9   :   ;   <   =   >   ?
           UXI,UXI,UXI,UXI,UXI,UXI,UXI,UXI,UXI,UXI,U,  U,  U,  U,  U,  U,
        // @   A   B   C    D    E    F    G   H   I   J   K   L   M   N   O
           U,UXSI,UXSI,UXSI,UXSI,UXSI,UXSI,USI,USI,USI,USI,USI,USI,USI,USI,USI,
        // P   Q   R   S   T   U   V   W   X   Y   Z   [   \   ]   ^   _
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,U,  S,  U,  U,  USI,
        // `   a   b   c    d    e    f    g   h   i   j   k   l   m   n   o
           U,UXSI,UXSI,UXSI,UXSI,UXSI,UXSI,USI,USI,USI,USI,USI,USI,USI,USI,USI,
        // p   q   r   s   t   u   v   w   x   y   z   {   |   }   ~
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,U,  U,  U,  U,  0,
        // U+008*
           0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
        // U+009*
           0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
        // U+00A*
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,
        // U+00B*
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,
        // U+00C*
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,
        // U+00D*
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,
        // U+00E*
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,
        // U+00F*
           USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI,USI
    ];

    var codeOf = function(character) {
        return character.charCodeAt(0);
    };

    var isDigit = function(character) {
        return (character >= '0') && (character <= '9');
    };

    var isHexDigit = function(character) {
        var code = codeOf(character);
        return code < 256 && (lexTable[code] & IS_HEX_DIGIT) !== 0;
    };

    var isWhitespace = function(character) {
        var code = codeOf(character);
        return code < 256 && (lexTable[code] & IS_WHITESPACE) !== 0;
    };

    var hexDigitValue = function(character) {
        if (isDigit(character)) {
            return parseInt(character, 10);
        }
        switch (character.toLowerCase()) {
            case 'a': return 10;
            case 'b': return 11;
            case 'c': return 12;
            case 'd': return 13;
            case 'e': return 14;
            case 'f': return 15;
        }
        throw new AssertionError('An hexadecimal digit was expected: ' + character);
    };

	// LexicalError

	var LexicalError = function(message) {
		this.name = 'LexicalError';
		this.message = message;
	};

	LexicalError.prototype = Object.create(Error.prototype);

    // TokenType

	var TokenType = function(name) {
		this.name = name;
	};

	TokenType.prototype.toString = function() {
		return this.name;
	};

	TokenType.EOF = new TokenType('EOF');
	// Tokens defined by the CSS3 Syntax Module
	TokenType.IDENT             = new TokenType('IDENT');
	TokenType.ATKEYWORD         = new TokenType('ATKEYWORD');       // '@' IDENT
	TokenType.STRING            = new TokenType('STRING');
	TokenType.HASH              = new TokenType('HASH');            // '#'{name}
	TokenType.NUMBER            = new TokenType('NUMBER');
	TokenType.PERCENTAGE        = new TokenType('PERCENTAGE');      // NUMBER '%'
	TokenType.DIMENSION         = new TokenType('DIMENSION');       // NUMBER IDENT
	TokenType.URI               = new TokenType('URI');
	TokenType.UNICODE_RANGE     = new TokenType('UNICODE-RANGE');
	TokenType.CDO               = new TokenType('CDO');             // '<!--'
	TokenType.CDC               = new TokenType('CDC');             // '-->'
	TokenType.S                 = new TokenType('S');               // Whitespace
	TokenType.COMMENT           = new TokenType('COMMENT');         // /* ... */
	TokenType.FUNCTION          = new TokenType('FUNCTION');        // IDENT '('
	TokenType.INCLUDES          = new TokenType('INCLUDES');        // '~='
	TokenType.DASHMATCH         = new TokenType('DASHMATCH');       // '|='
	TokenType.PREFIXMATCH       = new TokenType('PREFIXMATCH');     // '^='
	TokenType.SUFFIXMATCH       = new TokenType('SUFFIXMATCH');     // '$='
	TokenType.SUBSTRINGMATCH    = new TokenType('SUBSTRINGMATCH');  // '*='
	TokenType.CHAR              = new TokenType('CHAR');            // any other char not matched
	TokenType.BOM               = new TokenType('BOM');             // #xFEFF
	// Tokens defined by the CSS3 Selectors Module
	TokenType.PLUS              = new TokenType('PLUS');            // {w}'+'
	TokenType.GREATER           = new TokenType('GREATER');         // {w}'>'
	TokenType.COMMA             = new TokenType('COMMA');           // {w}','
	TokenType.TILDE             = new TokenType('TILDE');           // {w}'~'
	TokenType.NOT               = new TokenType('NOT');             // ':NOT('
	TokenType.INVALID           = new TokenType('INVALID');
	//
	// Other tokens defined by the CSS 2.1 Grammar:
	//
	// - http://www.w3.org/TR/CSS21/syndata.html
	// - http://www.w3.org/TR/CSS21/grammar.html
	//
	TokenType.COLON             = new TokenType('COLON');           // ':'
	TokenType.SEMICOLON         = new TokenType('SEMICOLON');       // ';'
	TokenType.LBRACE            = new TokenType('LBRACE');          // '{'
	TokenType.RBRACE            = new TokenType('RBRACE');          // '}'
	TokenType.LPAREN            = new TokenType('LPAREN');          // '('
	TokenType.RPAREN            = new TokenType('RPAREN');          // ')'
	TokenType.LBRACKET          = new TokenType('LBRACKET');        // '['
	TokenType.RBRACKET          = new TokenType('RBRACKET');        // ']'
	// Tokens needed by the CSS3 Template Module
	TokenType.SLASH             = new TokenType('SLASH');           // '/'
	TokenType.AUTO              = new TokenType('AUTO');            // 'auto'
	TokenType.ASTERISK          = new TokenType('ASTERISK');        // '*'
	TokenType.MIN_CONTENT       = new TokenType('MIN-CONTENT');     // 'min-content'
	TokenType.MAX_CONTENT       = new TokenType('MAX-CONTENT');     // 'max-content'
	TokenType.MINMAX            = new TokenType('MINMAX');          // 'minmax'
	TokenType.FIT_CONTENT       = new TokenType('FIT-CONTENT');     // 'fit-content'
	TokenType.LETTER            = new TokenType('LETTER');
	TokenType.SAME              = new TokenType('SAME');            // 'same'
	TokenType.SLOT              = new TokenType('SLOT');            // '::slot('{name}')'
	// Other tokens added by me
	TokenType.PERIOD            = new TokenType('PERIOD');          // '.'
	TokenType.EQUALS            = new TokenType('EQUALS');           // '='


	// Token

    var Token = function(type, lexeme) {
        this.type = type;
        this.lexeme = lexeme;
    };

    Token.prototype.is = function(tokenType) {
		return this.type === tokenType;
    };

	var falseFunction = function() {
		return false;
	};

	Token.prototype.isIdent = falseFunction;
	Token.prototype.isAtKeyword = falseFunction;
	Token.prototype.isString = falseFunction;
	Token.prototype.isHash = falseFunction;
	Token.prototype.isNumber = falseFunction;
	Token.prototype.isPercentage = falseFunction;
	Token.prototype.isDimension = falseFunction;
	Token.prototype.isUri = falseFunction;
	Token.prototype.isUnicodeRange = falseFunction;
	Token.prototype.isComment = falseFunction;
	Token.prototype.isFunction = falseFunction;
	Token.prototype.isDelim = falseFunction;

	Token.prototype.isCombinator = function() {
		return this === Token.PLUS || this === Token.GREATER || this === Token.TILDE || this === Token.S;
	};


	Token.prototype.toString = function() {
        return this.type.name + ' (' + this.lexeme + ')';
    };

	Token.EOF = new Token(TokenType.EOF, 'End of file');
	Token.S = new Token(TokenType.S, ' ');
	Token.CDO = new Token(TokenType.CDO, '<!--');
    Token.CDC = new Token(TokenType.CDC, '-->');
    Token.INCLUDES = new Token(TokenType.INCLUDES, '~=');
    Token.DASHMATCH = new Token(TokenType.DASHMATCH, '|=');
    Token.PREFIXMATCH = new Token(TokenType.PREFIXMATCH, '^=');
    Token.SUFFIXMATCH = new Token(TokenType.SUFFIXMATCH, '$=');
    Token.SUBSTRINGMATCH = new Token(TokenType.SUBSTRINGMATCH, '*=');
    Token.BOM = new Token(TokenType.BOM, '#xFEFF');
    // The following tokens are defined in the CSS3 Selectors Module
    Token.PLUS = new Token(TokenType.PLUS, '+');
    Token.GREATER = new Token(TokenType.GREATER, '>');
    Token.COMMA = new Token(TokenType.COMMA, ',');
    Token.TILDE = new Token(TokenType.TILDE, '~');
    Token.PLUS = new Token(TokenType.PLUS, '+');
	// Tokens defined by the CSS 2.1 Grammar
	Token.COLON = new Token(TokenType.COLON, ':');
	Token.SEMICOLON = new Token(TokenType.SEMICOLON, ';');
	Token.LBRACE = new Token(TokenType.LBRACE, '{');
	Token.RBRACE = new Token(TokenType.RBRACE, '}');
	Token.LPAREN = new Token(TokenType.LPAREN, '(');
	Token.RPAREN = new Token(TokenType.RPAREN, ')');
	Token.LBRACKET = new Token(TokenType.LBRACKET, '[');
	Token.RBRACKET = new Token(TokenType.RBRACKET, ']');
	// Tokens created by me for the CSS3 Template Module
    Token.SLASH = new Token(TokenType.SLASH, '/');
    Token.AUTO = new Token(TokenType.AUTO, 'auto');
    Token.ASTERISK = new Token(TokenType.ASTERISK, '*');
    Token.MAX_CONTENT = new Token(TokenType.MAX_CONTENT, 'max-content');
    Token.MIN_CONTENT = new Token(TokenType.MIN_CONTENT, 'min-content');
    Token.FIT_CONTENT = new Token(TokenType.FIT_CONTENT, 'fit-content');
    Token.SAME = new Token(TokenType.SAME, 'same');
	// Other tokens added by me
	Token.PERIOD = new Token(TokenType.PERIOD, '.');
	Token.EQUALS = new Token(TokenType.EQUALS, '=');

	// IDENT

	var IdentifierToken = function(name) {
		Token.call(this, TokenType.IDENT, name);
		this.name = name;
	};

	IdentifierToken.prototype = Object.create(Token.prototype);

	IdentifierToken.prototype.isIdent = function(name) {
		if (!name) {
			return true;
		}
		return this.name === name;
	};

	// AT-KEYWORD

	var AtKeywordToken = function(name) {
		Token.call(this, TokenType.ATKEYWORD, name);
		this.name = name;
	};

	AtKeywordToken.prototype = Object.create(Token.prototype);

	AtKeywordToken.prototype.isAtKeyword = function(name) {
		if (!name) {
			return true;
		}
		return this.name === name;
	};

	// STRING

	var StringToken = function(value) {
		Token.call(this, TokenType.STRING, value);
		this.value = value;
	};

	StringToken.prototype = Object.create(Token.prototype);

	StringToken.prototype.isString = function(value) {
		if (!value) {
			return true;
		}
		return this.value === value;
	};

	// HASH

	var HashToken = function(name) {
		Token.call(this, TokenType.HASH, name);
		this.name = name;
	};

	HashToken.prototype = Object.create(Token.prototype);

	HashToken.prototype.isHash = function(name) {
		if (!name) {
			return true;
		}
		return this.name === name;
	};

	// NUMBER

	var NumberToken = function(value) {
		Token.call(this, TokenType.NUMBER, value);
		this.value = value;
	};

	NumberToken.prototype = Object.create(Token.prototype);

	NumberToken.prototype.isNumber = function(value) {
		if (!value) {
			return true;
		}
		return this.value === value;
	};

	// PERCENTAGE

	var PercentageToken = function(value) {
		Token.call(this, TokenType.PERCENTAGE, value + '%');
		this.value = value;
	};

	PercentageToken.prototype = Object.create(Token.prototype);

	PercentageToken.prototype.isPercentage = function(value) {
		if (!value) {
			return true;
		}
		return this.value === value;
	};

	// DIMENSION

	// Both `value` and `string` are supposed to be `string` objects, like for
	// example '13' and 'em', or '120' and 'px'.
	var DimensionToken = function(value, unit) {
		Token.call(this, TokenType.DIMENSION, value + unit);
		this.value = value;
		this.unit = unit;
	};

	DimensionToken.prototype = Object.create(Token.prototype);

	// If a value is present, it is expected to be an string representing a
	// dimension, that is, the sum of a value and a unit, like '13em' or '120px'.
	DimensionToken.prototype.isDimension = function(value) {
		if (!value) {
			return true;
		}
		return value === this.value + this.unit;
	};

	// URI

	var UriToken = function(value) {
		Token.call(this, TokenType.URI, value);
		this.value = value;
	};

	UriToken.prototype = Object.create(Token.prototype);

	UriToken.prototype.isUri = function(value) {
		if (!value) {
			return true;
		}
		return this.value === value;
	};

	// UNICODE-RANGE

    var UnicodeRangeToken = function(value, low, high, valid) {
        Token.call(this, TokenType.UNICODE_RANGE, value);
		this.value = value;
        this.low = low;
        this.high = high;
        this.valid = valid;
    };

    UnicodeRangeToken.prototype = Object.create(Token.prototype);

	UnicodeRangeToken.prototype.isUnicodeRange = function(value) {
		if (!value) {
			return true;
		}
		return this.value === value;
	};

	// COMMENT

	var CommentToken = function(comment) {
		Token.call(this, TokenType.COMMENT, comment);
	};

	CommentToken.prototype = Object.create(Token.prototype);

	CommentToken.prototype.isComment = function() {
		return true;
	};

	// FUNCTION

	var FunctionToken = function(name) {
		Token.call(this, TokenType.FUNCTION, name);
		this.name = name;
	};

	FunctionToken.prototype = Object.create(Token.prototype);

	FunctionToken.prototype.isFunction = function(name) {
		if (!name) {
			return true;
		}
		return this.name === name;
	};

	// CHAR (called DELIM in CSS 2.1 Spec)

	var CharToken = function(charSymbol) {
		Token.call(this, TokenType.CHAR, charSymbol);
		this.symbol = charSymbol;
	};

	CharToken.prototype = Object.create(Token.prototype);

	CharToken.prototype.isDelim = function(charSymbol) {
		if (!charSymbol) {
			return true;
		}
		return this.symbol === charSymbol;
	};

	// MIN-MAX

	// TODO
	var MinMax = function(p, q) {
		Token.call(this, TokenType.MINMAX, p + ', ' + q);
		this.p = p;
		this.q = q;
	};

	MinMax.prototype = Object.create(Token.prototype);

	//
	//
	//
	//
	// Lexer
	// -----
	//
	//
	//
	//

	var Lexer = function() {

		var logger = ALMCSS.debug.getLogger('Lexer');
		var log = logger.log;
		var info = logger.info;
		var warn = logger.warn;

        var EOF = -1;

		var input;
        var position = 0;
        var currentChar;
        var currentSpelling = '';

        var nextChar = function() {
            if (position < input.length) {
                currentChar = input.charAt(position);
                currentSpelling = currentSpelling + currentChar;
                position = position + 1;
            } else {
                currentChar = EOF;
            }
			return currentChar;
        };

        var pushback = function(howManyChars) {
			howManyChars = howManyChars || 1;
			for (var i = 0; i < howManyChars; i++) {
				assert(position > 0, 'There is nothing to be pushed back into the input stream');
				assert(currentSpelling.length > 0,
					'Why would someone want to push back characters that have already been ' +
					'recognized as part of valid tokens?');
				position = position - 1;
				currentChar = input.charAt(position - 1);
				currentSpelling = currentSpelling.substring(0, currentSpelling.length - 1);
			}
        };

		// Scans a comment block.

		var scanComment = function() {
			assert(currentSpelling === '/*', 'A start of comment was expected: ' + currentSpelling);
			log('Skipping comment...');
			var comment = currentSpelling;
			while (true) {
				comment = comment + nextChar();
				if (currentChar === '*') {
					if (nextChar() === '/') {
						comment = comment + currentChar;
						log('A comment block was matched: ' + comment);
						nextChar();
						return new CommentToken(comment);
					}
				}
				if (currentChar === EOF) {
					warn('Unexpected end of file while skipping a comment block');
					info(comment);
					return new CommentToken(comment);
				}
			}
		};

		//     STRING ::= string
		//
		//     string ::= '"' (stringchar | "'")* '"' |
		//                "'" (stringchar | '"')* "'"
		//     stringchar ::= urlchar | #x20 | '\' nl
		//
		var gatherString = function() {
			log('Gathering a string...');
			assert(currentChar === '"' || currentChar === "'",
					'A string must start either by \' or "');
			var quote, result;
			quote = currentChar;
			result = '';
			nextChar();
			while (currentChar !== EOF && currentChar !== quote &&
					(isUrlChar(currentChar) || currentChar === ' ' || currentChar === '\\')) {
				// According to CSS3 Syntax Module §4.1 (Characters and case),
				// inside a string, a backslash followed by a newline is
				// ignored (i.e., the string is deemed not to contain either
				// the backslash or the newline)</cite>
				if (currentChar === '\\') {
					nextChar();
					if (currentChar === '\n' || currentChar === '\r' || currentChar === '\f') {
						nextChar(); // Ignore both the backslash and the newline character
					} else { // Otherwise, analyses it as a normal escaped sequence
						pushback();
						result = result + gatherEscape();
					}
				}
				result = result + currentChar;
				nextChar();
			}
			if (currentChar === quote) {
				nextChar(); // Omit closing quote
			} else {
				warn('Mismatch closing quote in a string: what has to be done?');
			}
			log('The string gathered was: ' + result);
			return result;
		};

		var scanString = function() {
			log('Scanning a string...');
			return new StringToken(gatherString());
		};

		var skipWhitespaces = function() {
			log('Skipping whitespaces...');
			while (currentChar !== EOF && isWhitespace(currentChar)) {
				nextChar();
			}
		};

		var isUrlChar = function(character) {
			var code = codeOf(character);
			return code >= 0 && (code > 256 || lexTable[code] & IS_URL_CHAR) !== 0;
		};

		var scanUri = function() {
			assert(currentSpelling.toLowerCase() === 'url(',
					"An URI token must start by 'url(', not by '" + currentSpelling + "'");
			nextChar();
			skipWhitespaces();
			var uri = '';
			if (currentChar === '"' || currentChar === "'") {
				uri = gatherString();
			} else {
				while (currentChar !== EOF && (isUrlChar(currentChar) || currentChar === '\\')) {
					if (currentChar === '\\') {
						uri = uri + gatherEscape();
					}
					if (currentChar === '"' || currentChar === "'") {
						uri = uri + gatherString();
						break;
					}
					uri = uri + currentChar;
					nextChar();
				}
			}
			skipWhitespaces();
			if (currentChar === ')') {
				nextChar();
				return new UriToken(uri);
			}
			throw new LexicalError('Missing closing paren while scanning an URI token: ' +
					currentSpelling);
		};

		// Checks whether a character is valid as a part of an identifier. Note
		// that this is more relaxed than the requirements for being a valid
		// start of identifier:
		//
		//     nmchar ::= [a-zA-Z0-9] | '-' | '_' | nonascii | escape
		//
		// Basically, numbers and '-' are allowed inside an identifier.
		//
		var isIdent = function(character) {
			var code = codeOf(character);
			return code >= 256 || (lexTable[code] & IS_IDENT) !== 0;
		};

        // Checks whether there is a possible start of identifier at current
        // position on the input stream, according to the CSS production:
        //
        //     ident    ::= '-' ? nmstart nmchar*
        //     nmstart  ::= [a-zA-Z] | '_' | nonascii | escape
        //
		// If the first character is a '-' this functions needs to read another
		// character from the input stream to check whether that second character
		// is also a valid start of identifier. After testing it, that character
		// is returned to the input stream, so that this function always leaves
		// the input stream in the same state that it has when it was called.
		//
        var isIdentStart = function(character) {

			if (character === '-') {
				character = nextChar();
				pushback();
			}
			var code = codeOf(character);
			return code >= 256 || (lexTable[code] & START_IDENT) !== 0;
        };

		var gatherEscape = function() {
			assert(currentChar === '\\', 'Why has gatherScape been called if the current character is not \'\\\'?');
			log('Looking for a character escape...');
			var i = 0, code = 0;
			var escape = currentChar + nextChar();
			while (isHexDigit(currentChar) && i < 6) {
				code = code * 16 + hexDigitValue(currentChar.toLowerCase());
				escape = escape + nextChar();
				i = i + 1;
			}

			if (i === 0) {
				log('Invalid escape sequence: ' + escape);
				return false;
			}

			// According to CSS3 Syntax Module,
			// <a href="http://www.w3.org/TR/css3-syntax/#characters"
			// title="Characters and case">§ 4.1</a>, only one whitespace
			// character is ignored after a hexadecimal escape; <q>note
			// that this means that a "real" space after the scape sequence
			// must itself either be escaped or doubled</q>.
			if (isWhitespace(currentChar)) {
				var isCarriageReturn = currentChar === '\r';
				nextChar();
				// However, in this case (a whitespace after the hexadecimal
				// number), <cite>user agents should treat a "CR/LF" pair
				// (13/10) as a single whitespace</cite>
				if (currentChar === '\f') {
					nextChar();
				}
			}

			pushback();
			var result = String.fromCharCode(code);
			log("A valid escape character was found: '" + escape + "' (" + result + ')');
			return result;
		};

		var gatherIdent = function() {
			log('Gathering an identifier...');
			if (!isIdentStart(currentChar)) {
				log('This is not a valid start of an identifier, so nothing was gathered: ' + currentChar);
				return '';
			}
			var ident = '';
			if (currentChar === '-') {
				ident = ident + nextChar();
				assert(isIdentStart(currentChar), 'This was supposed to be a valid identifier start: ' + currentChar);
			}
			while (currentChar !== EOF && (isIdent(currentChar) || currentChar === '\\')) {
				if (currentChar === '\\') {
					log("Found a backslash ('\') inside an identifier");
					var escape = gatherEscape();
					// If an escape was successfully parsed by `gatherEscape`
					// the value of the escaped character is added to this
					// identifier; otherwise, it means that the final of the
					// identifier has been reached (the backslash will remain
					// as the current character of the input stream and will
					// be returned as a CHAR token in the following call to
					// `nextToken`
					//
					// Correction: no; despite it is not clear in the spec
					// (CSS3 Syntax Module), according to CSS 2.1 Test Suite,
					// and specifically to escaped-ident-char-001
					// (http://test.csswg.org/suites/css2.1/20110323/html4/escaped-ident-char-001.htm),
					// it seems that in that case the backslash is omitted and
					// the following character is normally added to the
					// identifier. For example:
					//
					//     di\v {
					//         \c\o\l\o\r: green;
					//     }
					//
					// should be recognised as:
					//
					//     div {
					//         color: green;
					//
					if (!escape) {
						//continue;
						ident = ident + currentChar;
					} else {
						ident = ident + escape;
					}
				} else {
					ident = ident + currentChar;
				}
				nextChar();
			}
			log('The identifier gathered was: ' + ident);
			return ident;
		};

		var gatherName = function() {
			log('Gathering a name...');
			if (!isIdent(currentChar)) {
				log('This is not a valid char of an identifier, so nothing was gathered: ' + currentChar);
				return '';
			}
			var ident = '';
			if (currentChar === '-') {
				ident = ident + nextChar();
				assert(isIdent(currentChar), 'This was supposed to be a valid name char: ' + currentChar);
			}
			while (currentChar !== EOF && (isIdent(currentChar) || currentChar === '\\')) {
				if (currentChar === '\\') {
					log("Found a backslash ('\') inside an identifier");
					var escape = gatherEscape();
					// If an escape was successfully parsed by `gatherEscape`
					// the value of the escaped character is added to this
					// identifier; otherwise, it means that the final of the
					// identifier has been reached (the backslash will remain
					// as the current character of the input stream and will
					// be returned as a CHAR token in the following call to
					// `nextToken`
					//
					// Correction: no; despite it is not clear in the spec
					// (CSS3 Syntax Module), according to CSS 2.1 Test Suite,
					// and specifically to escaped-ident-char-001
					// (http://test.csswg.org/suites/css2.1/20110323/html4/escaped-ident-char-001.htm),
					// it seems that in that case the backslash is omitted and
					// the following character is normally added to the
					// identifier. For example:
					//
					//     di\v {
					//         \c\o\l\o\r: green;
					//     }
					//
					// should be recognised as:
					//
					//     div {
					//         color: green;
					//
					if (!escape) {
						//continue;
						ident = ident + currentChar;
					} else {
						ident = ident + escape;
					}
				} else {
					ident = ident + currentChar;
				}
				nextChar();
			}
			log('The name gathered was: ' + ident);
			return ident;
		};

		// Analyses the input stream looking for either an identifier, a
		// function name, or a keyword. A valid start of identifier is expected
		// to be found as current character in the input stream, and it reads
		// characters from the input stream while they are valid identifier
		// characters or any escaped character (<q>backslash escapes are always
		// considered to be part of an identifier or a string (i.e., "\7B" is
		// not punctuation, even though "{" is, and "\32" is allowed at the
		// start of a class name, even though "2" is not</q> &mdash;CSS3 Syntax
		// Module, § 4.1). An identifier can also starts by '-', in which case
		// the following character must also be a valid identifier start.
		//
		// If the identifier is immediately followed by a left parenthesis, it
		// represents either a `URI` or a `FUNCTION`, and one of those tokens
		// is returned. Otherwise, it returns an `IDENT` token.
		//
		var scanIdentifier = function() {
			assert(isIdentStart(currentChar), '\'' + currentChar + '\' is not a valid start for an identifier');
			log('Scanning an identifier (currentSpelling = ' + currentSpelling + ')...');
			var ident = gatherIdent();
			// If this identifier is immediately followed by a left parenthesis,
			// it is either a function or a URI token
			if (currentChar === '(') {
				if (ident.toLowerCase() === 'url') {
					return scanUri();
				}
				// Note that, in the case of functions, the grammar rule is:
				//     {ident}"("
				// That is, the function token only comprises the name of the
				// function and the left parenthesis, the rest is left to the
				// parser
				nextChar(); // To skip the left parenthesis
				return new FunctionToken(ident);
			}
			// If the identifier is a keyword, the token for that keyword is returned
			switch (ident.toLowerCase()) {
				case "auto": return Token.AUTO;
				case "max-content": return Token.MAX_CONTENT;
				case "min-content": return Token.MIN_CONTENT;
				case "minmax": return Token.MINMAX;
				case "fitcontent": return Token.FIT_CONTENT;
				case "same": return Token.SAME;
			}
			log('An identifier was found: ' + ident);
			return new IdentifierToken(ident);
		};

		var scanAtKeyword = function() {
			assert(currentSpelling.charAt(0) === '@',
				"A character at ('@') should have been read to scan an AT-KEYWORD token: " + currentChar);
			assert(isIdent(currentChar),
				'The character following the at symbol should be a valid identifier start: ' + currentChar);
			log('Scanning an "at" keyword...');
			var ident = gatherIdent();
			if (ident === '') {
				log("Character at ('@') was not followed by a valid identifier, " +
					'an at token will be returned instead');
				return Token.AT;
			}
			log('An at keyword was matched: ' +  ident);
			return new AtKeywordToken(ident);
		};

		// NUMBER or DIMENSION

		var scanNumberOrDimension = function() {

			var startChar = currentSpelling.charAt(0),
				dotFound = false,
				number = '',
				unit = '';

			assert(startChar === '.' || startChar === '+' || startChar === '-' || isDigit(startChar),
				"Why has this been called with '" + startChar + "'?");
			assert(isDigit(currentChar) || currentChar === '.',
				"A digit or dot ('.') was expected as current char: " + currentChar);

			log('Scanning a number or a dimension...');

			if (!isDigit(startChar)) {
				number = number + startChar;
			}

			while (isDigit(currentChar) || currentChar === '.') {
				if (currentChar === '.') {
					if (dotFound) {
						log('Another dot has been found while scanning the fractional part of a number');
						break;
					} else {
						log('Found a dot while scanning a number: we continue scanning its fractional part');
						dotFound = true;
					}
				}
				number = number + currentChar;
				nextChar();
			}
			log("number = " + number);
			if (currentChar !== EOF && isIdentStart(currentChar)) {
				unit = gatherIdent();
				log('A dimension token was matched: ' + number + unit);
				return new DimensionToken(number, unit);
			}
			if (currentChar === '%') {
				log('A percentage token was matched: ' + number + currentChar);
				nextChar();
				return new PercentageToken(number);
			}
			log('A number token was matched: ' + number);
			//nextChar();
			return new NumberToken(number);
		};

		// From the CSS Fonts Module Level 3
		// <a href="http://www.w3.org/TR/css3-fonts/#unicode-range-desc"
		// title="Character range: the unicode-range descriptor">§ 4.5</a>,
		// <cite>each unicode range value is prefixed by "U+" and multiple,
		// discontinuous ranges are separated by commas</cite>. The Fonts
		// specification continues saying that whitespaces before or after
		// commas are ignored, and that valid character code values vary
		// between 0 and 10FFFF inclusive. A single range has three basic
		// forms:
		//
		// - a single code point (for example, U+416)
		// - an interval value range (for example, U+400-4ff)
		// - a range where trailing '?' characters imply 'any digit value'
		//   (for example, U+4??)
		//
        var scanUnicodeRange = function() {

            assert(currentChar === '+');
            assert(currentSpelling === 'u+' || currentSpelling === 'U+',
                          'A Unicode range should start with eiter \'u+\' or \'U+\': ' + currentSpelling);

            function isHexDigitOrQuestionMark(character) {
                return isHexDigit(character) || character === '?';
            }

			log('Scanning an unicode range... (current spelling = ' + currentSpelling);

			nextChar();

			// If the character immediately after the plus sign (+) is not a
			// hex digit or '?', this is not really a unicode range token: scan
			// it as an identifier starting by 'U' (or 'u')
			if (!isHexDigit(currentChar) && currentChar !== '?') {
                pushback(2);
				assert(currentChar === 'u' || currentChar === 'U');
				assert(currentSpelling === 'u' || currentSpelling === 'U');
				return scanIdentifier(); // A
            }

            var i = 0, valid = true, hasQuestionMarks = false, low = 0, high = 0;

            while (i < 6 && isHexDigitOrQuestionMark(currentChar)) {
                nextChar();
                if (isHexDigit(currentChar)) {
                    if (hasQuestionMarks) {
                        valid = false;
                        log('All question marks should be at the end in a Unicode range');
                    }
                    low = low * 16 + hexDigitValue(currentChar);
                    high = high * 16 + hexDigitValue(currentChar);
                } else {
                    hasQuestionMarks = true;
                    low = low * 16 + 0x0;
                    high = high * 16 + 0xF;
                }
                i = i + 1;
            }

            if (currentChar === '-') {
                nextChar();
                if (isHexDigit(currentChar)) {
                    if (hasQuestionMarks) {
                        valid = false;
                        log('All question marks should be at the end in a Unicode range');
                    }
                    high = i = 0;
                    while (i < 6 && isHexDigit(currentChar)) {
                        nextChar();
                        high = high * 16 + hexDigitValue(currentChar);
                        i = i + 1;
                    }
                }
            }

			log('A unicode range was matched: ' + currentSpelling);
            return new UnicodeRangeToken(low, high, valid);

        }; // scanUnicodeRange

		var scanHash = function() {
			assert(currentChar === '#', "A hash must start with '#', not with '" + currentChar + "'. " +
				"Why has this been called?");
			var id = '';
			nextChar();
			if (currentChar !== EOF && (isIdent(currentChar) || currentChar === '\\')) {
				//id = gatherIdent();
				id = gatherName();
				if (id) {
					return new HashToken(id);
				}
			}
			pushback();
			return scanCharToken();
		};

		var scanCharToken = function() {
			log("Looking if '" + currentChar + "' is one of the single character tokens...");
			var result;
			switch (currentChar) {
				case '#': result = assert(false, 'This should have been matched by scanHash'); break;
				case '+': result = Token.PLUS; break;
				case '>': result = Token.GREATER; break;
				case ',': result = Token.COMMA; break;
				case '~': result = Token.TILDE; break;
				case '*': result = Token.ASTERISK; break;
				case '{': result = Token.LBRACE; break;
				case '}': result = Token.RBRACE; break;
				case '(': result = Token.LPAREN; break;
				case ')': result = Token.RPAREN; break;
				case ':': result = Token.COLON; break;
				case ';': result = Token.SEMICOLON; break;
				case '.': result = Token.PERIOD; break;
				case '=': result = Token.EQUALS; break;
				default : result = new CharToken(currentChar);
					log('A char not matched by any other rule has been found: ' + currentChar + '\n' +
						'Therefore, a CHAR token is returned');
			}
			nextChar();
			return result;
		};

		var currentInput = function() {
			var startPosition = position - 1,
				endPosition,
				endLine;

			endLine = input.indexOf('\n', position);
			endPosition = endLine ? endLine : input.length;
			return input.substring(startPosition, endPosition) + ' [...]';
		};

		var nextToken = function() {

			var previousChar;

			log('nextToken has been called, current input is: ' + currentInput());
			currentSpelling = currentChar;

			// EOF
			if (currentChar === EOF) {
				return Token.EOF;
			}

			// Why does JSCSSP not look for Unicode characters, like Mozilla
			// nsCSSScanner does?

			// UNICODE-RANGE
			if ((currentChar === 'u' || currentChar === 'U')) {
				if (nextChar() === '+') {
					return scanUnicodeRange();
				} else {
					pushback();
				}
			}

			// IDENT
			if (isIdentStart(currentChar)) {
				return scanIdentifier();
			}

			// AT-KEYWORD
			if (currentChar === '@') {
				nextChar();
				if (isIdentStart(currentChar)) {
					return scanAtKeyword();
				}
				pushback();
			}

			// NUMBER, DIMENSION or PERCENTAGE
			if (currentChar === '.' || currentChar === '+' || currentChar === '-') {
				previousChar = currentChar;
				nextChar();
				if (isDigit(currentChar)) {
					return scanNumberOrDimension();
				} else {
					//nextChar();
					if (currentChar === '.' && (previousChar === '+' || previousChar === '-')) {
						return scanNumberOrDimension();
					}
				}
				pushback();
			}
			if (isDigit(currentChar)) {
				return scanNumberOrDimension();
			}

			// ID
			if (currentChar === '#') {
				return scanHash();
			}

			// STRING
			if (currentChar === '"' || currentChar === "'") {
				return scanString();
			}

			// S
			if (isWhitespace(currentChar)) {
				skipWhitespaces();
				return Token.S;
			}

			// COMMENT
			if (currentChar === '/') {
				nextChar();
				if (currentChar === '*') {
					return scanComment();
				}
				pushback();
			}

			// HTML Comments: CDO ('<!--') and CDC ('-->')

			if (currentChar === '<') {
				if (nextChar() === '!') {
					if (nextChar() === '-') {
						if (nextChar() === '-') {
							nextChar();
							return Token.CDO;
						}
						pushback();
					}
					pushback();
				}
				pushback();
			}

			if (currentChar === '-') {
				if (nextChar() === '-') {
					if (nextChar() === '>') {
						nextChar();
						return Token.CDC;
					}
					pushback();
				}
				pushback();
			}

			// INCLUDES ('~=), DASHMATCH ('|='), PREFIXMATCH ('^='), SUFFIXMATCH ('$=')
			// and SUBSTRINGMATCH ('*=')

			if (currentChar === '~' || currentChar === '|' || currentChar === '^' ||
				currentChar === '$' || currentChar === '*') {
				previousChar = currentChar;
				nextChar();
				if (currentChar === '=') {
					switch (previousChar) {
						case '~': return Token.INCLUDES;
						case '|': return Token.DASHMATCH;
						case '^': return Token.PREFIXMATCH;
						case '$': return Token.SUFFIXMATCH;
						case '*': return Token.SUBSTRINGMATCH;
					}
				}
				pushback();
			}

			// Any other character not matched by the above rules

			return scanCharToken();
		};

		// Receives a `string` object containing the input stream to be read.
		// It performs an initial call to `nextChar`, which will therefore be
		// available in the first invocation of `nextToken`.
		//
		var init = function(inputStream) {
			input = inputStream;
			position = 0;
			nextChar();
		};

		return {
			init: init,
			nextToken: nextToken
		};

	}();

	//
	//
	//
	//
	// Parser
	// ------
	//
	//
	//
	//

	// ParsingError

	var ParsingError = function(message) {
		this.message = message;
	};

	ParsingError.prototype = Object.create(ALMCSS.AlmcssError);

	var Parser = function() {

		var logger = ALMCSS.debug.getLogger('Parser'),
			log = logger.log,
			info = logger.info,
			error = logger.error,
			Declaration = ALMCSS.css.Declaration,
			DeclarationBlock = ALMCSS.css.DeclarationBlock,
			Rule = ALMCSS.css.Rule,
			RuleSet = ALMCSS.css.RuleSet,
			lexer = Lexer,
			currentToken;

		var nextToken = function() {
			currentToken = lexer.nextToken();
		};

		var match = function(expectedToken, message) {
			if (currentToken.type !== expectedToken) {
				var s = 'A ' + expectedToken + ' was expected, but ' + currentToken + ' was found';
				if (message) {
					s = s + '(' + message + ')';
				}
				throw new ParsingError(s);
			}
		};

		// If current token is a whitespace, this method skips any other subsequent
		// whitespace token returned by the lexer through its `nextToken` method.
		// If at least one token (in that case, it would be the current token when
		// this method was invoked) was a whitespace, it returns a string consisting
		// of a single space (' '); otherwise, it returns an empty string ('').
		//
		var parseWhitespace = function() {
			var whitespace = '';
			while (currentToken === Token.S) {
				whitespace = ' ';
				nextToken();
			}
			return whitespace;
		};

		//     class : '.' IDENT
		//
		var parseClassSelector = function() {
			assert(currentToken === Token.PERIOD, 'Why has this been called without a period?');
			nextToken();
			match(TokenType.IDENT, 'while parsing a class selector');
			return '.' + currentToken.name;
		};

		// Parses an attribute selector according to the next production (as defined in the
		// Selectors Level 3 Module):
		//
		//      attrib : '[' IDENT S*  [ [ PREFIXMATCH | SUFFIXMATCH | SUBSTRINGMATCH |
		//                                 '=' | INCLUDES | DASHMATCH ]
		//                               S* [ IDENT | STRING ] S* ]? ']'
		//
		// If an `attrib` production is matched, the selector text is returned as a string;
		// otherwise, a `ParsingError` exception is thrown.
		//
		var parseAttributeSelector = function() {
			assert(currentToken === Token.LBRACKET, "Why has this been called without a '[' token?");
			log('Parsing an attribute selector...');
			var selectorText = '[';
			nextToken();
			parseWhitespace();
			match(TokenType.IDENT, 'while parsing an attribute selector');
			selectorText = selectorText + currentToken.name;
			nextToken();
			parseWhitespace();
			// [ PREFIXMATCH | SUFFIXMATCH | SUBSTRINGMATCH | '=' | INCLUDES | DASHMATCH ]
			if (currentToken === Token.PREFIXMATCH ||
				currentToken === Token.SUFFIXMATCH ||
				currentToken === Token.SUBSTRINGMATCH ||
				currentToken === Token.EQUALS ||
				currentToken === Token.INCLUDES ||
				currentToken === Token.DASHMATCH) {
				selectorText = selectorText + currentToken.name;
				nextToken();
				parseWhitespace();
				// [ IDENT | STRING ]
				if (currentToken.isIdent() || currentToken.isString()) {
					selectorText = selectorText + currentToken.isIdent() ? currentToken.name : currentToken.value;
				} else {
					throw new ParsingError('An identifier or a string were expected in an attribute ' +
						'selector, but a ' + currentToken + ' token was found');
				}
				nextToken();
				parseWhitespace();
			}
			match(TokenType.RBRACKET, 'while parsing an attribute selector');
			log('An attribute selector was matched: ' + selectorText);
			return selectorText;
		};

		// Parses an expression according to the next production (as defined in the
		// Selectors Level 3 Module):
		//
		//     expression : [ [ PLUS | '-' | DIMENSION | NUMBER | STRING | IDENT | S* ]+
		//
		// If an `expression` production is matched, the selector text is returned as
		// a string; otherwise, a `ParsingError` exception is thrown.
		//
		var parseExpression = function() {
			log('Parsing an expression selector...');
			var foundAny = false, hasMore = true, selectorText = '';
			while (hasMore) {
				if (currentToken === Token.PLUS ||
					currentToken.isDelim('-') ||
					currentToken.isDimension() ||
					currentToken.isNumber() ||
					currentToken.isString() ||
					currentToken.isIdent()) {
					foundAny = true;
					selectorText = selectorText + currentToken.lexeme;
					nextToken();
				} else {
					hasMore = false;
				}
				if (parseWhitespace()) {
					selectorText = selectorText + ' ';
				}
			}
			if (!foundAny) {
				throw new ParsingError("At least one of either a '-', a dimension, a number, " +
					"a string or an ident were expected in an expression selector, but " +
					currentToken + ' token was found');
			}
			log('An expression selector was matched: ' + selectorText);
			return selectorText;
		};

		//
		//     functional_pseudo : FUNCTION S* expression ')'
		//
		var parseFunctionalPseudo = function() {
			assert(currentToken.isFunction(), 'Why has this been called without a function token?');
			log('Parsing a functional pseudo element or pseudo class selector...');
			var selectorText = currentToken.name + '(';
			nextToken();
			parseWhitespace();
			selectorText = selectorText + parseExpression();
			match(TokenType.RPAREN, 'while parsing a functional pseudo element or pseudo class');
			selectorText = selectorText + ')';
			log('A functional pseudo element or pseudo class was matched: ' + selectorText);
			return selectorText;
		};

		//
		//     pseudo            : ':' ':'? [ IDENT | functional_pseudo ]
		//     functional_pseudo : FUNCTION S* expression ')'
		//
		var parsePseudoSelector = function() {
			assert(currentToken === Token.COLON, "Why has this been called without a ':'?");
			log('Parsing a pseudo element or pseudo class selector...')
			var selectorText = ':';
			nextToken();
			if (currentToken === Token.COLON) {
				selectorText = selectorText + ':';
				nextToken();
			}
			if (currentToken.isIdent() || currentToken.isFunction()) {
				if (currentToken.isIdent()) {
					selectorText = selectorText + currentToken.name;
				} else {
					selectorText = selectorText + parseFunctionalPseudo();
				}
				nextToken();
			} else {
				throw new ParsingError("An identifier or a function were expected in an attribute selector, but a " +
					currentToken + ' token was found');
			}
			log('A pseudo element or pseudo class selector was matched: ' + selectorText);
			return selectorText;
		};

		//
		//     negation     : NOT '(' S* negation_arg S* ')'
		//     negation_arg : type_selector | universal | HASH | class | attrib | pseudo
		//
		var parseNegation = function() {
			assert(currentToken === Token.NOT, 'A NOT token was expected: why has this been called?');
			var selectorText = 'NOT';
			nextToken();
			match(TokenType.LPAREN, 'while parsing a negation selector');
			selectorText = selectorText + '(';
			nextToken();
			parseWhitespace();
			if (currentToken.isIdent()) {
				selectorText = selectorText + currentToken.name;
			} else if (currentToken === Token.ASTERISK) {
				selectorText = selectorText + '*';
			} else if (currentToken.isHash()) {
				selectorText = selectorText + currentToken.name;
			} else if (currentToken === Token.PERIOD) {
				selectorText = selectorText + parseClassSelector();
			} else if (currentToken === Token.LBRACKET) {
				selectorText = selectorText + parseAttributeSelector();
			} else if (currentToken === Token.COLON) {
				selectorText = selectorText + parsePseudoSelector();
			} else {
				throw new ParsingError("[ type_selector | universal | HASH | class | attrib | pseudo ] " +
					" was expected as an argument for a negation selector, but '" + currentToken + "' was found");
			}
			nextToken();
			parseWhitespace();
			match(TokenType.RPAREN, 'while parsing a negation selector');
			return selectorText;
		};

		//
		//     simple_selector_sequence :
		//         [ type_selector | universal ] [ HASH | class | attrib | pseudo | negation ]* S*
		//         | [ HASH | class | attrib | pseudo | negation ]+ S*
		//
		var parseSimpleSelectorSequence = function() {
			log('Parsing a simple selector sequence...');
			var selectorText = '', hasTypeOrUniversal = false, hasAny = false;
			if (currentToken.isIdent() || currentToken === Token.ASTERISK) {
				selectorText = currentToken.isIdent() ? currentToken.name : '*';
				hasTypeOrUniversal = true;
			}
			nextToken();
			while (true) {
				if (currentToken.isHash()) {
					selectorText = selectorText + '#' + currentToken.name;
				} else if (currentToken === Token.PERIOD) {
					selectorText = selectorText + parseClassSelector();
				} else if (currentToken === Token.LBRACKET) {
					selectorText = selectorText + parseAttributeSelector();
				} else if (currentToken === Token.COLON) {
					selectorText = selectorText + parsePseudoSelector();
				} else if (currentToken === Token.NOT) {
					selectorText = selectorText + parseNegation();
				} else {
					break;
				}
				hasAny = true;
				nextToken();
			}
			if (!hasTypeOrUniversal && !hasAny) {
				throw new ParsingError('Invalid simple selector sequence');
			}
			return selectorText;
		};

		//
		//     selector : simple_selector_sequence [ combinator simple_selector_sequence ]*
		//
		var parseSelector = function() {
			var previousToken, selectorText = parseSimpleSelectorSequence();
			while (currentToken.isCombinator()) {
				previousToken = currentToken;
				nextToken();
				parseWhitespace();
				if (currentToken !== Token.LBRACE) {
					// Then adds the value of the previous token (the combinator) and tries to
					// parse a simple selector sequence. This is done so to distinguish between
					// whitespaces that may there be after the last simple selector and the start
					// of the declarations block from the whitespace that acts as a combinator of
					// two simple selectors.
					selectorText = selectorText + previousToken.lexeme + parseSimpleSelectorSequence();
				}
			}
			return selectorText;
		};

		//
		//     selectors_group : selector [ COMMA S* selector ]*
		//
		var parseSelectorGroup = function() {
			var selectorText  = parseSelector();
			while (currentToken === Token.COMMA) {
				nextToken();
				parseWhitespace();
				selectorText = selectorText + ', '+ parseSelector();
			}
			return selectorText;
		};

		var parseTemplateDefinition = function(selectorText) {

			var Length = ALMCSS.template.Length,
				Height = ALMCSS.template.Height,
				Width = ALMCSS.template.Width,
				Row = ALMCSS.template.Row,
				createTemplate = ALMCSS.template.createTemplate;

			function isColumnWidht(token) {
				return token.isDimension() ||
					token.isDelim(ASTERISK) ||
					token === Token.MAX_CONTENT ||
					token === Token.MIN_CONTENT ||
					token.type === TokenType.MINMAX ||
					token === Token.FIT_CONTENT;
			}

			function isRowHeight(token) {
				return token.isDimension() ||
					token === Token.AUTO ||
					token.isDelim(ASTERISK);
			}

			var cssText = '',
				// The string that defines a row, as it appears in the style sheet
				rowDefinition,
				// The `Row` object (defined in the `ALMCSS.template` module) that will be created
				row,
				// Either a `Length` or a `Height` object representing the row height.
				// They are defined in the `ALMCSS.template` module
				rowHeight,
				// An array of `Row` objects that will be passed to the `createTemplate` function
				rows = [],
				// The width of each column. It will be either a `Length` or a `Width` object
				columnWidth,
				// An array with the column widths that have been specified, if any
				columnWidths = [],
				// The template created
				template;

			assert(currentToken.isString(), 'Why are we parsing a template without having read a string?');
			info('Parsing a template definition...');
			while (currentToken.isString()) {
				cssText = cssText + '"' + currentToken.value + '"';
				rowDefinition = currentToken.value;
				nextToken();
				parseWhitespace();
				if (currentToken.isDelim('/')) {
					cssText = cssText + ' /';
					nextToken();
					if (!isRowHeight(currentToken)) {
						throw new ParsingError("After a slash ('/') a valid value is expected " +
							"as the height of a row in a template definition: " + currentToken);
					}
					// Length
					if (currentToken.isDimension()) {
						rowHeight = new Length(currentToken.value, currentToken.unit);
					// 'auto'
					} else if (currentToken === Token.AUTO) {
						rowHeight = Height.auto;
					// '*' (equal-height row)
					} else {
						assert(currentToken.isDelim(ASTERISK));
						rowHeight = Height.equal;
					}
					cssText = cssText + currentToken.lexeme;
					row = new Row(rowDefinition, rowHeight);
					// If a row height had been specified for this row, its token
					// has been consumed and another one needs to be read
					nextToken();
				} else {
					row = new Row(rowDefinition);
				}
				rows.push(row);
				log('A new template row has been matched: ' + row);
				cssText = cssText + '\n';
				// We do not need to call to `nextToken` here, since a new token
				// is already available either because it was not a '/' so the
				// row height was not scanned and therefore the token was not
				// consumed; or because the last call to `nextToken` while
				// scanning the row height
				parseWhitespace();
			}
			while (isColumnWidht(currentToken)) {
				cssText = cssText + ' ' + currentToken.lexeme;
				// Length
				if (currentToken.isDimension()) {
					columnWidth = new Length(currentToken.value, currentToken.unit);
				// '*' (equal-width column)
				} else if (currentToken.isDelim(ASTERISK)) {
					columnWidth = Width.equal;
				// 'max-content'
				} else if (currentToken === Token.MAX_CONTENT) {
					columnWidth = Width.maxContent;
				// 'min-content'
				} else if (currentToken === Token.MIN_CONTENT) {
					columnWidth = Width.minContent;
				// minmax(p, q)
				} else if (currentToken.type === TokenType.MINMAX) {
					columnWidth = new MinMax(currentToken.p, currentToken.q);
				// fit-content
				} else {
					assert(currentToken === Token.FIT_CONTENT);
					columnWidth = Width.fitContent;
				}
				columnWidths.push(columnWidth);
				nextToken();
				parseWhitespace();
			}
			if (!columnWidths.length) {
				log('No column widths were specified');
			} else {
				log('Column widths: ' + columnWidths);
			}
			template = createTemplate(rows, columnWidths, selectorText, cssText);
			return template;
		};

		//
		//     property : IDENT S*
		//
		var parseProperty = function() {
			if (!currentToken.isIdent()) {
				throw new ParsingError('An identifier is needed for a property name: ' + currentToken);
			}
			var result = currentToken.name;
			nextToken();
			parseWhitespace();
			return result;
		};

		//
		//     declaration : property ':' S* any S* [ ';' | '}' ] S*
		//
		var parseDeclaration = function(rule) {

			var addPositionedElement = ALMCSS.template.addPositionedElement;

			var property, value, isTemplate, previousToken, declaration, template;
			property = parseProperty().toLowerCase();
			value = '';
			match(TokenType.COLON);
			nextToken();
			parseWhitespace();

			// Is it a `display` property with a template definition as a value?
			if (property === 'display' && currentToken.isString()) {
				info("Found a 'display' property with a initial " +
					'string value: assuming it is a template');
				isTemplate = true;
				template = parseTemplateDefinition(rule.selectorText);
				value = template.cssText;
				info('A template has been matched:\n' + template);

			// Is it a `position` property with the name of a slot as a value?
			} else if (property === 'position' && currentToken.isIdent()) {
				info("Found a 'position' property with a identifier " +
					'as a value: assuming it is the name of a slot');
				addPositionedElement(rule.selectorText, currentToken.name);
			}

			// For every other CSS property different than `display` and `position`,
			// or for those `display` and `position` properties with a "normal" value
			// and that thus do not belong to the Template Layout Module, the parser
			// does not need to do anything, since those properties are recognised and
			// processed by he browser. It simply reads tokens from the lexical scanner
			// until either a semicolon (';') (end of a declaration) or a right brace
			// ('}') (end of a rule, in that case the semicolon is optional after the
			// ast declaration) are found.

			while (currentToken !== Token.SEMICOLON && currentToken !== Token.RBRACE) {
				previousToken = currentToken;
				nextToken();
				if (previousToken === Token.S) {
					if (currentToken === Token.SEMICOLON || currentToken === Token.RBRACE) {
						break;
					}
				}
				if (!isTemplate) {
					value = value + previousToken.lexeme;
				}
			}
			if (currentToken === Token.SEMICOLON) {
				nextToken();
			}
			parseWhitespace();
			declaration = new Declaration(property, value);
			if (isTemplate) {
				declaration.template = template;
			}
			rule.addDeclaration(declaration);
		};

		//
		//     declaration_block : declaration [ ';' S* declaration ]* '}' S*
		//
		var parseDeclarationBlock = function(rule) {
			parseDeclaration(rule);
			while (currentToken !== Token.RBRACE) {
				parseDeclaration(rule);
			}
		};

		var parseRule = function() {
			var selectorText, rule;
			log('Parsing a rule...');
			try {
				selectorText = parseSelectorGroup();
				match(TokenType.LBRACE, 'while parsing a rule');
				rule = new Rule(selectorText);
				nextToken();
				parseWhitespace();
				parseDeclarationBlock(rule);
				match(TokenType.RBRACE, 'while parsing a rule');
				nextToken();
				parseWhitespace();
				log('A rule was matched: ' + rule);
				return rule;
			} catch (e) {
				error('An invalid selector was found: the rule is omitted: ' + selectorText);
			}
		};

		var parseStyleSheet = function() {
			var ruleSet = [];
			while (currentToken !== Token.EOF) {
				ruleSet.push(parseRule());
			}
			return ruleSet;
		};


		var parse = function(input) {
			lexer.init(input);
			nextToken();
			return parseStyleSheet();
		};

		return {
			parse: parse
		};

	}();

	return {
		Lexer: Lexer,
		Parser: Parser,
		Token: Token,
		TokenType: TokenType
	};

}();