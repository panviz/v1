var registry = {'type' : 'registry'}

//Main actions
registry.actions = require(ROOT_PATH + '/config/actions.json')

//Load extensions
extensions = ['editor.text', 'uploader.html', 'access.fs'];
extensions.forEach(function(name){
	var file = '../module/' + name.replace('.','/') + '/config.json';
	var extension = require(file);
	var type = name.split('.')[0];
	registry[type + 's'] = {};
	registry[type + 's'][name] = extension[type];
})

//User
//registry.user = require('./user.json')

var global =
{
	"global_param": [
		{
			"name": "GUI_THEME",
			"group": "CONF_MESSAGE[Main Options]",
			"type": "select",
			"choices": "mybase|Mybase, manager|Manager",
			"label": "CONF_MESSAGE[Theme]",
			"description": "CONF_MESSAGE[Theme used for display]",
			"mandatory": "true",
			"default": "mybase"
		},
		{
			"name": "CUSTOM_FONT_SIZE",
			"group": "CONF_MESSAGE[Start Up Screen]",
			"type": "string",
			"label": "CONF_MESSAGE[Title Font Size]",
			"description": "CONF_MESSAGE[Font sized used for the title in the start up screen]",
			"mandatory": "false",
			"default": ""
		},
		{
			"name": "CUSTOM_ICON",
			"group": "CONF_MESSAGE[Start Up Screen]",
			"type": "string",
			"label": "CONF_MESSAGE[Custom Icon]",
			"description": "CONF_MESSAGE[URI to a custom image to be used as start up logo]",
			"mandatory": "false",
			"default": "module/ui/main/Logo250.png"
		},
		{
			"name": "CUSTOM_ICON_WIDTH",
			"group": "CONF_MESSAGE[Start Up Screen]",
			"type": "string",
			"label": "CONF_MESSAGE[Icon Width]",
			"description": "CONF_MESSAGE[Width of the custom image (by default 35px)]",
			"mandatory": "false",
			"default": "250px"
		},
		{
			"name": "CUSTOM_ICON_HEIGHT",
			"group": "CONF_MESSAGE[Start Up Screen]",
			"type": "string",
			"label": "CONF_MESSAGE[Icon Height]",
			"description": "CONF_MESSAGE[Height of the custom icon (with the px mention)]",
			"mandatory": "false",
			"default": "50px"
		},
		{
			"name": "CUSTOM_ICON_ONLY",
			"group": "CONF_MESSAGE[Start Up Screen]",
			"type": "boolean",
			"label": "CONF_MESSAGE[Icon Only]",
			"description": "CONF_MESSAGE[Skip the title, only display an image]",
			"mandatory": "false",
			"default": "true"
		},
		{
			"name": "CUSTOM_WELCOME_MESSAGE",
			"group": "CONF_MESSAGE[Start Up Screen]",
			"type": "textarea",
			"label": "CONF_MESSAGE[Welcome Message]",
			"description": "CONF_MESSAGE[An additionnal message displayed in the start up screen]",
			"mandatory": "false",
			"default": ""
		},
		{
			"name": "CLIENT_TIMEOUT_TIME",
			"group": "CONF_MESSAGE[Client Session Config]",
			"type": "integer",
			"label": "CONF_MESSAGE[Client Timeout]",
			"description": "CONF_MESSAGE[The length of the client session in SECONDS. By default, it's copying the server session length. In most PHP installation, it will be 1440, ie 24minutes. You can set this value to 0, this will make the client session 'infinite' by pinging the server at regular occasions (thus keeping the PHP session alive). This is not a recommanded setting for evident security reasons.]",
			"mandatory": "false"
		},
		{
			"name": "CLIENT_TIMEOUT_WARN",
			"group": "CONF_MESSAGE[Client Session Config]",
			"type": "integer",
			"label": "CONF_MESSAGE[Warning Before]",
			"description": "CONF_MESSAGE[Number of MINUTES before the session expiration for issuing an alert to the user]",
			"mandatory": "false",
			"default": "3"
		},
	]
}

module.exports = registry;
