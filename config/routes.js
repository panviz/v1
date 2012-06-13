module.exports = function(app){

	var root = require('../app/controllers/root_controller')(app);
	
	//load theme template
	app.get('/', root.index);
	//gui settings
	app.get('/settings.json*', root.settings);
	app.get('/registry.json*', root.registry);

	//proxy missing actions to old server
	app.all('/index.php', function(request, response){
		var http = require('http');
		var host = "http://word.com:3000";
		var proxy = http.createClient(3000, request.headers[host])
		var proxy_request = proxy.request(request.method, request.url, request.headers);

		proxy_request.addListener('response', function (proxy_response) {
			proxy_response.addListener('data', function(chunk) {
			  response.write(chunk, 'binary');
			});
			proxy_response.addListener('end', function() {
			  response.end();
			});
			proxy_response.addListener('error', function() {
				console.log("php is down")
			});
			response.writeHead(proxy_response.statusCode, proxy_response.headers);
		});
		proxy.on('error', function(err) {
			console.log(err.toString() + " on request to " + host);
			response.render('404');
		});
		
		request.addListener('data', function(chunk) {
			proxy_request.write(chunk, 'binary');
		});
		request.addListener('end', function() {
			proxy_request.end();
		});
	});
};
