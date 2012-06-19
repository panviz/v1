const express   = require('express')
    , expose    = require('express-expose');
		_ = require('underscore');
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

	var appSettings = require('./settings.js');
	//TODO don't expose expressjs setting to client
	_.extend(app.settings, appSettings);
	//make Global
	settings = app.settings;
	
	//  Add template engine
	app.configure(function(){
	this
		.set('views', ROOT_PATH + '/app/views')
		.helpers(require(ROOT_PATH + '/app/helpers/application_helper'))
		.set('view engine', 'ejs')
		.use('/module', express.static(ROOT_PATH + '/module'))
		.use('/client', express.static(ROOT_PATH + '/client'))
	});
	
	settings.available_languages = require('./i18n/list.json');
	settings.i18n= require('./i18n/' + app.settings.locale + '.json');

	return app;
}
