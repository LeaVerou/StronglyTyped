/**
 * Library for strongly typed properties and global variables in JavaScript
 * @author Lea Verou
 * @version 1.1
 * MIT license http://www.opensource.org/licenses/mit-license.php
 */

// Array.prototype.forEach polyfill from MDC
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(fun /*, thisp */) {
		"use strict";
		
		if (this === void 0 || this === null) {
			throw new TypeError();
		}
		
		var t = Object(this), len = t.length >>> 0;

		if (typeof fun !== "function") {
			throw new TypeError();
		}
		
		var thisp = arguments[1];
		
		for (var i = 0; i < len; i++) {
			if (i in t) {
				fun.call(thisp, t[i], i, t);
			}
		}
	};
}

// Function.prototype.bind polyfill from MDC
if (!Function.prototype.bind) {
	Function.prototype.bind = function(obj) {
		var slice = [].slice,
		    args = slice.call(arguments, 1), 
		    self = this, 
		    nop = function () {}, 
		    bound = function () {
		    	return self.apply(this instanceof nop ? this : (obj || {}), args.concat(slice.call(arguments)));    
		    };
		
		nop.prototype = self.prototype;
		
		bound.prototype = new nop();
		
		return bound;
	};
}

(function() {
var objects = [];

var self = window.StronglyTyped = {
	/**
	 * Generic function for defining strongly typed properties.
	 * You're advised to use the shortcuts defined below.
	 */
	property: function(type, o, property, value) {
		getProperties(o)[property] = value;
		
		defineProperty(o, property, {
			get: getter.bind(o, property),
			set: setter.bind(o, type, property)
		});
		
		o[property] = value;
	},
	
	/**
	 * Constants that can't be changed
	 */
	constant: function(o, name, value) {
		defineProperty(o, name, {
			get: getter.bind(o, name),
			set: function(value) {
				var currentValue = getProperties(this)[name];
				
				if (currentValue === undefined) {
					getProperties(this)[name] = value;
				}
				else {
					// ISSUE Should we throw an error?
				}
			}
		});
		
		o[name] = value;
	}
};

var supportsDefineProperty = 'defineProperty' in Object &&
	(function(){
		var testDOM = document.createElement('div'),
		    testO = {};
		
		try {
			Object.defineProperty(testDOM, 'test', {
				get: function(){},
				set:function(){}
			});
			
			Object.defineProperty(testO, 'test', {
				get: function(){},
				set:function(){}
			});
		}
		catch(e){
			return false;
		}
		
		return true;
	})();

// Smoothen out differences between Object.defineProperty
// and __defineGetter__/__defineSetter__
if (supportsDefineProperty) {
	var defineProperty = Object.defineProperty;
}
else if ('__defineSetter__' in Object) {
	var defineProperty = function(o, property, etters) {
		o.__defineGetter__(property, etters.get);
		
		o.__defineSetter__(property, etters.set);
	}
}

// Fallback to regular properties if getters/setters are not supported
if (typeof defineProperty === 'undefined') {
	if(window.console && console.warn) {
		console.warn('Getters and Setters are not supported so StronglyTyped will fallback to regular properties');
	}
	
	self.property = function(type, o, property, value) {
		o[property] = value;
	}
}

// Shortcuts
[
	'Array',
	'Boolean', 
	'Date', 
	'Function',
	'Integer',
	'Number', 
	'RegExp', 
	'String'
].forEach(function(type) {
	self[type.toLowerCase()] = self.property.bind(self, type);
});

/*************************
 * Private functions
 *************************/

/**
 * Generic getter
 */
function getter(property) { 
	return getProperties(this)[property];
}

/**
 * Generic setter
 */
function setter(type, property, value) { 
	if (isType(type, value) || value === null || value === undefined) {
		getProperties(this)[property] = value;
	}
	else {
		throw TypeError(property + ' must be of type ' + type + '. ' + value + ' is not.');
	}
}

/**
 * Finds the object and returns its strongly typed properties
 */
function getProperties(o) {
	for (var i=0, len=objects.length; i<len; i++) {
		if (objects[i].object === o) {
			return objects[i].properties;
		}
	}
	
	// If we're here, it wasn't found so let's add it now
	i = objects.push({
		object: o,
		properties: {}
	}) - 1;
	
	return objects[i].properties;
}

/**
 * Tests whether a value is of a given type
 */
function isType(type, value) {
	switch(type) {
		case 'Integer':
			return isType('Number', value) && (isNaN(value) || !isFinite(value) || value % 1 === 0);
		default:
			return value instanceof window[type] ||
				Object.prototype.toString.call(value) === '[object ' + type + ']';
	}
}

})();