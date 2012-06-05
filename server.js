var express = require('express'),
	http = require('http'),
	libpath = require('path'),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime');

var host = 'http://word.com:3000/';
var path = "Z:/home/word.com/www/";
var app = express.createServer();

app.use(express.logger());

// Serve user's folder
app.get('/get_content', function(req, res){
	res.send('hi from Node ');
});

// Serve application files
app.get('/plugins', function(request, response){
    var uri = url.parse(request.url).pathname;
    var filename = libpath.join(path, uri);

    libpath.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.write("404 Not Found\n");
            response.end();
            return;
        }
		//TODO what if directory queried?
        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }

        fs.readFile(filename, "binary", function (err, file) {
            if (err) {
                response.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                response.write(err + "\n");
                response.end();
                return;
            }

            var type = mime.lookup(filename);
            response.writeHead(200, {
                "Content-Type": type
            });
            response.write(file, "binary");
            response.end();
        });
    });
});

function action_notfound(response, msg){
  response.writeHead(404);
  response.write(msg);
  response.end();
}

app.all('*', function(request, response){
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
		return action_notfound(response, "Requested resource ("+request.url+") is not accessible on host \""+host+"\"");
	});
	
	request.addListener('data', function(chunk) {
		proxy_request.write(chunk, 'binary');
	});
	request.addListener('end', function() {
		proxy_request.end();
	});
});

app.listen(80);
console.log('Express app started on port 80');
