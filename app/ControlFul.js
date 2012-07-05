/*
 * Mediator between application GUI and Controls implementation
 * add dispose
 */
Class.create("ControlFul", {
	//__implements : "Manager",
	/**
	 * Creates Controls Classes on temlate load
	 * @var htmlElement HtmlElement
	 */
	initialize : function(htmlElement){
		//Controls instances
		var controls = this._controls = $H();
		 
		//Parse temlate
		Element.select(htmlElement, 'div[control]').forEach(function(element){
			var className = element.readAttribute("control") || "";
			var jClass = Class.getByName(className);
			var id = element.readAttribute("id") || "";
			var options = {};
			if(element.readAttribute("jOptions")){
				try{
						options = element.readAttribute("jOptions").evalJSON();
				}catch(e){
						alert("Error while parsing JSON for GUI template part " + id + "!");
				}
			}
			var control = new jClass(element, options);
			controls.set(id, control);

			if(Class.objectImplements(obj, "Focusable")){
				obj.setFocusBehaviour();
				this._focusables.push(obj);
			}
			if(Class.objectImplements(obj, "ContextMenuable")){
				obj.setContextualMenu(this.contextMenu);
			}
			if(Class.objectImplements(obj, "ActionProvider")){
				if(!this.guiActions) this.guiActions = new Hash();
				this.guiActions.update(obj.getActions());
			}
		})
		document.fire("controls:initialized");
	},

	/**
	 * Applies a template_part by removing existing components at this location
	 * and recreating new ones.
	 * @param id String The id of the DOM anchor
	 * @param jClass Control A widget class
	 * @param options Object A set of options that may have been decoded from json.
	 */
	refreshGuiComponent : function(id, jClass, jClassName, optionsString, cdataContent){
		if(!window[id]) return;
		// First destroy current component, unregister actions, etc.			
		var oldObj = window[id];
		if(oldObj.__className == jClassName && oldObj.__optionsString == optionsString){
			return;
		}
		var options = {};
		if(optionsString){
			options = optionsString.evalJSON();			
		}
		if(Class.objectImplements(oldObj, "Focusable")){
			this._focusables = this._focusables.without(oldObj);
		}
		if(Class.objectImplements(oldObj, "ActionProvider")){
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
		//TODO move to Class initialization
		var obj = new jClass($(id), options);
		if(Class.objectImplements(obj, "Focusable")){
			obj.setFocusBehaviour();
			this._focusables.push(obj);
		}
		if(Class.objectImplements(obj, "ContextMenuable")){
			obj.setContextualMenu(this.contextMenu);
		}
		if(Class.objectImplements(obj, "ActionProvider")){
			if(!this.guiActions) this.guiActions = new Hash();
			this.guiActions.update(obj.getActions());
		}

		obj.__optionsString = optionsString;
		
		obj.resize();
		delete(oldObj);
	},
	
	/**
	 * Spreads a client_configs/component_config to all gui components.
	 * It will be the mission of each component to check whether its for him or not.
	 */
	refreshGuiComponentConfigs : function(){
        this._guiComponentsConfigs = $H();
		var items = XPathSelectItems(this._controls, "client_configs/component_config");
		if(!items.length) return;
		for(var i=0;i<items.length;i++){
			this.setGuiComponentConfig(items[i]);
		}
	},
	
	/**
	 * Apply the componentConfig to the Object of a item
	 * @param domItem Widget
	 */
	setGuiComponentConfig : function(domItem){
		var className = domItem.getAttribute("className");
		var classId = domItem.getAttribute("classId") || null;
		var classConfig = new Hash();
		if(classId){
			classConfig.set(classId, domItem);
		}else{
			classConfig.set('all', domItem);
		}
        var cumul = this._guiComponentsConfigs.get(className);
        if(!cumul) cumul = $A();
		cumul.push(classConfig);
        this._guiComponentsConfigs.set(className, cumul);
		document.fire("app:component_config_changed", {className: className, classConfig: classConfig});
	},

	/*
	 * Get Control from registry
	 */
	get : function(id){
		return this._controls.get(id);
	}
})
