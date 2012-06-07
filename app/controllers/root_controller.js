// Set all global variables 
var controller = {}
  , app;

module.exports = function (_app) {
	app = _app;
	return controller;
}

controller.index = function(req, res, next){
    res.render('index.ejs');
}
