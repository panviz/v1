var fs = require('fs'),
		util = require('util'),
		wrench = require('wrench'),
		//parser = require('xml2json'),
		path = process.cwd();

var php2Json = function(files){
	files.forEach(function(file){
		if (file.match(/i18n.*\.php$/g)) {
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

var xml2Json = function(files){
	files.forEach(function(file){
		if (file.match(/manifest\.xml$/g)) {
			var filename = path + '/module/' + file;
			console.log(filename);
			var xml = fs.readFileSync(filename);
			var data = parser.toJson(xml)
			//add formatting
			var data = JSON.stringify(data, null, '  ');
			fs.writeFileSync(filename.replace(/\.xml$/,'.json'), data)
		}
	})
}

var test = function(files){
	files.forEach(function(file){
		if (file.match(/\.js/g)) {
			var data = '';
			var filename = path + '/module/' + file;
			var f = new wrench.LineReader(filename);
			while(f.hasNextLine()) {
				var line = f.getNextLine();
				var exp = /ajaxplorer:/;
				if (line.match(exp)){
					console.log(filename)
					line = line.replace(exp, 'application:');
				}
				data += line;
			}
			fs.writeFileSync(filename, data);
		}
	})
}

var files = wrench.readdirSyncRecursive('module');
test(files)
