module.exports = function(app){

	var root = require('../app/controllers/root_controller')(app);
	
	//load theme template
	app.get('/', root.index);
	app.get('/settings.json*', root.settings);
	app.get('/registry.json*', root.registry);
	app.get('/data/*', root.data);
};
