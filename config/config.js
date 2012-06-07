const express   = require('express')
    , expose    = require('express-expose');

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
	  .set('view engine', 'ejs')
	  .use('/plugins', express.static(__dirname + '/../plugins'))
	});

	app.set('version', '0.1.6');

	return app;
}
