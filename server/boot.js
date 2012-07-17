#!/usr/bin/env node
var path = require('path');
//var passport = require('passport');

  //Global
fs = require('fs');
isServer = true;
ROOT_PATH = path.join(__dirname, '/..');
require(ROOT_PATH + '/app/lib/prototype/server');
//require(ROOT_PATH + '/app/Application');
require('./Application')

require('./exception')

var environment = require(ROOT_PATH + '/config/server/environment');
var route = require(ROOT_PATH + '/config/server/route');
//var auth = passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),

// Create Server Application
$app = new Application();

//$app.setMiddleware("post", "login", auth);
$app.setEnv(environment.development);
$app.setRoute(route);

// Run express server
$app.run()
