/**
 * Abstract container any type of pane that can resize
 */
Class.create("Pane", {	
	
	__implements : "IWidget",
	
	/**
	 * Constructor
	 * @param element HTMLElement The Node anchor
	 * @param options Object The pane parameters
	 */
	initialize : function(element, options){
		this.element = $(element);
		if(!this.element){
			throw new Error('Cannot find element for Pane : ' + this.__className);
		}
		this.options = options || {};
		this.element.paneObject = this;
		if(this.element.getAttribute('paneHeader')){
			this.addPaneHeader(
				this.element.getAttribute('paneHeader'), 
				this.element.getAttribute('paneIcon'));
		}
        if(this.element && this.options.elementStyle){
            this.element.setStyle(this.options.elementStyle);
        }
		this.childrenPanes = $A([]);
		this.scanChildrenPanes(this.element);
	},
	
	/**
	 * Called when the pane is resized
	 */
	resize : function(){		
		// Default behaviour : resize children
    	if(this.options.fit && this.options.fit == 'height'){
    		var marginBottom = 0;
    		if(this.options.fitMarginBottom){
    			var expr = this.options.fitMarginBottom;
    			try{marginBottom = parseInt(eval(expr));}catch(e){}
    		}
    		fitHeightToBottom(this.element, (this.options.fitParent ? $(this.options.fitParent) : null), expr);
    	}
    	this.childrenPanes.invoke('resize');
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
        this.childrenPanes.each(function(child){
            child.destroy();
        });
        this.element.update("");
        if(window[this.element.id]){
            delete window[this.element.id];
        }
		this.element = null;

	},
	
	/**
	 * Find and reference direct children IWidget
	 * @param element HTMLElement
	 */
	scanChildrenPanes : function(element){
		if(!element.childNodes) return;
		$A(element.childNodes).each(function(c){
			if(c.paneObject) {
				this.childrenPanes.push(c.paneObject);
			}else{
				this.scanChildrenPanes(c);
			}
		}.bind(this));
	},
	
	/**
	 * Show the main html element
	 * @param show Boolean
	 */
	showElement : function(show){
		if(show){
			this.element.show();
		}else{
			this.element.hide();
		}
	},
	
	/**
	 * Adds a simple haeder with a title and icon
	 * @param headerLabel String The title
	 * @param headerIcon String Path for the icon image
	 */
	addPaneHeader : function(headerLabel, headerIcon){
        var header = new Element('div', {className: 'panelHeader', message_id: headerLabel}).update(I18N[headerLabel]);
        if(headerIcon){
            var ic = resolveImageSource(headerIcon, '/image/actions/ICON_SIZE', 16);
            header.insert({top: new Element("img", {src: ic, className: 'panelHeaderIcon'})});
            header.addClassName('panelHeaderWithIcon');
        }
        if(this.options.headerClose){
            var ic = resolveImageSource(this.options.headerClose.icon, '/image/actions/ICON_SIZE', 16);
            var img = new Element("img", {src: ic, className: 'panelHeaderCloseIcon', title: I18N[this.options.headerClose.title]});
            header.insert({top: img});
            var sp = this.options.headerClose.splitter;
            img.observe("click", function(){
                window[sp]["fold"]();
            });
        }
		this.element.insert({top : header});
		disableTextSelection(header);
	},
	
	/**
	 * Sets a listener when the element is focused to notify app object
	 */
	setFocusBehaviour : function(){
		this.element.observe("click", function(){
			if(app) app.focusOn(this);
		}.bind(this));
	},


    getUserPreference : function(prefName){
        if(!app || !app.user) return;
        var gui_pref = app.user.getPreference("gui_preferences", true);
        if(!gui_pref || !gui_pref[this.element.id+"_"+this.__className]) return;
        return gui_pref[this.element.id+"_"+this.__className][prefName];
    },

    setUserPreference : function(prefName, prefValue){
        if(!app || !app.user) return;
        var guiPref = app.user.getPreference("gui_preferences", true);
        if(!guiPref) guiPref = {};
        if(!guiPref[this.element.id+"_"+this.__className]) guiPref[this.element.id+"_"+this.__className] = {};
        if(guiPref[this.element.id+"_"+this.__className][prefName] && guiPref[this.element.id+"_"+this.__className][prefName] == prefValue){
            return;
        }
        guiPref[this.element.id+"_"+this.__className][prefName] = prefValue;
        app.user.setPreference("gui_preferences", guiPref, true);
        app.user.savePreference("gui_preferences");
    }
});
