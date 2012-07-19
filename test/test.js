var assert = require("assert"),
path = require('path'),
express = require('express');
ROOT_PATH = path.join(__dirname, '/..');

require(ROOT_PATH + '/app/lib/prototypeJS/prototype');
require(ROOT_PATH + '/app/Parcel');
require(ROOT_PATH + '/app/Proxy');

describe('Proxy', function(){
  $app = {};
  $app.server = {};
  $app.server.installHandlers = function(){}
  
  //TODO stub for server
  //stub for client
  SockJS = function(p){var send = function(){}}
  var url = '/registry'

  isServer = false;
  var client = new Proxy(url);
  isServer = true;
  var server = new Proxy(url);

  describe('#get()', function(){
    it('should return Model not supported', function(){
      var callback = function(data){
        assert(data == "Model not supported")
      }
      client.get("Model", 'id', {}, callback)
    })

    it('should pass value to callback')
  })
})
