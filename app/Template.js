var fs = require('fs'),
		Path = require('path');

module.exports = {
	include_tag: function(file){
		return insert_file(file, '<script language="javascript" type="text/javascript" src="%path%"></script>');
	},

	link_tag: function(file){
		return insert_file(file, '<link rel="stylesheet" type="text/css" href="%path%">');
	},
	//translations
	//TODO add %s substitution
	t: function(message){
			 if (settings.currentLanguage == "en"){
				 return message;
			 } else {
				 settings.i18n[settings.currentLanguage][message];
			 }
		 }
}

function insert_file(path, code){
	if (path.indexOf("list") != -1){
		var list = [];
		getList(path).forEach(function(name) {
			if (!name) return;
			//if list.txt is not in /config, it has paths relative to its path
			if (path.indexOf("config") == -1){
				name = Path.dirname(path) + '/' + name;
			} else{
				name = '/app/' + name;
			}
			list.push(insert_file(name, code));
		})
		return list.join('\n');
	} else {
		return code.replace('%path%', path)
	}
}

//TODO use global root variable for path
function getList(path){
	var filepath = ROOT_PATH + path;
	try {
		fs.statSync(filepath)
	}
	catch (e) {
			var filepath = ROOT_PATH + '/app' + path;
		}
	return fs.readFileSync(filepath, "binary").split('\n');
}
