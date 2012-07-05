var passport = require('passport');
//TODO build routes on app/API
var Routes = function(app, controller){
	
	//load theme template
	app.get('/', controller.index);
	app.get('/settings.json*', controller.settings);
	app.get('/registry.json*', controller.registry);
	app.get('/data/*', controller.data);

	app.get('/account', controller.ensureAuthenticated, controller.account);
	app.get('/login', controller.login);

	// POST /login
	//   Use passport.authenticate() as route middleware to authenticate the
	//   request.  If authentication fails, the user will be redirected back to the
	//   login page.  Otherwise, the primary route function function will be called,
	//   which, in this example, will redirect the user to the home page.
	//
	//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
	app.post('/login', 
		passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
		controller.index
	);
	app.get('/logout', controller.logout)
};

module.exports = Routes;
