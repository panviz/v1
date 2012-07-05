// Set all global variables 
var controller = {}
  , app

module.exports = function (_app) {
	app = _app;
	return controller;
};

controller.index = function(req, res, next){
	//TODO define ui.name, currentLanguage, theme in settings.json based on requester locale, platform 
	if (!settings.ui.name){
		setUI("desktop");
	}
	if (!settings.ui.theme){
		setTheme("mybase");
	}
	res.render('index.ejs', { user: req.user });
};

controller.settings = function(req, res, next){
	res.send(settings);
};

controller.registry = function(req, res, next){
	res.send(registry);
};

controller.data = function(req, res, next){
	res.send(ls);
};

controller.login = function(req, res){
	res.render('login', { user: req.user, message: req.flash('error') });
};

controller.logout = function(req, res){
	req.logout();
	res.redirect('/');
};

controller.ensureAuthenticated = function(req, res, next){
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
};

var setUI = function(name){
	if (name == "desktop"){
		var config = require(ROOT_PATH + '/config/ui.json')
	}
	Object.extend(settings.ui, config);
};

var setTheme = function(name){
	var ui = settings.ui;
	ui.theme = ui.themes[name];
	if (!ui.theme){
		ui.theme = ui.themes['mybase']
	}
	ui.theme.html = fs.readFileSync(ROOT_PATH + ui.theme.template, 'binary');
};
