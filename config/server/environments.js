module.exports = function(app){
 
  var port = process.env.PORT || 80;
 
  app.configure('local', function (){

    this
      .set('host', 'localhost')
      .set('port', port)
      .set('ENV','local')
  }); 
  
  return app
}
