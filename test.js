#!/usr/bin/env node
 
var prototype = require('./app/lib/prototype');
//Object.extend(global, prototype);  

Class.create("Major", {
	initialize : function(){
		console.log('parent');
	},
	act : function(){
		console.log('act');
	}
})

Class.create("Child", Major, {
	initialize : function(){
		console.log('child');
	}
})

p = new Major();
c = new Child();
c.act()
