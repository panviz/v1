var fs = require('fs'),
	vm = require('vm');

var protoPath = './app/lib/prototype/lang/';
var files = ['object.js', 'function.js', 'enumerable.js', 'array.js', 'string.js', 'number.js', 'regexp.js', 'date.js', 'class.js', 'range.js', 'hash.js', 'prototype.oo.js']

Prototype = {
  Version: '1.7',
  emptyFunction: function() { },
  K: function(x) { return x }
};

files.forEach(function(path) {
	var code = fs.readFileSync(protoPath + path);
	vm.runInThisContext(code, path);
})

module.exports = {
	Object : Object
, Function : Function
, $break : $break
, Enumerable : Enumerable
, String : String
, Number : Number
, RegExp : RegExp
, Date : Date
, Array : Array
, $A : $A
, $w : $w
, Class : Class
, $H : $H
, $R : $R
, ObjectRange : ObjectRange
, Interface : Interface
, $$OO_ObjectsRegistry : $$OO_ObjectsRegistry
}
