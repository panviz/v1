/**
 * Main BootLoader.
 * Defaults params for constructor should be settings.json
 */
Class.create("Bootstrap", {
	/**
	 * @var $H()
	 */
	parameters: $H({}),
	/**
	 * @var connection - class variable 
	 */
	connection: null,
	/**
	 * Constructor 
	 * @param startParameters Object The options
	 */
	initialize : function(options){
		this.parameters = $H(options);
		if(this.parameters.get("ALERT")){
			window.setTimeout(function(){alert(this.parameters.get("ALERT"));}.bind(this),0);
		}		
		Event.observe(document, 'dom:loaded', this._onDomLoaded.bind(this));
		document.observe('app:actions_loaded', this._onActionsLoaded.bind(this));
		document.observe('app:loaded', this._onApplicationLoaded.bind(this));
	},
	/**
	 * Real loading action
	 */
	loadBootConfig : function(){
		var url = this.parameters.get('url')+(this.parameters.get("debugMode") ? '&debug=true' : '');
		if(this.parameters.get('SERVER_PREFIX_URI')){
			url += '&server_prefix_uri=' + this.parameters.get('SERVER_PREFIX_URI');
		}
		connection = new Connection(url);
		connection.onComplete = this._onSettingsLoaded.bind(this);
		connection.sendSync();
	},
	
	refreshContextVariablesAndInit : function(connection){
		if(this.parameters.get('SECURE_TOKEN') && !Connection.SECURE_TOKEN){
			Connection.SECURE_TOKEN = this.parameters.get('SECURE_TOKEN');
		}

		// Refresh window variable
		window.THEME = this.parameters.get('ui').theme;
		var cssRes = THEME.cssResources;
		if(cssRes) cssRes.each(this.loadCSSResource.bind(this));
		if(this.parameters.get('additional_js_resource')){
			connection.loadLibrary(this.parameters.get('additional_js_resource?v='+this.parameters.get("version")));
		}
		this.insertLoaderProgress();
		if(!this.parameters.get("debug")){
			connection.loadLibrary("app.js?v="+this.parameters.get("version"));
		}
		window.I18N = this.parameters.get("i18n");
		document.fire("app:boot_loaded");
		window.app = new Application(this.parameters);
		$('version_span').update(' - Version '+this.parameters.get("version") + ' - '+ this.parameters.get("versionDate"));
		window.app.init();		
	},
	
	/**
	 * Inserts a progress bar 
	 */
	insertLoaderProgress : function(){
		viewPort = document.viewport.getDimensions();
		$('progressBox').setStyle({
            left: parseInt(Math.max((viewPort.width-$('progressBox').getWidth())/2,0))+"px",
            top: parseInt(Math.max((viewPort.height-$('progressBox').getHeight())/3,0))+"px"
        });
		var options = {
			animate		: true,										// Animate the progress? - default: true
			showText	: false,									// show text with percentage in next to the progressbar? - default : true
			width		: 154,										// Width of the progressbar - don't forget to adjust your image too!!!
			boxImage	: window.THEME.path +'/image/progress_box.gif',			// boxImage : image around the progress bar
			barImage	: window.THEME.path +'/image/progress_bar.gif',	// Image to use in the progressbar. Can be an array of images too.
			height		: 11,										// Height of the progressbar - don't forget to adjust your image too!!!
			onTick		: function(pbObj) { 
				if(pbObj.getPercentage() == 100){
                    new Effect.Parallel([
                            new Effect.Opacity($('loading_overlay'),{sync: true,from: 0.2,to: 0,duration: 0.8}),
                            new Effect.Opacity($('progressBox'),{sync: true,from: 1,to: 0,duration: 0.8})
                        ],
                        {afterFinish : function(){
                            $('loading_overlay').remove();
                            if($('progressCustomMessage').innerHTML.strip() && $("generic_dialog_box") && $("generic_dialog_box").visible() && $("generic_dialog_box").down('div.dialogLegend')){
                                $("generic_dialog_box").down('div.dialogLegend').update($('progressCustomMessage').innerHTML.strip());
                            }
                            $('progressBox').remove();
                        }});
					return false;
				}
				return true ;
			}
		};
		window.loaderProgress = new JS_BRAMUS.jsProgressBar($('loaderProgress'), 0, options); 
	},
	/**
	 * Loads a CSS file
	 * @param fileName String
	 */
	loadCSSResource : function(fileName){
		var head = $$('head')[0];
		var cssNode = new Element('link', {
			type : 'text/css',
			rel  : 'stylesheet',
			href : THEME.path + '/' + fileName,
			media : 'screen'
		});
		head.insert(cssNode);
	},
	//prototype event
	_onDomLoaded : function(){
			var startedFromOpener = false;
			try{
					if(window.opener && window.opener.bootstrap){
							this.parameters = window.opener.bootstrap.parameters;
							// Handle queryString case, as it's not passed via settings.json
							var qParams = document.location.href.toQueryParams();
							if(qParams['external_selector_type']){
									this.parameters.set('SELECTOR_DATA', {type: qParams['external_selector_type'], data: qParams});
							}else{
									if(this.parameters.get('SELECTOR_DATA')) this.parameters.unset('SELECTOR_DATA');
							}
							this.refreshContextVariablesAndInit(new Connection());
							startedFromOpener = true;
					}
			}catch(e){
					if(console && console.log) console.log(e);
			}
			if(!startedFromOpener){
					this.loadBootConfig();
			}
	},
	//TODO move out XML
	_onSettingsLoaded : function(transport){
		if(transport.responseXML && transport.responseXML.documentElement && transport.responseXML.documentElement.nodeName == "tree"){
			var alert = XPathSelectSingleNode(transport.responseXML.documentElement, "message");
			window.alert('Exception caught by application : ' + alert.firstChild.nodeValue);
			return;
		}
		var serverError;
		try{
			var data = transport.responseText.evalJSON();
		}catch(e){
			serverError = 'Error while parsing JSON response : ' + e.message;
		}
		if(!typeof data == "object"){
			serverError = 'Exception uncaught by application : ' + transport.responseText;
		}
		if(serverError){
			document.write(serverError);
			if(serverError.indexOf('<b>Notice</b>')>-1 || serverError.indexOf('<b>Strict Standards</b>')>-1){
				window.alert('Server Error');
			}
			return;
		}
		this.parameters.update(data);
		
		if(this.parameters.get('SECURE_TOKEN')){
			Connection.SECURE_TOKEN = this.parameters.get('SECURE_TOKEN');
		}
		if(this.parameters.get('SERVER_PREFIX_URI')){
			this.parameters.set('serverAccess', this.parameters.get('SERVER_PREFIX_URI') + this.parameters.get('serverAccess') + '?' + (Connection.SECURE_TOKEN ? 'secure_token=' + Connection.SECURE_TOKEN : ''));
		}else{
			this.parameters.set('serverAccess', this.parameters.get('serverAccess') + '?' + (Connection.SECURE_TOKEN ? 'secure_token=' + Connection.SECURE_TOKEN : ''));
		}
		
		this.refreshContextVariablesAndInit(connection);
		
	},
	_onActionsLoaded : function(){
		if(!this.parameters.get("SELECTOR_DATA") && app.actionBar.actions.get("ext_select")){
			app.actionBar.actions.unset("ext_select");
			app.actionBar.fireContextChange();
			app.actionBar.fireSelectionChange();	
		}else if(this.parameters.get("SELECTOR_DATA")){
			app.actionBar.defaultActions.set("file", "ext_select");
		}
	},
	_onApplicationLoaded : function(){
		if(this.parameters.get("SELECTOR_DATA")){
				app.actionBar.defaultActions.set("file", "ext_select");
				app.actionBar.selectorData = new Hash(this.parameters.get("SELECTOR_DATA"));	    		
		}
	}
});
