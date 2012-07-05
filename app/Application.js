/**
 * Manages managers for [Action, Extension, View], templates, Controls
 * Provider of Application state
 * Builds GUI
 */
Class.create("Application", {

	blockEditorShortcuts: false,
	blockShortcuts: false,
	blockNavigation: false,

	initialize : function(p)
	{	
		this.p = p;

		//TODO set context from registry?
		//@var Item
		this._context = null;
		this._focusables = [];
		//@var Json
		this._registry = p.get("registry");
		this._ui = p.get("ui");

		//Public
		this.historyCount = 0;
		this.title = this._ui.title;
		this.currentLanguage = p.get("currentLanguage");
		this.element = this._ui.theme.element;
		this.contextMenu = this._setContextMenu();
		this.actionBar = new ActionFul(p.get("usersEnabled"));
		this.controlFul = new ControlFul($(this.element));
		this.extensionFul = new ExtensionFul();
		this.display = new Display();
		this.registry = new Registry(p.get("socketPath"));
		
		//set Global shortcuts
		$display = this.display;
		$modal = $display.modal;
		//TODO rename actionBar
		$act = this.actionBar;
		$ext = this.extensionFul;
		$ctrl = this.controlFul;
		$reg = this.registry;
	
		$modal.initForms();
		//TODO update progress bar from right places
		//show progress bar with ? steps
		$modal.showLoader(3);
		//this.refreshExtensionsRegistry();

		////listener on repository:loaded
		document.observe("app:context_changed", this._onContextChanged.bind(this));
		//this.actionBar.initActions(this._registry.actions);
		$modal.updateLoadingProgress('Actions: Done');
			
		//Insert html of current Theme
		this.applyTemplates();
		this._setHistory();
		this.activityMonitor = new ActivityMonitor(
			window.bootstrap.p.get('session_timeout'), 
			window.bootstrap.p.get('client_timeout'), 
			window.bootstrap.p.get('client_timeout_warning'));
			
		this._fitWindow();
		//this.refreshTemplateParts();
		//this.refreshGuiComponentConfigs();
		$modal.updateLoadingProgress('User Interface: Done');
		this.initTabNavigation();

		document.fire('app:loaded');
	},

	/**
	 * Parses a client_configs/template_part item
	 */
	refreshTemplateParts : function(){
		var parts = XPathSelectItems(this._registry, "client_configs/template_part");
		var toUpdate = {};
		if(!this.templatePartsToRestore){
			this.templatePartsToRestore = $A();
		}
		for(var i=0;i<parts.length;i++){
            if(parts[i].getAttribute("theme") && parts[i].getAttribute("theme") != bootstrap.p.get("theme")){
                continue;
            }
			var id = parts[i].getAttribute("id");
			var jClassName = parts[i].getAttribute("jClass");
			var optionsString = parts[i].getAttribute("jOptions");
            var cdataContent = "";
            if(parts[i].firstChild && parts[i].firstChild.itemType == 4 && parts[i].firstChild.itemValue != ""){
                cdataContent = parts[i].firstChild.itemValue;
            }
			
			var jClass = Class.getByName(jClassName);
			if(jClass && id && Class.objectImplements(jClass, "Control")){				
				toUpdate[id] = [jClass, jClassName, optionsString, cdataContent];
				this.templatePartsToRestore = this.templatePartsToRestore.without(id);
			}
		}
        var futurePartsToRestore = $A(Object.keys(toUpdate));
		this.templatePartsToRestore.each(function(key){
			var part = this.findOriginalTemplatePart(key);
				if(part){
						var jClassName = part.getAttribute("jClass");
						var optionsString = part.getAttribute("jOptions");
						var cdataContent = part.innerHTML;
						var jClass = Class.getByName(jClassName);
						toUpdate[key] = [jClass, jClassName, optionsString, cdataContent];
				}
		}.bind(this));
		
		for(var id in toUpdate){
			this.refreshGuiComponent(id, toUpdate[id][0], toUpdate[id][1], toUpdate[id][2], toUpdate[id][3]);
		}
		this.templatePartsToRestore = futurePartsToRestore;
	},

	/**
	 * Try reading the cookie and sending it to the server
	 */
	logUserFromCookie : function(){
		var rememberData = retrieveRememberData();
		if(rememberData!=null){
		var connection = new Connection('/user/' + rememberData.user);
			connection.addParameter('password', rememberData.pass);
			connection.addParameter('cookie_login', 'true');
			connection.onComplete = function(transport){
				hideLightBox();
				this.actionBar.parseXmlMessage(transport.responseXML);
			}.bind(this);
			connection.sendSync();
		}
	},
			
	/**
	 * Refresh the repositories list for the current user
	 */
	reloadRepositoriesList : function(){
		if(!this.user) return;
		document.observeOnce("app:registry_part_loaded", function(event){
			if(event.memo != "user/repositories") return;
			this.user = new User(this._registry.user);
			repId = this.user.getActiveRepository();
			repList = this.user.getRepositoriesList();
			document.fire("app:repository_list_refreshed", {list: repList,active: repId});			
		}.bind(this));
		this.loadRegistry(false, "user/repositories");
	},
	
	/**
	 * Create Item and save as current context
	 * @event user loads repository
	 * @param data item data
	 */
	_onContextChanged: function(data){
		this._context = new Item(data);
		//TODO if path is not root goto path
			this.goTo(new Item(copy));
	},
	
	/**
	 * Require a context change to the given path
	 * @param itemOrPath Item|String A item or a path
	 */
	goTo: function(itemOrPath){		
		if(Object.isString(itemOrPath)){
			item = new Item(itemOrPath);
		}else{
			item = itemOrPath;
		}
		this._contextHolder.requireContextChange(item);
	},
	
	/**
	 * Change the repository of the current user and reload list and current.
	 * @param repositoryId String Id of the new repository
	 */
	triggerRepositoryChange: function(repositoryId){		
		document.fire("app:trigger_repository_switch");
		var connection = new Connection();
		connection.addParameter('get_action', 'switch_repository');
		connection.addParameter('repository_id', repositoryId);
		oThis = this;
		connection.onComplete = function(transport){
			this.repositoryId = null;
			this.loadRegistry();
		}.bind(this);
		var root = this._contextHolder.getRootItem();
		if(root){
			this.skipLsHistory = true;
			root.clear();			
		}
		connection.sendAsync();
	},

	
	/**
	 * Inserts the main template in the GUI.
	 * TODO handle passedTarget
	 */
	applyTemplates : function(passedTarget){
		var theme = this._ui.theme;
		var target = $(this.element);
		var obj = {}; obj['top'] = theme.html;
		target.insert(obj);
		obj['top'].evalScripts();
		$modal.updateLoadingProgress('Applied theme: ' + theme.name);	
	},
		
	findOriginalTemplatePart : function(id){
		var tmpElement = new Element("div", {style: "display:none;"});
		$$("body")[0].insert(tmpElement);
		this.initTemplates(tmpElement);
		var tPart = tmpElement.down('[id="'+id+'"]');
        if(tPart) tPart = tPart.clone(true);
		tmpElement.remove();
		return tPart;
	},
	
	/**
	 * Trigger a simple download
	 * @param url String
	 */
    triggerDownload: function(url){
        document.location.href = url;
    },

    /**
     * Reload all messages on language change
     * @param newLanguage String
     */
	loadI18NMessages: function(newLanguage){
		var connection = new Connection('/i18n/' + newLanguage);
		connection.onComplete = function(transport){
			if(transport.responseText){
				var result = transport.responseText.evalScripts();
				I18N = result[0];
				for(var key in I18N){
					I18N[key] = I18N[key].replace("\\n", "\n");
				}
				this.updateI18nTags();
				if(this.guiActions){
					this.guiActions.each(function(pair){
						pair.value.setLabel();
					});
				}
				this.loadRegistry();
				this.fireContextRefresh();
				this.currentLanguage = newLanguage;
			}
		}.bind(this);
		connection.sendSync();
	},
	
	/**
	 * Search all j_message_id tags and update their value
	 */
	updateI18nTags: function(){
		var messageTags = $$('[j_message_id]');		
		messageTags.each(function(tag){	
			var messageId = tag.getAttribute("j_message_id");
			try{
				tag.update(I18N[messageId]);
			}catch(e){}
		});
	},
	
	/**
	 * Trigger a captcha image
	 * @param seedInputField HTMLInput The seed value
	 * @param existingCaptcha HTMLImage An image (optional)
	 * @param captchaAnchor HTMLElement Where to insert the image if created.
	 * @param captchaPosition String Position.insert() possible key.
	 */
	loadSeedOrCaptcha : function(seedInputField, existingCaptcha, captchaAnchor, captchaPosition){
		var connection = new Connection("/seed");
		connection.onComplete = function(transport){
			if(transport.responseJSON){
				seedInputField.value = transport.responseJSON.seed;
				var src = window.serverAccessPath + '&get_action=get_captcha&sid='+Math.random();
				var refreshSrc = jResourcesFolder + '/image/action/16/reload.png';
				if(existingCaptcha){
					existingCaptcha.src = src;
				}else{
					var insert = {};
					var string = '<div class="main_captcha_div" style="padding-top: 4px;"><div class="dialogLegend" j_message_id="389">'+I18N[389]+'</div>';
					string += '<div class="captcha_container"><img id="captcha_image" align="top" src="'+src+'" width="170" height="80"><img align="top" style="cursor:pointer;" id="captcha_refresh" src="'+refreshSrc+'" with="16" height="16"></div>';
					string += '<div class="SF_element">';
					string += '		<div class="SF_label" j_message_id="390">'+I18N[390]+'</div> <div class="SF_input"><input type="text" class="dialogFocus dialogEnterKey" style="width: 100px; padding: 0px;" name="captcha_code"></div>';
					string += '</div>';
					string += '<div style="clear:left; margin-bottom:7px;"></div></div>';
					insert[captchaPosition] = string;
					captchaAnchor.insert(insert);
					$modal.refreshDialogPosition();
					$modal.refreshDialogAppearance();
					$('captcha_refresh').observe('click', function(){
						$('captcha_image').src = window.serverAccessPath + '&get_action=get_captcha&sid='+Math.random();
					});
				}
			}else{
				seedInputField.value = transport.responseText;
				if(existingCaptcha){
					existingCaptcha.up('.main_captcha_div').remove();
					$modal.refreshDialogPosition();
					$modal.refreshDialogAppearance();
				}
			}
		};
		connection.sendSync();		
	},

	_setHistory : function(){
		if(!Prototype.Browser.WebKit && !Prototype.Browser.IE){
			this.history = new Proto.History(function(hash){
				this.goTo(this.historyHashToPath(hash));
			}.bind(this));
			document.observe("app:context_changed", function(event){
				debugger
				this.updateHistory(this.getContext().getPath());
			}.bind(this));
		}else{
			document.observe("app:context_changed", function(event){
				debugger
				var path = this.getContext().getPath();
				document.title = this.title + ' - '+(getBaseName(path) ? getBaseName(path) : '/');
			}.bind(this));
		}
		document.observe("app:context_changed", function(event){
			debugger
			if(this.skipLsHistory || !this.user || !this.user.getActiveRepository()) return;			
			window.setTimeout(function(){
				var data = this.user.getPreference("ls_history", true) || {};
				data = new Hash(data);
				data.set(this.user.getActiveRepository(), this.getContext().getPath());
				this.user.setPreference("ls_history", data, true);
				this.user.savePreference("ls_history");
			}.bind(this), 100 );
		}.bind(this) );
	},
			
	/**
	 * Updates the browser history
	 * @param path String Path
	 */
	updateHistory: function(path){
		if(this.history) this.history.historyLoad(this.pathToHistoryHash(path));
	},
	
	/**
	 * Translate the path to a history step. Return the count.
	 * @param path String
	 * @returns Integer
	 */
	pathToHistoryHash: function(path){
		document.title = this.title + ' - '+(getBaseName(path) ? getBaseName(path) : '/');
		if(!this.pathesHash){
			this.pathesHash = new Hash();
			this.historyCount = -1;
		}
		var foundKey;
		this.pathesHash.each(function(pair){
			if(pair.value == path) foundKey = pair.key;
		});
		if(foundKey != undefined) return foundKey;
	
		this.historyCount++;
		this.pathesHash.set(this.historyCount, path);
		return this.historyCount;
	},
	
	/**
	 * Reverse operation
	 * @param hash Integer
	 * @returns String
	 */
	historyHashToPath: function(hash){
		if(!this.pathesHash) return "/";
		var path = this.pathesHash.get(hash);
		if(path == undefined) return "/";
		return path;
	},	

	/**
	 * Accessor for updating the datamodel context
	 * @param jContextItem Item optional
	 * @param jSelectedItems Item[]
	 * @param selectionSource String
	 */
	updateContextData : function(jContextItem, jSelectedItems, selectionSource){
		if(jContextItem){
			this._contextHolder.requireContextChange(jContextItem);
		}
		if(jSelectedItems){
			this._contextHolder.setSelectedItems(jSelectedItems, selectionSource);
		}
	},
	
	/**
	 * @returns Item
	 */
	getContext : function(){
		return this._context;
	},
	
	/**
	 * TODO remove
	 * @returns Collection
	 */
	getUserSelection : function(){
		return this._contextHolder;
	},		
	
	/**
	 * Accessor for datamodel.requireContextChange()
	 */
	fireContextRefresh : function(){
		this.getContextHolder().requireContextChange(this.getContext(), true);
	},
	
	/**
	 * Accessor for datamodel.requireContextChange()
	 */
	fireItemRefresh : function(itemPathOrItem){
		this.getContextHolder().requireItemReload(itemPathOrItem);
	},
	
	/**
	 * Accessor for datamodel.requireContextChange()
	 * TODO move out
	 */
	fireContextUp : function(){
		if(this.getContext().isRoot()) return;
		this.updateContextData(this.getContext().getParent());
	},
	
	/**
	 * @returns Object
	 */
	getRegistry : function(){
		return this._registry;
	},	
	
	/**
	 * Utility 
	 * @returns Boolean
	 */
	cancelCopyOrMove: function(){
		this.actionBar.treeCopyActive = false;
		hideLightBox();
		return false;
	},
		
	/**
	 * Blocks all access keys
	 */
	disableShortcuts: function(){
		this.blockShortcuts = true;
	},
	
	/**
	 * Unblocks all access keys
	 */
	enableShortcuts: function(){
		this.blockShortcuts = false;
	},
	
	/**
	 * blocks all tab keys
	 */
	disableNavigation: function(){
		this.blockNavigation = true;
	},
	
	/**
	 * Unblocks all tab keys
	 */
	enableNavigation: function(){
		this.blockNavigation = false;
	},

	disableAllKeyBindings : function(){
		 this.blockNavigation = this.blockShortcuts = this.blockEditorShortcuts = true;
	},

	enableAllKeyBindings : function(){
		 this.blockNavigation = this.blockShortcuts = this.blockEditorShortcuts = false;
	},
	
	/**
	 * TODO move to Modal
	 * Display an information or error message to the user 
	 * @param messageType String ERROR or SUCCESS
	 * @param message String the message
	 */	
	displayMessage: function(messageType, message){
		var urls = parseUrl(message);
		if(urls.length && this.user && this.user.repositories){
			urls.each(function(match){
				var repo = this.user.repositories.get(match.host);
				if(!repo) return;
				message = message.replace(match.url, repo.label+" : " + match.path + match.file);
			}.bind(this));
		}
		$modal.displayMessage(messageType, message);
	},
	
	/**
	 * Focuses on a given widget
	 * @param object Focusable
	 */
	focusOn : function(object){
		this._focusables.each(function(obj){
			if(obj != object) obj.blur();
		});
		object.focus();
	},
	
	/**
	 * Blur all widgets
	 */
	blurAll : function(){
		this._focusables.each(function(f){
			if(f.hasFocus) this._lastFocused = f;
			f.blur();
		}.bind(this) );
	},	
	
	/**
	 * Find last focused Focusable and focus it!
	 */
	focusLast : function(){
		if(this._lastFocused) this.focusOn(this._lastFocused);
	},
	
	/**
	 * Create a Tab navigation between registerd Focusable
	 */
	initTabNavigation : function(){
		var objects = this._focusables;
		// ASSIGN OBSERVER
		Event.observe(document, "keydown", function(e)
		{			
			if(e.keyCode == Event.KEY_TAB)
			{
				if(this.blockNavigation) return;
				var shiftKey = e['shiftKey'];
				var foundFocus = false;
				for(i=0; i<objects.length;i++)
				{
					if(objects[i].hasFocus)
					{
						objects[i].blur();
						var nextIndex;
						if(shiftKey)
						{
							if(i>0) nextIndex=i-1;
							else nextIndex = (objects.length) - 1;
						}
						else
						{
							if(i<objects.length-1)nextIndex=i+1;
							else nextIndex = 0;
						}
						objects[nextIndex].focus();
						foundFocus = true;
						break;
					}
				}
				if(!foundFocus && objects[0]){
					this.focusOn(objects[0]);
				}
				Event.stop(e);
			}
			if(this.blockShortcuts || e['ctrlKey']) return;
			if(e.keyCode != Event.KEY_DELETE && ( e.keyCode > 90 || e.keyCode < 65 ) ) return;
			else return this.actionBar.fireActionByKey(e, (e.keyCode == Event.KEY_DELETE ? "key_delete" : String.fromCharCode(e.keyCode).toLowerCase()));
		}.bind(this));
	},

	_setContextMenu : function(){
		var menu = new Proto.Menu({
			resourcesFolder: this.p.get('ui').theme.path,
		  selector: '', // context menu will be shown when element with class name of "contextmenu" is clicked
		  className: 'menu desktop', // this is a class which will be attached to menu container (used for css styling)
		  menuItems: [],
		  fade: true,
		  zIndex: 2000
		});
		menu.options.beforeShow = function(e){
			debugger
			this.options.lastElement = Event.element(e);
			this.options.menuItems = app.actionBar.getContextActions(Event.element(e));
			this.refreshList();
		}.bind(menu);
		menu.options.beforeHide = function(e){
			this.options.lastElement = null;
		}.bind(menu);
		document.observe("app:actions_refreshed", function(){
			//TODO investigate after ProtoMenu.beforeShow
			if(this.options.lastElement){
				this.options.menuItems = app.actionBar.getContextActions(this.options.lastElement);
				this.refreshList();
			}			
		}.bind(menu));
		return menu;
	},
	
	_fitWindow : function(){
		var desktop = $(this.element);
		var options = desktop.getAttribute("options").evalJSON(false);
		if(options.fit && options.fit == 'height'){
			var marginBottom = 0;
			if(options.fitMarginBottom){
				try{marginBottom = parseInt(eval(options.fitMarginBottom));}catch(e){}
			}
			if(options.fitParent == 'window') options.fitParent = window;
			else options.fitParent = $(options.fitParent);
			fitHeightToBottom($(this.element), options.fitParent, marginBottom, true);
		}
 }
});
