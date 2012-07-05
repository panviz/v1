/**
 * Show/Edit Item in embedded window
 */
Class.create("View", Pane, {
	
	__implements : ["Focusable", "ContextMenuable"],

    __allObservers : $A(),
	/**
	 * @var Hash The default actions, initialized with fs, nofs and close
	 */
	defaultActions : new Hash(),
	/**
	 * @var String
	 */
	toolbarSeparator : '<div class="separator"></div>',
	//@var Boolean Current state of the editor
	fullScreenMode : false,
	 //@var Hash For the moment supported options are "fullscreen", "closable", "floatingToolbar".
	editorOptions: null, 
	
	/**
	 * Constructor
	 * @param $super klass Reference to the constructor
	 * @param oElement HTMLElement
	 */
	initialize: function($super, oElement, p)
	{
		debugger
		$super($(oElement), p);
		this.element = oElement;
		//TODO create title div
		this.title = this.element.select(".title")[0];
		//TODO create content div
		this.content = this.element.select(".content")[0];
		this.currentForm;
		this.cachedForms = new Hash();
		this.iframeIndex = 0;	
		this.editorOptions = Object.extend({
			maximizable: true, 
			closable: true, 
			floatingToolbar: false
		}, p || { });		
		this.FSTitle = "FS mode";
		this.originalWindowTitle;
		if(p){
			var formId = p.formId;
			this.mime = p.mime;
			this.prepareHeader(p.text, resolveImageSource(p.icon, '/image/action/ICON_SIZE', 16));
		}
		this.defaultActions = new Hash({
			'fs': '<a id="fsButton"><img src="'+THEME.path+'/image/action/22/window_fullscreen.png"  width="22" height="22" alt="" border="0"><br><span message_id="235"></span></a>',
			'nofs': '<a id="nofsButton" style="display:none;"><img src="'+THEME.path+'/image/action/22/window_nofullscreen.png"  width="22" height="22" alt="" border="0"><br><span message_id="236"></span></a>',
			'close': '<a id="closeButton"><img src="'+THEME.path+'/image/action/22/fileclose.png"  width="22" height="22" alt="" border="0"><br><span message_id="86"></span></a>'
		});
        if(this.editorOptions.actions){
            this.defaultActions = $H(Object.extend(this.defaultActions._object, this.editorOptions.actions));
        }
		this._initGUI(formId);
		this.initActions();

		//var loadingObs = this.setOnLoad.bind(this);
		this._registerObserver(document, "app:context_changed", this._onContextChanged);
		//this._registerObserver(document, "app:context_loading", loadingObs);
		//this._registerObserver(document, "app:component_config_changed", _onComponentConfig);
		//this._registerObserver(document, "app:selection_changed", _onSelectionChanged);

		this.allDraggables = new Array();
		this.allDroppables = new Array();		
		
		//var repoSwitchObserver = this.setOnLoad.bind(this);
		//this._registerObserver(document, "app:trigger_repository_switch", repoSwitchObserver);
	},
	/**
	 * Initialize standards editor actions
	 */
	initActions : function(){
		this.actions = new Hash();
		this.registeredActions = new Hash();
		var actionBarSel = this.element.select('.action_bar');		
		if(!actionBarSel.length){
			this.actionBar = new Element('div', {className: 'action_bar'});
			this.element.insert({top: this.actionBar});
		}else{
			this.actionBar = actionBarSel[0];
		}
        this.actionBar.addClassName('editor_action_bar');
		if(!this.editorOptions.maximizable){
			this.defaultActions.unset("fs");
			this.defaultActions.unset("nofs");
		}
		this.actionBar.insert({top: this.toolbarSeparator});	
		this.actionBar.insert({bottom: this.toolbarSeparator});
		this.actionBar.insert({bottom: this.defaultActions.values().join('\n')});
		this.actionBar.select('a').each(function(link){
			link.onclick = function(){return false;};
			link.href = "#";
            link.select("br").invoke("remove");
            link.select("img").invoke("addClassName", "actionbar_button_icon");
            link.select("span").invoke("addClassName", "actionbar_button_label");
			var span = link.select('span[message_id]')[0];
            var title = I18N[span.readAttribute("message_id")];
			if(span) span.update(title);
			this.actions.set(link.id, link);
			if(link.getAttribute('access_key')){
				var aK = link.getAttribute('access_key');
				if(Event[aK]) aK = Event[aK];
				this.registeredActions.set(aK, link.id);
                if(!(!isNaN(parseFloat(aK)) && isFinite(aK))) title += " (" + aK + ")";
			}
            link.setAttribute("title", title);
		}, this);
		if(this.registeredActions.size()){
			this.keyObs = function(e){
                if(app.blockEditorShortcuts) return;
				if(this.registeredActions.get(e.keyCode)){
					this.actions.get(this.registeredActions.get(e.keyCode)).onclick();
				}else if(this.registeredActions.get(String.fromCharCode(e.keyCode).toLowerCase())){
					this.actions.get(this.registeredActions.get(String.fromCharCode(e.keyCode).toLowerCase())).onclick();
				}
			}.bind(this);
			Event.observe(document, "keydown", this.keyObs);
			this.element.observe("view:close", function(){
				Event.stopObserving(document, "keydown", this.keyObs);
			}.bind(this));
		}
		
		if(this.actions.get("closeButton")){
			this.actions.get("closeButton").observe("click", function(){
				hideLightBox(true);
			}.bind(this) );
			if(window.ajxpMobile){
				// Make sure "Close" is the first.
				this.actionBar.insert({top: this.actions.get("closeButton")});
			}
		}
		if(this.actions.get("fsButton")){
			this.actions.get("fsButton").observe("click", this.setFullScreen.bind(this));
			this.actions.get("nofsButton").observe("click", this.exitFullScreen.bind(this));
			this.actions.get("fsButton").show();
			this.actions.get("nofsButton").hide();
		}
		
		if(this.editorOptions.floatingToolbar){
			this.makeToolbarFloatable();
		}

        if(this.editorOptions.toolbarStyle){
            this.actionBar.addClassName(this.editorOptions.toolbarStyle);
        }
		
		attachMobileScroll(this.actionBar, "horizontal");
	},
	/**
	 * Creates the base GUI
	 */
	_initGUI : function(sFormId, fOnLoad, fOnComplete, fOnCancel, bOkButtonOnly, skipButtons)
	{
		this.createTitleSpans();
		var newForm;
		if($(sFormId).tagName == 'FORM') // WE PASSED A PREFETCHED HIDDEN FORM
		{
			newForm = $(sFormId);
			newForm.show();
		}
		else
		{
			var formDiv = $(sFormId);
			//var formDiv = $('all_forms').select('[id="'+sFormId+'"]')[0];	
			var newForm = document.createElement('form');
			newForm.id = 'action_form';
			newForm.setAttribute('name','action_form');
			newForm.setAttribute('action', 'cont.php');
			newForm.appendChild(formDiv.cloneNode(true));
			var reloadIFrame = null;
			if($(newForm).getElementsByTagName("iframe")[0])
			{
				reloadIFrame = $(newForm).getElementsByTagName("iframe")[0];
				reloadIFrameSrc = $(newForm).getElementsByTagName("iframe")[0].getAttribute("src");
			}
			if(formDiv.getAttribute('action'))
			{
				var actionField = document.createElement('input');
				actionField.setAttribute('type', 'hidden'); 
				actionField.setAttribute('name', 'get_action'); 
				actionField.setAttribute('value', formDiv.getAttribute('action'));
				newForm.appendChild(actionField);
			}		
		}
		//if(!this.cachedForms.get(sFormId) && !skipButtons){
			//this.addSubmitCancel(newForm, fOnCancel, bOkButtonOnly);
		//}
		this.content.appendChild(newForm);
		var boxPadding = $(sFormId).getAttribute("box_padding");
		if(!boxPadding) boxPadding = 10;
		this.content.setStyle({padding: boxPadding+'px'});
		
		//if(fOnCancel){
			//this.title.select('#$modal.loseBtn')[0].observe("click", function(){fOnCancel(modal.getForm());hideLightBox();});
		//}
		//else{
			//this.title.select('#$modal.loseBtn')[0].observe("click", function(){hideLightBox();});
		//}			
		
		if(fOnComplete)	{
			newForm.onsubmit = function(){
				try{
					fOnComplete($modal.getForm());
				}catch(e){
					alert('Unexpected Error : please report!\n'+e);				
				}
				return false;
			};
		}
		else {
			newForm.onsubmit = function(){
				app.actionBar.submitForm($modal.getForm());
				return false;
			};
		}
		if($(newForm).select(".dialogFocus").length)
		{
			objToFocus = $(newForm).select(".dialogFocus")[0];
			setTimeout('objToFocus.focus()', 500);
		}
		if($(newForm).select(".replace_rep").length)
		{
			repDisplay = $(newForm).select(".replace_rep")[0];
			repDisplay.innerHTML = app.getContextHolder().getContextNode().getPath();
		}
		if($(newForm).select(".replace_file").length)
		{
			repDisplay = $(newForm).select(".replace_file")[0];
			repDisplay.innerHTML = getBaseName(app.getUserSelection().getUniqueFileName());
		}
		if($(newForm).select('.dialogEnterKey').length && Prototype.Browser.IE){
			$(newForm).select('.dialogEnterKey').each(function(el){
				if(el.enterObserver) return;
				el.observe("keypress", function(event){
					if(event.keyCode == Event.KEY_RETURN){
						newForm.onsubmit();						
					}
				});
				el.enterObserver = true;
			});
		}
		this.currentForm = newForm;
		if(fOnLoad != null)
		{
			fOnLoad(this.currentForm);
			// Reload shadow if the content has changed after the fOnLoad call
			//this.refreshDialogAppearance();
		}
		// SAFARI => FORCE IFRAME RELOADING
		//if(Prototype.Browser.WebKit && reloadIFrame && reloadIFrameSrc) reloadIFrame.src = reloadIFrameSrc;
	},
    _registerObserver : function(object, eventName, handler){
        Event.observe(object, eventName, handler.bind(this));
        this.__allObservers.push({
            object: object,
            event: eventName,
            handler: handler});
    },
    _clearObservers : function(){
        this.__allObservers.each(function(el){
            Event.stopObserving(el.object, el.event, el.handler);
        });
        if(this.observer){
            this.stopObserving("resize", this.observer);
        }
        if(this.scrollSizeObserver){
            this.stopObserving("resize", this.scrollSizeObserver);
        }
    },
	//this._onSselectionChanged = function(event){
		//if(event.memo._selectionSource == null || event.memo._selectionSource == this) return;
		//this.setSelectedNodes(app.getContextHolder().getSelectedNodes());
	//},
	_onContextChanged : function(event){
												debugger
		var onLoading = this.setOnLoad.bind(this);
		var onLoad = this.removeOnLoad.bind(this);
		var currentDir = app.getContextNode().getPath();
		if (currentDir != '/'){currentDir += "/"};
		var defaultFileName = currentDir + '.' + this.mime;
		var defaultFile = new Node(defaultFileName);
		//TODO add 3d parameter selectionSource
		//add default file to selection within current context
		app.updateContextData(null, [defaultFile]); 
		this.open(app.getUserSelection());		
	},
	/**
	 * Implementation of the Control methods
	 */
	getDomNode : function(){
		return this.element;
	},
	/**
	 * Implementation of the Control methods
	 */
	destroy : function(){
        this._clearObservers();
        if(window[this.element.id]){
            delete window[this.element.id];
        }
		this.element = null;
	},
	/**
	 * Resizes the widget
	 */
	resize : function(){
		if(this.options.fit && this.options.fit == 'height'){
			var marginBottom = 0;
			if(this.options.fitMarginBottom){
				var expr = this.options.fitMarginBottom;
				try{marginBottom = parseInt(eval(expr));}catch(e){}
			}
			fitHeightToBottom(this.element, (this.options.fitParent?$(this.options.fitParent): null), expr);
		}		
		if($('table_rows_container') && Prototype.Browser.IE && this.gridStyle == "file"){
			$('table_rows_container').setStyle({width: '100%'});
		}
		this.notify("resize");
	},
	/**
	 * Do nothing
	 * @param show Boolean
	 */
	showElement : function(show){
	},
	/**
	 * Link focusing to app main
	 */
	setFocusBehaviour : function(){
        //var clickObserver = function(){
			//if(app) app.focusOn(this);
		//}.bind(this) ;
        //this._registerObserver(this.element, "click", clickObserver);
	},
	/**
	 * Sets the contextual menu
	 * @param protoMenu Proto.Menu
	 */
	setContextualMenu : function(protoMenu){
		this.protoMenu = protoMenu;	
	},
	/**
	 * from FilesList
	 * Add a "loading" image on top of the component
	 */
	setOnLoad : function(){
		if(this.loading) return;
		addLightboxMarkupToElement(this.element);
		var img = new Element('img', {
			src: THEME.path+'/image/loadingImage.gif'
		});
		var overlay = this.element.down("#element_overlay");
		overlay.insert(img);
		img.setStyle({marginTop: Math.max(0, (overlay.getHeight() - img.getHeight())/2) + "px"});
		this.loading = true;
	},
	/**
	 * Remove the loading image
	 */
	removeOnLoad : function(){
		removeLightboxFromElement(this.element);
		this.loading = false;
	},
	/**
	 * Focus on this widget (focus input)
	 */
	focus : function(){
		if(this.element && this.element.visible()){
			//this._inputBox.activate();
			this.hasFocus = true;
		}
	},
	/**
	 * Blur this widget
	 */
	blur : function(){
		if(this._inputBox){
			//this._inputBox.blur();
		}
		this.hasFocus = false;
	},
	/**
	 * @param sTitle String Title of the view
	 * @param sIconSrc String Source icon
	 */
	prepareHeader : function(sTitle, sIconSrc){
		var hString = "<span class=\"titleString\">";
		if(sIconSrc != "") hString = "<span class=\"titleString\"><img src=\""+sIconSrc.replace('22', '16')+"\" width=\"16\" height=\"16\" align=\"top\"/>&nbsp;";
		hString += sTitle + '</span>';
		this.title.update(hString);
	},
	/**
	 * Updates the view title
	 * @param title String
	 */
	updateTitle : function(title){
		if(title != ""){
			title = " - " + title;
		}
		if(this.fullScreenMode){
			title = this.FSTitle;
		}
		$display.getView().setTitle(title);
	},
	/**
	 * Experimental : detach toolbar
	 */
	makeToolbarFloatable : function(){
        this.element.up("div.dialogContent").setStyle({position: 'relative'});
		this.actionBar.absolutize();
        var crtIndex = parseInt(this.element.getStyle("zIndex"));
        if(!crtIndex) crtIndex = 1000;
		this.actionBar.setStyle({
			zIndex: (crtIndex + 1000),
			width: '',
			top: ''
		});
        this.actionBar.addClassName("floatingBar");
		this.actionBar.down("div.separator").remove();
		this.actionBarPlacer = function(){
            var anchor = (this.floatingToolbarAnchor?this.floatingToolbarAnchor: this.contentMainContainer);
            if(!anchor) return;
            var w = this.actionBar.getWidth();
            var elW = anchor.getWidth();
            this.actionBar.setStyle({left: (Math.max(0,(elW-w)/2))+(anchor.positionedOffset().left)+'px'});
            this.actionBar.setStyle({top: (anchor.getHeight()-this.actionBar.getHeight() - 30 )+'px'});
		}.bind(this);
		this.element.observe("view:resize", this.actionBarPlacer);
		this.element.observe("view:close", function(){
			this.element.stopObserving("view:resize", this.actionBarPlacer);
		}.bind(this));
		window.setTimeout(this.actionBarPlacer, 100);
		new Draggable(this.actionBar);
	},
	
	/**
	 * Open note in new context
	 * @param userSelection Collection the data model
	 */
	open : function(userSelection){
		this.userSelection = userSelection;
		this.clearContent();
	},
	/**
	 * Change editor status
	 * @param isModified Boolean
	 */
	setModified : function(isModified){
		this.isModified = isModified;
		this.modifSpan.update((isModified ? "*" : ""));
		if(this.actions.get("saveButton")){
			if(isModified){
				this.actions.get("saveButton").removeClassName("disabled");
			}else{
				this.actions.get("saveButton").addClassName("disabled");
			}
		}
		if(this.fullScreenMode){
			this.refreshFullScreenTitle();
		}
		this.element.fire("view:modified", isModified);
	},
	/**
	 * Switch to fullscreen mode
	 */
	setFullScreen : function(){
		if(!this.contentMainContainer){
			this.contentMainContainer = this.element;
		}
		this.originalHeight = this.contentMainContainer.getHeight();	
		this.originalWindowTitle = document.title;
        this.element.fire("view:enterFS");

		this.element.absolutize();
		this.actionBar.setStyle({marginTop: 0});
		$(document.body).insert(this.element);
		this.element.setStyle({
			top: 0,
			left: 0,
			marginBottom: 0,
			backgroundColor: '#fff',
			width: parseInt(document.viewport.getWidth())+'px',
			height: parseInt(document.viewport.getHeight())+"px",
			zIndex: 3000});
		this.actions.get("fsButton").hide();
		this.actions.get("nofsButton").show();
		Event.observe(window, "resize", this._onFullScreen.bind(this));
		this.refreshFullScreenTitle();
		this.resize();
		this.fullScreenMode = true;
		this.element.fire("view:enterFSend");
	},
	_onFullScreen : function(){
		this.element.setStyle({height: parseInt(document.viewport.getHeight())+"px"});
		this.resize();		
	},
	/**
	 * Refreshes the title
	 */
	refreshFullScreenTitle : function(){
		document.title = "AjaXplorer - " + this.title.select('span.titleString')[0].replace("&nbsp;","");
	},
	/**
	 * View show exit fullscreen mode
	 */
	exitFullScreen : function(){
		if(!this.fullScreenMode) return;
		this.element.fire("view:exitFS");
		Event.stopObserving(window, "resize", this._onFullScreen.bind(this));
		//TODO find content of exact View (currently fullscreen)
		debugger
		var content = $$('.content')[0];
		content.setStyle({position: "relative"});
		content.insert(this.element);
		this.element.relativize();
		this.element.setStyle({position: "relative"});
		this.element.setStyle({top: 0,left: 0,
			width: parseInt(content.getWidth())+'px',
			height: parseInt(content.getHeight())+"px",
			zIndex: 100});
		this.resize(this.originalHeight);
		this.actions.get("fsButton").show();
		this.actions.get("nofsButton").hide();		
		document.title = this.originalWindowTitle;
		this.fullScreenMode = false;
		this.element.fire("view:exitFSend");
	},
	/**
	 * Resizes the main container
	 * @param size int|null
	 */
	resize : function(size){
		if(size){
			this.contentMainContainer.setStyle({height: size+"px"});
		}else{
			fitHeightToBottom(this.contentMainContainer, this.element);
		}
		this.element.fire("view:resize", size);
	},
	/**
	 * Closes the editor
	 * @returns Boolean
	 */
	close : function(){		
		if(this.fullScreenMode){
			this.exitFullScreen();
		}
		this.element.fire("view:close");
		return false;
	},
	
	/**
	 * from AbstractEditor
	 * Add a loading image to the given element
	 * @param element Element dom node
	 */
	//setOnLoad : function(element){	
		//addLightboxMarkupToElement(element);
		//var img = document.createElement("img");
		//img.src = THEME.path+"/image/loadingImage.gif";
		//$(element).select("#element_overlay")[0].appendChild(img);
		//this.loading = true;
	//},
	/**
	 * TODO move somewhere?
	 * Called by the other components to create a preview (thumbnail) of a given node
	 * @param item Node The node to display
	 * @param rich Boolean whether to display a rich content (flash, video, etc...) or not (image)
	 * @returns Element
	 */
	getPreview : function(item, rich){
		// Return icon if not overriden by derived classes
		src = AbstractEditor.prototype.getThumbnailSource(item);
		imgObject = new Element("img", {src: src, width: 64, height: 64, align: 'absmiddle', border: 0});
		imgObject.resizePreviewElement = function(dimensionObject){
			dimensionObject.maxWidth = dimensionObject.maxHeight = 64;
			var styleObject = fitRectangleToDimension({width: 64,height: 64},dimensionObject);
			if(dimensionObject.width >= 64){
				var newHeight = parseInt(styleObject.height);
				var mT = parseInt((dimensionObject.width - 64)/2) + dimensionObject.margin;
				var mB = dimensionObject.width+(dimensionObject.margin*2)-newHeight-mT-1;
				styleObject.marginTop = mT + "px"; 
				styleObject.marginBottom = mB + "px"; 
			}
			this.setStyle(styleObject);
		}.bind(imgObject);
		return imgObject;
	},
	
	/**
	 * TODO move somewhere?
	 * Gets the standard thumbnail source for previewing the node
	 * @param item Node
	 * @returns String
	 */
	getThumbnailSource : function(item){
		return resolveImageSource(item.getIcon(), "/image/mime/ICON_SIZE", 64);
	},
	/**
	 * Clear all content
	 * @param object HTMLElement The current form
	 */
	clearContent: function(){
		//TODO should delete only textarea, not entire form
		this.content.innerHtml = "";
	},
	/**
	 * Creates the title label depending on the "modified" status
	 */
	createTitleSpans : function(){
		var currentTitle = this.title.select('span.titleString')[0];
		this.filenameSpan = new Element("span", {className: "filenameSpan"});
		currentTitle.insert({bottom: this.filenameSpan});
		
		this.modifSpan = new Element("span", {className: "modifiedSpan"});
		currentTitle.insert({bottom: this.modifSpan});		
	}
});
