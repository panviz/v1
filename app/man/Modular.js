/**
 * Modules manager
 * Provider of module resources, such as [js, css, html(module templates)]
 */
Class.create("Modular", ReactiveProvider, {
  public : "all",

  /**
   * Init all executable modules from local store
   * Client loads modules to local store in Gui
   */
  initialize : function($super, store){
    $super(store);
    this.store.setUniq("name");
    var self = this;
    //TODO add findByMask(*) method to Store
    this.store._local.forEach(function(module){
      var config = module.config;
      if(config.server && config.server.executable){
        self._instances[module.id] = new Module(module.name, store);
      }
    })
  },

  // @server
  get : function($super, callback, name, options){
    var self = this;
    if (!isServer){
      var cb = function(data){
        var module = new Module(data.name)
        self._instances[data.name] = module;
        callback(module);
      }
      $super(cb, name, options)
    } else{
      $super(callback, name, options)
    }
  },

  /**
   * Check if some dependencies must be loaded before
   * @returns Boolean
   */
  hasDependencies : function(){
    return (this.resources.dependencies || false);
  },

  /**
   * Load a javascript file
   * @param fileName String
   * @param className String
   */
  loadJSResource : function(fileName, className){
    try{
      eval('window.testTemporaryObject = '+className);
      delete(window.testTemporaryObject);
    }catch(e){
      if(typeof(className)!='function' || typeof(className.prototype)!='object'){
        var conn = new Connection();
        conn._libUrl = false;
        if(bootstrap.p.get('SERVER_PREFIX_URI')){
          conn._libUrl = bootstrap.p.get('SERVER_PREFIX_URI');
        }
        conn.loadLibrary(fileName);
      }
    }
  },
  /**
   * Load a CSS file
   * @param fileName String
   */
  loadCSSResource : function(fileName){
    var head = $$('head')[0];
      fileName = bootstrap.p.get('SERVER_PREFIX_URI')+fileName;
    var cssNode = new Element('link', {
      type : 'text/css',
      rel  : 'stylesheet',
      href : fileName+"?v="+window.bootstrap.p.get("version"),
      media : 'screen'
    });
    head.insert(cssNode);
  },
  /**
   * Insert the HTML snipper and evaluate scripts
   * @param formId String
   * @param htmlSnippet String
   */
  loadGuiForm : function(formId, htmlSnippet){
    if(!$(this.formContainer).select('[id="'+formId+'"]').length){
      htmlSnippet.evalScripts();
      $(this.formContainer).insert(htmlSnippet.stripScripts());
    }
  },

  // Check if resources are tagged autoload and load them
  loadAutoLoadResources : function(registry){
  },

  /**
   * Get required provider extension from user config
   * @return Array Extension names
   */
  getUserProviders: function(repos){
    var providers = [];
    repos.each(function(repo){
      providers.push("provider." + repo.provider)
    })
    return providers;
  },

  /**
   * Find the currently active extensions by type
   * @param extensionType String "editor" or "uploader"
   * @returns $A()
   */
  getActiveExtensionByType : function(extensionType){
    var exts = $A();
    return this._registry[extensionType];
  },
  
  /**
   * Find a given editor by its id
   * @param editorId String
   * @returns View
   */
  findEditorById : function(editorId){
    return this._registry.editor.detect(function(el){return(el.id == editorId);});
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
    this._registry.editor.each(function(el){
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
  }
});
