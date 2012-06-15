// Set all global variables 
var controller = {}
  , app;

module.exports = function (_app) {
	app = _app;
	return controller;
}

controller.index = function(req, res, next){
	//TODO define ui.name, currentLanguage, theme in settings.json based on requester locale, platform 
	if (!settings.ui.name){
		setUI("main");
	}
	if (!settings.ui.theme){
		setTheme("mybase");
	}
	res.render('index.ejs');
}

controller.settings = function(req, res, next){
	res.send(settings);
}

controller.registry = function(req, res, next){
	res.send(registry);
}

var setUI = function(name){
			config = require(ROOT_PATH + '/module/ui/' + name + '/config.json')
	_.extend(settings.ui, config);
}

var setTheme = function(name){
	var ui = settings.ui;
	ui.theme = ui.themes[name];
	ui.theme.html = fs.readFileSync(ROOT_PATH + ui.theme.template, 'binary');
}
