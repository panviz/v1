// Load dependencies
const express       = require('express')
		//, mvc						= require('../lib/mvc')
    , config        = require('../config/server/server')
    , routes        = require('../config/server/routes')
    , environments  = require('../config/server/environments')
		, errors        = require('../config/server/errors')
		, Controller		= require('./controller');

module.exports = function () {
  //  Create Server
  const app = express.createServer()
	
	// load controllers
	//mvc.boot(app);
  
  //  Load Expressjs config
  config(app);
  
  //  Load Environmental Settings
  environments(app);

  //  Load routes config
	var controller = Controller(app);
  routes(app, controller);
  
  //  Load error routes + pages
  errors(app);

  return app;
};
