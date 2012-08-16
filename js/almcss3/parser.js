var ALMCSS = ALMCSS || {};

ALMCSS.parser = function() {

	'use strict';

	var assert = ALMCSS.debug.assert;
	var AssertionError = ALMCSS.debug.AssertionError;
	var logger = ALMCSS.debug.getLogger('Parser');
	var log = logger.log;
	var debug = logger.debug;

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


	var InputStream = function(input) {

		var position = 0;

		var read = function() {
			if (position < input.length) {
				var result = input.charAt(position);
				position = position + 1;
				return result;
			}
			return -1;
		};

	};




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
        if (isDigit(character))
            return character;
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
		Error.call(this, 'LexicalError', message);
	};

	LexicalError.prototype = Object.create(Error.prototype);

    // TokenType

    var TokenType = {
        EOF             : {name: 'EOF'},
        // Tokens defined by the CSS3 Syntax Module
        S               : {name: 'S'},                  // Whitespace
        CDO             : {name: 'CDO'},                // '<!--'
        CDC             : {name: 'CDC'},                // '-->'
        STRING          : {name: 'STRING'},
        IDENT           : {name: 'IDENT'},
        ATKEYWORD       : {name: 'ATKEYWORD'},
        NUMBER          : {name: 'NUMBER'},
        DIMENSION       : {name: 'DIMENSION'},
        URI             : {name: 'URI'},
        UNICODE_RANGE   : {name: 'UNICODE-RANGE'},
        COMMENT         : {name: 'COMMENT'},
        FUNCTION        : {name: 'FUNCTION'},
        INCLUDES        : {name: 'INCLUDES'},
        DASHMATCH       : {name: 'DASHMATCH'},
        PREFIXMATCH     : {name: 'PREFIXMATCH'},
        SUFFIXMATCH     : {name: 'SUFFIXMATCH'},
        SUBSTRINGMATCH  : {name: 'SUBSTRINGMATCH'},
        CHAR            : {name: 'CHAR'},
        BOM             : {name: 'BOM'},
        // Tokens defined by the CSS3 Selectors Module
        HASH            : {name: 'HASH'},
        PLUS            : {name: 'PLUS'},
        GREATER         : {name: 'GREATER'},
        COMMA           : {name: 'COMMA'},
        TILDE           : {name: 'TILDE'},
        NOT             : {name: 'NOT'},
        INVALID         : {name: 'INVALID'},
        // Tokens needed by the CSS3 Template Module
        SLASH           : {name: 'SLASH'},
        AUTO            : {name: 'AUTO'},
        ASTERISK        : {name: 'ASTERISK'},
        MAX_CONTENT     : {name: 'MAX-CONTENT'},
        MIN_CONTENT     : {name: 'MIN-CONTENT'},
        MINMAX          : {name: 'MINMAX'},
        FIT_CONTENT     : {name: 'FIT-CONTENT'},
        LETTER          : {name: 'LETTER'},
        SAME            : {name: 'SAME'}
    };

    // Token

    var Token = function(type, lexeme) {
        this.type = type;
        this.lexeme = lexeme;
    };

    Token.prototype.toString = function() {
        return this.type.name;
    };

    Token.CDO = new Token(TokenType.EOF, '<!--');
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
    // Tokens created by me for the CSS3 Template Module
    Token.SLASH = new Token(TokenType.SLASH, '/');
    Token.AUTO = new Token(TokenType.AUTO, 'auto');
    Token.ASTERISK = new Token(TokenType.ASTERISK, '*');
    Token.MAX_CONTENT = new Token(TokenType.MAX_CONTENT, 'max-content');
    Token.MIN_CONTENT = new Token(TokenType.MIN_CONTENT, 'min-content');
    Token.FIT_CONTENT = new Token(TokenType.FIT_CONTENT, 'fit-content');
    Token.SAME = new Token(TokenType.SAME, 'same');


	// UNICODE-RANGE

    var UnicodeRangeToken = function(value, low, high, valid) {
        Token.call(this, TokenType.UNICODE_RANGE, value);
        this.low = low;
        this.high = high;
        this.valid = valid;
    };

    UnicodeRangeToken.prototype = Object.create(Token.prototype);

	// FUNCTION

	var FunctionToken = function(name) {
		Token.call(this, TokenType.FUNCTION, name);
	};

	FunctionToken.prototype = Object.create(Token.prototype);

	// IDENT

	var IdentifierToken = function(name) {
		Token.call(this, TokenType.IDENT, name);
	};

	IdentifierToken.prototype = Object.create(Token.prototype);

	// URI

	var UriToken = function(uri) {
		Token.call(this, TokenType.URI, uri);
	};

	UriToken.prototype = Object.create(Token.prototype);

	// CHAR

	var CharToken = function(character) {
		Token.call(this, TokenType.CHAR, character);
	};

	CharToken.prototype = Object.create(Token.prototype);

    // Lexer

	var Lexer = function() {

        var ESCAPE = '\\';
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
        };

        var pushback = function(howManyChars) {
			howManyChars = howManyChars || 1;
			for (var i = 0; i < howManyChars; i++) {
				assert(position > 0, 'There is nothing to be pushed back into the input stream');
				assert(currentSpelling.length > 0,
					'Why would someone want to push back characters that have already been ' +
					'recognized as part of valid tokens?');
				position = position - 1;
				currentChar = input.charAt(position);
				currentSpelling = currentSpelling.substring(0, currentSpelling.length - 1);
			}
        };


		//     STRING ::= string
		//
		//     string ::= '"' (stringchar | "'")* '"' |
		//                "'" (stringchar | '"')* "'"
		//     stringchar ::= urlchar | #x20 | '\' nl
		//
		var gatherString = function() {
			assert(currentChar === '"' || currentChar === "'",
					'A string must start either by \' or "');
			var quote, result;
			quote = result = currentChar;
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
			}
			if (currentChar === quote) {
				nextChar(); // Omit closing quote
			}
			return result;
		};

		var skipWhitespaces = function() {
			while (isWhitespace(currentChar)) {
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
			skipWhitespaces();
			var uri = '';
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
			skipWhitespaces();
			if (currentChar === ')') {
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
			return code >= 256 && (lexTable[code] & START_IDENT) !== 0;
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
			return isIdent(character);
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
			if (i < 6 && !isWhitespace(currentChar)) {
				throw new LexicalError('Invalid escape sequence: ' + escape);
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
			return String.fromCharCode(code);
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
			var ident = currentSpelling;
			if (currentChar === '-') {
				ident = ident + nextChar();
				assert(isIdentStart(currentChar), 'This was supposed to be a valid identifier start: ' + currentChar);
			}
			while (currentChar !== EOF && (isIdent(currentChar) || currentChar === '\\')) {
				if (currentChar === '\\') {
					var isValidEscape = gatherEscape();
					// If an escape was successfully parsed by `gatherEscape`
					// the value of the escaped character is added to this
					// identifier; otherwise, it means that the final of the
					// identifier has been reached (the backslash will remain
					// as the current character of the input stream and will
					// be returned as a CHAR token in the following call to
					// `nextToken`
					if (!isValidEscape) {
						break;
					}
					ident = ident + gatherEscape();
				}
				ident = ident + currentChar;
			}
			// If this identifier is immediately followed by a left parenthesis,
			// it is either a function or a URI token
			if (currentChar === '(') {
				nextChar();
				if (ident.toLowerCase() === 'url') {
					return scanUri();
				}
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
			return new IdentifierToken(ident);
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

            return new UnicodeRangeToken(low, high, valid);

        }; // scanUnicodeRange



		var nextToken = function() {

			currentSpelling = currentChar;

			// EOF
			if (currentChar === EOF) {
				return Token.EOF;
			}

			// Why does JSCSSP not look for Unicode characters, like Mozilla
			// nsCSSScanner does?

			// UNICODE-RANGE
			if ((currentChar === 'u' || currentChar === 'U') && nextChar() === '+') {
				return scanUnicodeRange();
			}

			// IDENT
			if (isIdentStart()) {
				return scanIdentifier();
			}
		};

		// Receives a `string` object containing the input stream to be read.
		// It performs an initial call to `nextChar`, which will therefore be
		// available in the first invocation of `nextToken`.
		//
		var init = function(inputStream) {
			input = inputStream;
			nextChar();
		};

		return {
			init: init,
			nextToken: nextToken
		};

	}();

}();