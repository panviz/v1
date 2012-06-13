const express   = require('express')
    , expose    = require('express-expose');
settings = require('./settings.js');
registry = require('./registry.js');

module.exports = function(app){

	//  Configure expressjs
	app.configure(function (){
	this
		.use(express.logger('\033[90m:method\033[0m \033[36m:url\033[0m \033[90m:response-time ms\033[0m'))
		.use(express.cookieParser())
		.use(express.bodyParser())
		.use(express.errorHandler({dumpException: true, showStack: true}))
		.use(express.session({ secret: 'faFka1@$aGsja'}))
	});

	//  Add template engine
	app.configure(function(){
	this
		.set('views', __dirname + '/../app/views')
		.helpers(require('../app/helpers/application_helper'))
		.set('view engine', 'ejs')
		.use('/module', express.static(__dirname + '/../module'))
	});

	app.set('version', '0.0.1');
	app.set('THEME_PATH', 'module/ui/main/theme/mybase/');
	app.set('GUI_JS_PATH', 'module/ui/main/js/');

	return app;
}
