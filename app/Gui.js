/*
 * ControlFul - GUI Controls management
 * Mediator between application GUI and Controls implementation
 * View Manager
 * Template manager
 */
Class.create("Gui", Reactive, {
  
  public : "all",

  initialize : function($super, p, store){
    $super(store)
    // TODO Use Template class for Server to respond to Client Gui?
    if (isServer) return

    //Controls instances
    this._controls = $H();
    this.ui = p.ui;
    this._views = $H();
    //TODO change to focused?
    this._current = null;
    this.modal = new Modal();
    this.get(this.initControls.bind(this), 'main')
  },

  // Initialize controls
  initControls : function(template){
    this._defaults = template.defaults;
    //TODO set controls to layout in viewport for performance
    var hasId = function(component){
      return component.id;
    }
    var processTemplate = Functional.processTree("components", hasId, this._initControl.bind(this))
    var controlsTree = processTemplate(template)

    var getExtControls = function(component){
      if (component.id){
        return component.control.extControls
      }
    }

    //TODO Viewport should be created while template process in processTemplate as Display control?
    template.items = template.components.select(getExtControls).flatten()
    //Container for all controls
    this.viewport = Ext.create('Ext.Viewport', template);
  },

  _initControl : function(component){
    var jClass = Class.getByName(component.control);
    var options = Object.extend(component.options, this._defaults)

    var getExtControls = function(component){
      if (component.id){
        return component.control.extControls
      }
    }
    if (component.components){
      options.innerControls = component.components.select(getExtControls).flatten()
    }
    var control = component.control = new jClass(options);
    this._controls.set(component.id, control);
    return component;
  },

  startView : function(){
    $$(".view").each(function(element){
      //TODO mime should be set into editors data while parsing
      var mime = element.getAttribute("default_mime")
      var editors = $ext.findEditorsForMime(mime);
      if(editors.length && editors[0].openable){
        var data = editors[0];
        data.mime = mime;
        this._createView(element, data);
      }
    }.bind(this));
  },

  setCurrentView : function(view){
    this._current = view;
  },

  /**
   * Returns the current view.
   */
  getView : function(){
    return this._current;
  },

  /**
   * Find an editor using the data and initialize it
   * @param data Object
   */
  _createView : function(element, data){
    if(data){
      app.loadEditorResources(data.resourcesManager);
      if(!data.formId){
        app.displayMessage('ERROR', 'Error, you must define a formId attribute in your &lt;editor&gt; manifest (or set it as openable="false")');
        return;
      }
      var editorClass = data.editorClass;
      var view;
      if(typeof(editorClass) == "string"){
        view = eval('new '+editorClass+'(element, data)');
      }else{
        view = new editorClass(element, data);
      }
      this._views.set(element.id, view);
      if (element.id == "main_view"){
        this.setCurrentView(view);
      }
    }
  },

  // Deprecated
  setUI : function(name){
    var name = name || "desktop";
    var config = require(ROOT_PATH + '/config/' + name)
    Object.extend(this.ui, config);
  },

  // Deprecated
  setTheme : function(name){
    var name = name || 'mybase';
    var ui = this.ui;
    ui.theme = ui.themes[name];
  },

  /**
   * Creates Controls Classes on temlate load
   * @var htmlElement HtmlElement
   */
  // Deprecated
  initFromHtmlTemplate : function(htmlElement){
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
  getControl : function(id){
    return this._controls.get(id);
  }
})
