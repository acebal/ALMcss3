// CSS
// ---
// This module `ALMCSS.css` defines a sort of object model (like the CSS
// Object Model (CSSOM), but much more simplified) for representing the style
// information associated to an HTML document through some JavaScript objects.
// The result of the parser is a structure in memory of those type of objects.
//
// File: stylesheet/css.js

var ALMCSS = ALMCSS || {};

ALMCSS.stylesheet.css = function() {

	'use strict';

	var logger = ALMCSS.debug.getLogger('CSS Object Model');
	var warn = logger.warn;

	// Declaration
	// -----------

	var Declaration = function(property, value) {
		this.property = property;
		this.value = value;
	};

	Declaration.prototype.toString = function() {
		return this.property + ": " + this.value + ';';
	};

	// DeclarationBlock
	// ----------------

	var DeclarationBlock = function() {
		this.declarations = [];
	};

	DeclarationBlock.prototype.getLength = function() {
		return this.declarations.length;
	};

	DeclarationBlock.prototype.get = function(property) {
		for (var i = 0; i < this.declarations.length; i++) {
			if (this.declarations[i].property === property) {
				return this.declarations[i];
			}
		}
		return null;
	};

	DeclarationBlock.prototype.hasProperty = function(property) {
		return this.get(property) !== null;
	};

	DeclarationBlock.prototype.add = function(declaration) {
		if (this.hasProperty(declaration.property)) {
			warn('Adding a declaration with a duplicated property: ' + declaration.property +
			'\nThe old one will be overwritten with the new value: ' + declaration.value);
			this.get(declaration.property).value = declaration.value;
		}
		this.declarations.push(declaration);
	};

	DeclarationBlock.prototype.toString = function() {
		var result = '', ident = '  ';
		for (var i = 0; i < this.declarations.length; i++) {
			result = result + ident + this.declarations[i];
			if (i <  this.declarations.length - 1) {
				result = result + '\n';
			}
		}
		return result;
	};

	// Rule
	// ----

	var Rule = function(selectorText) {
		this.selectorText = selectorText;
		this.declarations = new DeclarationBlock();
	};

	Rule.prototype.hasProperty = function(property) {
		return this.declarations.hasProperty(property);
	};

	Rule.prototype.getValueOf = function(property) {
		return this.declarations.get(property).value;
	};

	Rule.prototype.getNumberOfDeclarations = function() {
		return this.declarations.getLength();
	};

	Rule.prototype.addDeclaration = function(declaration) {
		this.declarations.add(declaration);
	};

	Rule.prototype.toString = function() {
		return this.selectorText + ' {\n' + this.declarations + '\n}\n';
	};

	// RuleSet

	var RuleSet = function() {
		this.rules = [];
	};

	RuleSet.prototype.getRule = function(selectorText) {
		for (var i = 0; i < this.rules.length; i++) {
			if (this.rules[i].selectorText === selectorText) {
				return this.rules[i];
			}
		}
	};

	RuleSet.prototype.toString = function() {
		var result = '';
		for (var i = 0; i < this.rules.length; i++) {
			result = result + this.rules[i];
		}
		return result;
	};

	return {
		Declaration: Declaration,
		Rule: Rule,
		RuleSet: RuleSet
	};

}();

