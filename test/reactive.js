var assert = require("assert")
require(__dirname + '/../app/lib/prototypeJS/prototype');
require('../app/Reactive')
require('../app/Store')

describe('Reactive', function(){
  isServer = true;
  $proxy = {send: function(cb){
    cb({error: "Not Found"})
  }}
  $modal = {};
  store = new Store();
  reactive = new Reactive(store);
  var username = 'dmitra';

  describe('get', function(){
    it('Server cannot find record', function(done){
      var cb = function(data, err){
        assert.equal(data, null);
        assert.equal(err, "Not Found");
        done()
      }
      reactive.get(cb, 'hi', {})
    })
    it('Client cannot find record', function(done){
      isServer = false;
      $modal = {error: function(){done()}}
      var cb = function(data, err){
        assert.equal(data, null);
        assert.equal(err, "Not Found");
        done()
      }
      reactive.get(cb, 'hi', {})
    })
  })

  describe('put', function(){
    it('', function(done){
      done()
    })
  })
})
