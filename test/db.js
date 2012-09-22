var assert = require("assert"),
neo4j = require('neo4j');

describe('DB', function(){
  var url = 'http://localhost:7474';
  var db = new neo4j.GraphDatabase(url);
  var username = 'dmitra';

  describe('query', function(){
    it('should find dmitra user', function(done){
      var query = [
        "START x=node(*)",
        "WHERE x.KEY! = 'VALUE'",
        "RETURN x"
      ].join('\n')
          .replace('KEY', 'name')
          .replace('VALUE', username)
      db.query(query, function(err, array){
        if (err) throw err
        assert(array[0].x)
        done()
      })
    })
  })

  describe('indexed node', function(){
    it('should find dmitra user', function(done){
      var onFind = function(err, node){
        assert.equal(node.data.name,  username);
        var cb = function(err, data){
          done()
        }
        node.getRelationships('follows', cb)
      }
      db.getIndexedNode('user', 'name', username, onFind);
    })
  })
})
