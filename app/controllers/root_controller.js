// Set all global variables 
var controller = {}
  , app;

module.exports = function (_app) {
	app = _app;
	return controller;
}

controller.index = function(req, res, next){
	//TODO define ui.name, currentLanguage, theme in settings.json based on requester locale, platform 
	if (!settings.ui.name){
		setUI("desktop");
	}
	if (!settings.ui.theme){
		setTheme("mybase");
	}
	res.render('index.ejs');
}

controller.settings = function(req, res, next){
	res.send(settings);
}

controller.registry = function(req, res, next){
	res.send(registry);
}

controller.data = function(req, res, next){
	res.send(ls);
}

var setUI = function(name){
	if (name == "desktop"){
		var config = require(ROOT_PATH + '/config/ui.json')
	}
	_.extend(settings.ui, config);
}

var setTheme = function(name){
	var ui = settings.ui;
	ui.theme = ui.themes[name];
	if (!ui.theme){
		ui.theme = ui.themes['mybase']
	}
	ui.theme.html = fs.readFileSync(ROOT_PATH + ui.theme.template, 'binary');
}

var ls = {
	"item" : {
		"name" : "ROOT",
		"path" : "/",
		"params" : {
			"repo_has_recycle" : true,
			"is_file" : false,
			"mimestring" : "Directory",
			"icon" : "folder.png",
			"openicon" : "folder_open.png",
			"file_group" : 1,
			"file_perms" : "0777",
			"modiftime" : 1340092475,
			"bytesize" : 0,
			"filesize" : "-",
			"is_image" : 0
		},
		"collection" : [
			{
				"name" : "dir1",
				"path" : "/dir0",
				"params" : {
					"is_file" : false,
					"mimestring" : "Directory",
					"icon" : "folder.png",
					"openicon" : "folder_open.png",
					"file_group" : 1,
					"file_owner" : 1,
					"file_perms" : "0777",
					"modiftime" : 1340099405,
					"bytesize" : 0,
					"filesize" : "-",
					"is_image" : 0
				}
			},
			{
				"name" : "bird",
				"path" : "/bird.jpg",
				"params" : {
					"is_file" : true,
					"mimestring" : "JPG picture",
					"icon" : "image.png",
					"openicon" : "folder_open.png",
					"file_group" : 1,
					"file_owner" : 1,
					"file_perms" : "0777",
					"modiftime" : 1340099885,
					"bytesize" : 52664,
					"filesize" : "51.43 Kb",
					"is_image" : 1,
					"image_type" : "image/jpeg",
					"image_width" : 660,
					"image_height" : 404,
					"readable_dimension" : "660px X 404px"
				}
			},
			{
				"name": "Recycle Bin",
				"path" : "/recycle_bin",
				"params" : {
					"is_file" : false,
					"mimestring" : "Recycle Bin",
					"mime" : "recycle",
					"icon" : "trashcan.png",
					"openicon" : "folder_open.png",
					"file_group" : 1,
					"file_owner" : 1,
					"file_perms" : "0777",
					"modiftime" : 1340099110,
					"bytesize" : 0,
					"filesize" : "-",
					"is_image" : 0
				}
			}
		]
	}
}
