#!/usr/bin/env node
var path = require('path');

  //Global
fs = require('fs');
isServer = true;
ROOT_PATH = path.join(__dirname, '/..');
require(ROOT_PATH + '/app/lib/prototype/server');
//Object.extend(global, prototype);  

try {
  require.paths = require.paths.unshift(__dirname + '/../node_modules');
} catch(e) {
  process.env.NODE_PATH = path.join(__dirname, '/../node_modules') + ':' + process.env.NODE_PATH
}

require('./exceptions')

if(!process.env.NODE_ENV) process.env.NODE_ENV="local"

//  Load boot file and fire away!

var app = require('./app')();
var port = process.env.PORT || 80;

app.listen(port);

console.log('\x1b[36mGraph\x1b[90m v%s\x1b[0m running as \x1b[1m%s\x1b[0m on http://%s:%d',
  app.set('version'),
  app.set('env'),
  app.set('host'),
  app.address().port
);
