/**
 * Library for strongly typed properties and global variables in JavaScript
 * @author Lea Verou
 * @version 1.0
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
		
		Object.defineProperty(o, property, {
			get: function() { 
				return getProperties(o)[property];
			},
			set: function(value) { 
				if(isType(type, value) || value === null || value === undefined) {
					getProperties(o)[property] = value;
				}
				else {
					throw TypeError(property + ' must be of type ' + type + '. ' + value + ' is not.');
				}
			}
		});
		
		if(arguments.length > 3) {
			o[property] = value;
		}
	}
};

// Fallback to regular properties if Object.defineProperty is not supported
if(!('defineProperty' in Object)) {
	if(window.console && console.warn) {
		console.warn('Object.defineProperty is not supported so StronglyTyped will fallback to regular properties');
	}
	
	self.property = function(type, o, property, value) {
		o[property] = arguments.length > 3? value : undefined;
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
 * Finds the object and returns its strongly typed properties
 */
function getProperties(o) {
	for (var i=0, len=objects.length; i<len; i++) {
		if(objects[i].object === o) {
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