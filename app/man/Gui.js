/**
 * ControlFul - GUI Controls management
 * Mediator between application GUI and Controls implementation
 * View Manager
 */
Class.create("Gui", ReactiveProvider, {
  public : "all",

  initialize : function($super, p, store){
    $super(store)
    this.store.setUniq("name");
    this.ui = p.ui;
    this._views = $H();
    //TODO change to focused?
    this._current = null;
    this.modal = new Modal();
    this.get(null, 'main')
  },

  // Initialize controls
  update : function($super, p){
    if (p.name != 'main') return $super(p);

    var template = Object.clone(p, true);
    this._defaults = template.defaults;
    //TODO set controls to layout in viewport for performance
    var hasId = function(component){
      return component.id;
    }
    var processTemplate = Functional.processTree("components", hasId, this._parseComponent.bind(this))
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

  _parseComponent : function(component){
    var options = Object.extend(component.options, this._defaults)
    //TODO move to instance
    if (component.module){
      $mod.getInstance(this.createView.bind(this, options), component.module);
      return {};
    }
    //TODO remove
    var getExtControls = function(component){
      if (component.id){
        return component.control.extControls
      }
    }
    if (component.components){
      options.innerControls = component.components.select(getExtControls).flatten()
    }
    component.control = this.instance(component);
    return component
  },

  instance : function(template){
    var controlClass = Class.getByName(template.control);
    var control = new controlClass(template.options);
    this._instances.set(template.id, control);
    return control;
  },

  createView : function(options, module){
    var self = this;
    var moduleClass = Class.getByName(module.man);
    Object.extend(true, module.config, options);
    var i18n = module.i18n;
    var currentLocale = t.current;
    var hash = (currentLocale != 'en' && i18n[currentLocale]) ?
      $util.composeHash(i18n.en, i18n[currentLocale]) : i18n.en
    t.update(hash);

    var control = new moduleClass(module.config);
    var addView = function(){
      // view has only one top level control
      self.viewport.add(control.extControls[0])
      control.render();
    }
    //TODO Create viewport before any controls?
    if (!this.viewport){setTimeout(addView, 100)}
    else {addView()}
    // Add control to Gui controls registry
    this._instances.set(module.name, control);
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
  }
})
