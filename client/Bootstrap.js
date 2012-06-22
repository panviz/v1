/**
 * Main BootLoader.
 * Defaults params for constructor should be settings.json
 */
Class.create("Bootstrap", {
	/**
	 * @var $H()
	 */
	p: $H({}),
	/**
	 * @var connection - class variable 
	 */
	connection: null,
	/**
	 * Constructor 
	 * @param startParameters Object The options
	 */
	initialize : function(options){
		this.p = $H(options);
		if(this.p.get("ALERT")){
			window.setTimeout(function(){alert(this.p.get("ALERT"));}.bind(this),0);
		}		
		Event.observe(document, 'dom:loaded', this._onDomLoaded.bind(this));
		document.observe('app:actions_loaded', this._onActionsLoaded.bind(this));
		document.observe('app:loaded', this._onApplicationLoaded.bind(this));
	},
	/**
	 * Real loading action
	 */
	loadBootConfig : function(){
		var url = this.p.get('url')+(this.p.get("debugMode") ? '&debug=true' : '');
		if(this.p.get('SERVER_PREFIX_URI')){
			url += '&server_prefix_uri=' + this.p.get('SERVER_PREFIX_URI');
		}
		connection = new Connection(url);
		connection.onComplete = this._onSettingsLoaded.bind(this);
		connection.sendSync();
	},
	
	init : function(connection){
		if(this.p.get('SECURE_TOKEN') && !Connection.SECURE_TOKEN){
			Connection.SECURE_TOKEN = this.p.get('SECURE_TOKEN');
		}

		// Refresh window variable
		window.THEME = this.p.get('ui').theme;
		var cssRes = THEME.cssResources;
		if(cssRes) cssRes.each(this.loadCSSResource.bind(this));
		if(this.p.get('additional_js_resource')){
			connection.loadLibrary(this.p.get('additional_js_resource?v='+this.p.get("version")));
		}
		this.insertLoaderProgress();
		if(!this.p.get("debug")){
			connection.loadLibrary("app.js?v="+this.p.get("version"));
		}
		window.I18N = this.p.get("i18n");
		document.fire("app:boot_loaded");
		window.app = new Application(this.p);
		$('version_span').update(' - Version '+this.p.get("version") + ' - '+ this.p.get("versionDate"));
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
	//TODO WTF?
	_onDomLoaded : function(){
			var startedFromOpener = false;
			try{
					if(window.opener && window.opener.bootstrap){
							this.p = window.opener.bootstrap.p;
							// Handle queryString case, as it's not passed via settings.json
							var qParams = document.location.href.toQueryParams();
							if(qParams['external_selector_type']){
									this.p.set('SELECTOR_DATA', {type: qParams['external_selector_type'], data: qParams});
							}else{
									if(this.p.get('SELECTOR_DATA')) this.p.unset('SELECTOR_DATA');
							}
							this.init(new Connection());
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
		this.p.update(data);
		
		if(this.p.get('SECURE_TOKEN')){
			Connection.SECURE_TOKEN = this.p.get('SECURE_TOKEN');
		}
		if(this.p.get('SERVER_PREFIX_URI')){
			this.p.set('serverAccess', this.p.get('SERVER_PREFIX_URI') + this.p.get('serverAccess') + '?' + (Connection.SECURE_TOKEN ? 'secure_token=' + Connection.SECURE_TOKEN : ''));
		}else{
			this.p.set('serverAccess', this.p.get('serverAccess') + '?' + (Connection.SECURE_TOKEN ? 'secure_token=' + Connection.SECURE_TOKEN : ''));
		}
		
		this.init(connection);
		
	},
	//TODO SELECTOR_DATA is set _onDomLoaded
	_onActionsLoaded : function(){
		var extSelect = app.actionBar.getAction("ext_select");
		if(!this.p.get("SELECTOR_DATA") && extSelect){
			extSelect.unset("ext_select");
			app.actionBar.fireContextChange();
			app.actionBar.fireSelectionChange();	
		}else if(this.p.get("SELECTOR_DATA")){
			app.actionBar.defaultActions.set("file", "ext_select");
		}
	},
	_onApplicationLoaded : function(){
		if(this.p.get("SELECTOR_DATA")){
				app.actionBar.defaultActions.set("file", "ext_select");
				app.actionBar.selectorData = new Hash(this.p.get("SELECTOR_DATA"));	    		
		}
	}
});
