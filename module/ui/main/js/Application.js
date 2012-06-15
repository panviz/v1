/**
 * This is the main JavaScript class instantiated by Boostrap at startup.
 */
Class.create("Application", {

    blockEditorShortcuts: false,
    blockShortcuts: false,
    blockNavigation: false,

	/**
	 * Constructor.
	 * @param loadRep String A base folder to load after initialization is complete
	 * @param usersEnabled Boolean Whether users management is enabled or not
	 * @param loggedUser String Already logged user. 
	 */
	initialize : function(params)
	{	
		this.parameters = params;
		this._initLoadRep = params.get("default_repository") || "";
		this._initObj = true ;
		this.usersEnabled = params.get("usersEnabled");
		this.actionBar = new ActionsManager(this.usersEnabled);
		this._setContextMenu();
		this._initLoggedUser = params.get("loggedUser");
		this._contextHolder = new DataModel();
		this._contextHolder.setNodeProvider(new RemoteNodeProvider());
		this._focusables = [];
		this._registry = null;
		this._resourcesRegistry = {};
		//this._initDefaultDisp = 'list';
		this.historyCount = 0;
		this._guiComponentsConfigs = new Hash();
		this.ui = params.get("ui");
		this.appTitle = this.ui.title;
		this.currentLanguage = params.get("currentLanguage");
		this.element = this.ui.theme.element;
	},
	
	/**
	 * Real initialisation sequence. Will Trigger the whole GUI building.
	 * Event app:loaded is fired at the end.
	 */
	init : function(){
		//split progress bar on 5 parts
		modal.setLoadingStepCounts(5);
		//sync load
		this.loadRegistry(true);		
		this.applyTemplates();
		modal.initForms();
		this._setHistory();
		this.activityMonitor = new ActivityMonitor(
			window.bootstrap.parameters.get('session_timeout'), 
			window.bootstrap.parameters.get('client_timeout'), 
			window.bootstrap.parameters.get('client_timeout_warning'));
		  
		this.guiLoaded = false;

		this.buildGUI($(this.element));
		this._fitWindow();
		// Rewind components creation!
		if(this.guiCompRegistry){
			this.initWidgets(this.guiCompRegistry);
		}
		this.guiLoaded = true;
		document.fire("app:gui_loaded");
		modal.updateLoadingProgress('User Interface: Done');
		this.initTabNavigation();
		this.blockShortcuts = false;
		this.blockNavigation = false;
		modal.updateLoadingProgress('Navigation: Done');
		

		this.tryLogUserFromCookie();

		window.setTimeout(function(){
			document.fire('app:loaded');
		}, 200);		
	},
	/**
	 * Loads the Registry, an image of the application in its current state
	 * sent by the server.
	 * @param sync Boolean Whether to send synchronously or not.
	 * @param part String load only a subpart of the registry
	 */
	loadRegistry : function(sync, part){
		var connexion = new Connexion('registry.json');
		connexion.onComplete = this._onRegistryLoaded.bind(this);
		if(part){
			connexion.addParameter('part', part);
		}
		sync ? connexion.sendSync() : connexion.sendAsync();
	},
	_onRegistryLoaded : function(transport){
		var data = transport.responseText.evalJSON();
		if(data.registry){
			this._registry = data.registry;
			modal.updateLoadingProgress('Registry: Done');
			document.fire("app:registry_loaded", this._registry);
			this.refreshExtensionsRegistry();
			//TODO add user on server to registry
			//this.logXmlUser(this._registry);
			if(this.user){
				var repId = this.user.getActiveRepository();
				var repList = this.user.getRepositoriesList();
				var repositoryObject = repList.get(repId);
				if(repositoryObject) repositoryObject.loadResources();
			}
			this.actionBar.loadActionsFromRegistry(this._registry);
			modal.updateLoadingProgress('Actions: Done');
				
			if(this.guiLoaded) {
				this.refreshTemplateParts();
				this.refreshGuiComponentConfigs();
			} else {
				document.observe("app:gui_loaded", function(){
					this.refreshTemplateParts();
					this.refreshGuiComponentConfigs();
				}.bind(this));
			}
		this.loadActiveRepository();
		}else if(doc.nodeName == "registry_part"){
			this.refreshXmlRegistryPart(doc);
		}
	},
	/**
	 * Inserts a document fragment retrieved from server inside the full tree.
	 * The node must contains the xPath attribute to locate it inside the registry.
	 * Event app:registry_part_loaded is triggerd once this is done.
	 * @param documentElement DOMNode
	 */
	refreshXmlRegistryPart : function(documentElement){
		var xPath = documentElement.getAttribute("xPath");
		var existingNode = XPathSelectSingleNode(this._registry, xPath);
		if(existingNode && existingNode.parentNode){
			var parentNode = existingNode.parentNode;
			parentNode.removeChild(existingNode);
			if(documentElement.firstChild){
				parentNode.appendChild(documentElement.firstChild.cloneNode(true));
			}
		}else if(xPath.indexOf("/") > -1){
			// try selecting parentNode
			var parentPath = xPath.substring(0, xPath.lastIndexOf("/"));
			var parentNode = XPathSelectSingleNode(this._registry, parentPath);
			if(parentNode && documentElement.firstChild){
				//parentNode.ownerDocument.importNode(documentElement.firstChild);
				parentNode.appendChild(documentElement.firstChild.cloneNode(true));
			}			
		}else{
			if(documentElement.firstChild) this._registry.appendChild(documentElement.firstChild.cloneNode(true));
		}
		document.fire("app:registry_part_loaded", xPath);		
	},
	
	initWidgets : function(compRegistry){
			var lastInst;
			if(compRegistry.length){
					for(var i=compRegistry.length;i>0;i--){
							var el = compRegistry[i-1];
							var ajxpId = el.ajxpId;
							compRegistry[i-1] = new el['ajxpClass'](el.ajxpNode, el.ajxpOptions);
							window[ajxpId] = compRegistry[i-1];
							lastInst = compRegistry[i-1];
					}
					if(lastInst){
							lastInst.resize();
					}
					for(var j=0;j<compRegistry.length;j++){
							var obj = compRegistry[j];
							if(Class.objectImplements(obj, "IFocusable")){
									obj.setFocusBehaviour();
									this._focusables.push(obj);
							}
							if(Class.objectImplements(obj, "IContextMenuable")){
									obj.setContextualMenu(this.contextMenu);
							}
							if(Class.objectImplements(obj, "IActionProvider")){
									if(!this.guiActions) this.guiActions = new Hash();
									this.guiActions.update(obj.getActions());
							}
					}
			}
	},

	/**
	 * populate guiCompRegistry with IWidget
	 * @param domNode
	 */
	buildGUI : function(domNode, compRegistry){
		if(domNode.nodeType != 1) return;
		if(!this.guiCompRegistry) this.guiCompRegistry = $A([]);
        if(!compRegistry){
            compRegistry = this.guiCompRegistry;
        }
		domNode = $(domNode);
		var ajxpClassName = domNode.readAttribute("ajxpClass") || "";
		var ajxpClass = Class.getByName(ajxpClassName);
		var ajxpId = domNode.readAttribute("id") || "";
		var ajxpOptions = {};
		if(domNode.readAttribute("ajxpOptions")){
            try{
                ajxpOptions = domNode.readAttribute("ajxpOptions").evalJSON();
            }catch(e){
                alert("Error while parsing JSON for GUI template part " + ajxpId + "!");
            }
		}
		if(ajxpClass && ajxpId && Class.objectImplements(ajxpClass, "IWidget")){
			compRegistry.push({ajxpId: ajxpId, ajxpNode: domNode, ajxpClass: ajxpClass, ajxpOptions: ajxpOptions});
		}		
		$A(domNode.childNodes).each(function(node){
			this.buildGUI(node, compRegistry);
		}.bind(this) );
	},
	
	/**
	 * Parses a client_configs/template_part node
	 */
	refreshTemplateParts : function(){
		var parts = XPathSelectNodes(this._registry, "client_configs/template_part");
		var toUpdate = {};
		if(!this.templatePartsToRestore){
			this.templatePartsToRestore = $A();
		}
		for(var i=0;i<parts.length;i++){
            if(parts[i].getAttribute("theme") && parts[i].getAttribute("theme") != bootstrap.parameters.get("theme")){
                continue;
            }
			var ajxpId = parts[i].getAttribute("ajxpId");
			var ajxpClassName = parts[i].getAttribute("ajxpClass");
			var ajxpOptionsString = parts[i].getAttribute("ajxpOptions");
            var cdataContent = "";
            if(parts[i].firstChild && parts[i].firstChild.nodeType == 4 && parts[i].firstChild.nodeValue != ""){
                cdataContent = parts[i].firstChild.nodeValue;
            }
			
			var ajxpClass = Class.getByName(ajxpClassName);
			if(ajxpClass && ajxpId && Class.objectImplements(ajxpClass, "IWidget")){				
				toUpdate[ajxpId] = [ajxpClass, ajxpClassName, ajxpOptionsString, cdataContent];
				this.templatePartsToRestore = this.templatePartsToRestore.without(ajxpId);
			}
		}
        var futurePartsToRestore = $A(Object.keys(toUpdate));
		this.templatePartsToRestore.each(function(key){
			var part = this.findOriginalTemplatePart(key);
            if(part){
                var ajxpClassName = part.getAttribute("ajxpClass");
                var ajxpOptionsString = part.getAttribute("ajxpOptions");
                var cdataContent = part.innerHTML;
                var ajxpClass = Class.getByName(ajxpClassName);
                toUpdate[key] = [ajxpClass, ajxpClassName, ajxpOptionsString, cdataContent];
            }
		}.bind(this));
		
		for(var id in toUpdate){
			this.refreshGuiComponent(id, toUpdate[id][0], toUpdate[id][1], toUpdate[id][2], toUpdate[id][3]);
		}
		this.templatePartsToRestore = futurePartsToRestore;
	},
	
	/**
	 * Applies a template_part by removing existing components at this location
	 * and recreating new ones.
	 * @param ajxpId String The id of the DOM anchor
	 * @param ajxpClass IWidget A widget class
	 * @param ajxpOptions Object A set of options that may have been decoded from json.
	 */
	refreshGuiComponent : function(ajxpId, ajxpClass, ajxpClassName, ajxpOptionsString, cdataContent){
		if(!window[ajxpId]) return;
		// First destroy current component, unregister actions, etc.			
		var oldObj = window[ajxpId];
		if(oldObj.__className == ajxpClassName && oldObj.__ajxpOptionsString == ajxpOptionsString){
			return;
		}
		var ajxpOptions = {};
		if(ajxpOptionsString){
			ajxpOptions = ajxpOptionsString.evalJSON();			
		}
		if(Class.objectImplements(oldObj, "IFocusable")){
			this._focusables = this._focusables.without(oldObj);
		}
		if(Class.objectImplements(oldObj, "IActionProvider")){
			oldObj.getActions().each(function(act){
				this.guiActions.unset(act.key);// = this.guiActions.without(act);
			}.bind(this) );
		}
		if(oldObj.htmlElement) var anchor = oldObj.htmlElement;
		oldObj.destroy();

        if(cdataContent && anchor){
            anchor.insert(cdataContent);
            var compReg = $A();
            $A(anchor.children).each(function(el){
                this.buildGUI(el, compReg);
            }.bind(this));
            if(compReg.length) this.initWidgets(compReg);
        }
		var obj = new ajxpClass($(ajxpId), ajxpOptions);
		if(Class.objectImplements(obj, "IFocusable")){
			obj.setFocusBehaviour();
			this._focusables.push(obj);
		}
		if(Class.objectImplements(obj, "IContextMenuable")){
			obj.setContextualMenu(this.contextMenu);
		}
		if(Class.objectImplements(obj, "IActionProvider")){
			if(!this.guiActions) this.guiActions = new Hash();
			this.guiActions.update(obj.getActions());
		}

		obj.__ajxpOptionsString = ajxpOptionsString;
		
		window[ajxpId] = obj;
		obj.resize();
		delete(oldObj);
	},
	
	/**
	 * Spreads a client_configs/component_config to all gui components.
	 * It will be the mission of each component to check whether its for him or not.
	 */
	refreshGuiComponentConfigs : function(){
        this._guiComponentsConfigs = $H();
		var nodes = XPathSelectNodes(this._registry, "client_configs/component_config");
		if(!nodes.length) return;
		for(var i=0;i<nodes.length;i++){
			this.setGuiComponentConfig(nodes[i]);
		}
	},
	
	/**
	 * Apply the componentConfig to the Object of a node
	 * @param domNode IWidget
	 */
	setGuiComponentConfig : function(domNode){
		var className = domNode.getAttribute("className");
		var classId = domNode.getAttribute("classId") || null;
		var classConfig = new Hash();
		if(classId){
			classConfig.set(classId, domNode);
		}else{
			classConfig.set('all', domNode);
		}
        var cumul = this._guiComponentsConfigs.get(className);
        if(!cumul) cumul = $A();
		cumul.push(classConfig);
        this._guiComponentsConfigs.set(className, cumul);
		document.fire("app:component_config_changed", {className: className, classConfig: classConfig});
	},

    getGuiComponentConfigs : function(className){
        return this._guiComponentsConfigs.get(className);
    },

	/**
	 * Try reading the cookie and sending it to the server
	 */
	tryLogUserFromCookie : function(){
		var connexion = new Connexion();
		var rememberData = retrieveRememberData();
		if(rememberData!=null){
			connexion.addParameter('get_action', 'login');
			connexion.addParameter('userid', rememberData.user);
			connexion.addParameter('password', rememberData.pass);
			connexion.addParameter('cookie_login', 'true');
			connexion.onComplete = function(transport){
                hideLightBox();
                this.actionBar.parseXmlMessage(transport.responseXML);
            }.bind(this);
			connexion.sendSync();
		}
	},
			
	/**
	 * Translate the XML answer to a new User object
	 * @param documentElement DOMNode The user fragment
	 * @param skipEvent Boolean Whether to skip the sending of app:user_logged event.
	 */
	logXmlUser: function(documentElement, skipEvent){
		this.user = null;
		var userNode = XPathSelectSingleNode(documentElement, "user");
		if(userNode){
			var userId = userNode.getAttribute('id');
			var children = userNode.childNodes;
			if(userId){ 
				this.user = new User(userId, children);
			}
		}
		if(!skipEvent){
			document.fire("app:user_logged", this.user);
		}
	},
		
	
	/**
	 * Find the current repository (from the current user) and load it. 
	 */
	loadActiveRepository : function(){
		var repositoryObject = new Repository(null);
		if(this.user != null)
		{
			var repId = this.user.getActiveRepository();
			var repList = this.user.getRepositoriesList();			
			repositoryObject = repList.get(repId);
			if(!repositoryObject){
				alert("No active repository found for user!");
			}
			if(this.user.getPreference("pending_folder") && this.user.getPreference("pending_folder") != "-1"){
				this._initLoadRep = this.user.getPreference("pending_folder");
				this.user.setPreference("pending_folder", "-1");
				this.user.savePreference("pending_folder");
			}else if(this.user.getPreference("ls_history", true)){
				var data = new Hash(this.user.getPreference("ls_history", true));
				this._initLoadRep = data.get(repId);
			}
		}
		this.loadRepository(repositoryObject);		
		if(repList && repId){
			document.fire("app:repository_list_refreshed", {list: repList,active: repId});
		}else{
			document.fire("app:repository_list_refreshed", {list: false,active: false});
		}		
	},
	
	/**
	 * Refresh the repositories list for the current user
	 */
	reloadRepositoriesList : function(){
		if(!this.user) return;
		document.observeOnce("app:registry_part_loaded", function(event){
			if(event.memo != "user/repositories") return;
			this.logXmlUser(this._registry, true);
			repId = this.user.getActiveRepository();
			repList = this.user.getRepositoriesList();
			document.fire("app:repository_list_refreshed", {list: repList,active: repId});			
		}.bind(this));
		this.loadXmlRegistry(false, "user/repositories");
	},
	
	/**
	 * Load a Repository instance
	 * @param repository Repository
	 */
	loadRepository: function(repository){
		
		if(this.repositoryId != null && this.repositoryId == repository.getId()){
			return;
		}
		
		repository.loadResources();
		var repositoryId = repository.getId();		
		var	newIcon = repository.getIcon(); 
				
		this.skipLsHistory = true;
		
		var providerDef = repository.getNodeProviderDef();
		if(providerDef != null){
			var provider = eval('new '+providerDef.name+'()');
			if(providerDef.options){
				provider.initProvider(providerDef.options);
			}
			this._contextHolder.setNodeProvider(provider);
			var rootNode = new Node("/", false, repository.getLabel(), newIcon, provider);
		}else{
			var rootNode = new Node("/", false, repository.getLabel(), newIcon);
			// Default
			this._contextHolder.setNodeProvider(new RemoteNodeProvider());
		}
		this._contextHolder.setRootNode(rootNode);
		this.repositoryId = repositoryId;
		
		/*
		if(this._initObj) { 
			rootNode.load();
			this._initObj = null ;
		}
		*/
		
		if(this._initLoadRep){
			if(this._initLoadRep != "" && this._initLoadRep != "/"){
				var copy = this._initLoadRep.valueOf();
				this._initLoadRep = null;
				rootNode.observeOnce("first_load", function(){
						setTimeout(function(){
							if(this.pathExists(copy)){
								this.goTo(new Node(copy));
							}
							this.skipLsHistory = false;
						}.bind(this), 1000);
				}.bind(this));
			}else{
				this.skipLsHistory = false;
			}
		}else{
			this.skipLsHistory = false;
		}
		
		rootNode.load();
	},

	/**
	 * Check whether a path exists by using the "stat" action.
	 * THIS SHOULD BE DELEGATED TO THE NODEPROVIDER.
	 * @param dirName String The path to check
	 * @returns Boolean
	 */
	pathExists : function(dirName){
		var connexion = new Connexion();
		connexion.addParameter("get_action", "stat");
		connexion.addParameter("file", dirName);
		this.tmpResTest = false;
		connexion.onComplete = function(transport){
			if(transport.responseJSON && transport.responseJSON.mode) this.tmpResTest = true;
		}.bind(this);
		connexion.sendSync();		
		return this.tmpResTest;
	},
	
	/**
	 * Require a context change to the given path
	 * @param nodeOrPath Node|String A node or a path
	 */
	goTo: function(nodeOrPath){		
		if(Object.isString(nodeOrPath)){
			node = new Node(nodeOrPath);
		}else{
			node = nodeOrPath;
		}
		this._contextHolder.requireContextChange(node);
	},
	
	/**
	 * Change the repository of the current user and reload list and current.
	 * @param repositoryId String Id of the new repository
	 */
	triggerRepositoryChange: function(repositoryId){		
		document.fire("app:trigger_repository_switch");
		var connexion = new Connexion();
		connexion.addParameter('get_action', 'switch_repository');
		connexion.addParameter('repository_id', repositoryId);
		oThis = this;
		connexion.onComplete = function(transport){
			this.repositoryId = null;
			this.loadXmlRegistry();
		}.bind(this);
		var root = this._contextHolder.getRootNode();
		if(root){
			this.skipLsHistory = true;
			root.clear();			
		}
		connexion.sendAsync();
	},

	/**
	 * Find Extension initialisation nodes (activeCondition, onInit, etc), parses 
	 * the XML and execute JS. 
	 * @param xmlNode DOMNode The extension node
	 * @param extensionDefinition Object Information already collected about this extension
	 * @returns Boolean
	 */
	initExtension : function(xmlNode, extensionDefinition){
		var activeCondition = XPathSelectSingleNode(xmlNode, 'processing/activeCondition');
		if(activeCondition && activeCondition.firstChild){
			try{
				var func = new Function(activeCondition.firstChild.nodeValue.strip());
				if(func() === false) return false;
			}catch(e){}
		}
		if(xmlNode.nodeName == 'editor'){
			Object.extend(extensionDefinition, {
				openable : !!(xmlNode.getAttribute("openable") == "true"),
				previewProvider: !!(xmlNode.getAttribute("previewProvider")=="true"),
				order: (xmlNode.getAttribute("order") ? parseInt(xmlNode.getAttribute("order")) : 0),
				formId: xmlNode.getAttribute("formId") || null,				
				text: MessageHash[xmlNode.getAttribute("text")],
				title: MessageHash[xmlNode.getAttribute("title")],
				icon: xmlNode.getAttribute("icon"),
				editorClass: xmlNode.getAttribute("className"),
				mimes: $A(xmlNode.getAttribute("mimes").split(",")),
				write: !!(xmlNode.getAttribute("write") && xmlNode.getAttribute("write") == "true")
			});
		}else if(xmlNode.nodeName == 'uploader'){
			var clientForm = XPathSelectSingleNode(xmlNode, 'processing/clientForm');
			if(clientForm && clientForm.firstChild && clientForm.getAttribute('id'))
			{
				extensionDefinition.formId = clientForm.getAttribute('id');
				if(!$('all_forms').select('[id="'+clientForm.getAttribute('id')+'"]').length){
					$('all_forms').insert(clientForm.firstChild.nodeValue);
				}
			}
			var extensionOnInit = XPathSelectSingleNode(xmlNode, 'processing/extensionOnInit');
			if(extensionOnInit && extensionOnInit.firstChild){
				try{eval(extensionOnInit.firstChild.nodeValue);}catch(e){}
			}
			var dialogOnOpen = XPathSelectSingleNode(xmlNode, 'processing/dialogOnOpen');
			if(dialogOnOpen && dialogOnOpen.firstChild){
				extensionDefinition.dialogOnOpen = dialogOnOpen.firstChild.nodeValue;
			}
			var dialogOnComplete = XPathSelectSingleNode(xmlNode, 'processing/dialogOnComplete');
			if(dialogOnComplete && dialogOnComplete.firstChild){
				extensionDefinition.dialogOnComplete = dialogOnComplete.firstChild.nodeValue;
			}
		}
		return true;
	},
	
	/**
	 * Refresh the currently active extensions
	 * Extensions are editors and uploaders for the moment.
	 */
	refreshExtensionsRegistry : function(){
		this._extensionsRegistry = {"editor": $A([]), "uploader": $A([])};
		var extensions = _.extend(this._registry.editors, this._registry.uploaders);
		//TODO set new ResourcesManager for every extension OR use Singleton?

		//for(var i=0;i<extensions.length;i++){
			//var extensionDefinition = {
				//id : extensions[i].getAttribute("id"),
				//xmlNode : extensions[i],
				//resourcesManager : new ResourcesManager()				
			//};
			//this._resourcesRegistry[extensionDefinition.id] = extensionDefinition.resourcesManager;
            //var resourceNodes = XPathSelectNodes(extensions[i], "client_settings/resources|dependencies|clientForm");
			//for(var j=0;j<resourceNodes.length;j++){
				//var child = resourceNodes[j];
				//extensionDefinition.resourcesManager.loadFromXmlNode(child);
			//}
			//if(this.initExtension(extensions[i], extensionDefinition)){
				//this._extensionsRegistry[extensions[i].nodeName].push(extensionDefinition);
			//}
		//}
		//TODO need load resources
		//ResourcesManager.prototype.loadAutoLoadResources(this._registry);
	},
	
	getPluginConfigs : function(pluginQuery){
		var properties = XPathSelectNodes(this._registry, 'plugins/'+pluginQuery+'/plugin_configs/property | plugins/ajxpcore[@id="core.'+pluginQuery+'"]/plugin_configs/property');
		var configs = $H();
		for(var i = 0; i<properties.length; i++){
			var propNode = properties[i];
			configs.set(propNode.getAttribute("name"), propNode.firstChild.nodeValue.evalJSON());
		}
		return configs;
	},
	
	/**
	 * Find the currently active extensions by type
	 * @param extensionType String "editor" or "uploader"
	 * @returns $A()
	 */
	getActiveExtensionByType : function(extensionType){
		var exts = $A();
		return this._extensionsRegistry[extensionType];
	},
	
	/**
	 * Find a given editor by its id
	 * @param editorId String
	 * @returns View
	 */
	findEditorById : function(editorId){
		return this._extensionsRegistry.editor.detect(function(el){return(el.id == editorId);});
	},
	
	/**
	 * Find Editors that can handle a given mime type
	 * @param mime String
	 * @returns View[]
	 */
	findEditorsForMime : function(mime, restrictToPreviewProviders){
		var editors = $A([]);
		var checkWrite = false;
		if(this.user != null && !this.user.canWrite()){
			checkWrite = true;
		}
		this._extensionsRegistry.editor.each(function(el){
			if(el.mimes.include(mime) || el.mimes.include('*')) {
				if(restrictToPreviewProviders && !el.previewProvider) return;
				if(!checkWrite || !el.write) editors.push(el);
			}
		});
		if(editors.length && editors.length > 1){
			editors = editors.sortBy(function(ed){
				return ed.order||0;
			});
		}
		return editors;
	},
	
	/**
	 * Trigger the load method of the resourcesManager.
	 * @param resourcesManager ResourcesManager
	 */
	loadEditorResources : function(resourcesManager){
		var registry = this._resourcesRegistry;
		resourcesManager.load(registry);
	},
	
	/**
	 * Inserts the main template in the GUI.
	 * TODO handle passedTarget
	 */
	applyTemplates : function(passedTarget){
		if(!this._registry) return;
		var theme = this.ui.theme;
		var target = $(this.element);
		var obj = {}; obj['top'] = theme.html;
		target.insert(obj);
		obj['top'].evalScripts();
		modal.updateLoadingProgress('Applied theme: ' + theme.name);	
	},
		
	findOriginalTemplatePart : function(ajxpId){
		var tmpElement = new Element("div", {style: "display:none;"});
		$$("body")[0].insert(tmpElement);
		this.initTemplates(tmpElement);
		var tPart = tmpElement.down('[id="'+ajxpId+'"]');
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
     * Reload all messages from server and trigger updateI18nTags
     * @param newLanguage String
     */
	loadI18NMessages: function(newLanguage){
		var connexion = new Connexion();
		connexion.addParameter('get_action', 'get_i18n_messages');
		connexion.addParameter('lang', newLanguage);
		connexion.onComplete = function(transport){
			if(transport.responseText){
				var result = transport.responseText.evalScripts();
				MessageHash = result[0];
				for(var key in MessageHash){
					MessageHash[key] = MessageHash[key].replace("\\n", "\n");
				}
				this.updateI18nTags();
				if(this.guiActions){
					this.guiActions.each(function(pair){
						pair.value.refreshFromI18NHash();
					});
				}
				this.loadXmlRegistry();
				this.fireContextRefresh();
				this.currentLanguage = newLanguage;
			}
		}.bind(this);
		connexion.sendSync();
	},
	
	/**
	 * Search all ajxp_message_id tags and update their value
	 */
	updateI18nTags: function(){
		var messageTags = $$('[ajxp_message_id]');		
		messageTags.each(function(tag){	
			var messageId = tag.getAttribute("ajxp_message_id");
			try{
				tag.update(MessageHash[messageId]);
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
		var connexion = new Connexion();
		connexion.addParameter("get_action", "get_seed");
		connexion.onComplete = function(transport){
			if(transport.responseJSON){
				seedInputField.value = transport.responseJSON.seed;
				var src = window.serverAccessPath + '&get_action=get_captcha&sid='+Math.random();
				var refreshSrc = ajxpResourcesFolder + '/images/actions/16/reload.png';
				if(existingCaptcha){
					existingCaptcha.src = src;
				}else{
					var insert = {};
					var string = '<div class="main_captcha_div" style="padding-top: 4px;"><div class="dialogLegend" ajxp_message_id="389">'+MessageHash[389]+'</div>';
					string += '<div class="captcha_container"><img id="captcha_image" align="top" src="'+src+'" width="170" height="80"><img align="top" style="cursor:pointer;" id="captcha_refresh" src="'+refreshSrc+'" with="16" height="16"></div>';
					string += '<div class="SF_element">';
					string += '		<div class="SF_label" ajxp_message_id="390">'+MessageHash[390]+'</div> <div class="SF_input"><input type="text" class="dialogFocus dialogEnterKey" style="width: 100px; padding: 0px;" name="captcha_code"></div>';
					string += '</div>';
					string += '<div style="clear:left; margin-bottom:7px;"></div></div>';
					insert[captchaPosition] = string;
					captchaAnchor.insert(insert);
					modal.refreshDialogPosition();
					modal.refreshDialogAppearance();
					$('captcha_refresh').observe('click', function(){
						$('captcha_image').src = window.serverAccessPath + '&get_action=get_captcha&sid='+Math.random();
					});
				}
			}else{
				seedInputField.value = transport.responseText;
				if(existingCaptcha){
					existingCaptcha.up('.main_captcha_div').remove();
					modal.refreshDialogPosition();
					modal.refreshDialogAppearance();
				}
			}
		};
		connexion.sendSync();		
	},

	_setHistory : function(){
		if(!Prototype.Browser.WebKit && !Prototype.Browser.IE){
			this.history = new Proto.History(function(hash){
				this.goTo(this.historyHashToPath(hash));
			}.bind(this));
			document.observe("app:context_changed", function(event){
				this.updateHistory(this.getContextNode().getPath());
			}.bind(this));
		}else{
			document.observe("app:context_changed", function(event){
				var path = this.getContextNode().getPath();
				document.title = this.appTitle + ' - '+(getBaseName(path) ? getBaseName(path) : '/');
			}.bind(this));
		}
		document.observe("app:context_changed", function(event){
			if(this.skipLsHistory || !this.user || !this.user.getActiveRepository()) return;			
			window.setTimeout(function(){
				var data = this.user.getPreference("ls_history", true) || {};
				data = new Hash(data);
				data.set(this.user.getActiveRepository(), this.getContextNode().getPath());
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
		document.title = this.appTitle + ' - '+(getBaseName(path) ? getBaseName(path) : '/');
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
	 * @param ajxpContextNode Node optional
	 * @param ajxpSelectedNodes Node[]
	 * @param selectionSource String
	 */
	updateContextData : function(ajxpContextNode, ajxpSelectedNodes, selectionSource){
		if(ajxpContextNode){
			this._contextHolder.requireContextChange(ajxpContextNode);
		}
		if(ajxpSelectedNodes){
			this._contextHolder.setSelectedNodes(ajxpSelectedNodes, selectionSource);
		}
	},
	
	/**
	 * @returns DataModel
	 */
	getContextHolder : function(){
		return this._contextHolder;
	},
	
	/**
	 * @returns Node
	 */
	getContextNode : function(){
		return this._contextHolder.getContextNode() || new Node("");
	},
	
	/**
	 * @returns DataModel
	 */
	getUserSelection : function(){
		return this._contextHolder;
	},		
	
	/**
	 * Accessor for datamodel.requireContextChange()
	 */
	fireContextRefresh : function(){
		this.getContextHolder().requireContextChange(this.getContextNode(), true);
	},
	
	/**
	 * Accessor for datamodel.requireContextChange()
	 */
	fireNodeRefresh : function(nodePathOrNode){
		this.getContextHolder().requireNodeReload(nodePathOrNode);
	},
	
	/**
	 * Accessor for datamodel.requireContextChange()
	 */
	fireContextUp : function(){
		if(this.getContextNode().isRoot()) return;
		this.updateContextData(this.getContextNode().getParent());
	},
	
	/**
	 * @returns DOMDocument
	 */
	getXmlRegistry : function(){
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
	 * Unblocks all access keys
	 */	
	getActionBar: function(){
		return this.actionBar;
	},
	
	/**
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
		modal.displayMessage(messageType, message);
	},
	
	/**
	 * Focuses on a given widget
	 * @param object IFocusable
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
	 * Find last focused IFocusable and focus it!
	 */
	focusLast : function(){
		if(this._lastFocused) this.focusOn(this._lastFocused);
	},
	
	/**
	 * Create a Tab navigation between registerd IFocusable
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
		this.contextMenu = new Proto.Menu({
			resourcesFolder: this.parameters.get('ui').theme.path,
		  selector: '', // context menu will be shown when element with class name of "contextmenu" is clicked
		  className: 'menu desktop', // this is a class which will be attached to menu container (used for css styling)
		  menuItems: [],
		  fade: true,
		  zIndex: 2000
		});
		var protoMenu = this.contextMenu;		
		protoMenu.options.beforeShow = function(e){
			this.options.lastElement = Event.element(e);
			this.options.menuItems = app.actionBar.getContextActions(Event.element(e));
			this.refreshList();
		}.bind(protoMenu);
		protoMenu.options.beforeHide = function(e){
			this.options.lastElement = null;
		}.bind(protoMenu);
		document.observe("app:actions_refreshed", function(){
			if(this.options.lastElement){
				this.options.menuItems = app.actionBar.getContextActions(this.options.lastElement);
				this.refreshList();
			}			
		}.bind(protoMenu));
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