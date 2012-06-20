/**
 * Widget for users action, displayed on the right of the toolbar
 */
Class.create("UserWidget", {
	__implements : ["IWidget"],
	/**
	 * Constructor
	 * @param element HTMLElement
	 */
	initialize: function(element){
		this.element = element;
		this.element.paneObject = this;
		
		this.mObs1 = function(){
            this.element.select('div').invoke('addClassName', 'user_widget_hover');
		}.bind(this);
		this.mObs2 = function(){
			var divs = this.element.select('div');
			if(!divs.length) return;
			if(divs[0].hasClassName('inline_hover_light')) return;
            this.element.select('div').invoke('removeClassName', 'user_widget_hover');
		}.bind(this);
		this.uLoggedObs = this.updateGui.bind(this);
		this.actLoaded = this.updateActions.bind(this);
		
		this.element.observe("mouseover", this.mObs1 );
		this.element.observe("mouseout", this.mObs2 );		
		document.observe("app:user_logged", this.uLoggedObs );
		document.observe("app:actions_loaded", this.actLoaded );		
		if(Prototype.Browser.IE) {
			document.observe("app:actions_refreshed", this.actLoaded );
		}
	},
	/**
	 * Updates on user status change
	 */
	updateGui : function(){
		var logging_string = "";
		var oUser = app.user;		
		if(oUser != null) 
		{
			if(oUser.id != 'guest') 
			{
				logging_string = '<div class="user_widget_label"><ajxp:message ajxp_message_id="142">'+I18N[142]+'</ajxp:message><i ajxp_message_title_id="189" title="'+I18N[189]+'">'+ oUser.id+' </i></div><div class="inlineBarButtonLeft" style="-moz-border-radius: 0pt 5px 5px 0pt;border-radius: 0pt 5px 5px 0pt;border-left-style:none; border-width:1px;"><img width="16" height="16" style="height: 6px; width: 10px; margin-top: 9px; margin-left: 3px; margin-right: 3px;" ajxp_message_title="189" title="'+I18N[189]+'" src="'+ajxpResourcesFolder+'/image/arrow_down.png"></div>';
				this.element.removeClassName('disabled');
				if(oUser.getPreference('lang') != null && oUser.getPreference('lang') != "" && oUser.getPreference('lang') != app.currentLanguage)
				{
					app.loadI18NMessages(oUser.getPreference('lang'));
				}
			}
			else 
			{
				logging_string = '<div style="padding:3px 0 3px 7px;"><ajxp:message ajxp_message_id="143">'+I18N[143]+'</ajxp:message></div>';
				this.element.addClassName('disabled');
			}
		}
		else 
		{
			logging_string = '<div style="padding:3px 0 3px 7px;"><ajxp:message ajxp_message_id="142">'+I18N[144]+'</ajxp:message></div>';
			this.element.addClassName('disabled');
		}
		this.element.update(logging_string);
	},
	
	/**
	 * Updates the menu with dedicated actions
	 */
	updateActions : function(){
										debugger
		var menuItems = $A();
		var actions = app.actionBar.getActionsForWidget("UserWidget", this.element.id).each(function(action){
			menuItems.push({
				name: action.getKeyedText(),
				alt: action.options.title,
				image: resolveImageSource(action.options.src, '/image/action/ICON_SIZE', 16),						
				callback: function(e){this.apply();}.bind(action)
			});			
		});
		
		if(this.menu){
			this.menu.options.menuItems = menuItems;
			this.menu.refreshList();
		}else{			
			this.menu = new Proto.Menu({			
				className: 'menu rootDirChooser rightAlignMenu',
				mouseClick: 'left',
				position: 'bottom right',
				anchor: this.element,
				createAnchor: false,
				topOffset: 2,
				leftOffset: -5,
				menuTitle: I18N[200],
				menuItems: menuItems,
				fade: true,
				zIndex: 1500,
				beforeShow : function(e){
					this.element.select('div').invoke('addClassName', 'inline_hover_light');
                    this.element.select('div').invoke('addClassName', 'user_widget_hover');
				}.bind(this),
				beforeHide : function(e){
					this.element.select('div').invoke('removeClassName', 'inline_hover_light');
					this.element.select('div').invoke('removeClassName', 'user_widget_hover');
				}.bind(this),
				beforeSelect : function(e){
					this.element.select('div').invoke('removeClassName', 'inline_hover_light');
                    this.element.select('div').invoke('removeClassName', 'user_widget_hover');
				}.bind(this)
			});		
			this.notify("createMenu");
		}
		
	},
	/**
	 * Resize widget
	 */
	resize : function(){
	},
	/**
	 * Show/hide widget
	 * @param show Boolean
	 */
	showElement : function(show){
		this.element.select(".user_widget_label").invoke((show ? 'show' : 'hide'));
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
		this.element.stopObserving("mouseover", this.mObs1 );
		this.element.stopObserving("mouseout", this.mObs2 );		
		document.stopObserving("app:user_logged", this.uLoggedObs );
		document.stopObserving("app:actions_loaded", this.actLoaded );		
		if(Prototype.Browser.IE) {
			document.stopObserving("app:actions_refreshed", this.actLoaded );
		}		
		this.element = null;
	}
});
