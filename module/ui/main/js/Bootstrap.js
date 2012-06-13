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
	 * @var connexion - class variable 
	 */
	connexion: null,
	/**
	 * Constructor 
	 * @param startParameters Object The options
	 */
	initialize : function(startParameters){
		this.parameters = $H(startParameters);
		this.detectBaseParameters();
		if(this.parameters.get("ALERT")){
			window.setTimeout(function(){alert(this.parameters.get("ALERT"));}.bind(this),0);
		}		
		Event.observe(document, 'dom:loaded', this._onDomLoaded.bind(this));
		document.observe('ajaxplorer:actions_loaded', this._onActionsLoaded.bind(this));
		document.observe('ajaxplorer:loaded', this._onAjaxplorerLoaded.bind(this));
	},
	/**
	 * Real loading action
	 */
	loadBootConfig : function(){
		var url = this.parameters.get('BOOTER_URL')+(this.parameters.get("debugMode") ? '&debug=true' : '');
		if(this.parameters.get('SERVER_PREFIX_URI')){
			url += '&server_prefix_uri=' + this.parameters.get('SERVER_PREFIX_URI');
		}
		connexion = new Connexion(url);
		connexion.onComplete = this._onSettingsLoaded.bind(this);
		connexion.sendSync();
	},
	
	refreshContextVariablesAndInit : function(connexion){
		if(this.parameters.get('SECURE_TOKEN') && !Connexion.SECURE_TOKEN){
			Connexion.SECURE_TOKEN = this.parameters.get('SECURE_TOKEN');
		}

		// Refresh window variable
		window.ajxpServerAccessPath = this.parameters.get('ajxpServerAccess');
		var cssRes = this.parameters.get("cssResources");
		if(cssRes) cssRes.each(this.loadCSSResource.bind(this));
		if(this.parameters.get('ajxpResourcesFolder')){
			connexion._libUrl = this.parameters.get('ajxpResourcesFolder') + "/js";
			window.ajxpResourcesFolder = this.parameters.get('ajxpResourcesFolder') + "/theme/" + this.parameters.get("theme");
		}
		if(this.parameters.get('additional_js_resource')){
			connexion.loadLibrary(this.parameters.get('additional_js_resource?v='+this.parameters.get("ajxpVersion")));
		}
		this.insertLoaderProgress();
		if(!this.parameters.get("debugMode")){
			connexion.loadLibrary("ajaxplorer.js?v="+this.parameters.get("ajxpVersion"));
		}
		window.MessageHash = this.parameters.get("i18nMessages");
		for(var key in MessageHash){
			MessageHash[key] = MessageHash[key].replace("\\n", "\n");
		}
		window.zipEnabled = this.parameters.get("zipEnabled");
		window.multipleFilesDownloadEnabled = this.parameters.get("multipleFilesDownloadEnabled");
		document.fire("ajaxplorer:boot_loaded");
		window.ajaxplorer = new Ajaxplorer(this.parameters.get("EXT_REP")||"", this.parameters.get("usersEnabled"), this.parameters.get("loggedUser"));
		if(this.parameters.get("currentLanguage")){
			window.ajaxplorer.currentLanguage = this.parameters.get("currentLanguage");
		}
		$('version_span').update(' - Version '+this.parameters.get("ajxpVersion") + ' - '+ this.parameters.get("ajxpVersionDate"));
		window.ajaxplorer.init();		
	},
	
	/**
	 * Detect the base path of the javascripts based on the script tags
	 */
	detectBaseParameters : function(){
		$$('script').each(function(scriptTag){
			if(scriptTag.src.match("/js/ajaxplorer_boot") || scriptTag.src.match("/js/ajaxplorer/Bootstrap.js")){
				if(scriptTag.src.match("/js/ajaxplorer_boot")){
					this.parameters.set("debugMode", false);
				}else{
					this.parameters.set("debugMode", true);
				}
                var src = scriptTag.src.replace('/js/ajaxplorer/Bootstrap.js','').replace('/js/ajaxplorer_boot.js', '').replace('/js/ajaxplorer_boot_protolegacy.js', '');
                if(src.indexOf("?")!=-1) src = src.split("?")[0];
				this.parameters.set("ajxpResourcesFolder", src);
			}
		}.bind(this) );
		if(this.parameters.get("ajxpResourcesFolder")){
			window.ajxpResourcesFolder = this.parameters.get("ajxpResourcesFolder");		
		}else{
			alert("Cannot find resource folder");
		}
		var booterUrl = this.parameters.get("BOOTER_URL");
		if(booterUrl.indexOf("?") > -1){
			booterUrl = booterUrl.substring(0, booterUrl.indexOf("?"));
		}
		this.parameters.set('ajxpServerAccessPath', booterUrl);
		window.ajxpServerAccessPath = booterUrl;
	},
	/**
	 * Inserts a progress bar 
	 */
	insertLoaderProgress : function(){
		var html = '<div id="loading_overlay" style="background-color:#555555; opacity:0.2;"></div>';
		if(this.parameters.get('customWelcomeScreen')){
			try { this.parameters.set('customWelcomeScreen', customFuncDecode(this.parameters.get('customWelcomeScreen')));
			}catch(e){
				this.parameters.set('customWelcomeScreen','');
			}
		}		
		if(this.parameters.get('customWelcomeScreen')){
			html += this.parameters.get('customWelcomeScreen');
		}else{
			var customWording = this.parameters.get("customWording");
			html+='	<div id="progressBox" class="dialogBox" style="width: 320px;display:block; top:30%; z-index:2002; left:40%; position:absolute; background-color:#fff; padding:0;">';
			html+='	<div align="left" class="dialogContent" style="color:#676965; font-family:Trebuchet MS,sans-serif; font-size:11px; font-weight:normal; left:10px; padding:10px;">';
			var icon = customWording.icon || ajxpResourcesFolder+'/images/ICON.png';
			var title = customWording.title || "AjaXplorer";
			var iconWidth = customWording.iconWidth || '35px';
			var fontSize = customWording.titleFontSize || '35px';
            var titleDivSize = (customWording.iconHeight ? 'height:' + customWording.iconHeight + ';' : '');
			html+=' <div style="margin-bottom:0px; font-size:'+fontSize+';font-weight:bold; background-image:url(\''+icon+'\');background-position:left center; background-repeat:no-repeat; padding-left:'+iconWidth+';'+titleDivSize+'color:#0077b3;">'+(customWording.iconOnly ? '' : title)+'</div>';
			if(customWording.title.toLowerCase() != "ajaxplorer"){
				html+='	<div style="padding:4px 7px; position:relative;"><div>Powered by AjaXplorer<span id="version_span"></span></div>';
			}else{
				html+='	<div style="padding:4px 7px;position:relative;"><div>The web data-browser<span id="version_span"></span></div>';
			}
			html+='	Written by Charles du Jeu - AGPL License. Updated by Dmitra.<div id="progressCustomMessage" style="margin-top: 35px; font-weight:bold; padding-bottom:5px;">';
			if(customWording.welcomeMessage){
				html+= customWording.welcomeMessage.replace(new RegExp("\n", "g"), "<br>");
			}
            html+="</div>";
            html+='<div id="progressState" style="float:left; display:inline;">Booting...</div>';
			html+='	<div id="progressBarContainer" style="margin-top:3px; margin-left:126px;"><span id="loaderProgress"></span></div>';
            html+= '<div id="progressBarHeighter" style="height:10px;"></div>';
			html+='	</div></div>';
		}

		$$('body')[0].insert({top: html});
		viewPort = document.viewport.getDimensions();
		$('progressBox').setStyle({
            left: parseInt(Math.max((viewPort.width-$('progressBox').getWidth())/2,0))+"px",
            top: parseInt(Math.max((viewPort.height-$('progressBox').getHeight())/3,0))+"px"
        });
		var options = {
			animate		: true,										// Animate the progress? - default: true
			showText	: false,									// show text with percentage in next to the progressbar? - default : true
			width		: 154,										// Width of the progressbar - don't forget to adjust your image too!!!
			boxImage	: window.ajxpResourcesFolder+'/images/progress_box.gif',			// boxImage : image around the progress bar
			barImage	: window.ajxpResourcesFolder+'/images/progress_bar.gif',	// Image to use in the progressbar. Can be an array of images too.
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
	 * Inserts Google Analytics Code
	 */
	insertAnalytics : function(){	
		if(!this.parameters.get("googleAnalyticsData")) return;
		var data = this.parameters.get("googleAnalyticsData");
		window._gaq = window._gaq || [];
		window._gaq.push(['_setAccount', data.id]);		
		if(data.domain) window._gaq.push(['_setDomainName', data.domain]);
		window._gaq.push(['_trackPageview']);
		window._gaTrackEvents = data.event;
		window.setTimeout(function(){
			var src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			var ga = new Element("script", {type: 'text/javascript', async: 'true',src: src});
			($$('head')[0] || $$('body')[0]).insert(ga);
		}, 200);
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
			href : this.parameters.get("ajxpResourcesFolder") + '/' + fileName,
			media : 'screen'
		});
		head.insert(cssNode);
	},
	/**
	 * Inserts the all_forms and generic dialog box if not alreay present.
	 * @param desktopNode String The id of the node to attach
	 */
	insertBasicSkeleton : function(desktopNode){
		if($('all_forms')) return;
		$(desktopNode).insert({after:
			'<div id="all_forms">\
				<div id="generic_dialog_box" class="dialogBox"><div class="dialogTitle"></div><div class="dialogContent"></div></div>\
				<div id="hidden_frames" style="display:none;"></div>\
				<div id="hidden_forms" style="position:absolute; left:-1000px;"></div>\
			</div>'});
	},
	//prototype event
	_onDomLoaded : function(){
		//TODO when the skeleton can be absent in view?
		this.insertBasicSkeleton(this.parameters.get('MAIN_ELEMENT'));
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
							this.refreshContextVariablesAndInit(new Connexion());
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
		var phpError;
		try{
			var data = transport.responseText.evalJSON();
		}catch(e){
			phpError = 'Error while parsing JSON response : ' + e.message;
		}
		if(!typeof data == "object"){
			phpError = 'Exception uncaught by application : ' + transport.responseText;
		}
		if(phpError){
			document.write(phpError);
			if(phpError.indexOf('<b>Notice</b>')>-1 || phpError.indexOf('<b>Strict Standards</b>')>-1){
				window.alert('Php errors detected, it seems that Notice or Strict are detected, you may consider changing the PHP Error Reporting level!');
			}
			return;
		}
		this.parameters.update(data);
		
		if(this.parameters.get('SECURE_TOKEN')){
			Connexion.SECURE_TOKEN = this.parameters.get('SECURE_TOKEN');
		}
		if(this.parameters.get('SERVER_PREFIX_URI')){
			this.parameters.set('ajxpResourcesFolder', this.parameters.get('SERVER_PREFIX_URI') + this.parameters.get('ajxpResourcesFolder'));
			this.parameters.set('ajxpServerAccess', this.parameters.get('SERVER_PREFIX_URI') + this.parameters.get('ajxpServerAccess') + '?' + (Connexion.SECURE_TOKEN ? 'secure_token=' + Connexion.SECURE_TOKEN : ''));
		}else{
			this.parameters.set('ajxpServerAccess', this.parameters.get('ajxpServerAccess') + '?' + (Connexion.SECURE_TOKEN ? 'secure_token=' + Connexion.SECURE_TOKEN : ''));
		}
		
		this.refreshContextVariablesAndInit(connexion);
		
	},
	_onActionsLoaded : function(){
		debugger
		if(!this.parameters.get("SELECTOR_DATA") && ajaxplorer.actionBar.actions.get("ext_select")){
			ajaxplorer.actionBar.actions.unset("ext_select");
			ajaxplorer.actionBar.fireContextChange();
			ajaxplorer.actionBar.fireSelectionChange();	
		}else if(this.parameters.get("SELECTOR_DATA")){
			ajaxplorer.actionBar.defaultActions.set("file", "ext_select");
		}
	},
	_onAjaxplorerLoaded : function(){
		debugger
		this.insertAnalytics();
		if(this.parameters.get("SELECTOR_DATA")){
				ajaxplorer.actionBar.defaultActions.set("file", "ext_select");
				ajaxplorer.actionBar.selectorData = new Hash(this.parameters.get("SELECTOR_DATA"));	    		
		}
	}
});
