ROOT_PATH = 'd:Dropbox/grafiy/src/'
neo4j = require('neo4j');
require(ROOT_PATH + 'app/lib/prototypeJS/prototype');

  var url = 'http://localhost:7474';
  var db = new neo4j.GraphDatabase(url);
  var username = 'dmitra';

var query = [
  "START a=node(*)",
  "MATCH (a)-[r]->(b)",
  "WHERE a.KEY! = 'VALUE'",
  "RETURN a, r, b"
].join('\n')
    .replace('KEY', 'name')
    .replace('VALUE', username)
db.query(query, function(err, array){
  debugger
  var links = array.map(function(){
  })
})
