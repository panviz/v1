var fs = require('fs'),
		util = require('util'),
		wrench = require('wrench'),
		//parser = require('xml2json'),
		path = process.cwd();

var test = function(files){
	var counter = 0;
	files.forEach(function(file){
		if (file.match(/ajaxplorer/gi)) {
			var filename = path + '/module/' + file;
			var f = new wrench.LineReader(filename);
			console.log(counter + filename)
		//fs.writeFileSync(filename, data);
		}
	})
}

var php2Json = function(files){
	files.forEach(function(file){
		if (file.match(/i18n.*\.php$/gi)) {
			var filename = path + '/module/' + file;
			var data = '{\n';
			var f = new wrench.LineReader(filename);
			while(f.hasNextLine()) {
				var line = f.getNextLine();
					if (line.match(/=>/)){
						data += line.replace(/=>/, ':').replace(/\s*$/, '');
						data += '\n';
					}
			}
			data += '}'
			fs.writeFileSync(filename.replace(/\.php$/, '.json'), data);
			fs.unlink(filename);
		}
	})
}

var xml2json = function(files){
	files.forEach(function(file){
		if (file.match(/.*action.*\.xml$/gi)) {
			var filename = path + '/module/' + file;
			console.log(filename);
			var xml = fs.readFileSync(filename);
			//var data = parser.toJson(xml)
			//add formatting
			//var data = JSON.stringify(data, null, '  ');
			//fs.writeFileSync(filename.replace(/\.xml$/,'.json'), data)
		}
	})
}

var replace = function(files){
	var counter = 0;
	var process = [];
	files.forEach(function(file){
		if (file.match(/\.js|\.txt|\.html|\.css/gi)) {
			process.push(path + '/module/' + file);
		}
	})
	process.forEach(function(file){
		var data = '';
		var	changed = false;
		var f = new wrench.LineReader(file);
		while(f.hasNextLine()) {
			var line = f.getNextLine();
			var exp = /ajaxplorer/g;
			if (line.match(exp)){
				console.log("LINE: " + line);
				line = line.replace(exp, 'app');
				changed = true;
				counter++
			}
			data += (line +'\n');
		}
		if (changed){
			console.log(counter + ': '+ file)
			fs.writeFileSync(file, data);
		}
	})
}

var files = wrench.readdirSyncRecursive('module');
xml2json(files)
