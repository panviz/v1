var fs = require('fs')
	, path = require('path');

module.exports = {
	include_tag: function(file){
		return insert_file(file, '<script language="javascript" type="text/javascript" src="%filename%"></script>');
	},

	link_tag: function(file){
		return insert_file(file, '<link rel="stylesheet" type="text/css" href="%filename%">');
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

function insert_file(filename, code){
	if (filename.indexOf("list") != -1){
		var list = [];
		getList(filename).forEach(function(name) {
			name = path.dirname(filename) + '/' + name;
			list.push(insert_file(name, code));
		})
		return list.join('\n');
	} else {
		return code.replace('%filename%', filename)
	}
}

//TODO use global root variable for path
function getList(filename){
	return fs.readFileSync(ROOT_PATH +'/'+ filename, "binary").split('\n');
}
