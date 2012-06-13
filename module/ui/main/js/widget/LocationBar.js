/**
 * Container for location components, go to parent, refresh.
 */
Class.create("LocationBar", {
	__implements : ["IWidget", "IFocusable"],
	_defaultGotoIcon : 'media-playback-start.png',
	_reloadGotoIcon : 'reload.png',
	_modified : false,
	_beforeModified : '',
	/**
	 * Constructor
	 * @param oElement HTMLElement
	 * @param options Object
	 */
	initialize : function(oElement, options){
		this.element = oElement;
		this.element.ajxpPaneObject = this;
		this.realPath = '/';
        this.options = options || {};
		this.createGui();
		document.observe("application:user_logged", this.resize.bind(this));
	},
	/**
	 * Creates the GUI
	 */
	createGui : function(){
		this.parentButton = simpleButton(
			'goto_parent', 
			'inlineBarButtonRight', 
			24, 24, 
			'goto_parent.png', 16, 
			'inline_hover', 
			function(){application.actionBar.fireAction('up_dir');}
			);
		this.element.insert(this.parentButton);
		var locDiv = new Element('div', {id: 'location_form'});
		this.initCurrentPath();
		this.element.insert(locDiv);
		locDiv.insert(this.currentPath);
		var inputDims = this.currentPath.getDimensions();
		this.currentPath.hide();
		this.label = new Element('div', {className: 'location_bar_label'}).update("/test");
		this.label.setStyle({
			marginTop: 1,
			fontSize: '11px',
			height: (Prototype.Browser.IE ? '18px' : '15px'),
			fontFamily: 'Trebuchet MS,sans-serif,Nimbus Sans L',
			zIndex: 10000,
			backgroundColor: 'white',
			whiteSpace: 'nowrap',
			overflow: 'hidden'
		});
		locDiv.insert(this.label);
		this.label.observe("click", function(){
			this.label.hide();
			this.currentPath.show();
			this.currentPath.focus();
		}.bind(this) );
		
		this.gotoButton = simpleButton(
			'location_goto', 
			'inlineBarButton', 
			104, 
			104, 
			this._reloadGotoIcon, 
			16, 
			'inline_hover', 
			this.submitPath.bind(this)
			);
		this.element.insert(this.gotoButton);

        if(this.options.searchButton){
            this.searchButton = simpleButton(
                'search_panel_button',
                'inlineBarButtonLeft',
                87, 184,
                this.options.searchIcon,
                16,
                'inline_hover',
                function(){
                    var folded = window[this.options.searchButton]['toggleFolding']();
                    if(!folded) $(this.options.searchFocus)['focus']();
                }.bind(this),
                false,
                true
            );
            this.element.insert(this.searchButton);
        }

		this.bmButton = simpleButton(
			'bookmarks_goto', 
			'inlineBarButtonLeft', 
			145, 145, 
			'bookmark.png',
			16, 
			'inline_hover', null, false, true);
		this.element.insert(this.bmButton);
		this.initBookmarksBar();
	},
	/**
	 * Initialize the input field with various observers
	 */
	initCurrentPath : function(){
		this.currentPath = new Element('input', {
			id: 'current_path',
			type: 'text',
			value: '/'
		});		
		var autoCompOptions = {	afterUpdateElement: function(element, li){
			if(this.currentPath.value != this.realPath){
				this.setModified(true);
				this.submitPath();
			}
		}.bind(this) };
		this.autoComp = new Autocompleter(this.currentPath, "autocomplete_choices", null, autoCompOptions);
		this.currentPath.observe("keydown", function(event){
			if(event.keyCode == 9) return false;
			if(!this._modified && (this._beforeModified != this.currentPath.getValue())){
				this.setModified(true);
			}
			if(event.keyCode == 13){
				if(this.autoComp.active) return;
				this.submitPath();
				Event.stop(event);
			}
		}.bind(this));		
		this.currentPath.observe("focus", function(e)	{
			application.disableShortcuts();
			this.hasFocus = true;
			this.currentPath.select();
			return false;
		}.bind(this) );		
		this.currentPath.observe("blur",function(e)	{
			this.currentPath.hide();
			this.label.show();
			if(!currentLightBox){
				application.enableShortcuts();
				this.hasFocus = false;
			}
		}.bind(this));
		document.observe("application:context_changed", function(event){
			window.setTimeout(function(){
				this.updateLocationBar(event.memo);
			}.bind(this), 0);			
		}.bind(this) );

	},
	/** 
	 * Insert a BookmarksBar object
	 */
	initBookmarksBar : function(){
		this.bookmarkBar = new BookmarksBar(this.bmButton);
	},
	/**
	 * Called on path submissionon
	 * @returns Boolean
	 */
	submitPath : function(){
		if(!this._modified){
			application.actionBar.fireAction("refresh");
		}else{
			var url = this.currentPath.value.stripScripts();
			if(url == '') return false;	
			var node = new Node(url, false);
			var parts = url.split("##");
			if(parts.length == 2){
				var data = new Hash();
				data.set("new_page", parts[1]);
				url = parts[0];
				node = new Node(url);
				node.getMetadata().set("paginationData", data);
			}
			// Manually entered, stat path before calling
			if(!application.pathExists(url)){
				modal.displayMessage('ERROR','Cannot find : ' + url);
				this.currentPath.setValue(this._beforeModified);
			}else{
				application.actionBar.fireDefaultAction("dir", node);
			}
		}
		return false;
	},
	/**
	 * Observer for node change
	 * @param newNode Node
	 */
	updateLocationBar: function (newNode)
	{
		if(Object.isString(newNode)){
			newNode = new Node(newNode);
		}
		var newPath = newNode.getPath();
		if(newNode.getMetadata().get('paginationData')){
			newPath += "##" + newNode.getMetadata().get('paginationData').get('current');
		}
		this.realPath = newPath;
		this.currentLabel = this.realPath;
		if(getBaseName(newPath) != newNode.getLabel()){
			this.currentLabel = getRepName(newPath) + '/' + newNode.getLabel();
		}
		this.label.update(this.currentLabel);
		this.currentPath.value = this.realPath;
		this.setModified(false);
	},	
	/**
	 * Change the state of the bar
	 * @param bool Boolean
	 */
	setModified : function(bool){
		this._modified = bool;
		this.gotoButton.setSrc(resolveImageSource((bool ? this._defaultGotoIcon : this._reloadGotoIcon), '/images/actions/ICON_SIZE', 16));
		this._beforeModified = this.currentPath.getValue();
	},
	/**
	 * Resize widget
	 */
	resize : function(){
		if(this.options.flexTo){
			var parentWidth = $(this.options.flexTo).getWidth();
			var siblingWidth = 0;
			this.element.siblings().each(function(s){
				if(s.ajxpPaneObject && s.ajxpPaneObject.getActualWidth){
					siblingWidth+=s.ajxpPaneObject.getActualWidth();
				}else{
					siblingWidth+=s.getWidth();
				}
			});
            var buttonsWidth = 20;
            this.element.select("div.inlineBarButton,div.inlineBarButtonLeft,div.inlineBarButtonRight").each(function(el){
                buttonsWidth += el.getWidth();
            });
			var newWidth = Math.min((parentWidth-siblingWidth-buttonsWidth),320);
			if(newWidth < 5){
				this.element.hide();
			}else{
				this.element.show();
				this.currentPath.setStyle({width: newWidth + 'px'});
				this.label.setStyle({width: newWidth + 'px'});
			}
		}
	},
	
	/**
	 * Implementation of the IWidget methods
	 */	
	getDomNode : function(){
		return this.element;
	},
	
	/**
	 * Implementation of the IWidget methods
	 */	
	destroy : function(){
		this.element = null;
	},

	/**
	 * Do nothing
	 * @param show Boolean
	 */
	showElement : function(show){},
	/**
	 * Do nothing
	 */
	setFocusBehaviour : function(){},
	/**
	 * Focus the widget : select the input field
	 */
	focus : function(){
		this.label.hide();
		this.currentPath.show();
		this.currentPath.focus();
		this.hasFocus = true;
	},
	/**
	 * Blur the widget : show the label instead of the input field.
	 */
	blur : function(){
		this.currentPath.blur();
		this.currentPath.hide();
		this.label.show();
		this.hasFocus = false;
	}	
});
