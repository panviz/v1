/*
 * ControlFul - GUI Controls management
 * Mediator between application GUI and Controls implementation
 * View Manager
 */
Class.create("Gui", Reactive, {
  public : "all",

  initialize : function($super, p, store){
    $super(store)

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
    if (component.module){
      $mod.get(this.moduleLoaded.bind(this), component.module);
      return {};
    }
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

  moduleLoaded : function(module){
    debugger
    // Add control to Gui controls registry
    this._controls.set(module.id, module.control);
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

  /*
   * Get Control from registry
   */
  getControl : function(id){
    return this._controls.get(id);
  }
})
