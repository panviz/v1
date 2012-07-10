/**
 * Modules manager
 * Provider of modules resources, such as [js, css, html(module templates)]
 * TODO Implement Provider interface
 */
Class.create("ExtensionFul", {
  __implements : "Provider",
  /**
   * Constructor
   */
  initialize : function(){
    //loaded extensions
    this._registry = {};
    this._resourcesRegistry = {};
    this.formContainer = 'all_forms';
    this.resources = {};
  },
  /**
   * Adds a Javascript resource
   * @param fileName String
   * @param className String
   */
  addJSResource : function(fileName, className){
    if(!this.resources.js){
      this.resources.js = [];
    }
    this.resources.js.push({fileName: fileName,className: className});
  },
  /**
   * Adds a CSS resource
   * @param fileName String
   */
  addCSSResource : function(fileName){
    if(!this.resources.css){
      this.resources.css = [];
    }
    this.resources.css.push(fileName);
  },
  /**
   * Adds a FORM from html snipper
   * @param formId String
   * @param htmlSnippet String
   */
  addGuiForm : function(formId, htmlSnippet){
    if(!this.resources.forms){
      this.resources.forms = {};
    }
    this.resources.forms[formId] = htmlSnippet;
  },
  /**
   * Add a dependency to another plugin
   * @param data Object
   */
  addDependency : function(data){
    if(!this.resources.dependencies){
      this.resources.dependencies = [];
    }
    this.resources.dependencies.push(data);
  },
  /**
   * Check if some dependencies must be loaded before
   * @returns Boolean
   */
  hasDependencies : function(){
    return (this.resources.dependencies || false);
  },
  /**
   * Load resources
   * @param resourcesRegistry $H resources registry
   */
  load : function(resourcesRegistry){
    if(this.loaded) return;
    if(this.hasDependencies()){
      this.resources.dependencies.each(function(el){
        if(resourcesRegistry[el]){
          resourcesRegistry[el].load(resourcesRegistry);
        }
      }.bind(this) );
    }   
    if(this.resources.forms){
      $H(this.resources.forms).each(function(pair){
        this.loadGuiForm(pair.key, pair.value);
      }.bind(this) );
    }
    if(this.resources.js){
      this.resources.js.each(function(value){
        this.loadJSResource(value.fileName, value.className);
      }.bind(this));
    }
    if(this.resources.css){
      this.resources.css.each(function(value){
        this.loadCSSResource(value);
      }.bind(this));
    }
    this.loaded = true;
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
        if(bootstrap.p.get('SERVER_PREFIX_URI')){
            fileName = bootstrap.p.get('SERVER_PREFIX_URI')+fileName;
        }
    var cssNode = new Element('link', {
      type : 'text/css',
      rel  : 'stylesheet',
      href : fileName+"?v="+window.bootstrap.p.get("ajxpVersion"),
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
  /**
   * Load the resources from XML
   * @param node XMLNode
   */
  loadFromXmlNode : function(node){
    if(node.nodeName == "resources"){
      for(var k=0;k<node.childNodes.length;k++){
        if(node.childNodes[k].nodeName == 'js'){
          this.addJSResource(node.childNodes[k].getAttribute('file'), node.childNodes[k].getAttribute('className'));
        }else if(node.childNodes[k].nodeName == 'css'){
          this.addCSSResource(node.childNodes[k].getAttribute('file'));
        }else if(node.childNodes[k].nodeName == 'img_library'){
          addImageLibrary(node.childNodes[k].getAttribute('alias'), node.childNodes[k].getAttribute('path'));
        }
      }   
    }else if(node.nodeName == "dependencies"){
      for(var k=0;k<node.childNodes.length;k++){
        if(node.childNodes[k].nodeName == "pluginResources"){
          this.addDependency(node.childNodes[k].getAttribute("pluginName"));
        }
      }
    }else if(node.nodeName == "clientForm"){
      this.addGuiForm(node.getAttribute("id"), node.firstChild.nodeValue);
    }

  },
  /**
   * Check if resources are tagged autoload and load them
   * @param registry DOMDocument XML Registry
   */
  loadAutoLoadResources : function(registry){
    var jsNodes = XPathSelectNodes(registry, '//client_settings/resources/js[@autoload="true"]');
    if(jsNodes.length){
      jsNodes.each(function(node){
        this.loadJSResource(node.getAttribute('file'), node.getAttribute('className'));
      }.bind(this));
    }
    var imgNodes = XPathSelectNodes(registry, '//client_settings/resources/img_library');
    imgNodes.each(function(node){
      addImageLibrary(node.getAttribute('alias'), node.getAttribute('path'));
    }.bind(this));    
  },
  /*
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
   * Find Extension initialisation items (activeCondition, onInit, etc), parses 
   * the XML and execute JS. 
   * @param xmlItem DOMItem The extension item
   * @param extensionDefinition Object Information already collected about this extension
   * @returns Boolean
   */
  initExtension : function(xmlItem, extensionDefinition){
    var activeCondition = XPathSelectSingleItem(xmlItem, 'processing/activeCondition');
    if(activeCondition && activeCondition.firstChild){
      try{
        var func = new Function(activeCondition.firstChild.itemValue.strip());
        if(func() === false) return false;
      }catch(e){}
    }
    if(xmlItem.itemName == 'editor'){
      Object.extend(extensionDefinition, {
        openable : !!(xmlItem.getAttribute("openable") == "true"),
        previewProvider: !!(xmlItem.getAttribute("previewProvider")=="true"),
        order: (xmlItem.getAttribute("order") ? parseInt(xmlItem.getAttribute("order")) : 0),
        formId: xmlItem.getAttribute("formId") || null,       
        text: I18N[xmlItem.getAttribute("text")],
        title: I18N[xmlItem.getAttribute("title")],
        icon: xmlItem.getAttribute("icon"),
        editorClass: xmlItem.getAttribute("className"),
        mimes: $A(xmlItem.getAttribute("mimes").split(",")),
        write: !!(xmlItem.getAttribute("write") && xmlItem.getAttribute("write") == "true")
      });
    }else if(xmlItem.itemName == 'uploader'){
      var clientForm = XPathSelectSingleItem(xmlItem, 'processing/clientForm');
      if(clientForm && clientForm.firstChild && clientForm.getAttribute('id'))
      {
        extensionDefinition.formId = clientForm.getAttribute('id');
        if(!$('all_forms').select('[id="'+clientForm.getAttribute('id')+'"]').length){
          $('all_forms').insert(clientForm.firstChild.itemValue);
        }
      }
      var extensionOnInit = XPathSelectSingleItem(xmlItem, 'processing/extensionOnInit');
      if(extensionOnInit && extensionOnInit.firstChild){
        try{eval(extensionOnInit.firstChild.itemValue);}catch(e){}
      }
      var dialogOnOpen = XPathSelectSingleItem(xmlItem, 'processing/dialogOnOpen');
      if(dialogOnOpen && dialogOnOpen.firstChild){
        extensionDefinition.dialogOnOpen = dialogOnOpen.firstChild.itemValue;
      }
      var dialogOnComplete = XPathSelectSingleItem(xmlItem, 'processing/dialogOnComplete');
      if(dialogOnComplete && dialogOnComplete.firstChild){
        extensionDefinition.dialogOnComplete = dialogOnComplete.firstChild.itemValue;
      }
    }
    return true;
  },
  
  /**
   * Refresh the currently active extensions
   */
  refreshExtensionsRegistry : function(){
    this._registry = {"editor": $A([]), "uploader": $A([])};
    var extensions = _.extend(this._registry.editors, this._registry.uploaders);
    //TODO set new ResourcesManager for every extension OR use Singleton?

    for(var i=0;i<extensions.length;i++){
      var extensionDefinition = {
        id : extensions[i].getAttribute("id"),
        xmlItem : extensions[i],
        resourcesManager : new ResourcesManager()       
      };
      this._resourcesRegistry[extensionDefinition.id] = extensionDefinition.resourcesManager;
            var resourceItems = XPathSelectItems(extensions[i], "client_settings/resources|dependencies|clientForm");
      for(var j=0;j<resourceItems.length;j++){
        var child = resourceItems[j];
        extensionDefinition.resourcesManager.loadFromXmlItem(child);
      }
      if(this.initExtension(extensions[i], extensionDefinition)){
        this._registry[extensions[i].itemName].push(extensionDefinition);
      }
    }
    //TODO need load resources
    ResourcesManager.prototype.loadAutoLoadResources(this._registry);
  },
  
  getPluginConfigs : function(pluginQuery){
    var properties = XPathSelectItems(this._registry, 'plugins/'+pluginQuery+'/plugin_configs/property | plugins/jcore[@id="core.'+pluginQuery+'"]/plugin_configs/property');
    var configs = $H();
    for(var i = 0; i<properties.length; i++){
      var propItem = properties[i];
      configs.set(propItem.getAttribute("name"), propItem.firstChild.itemValue.evalJSON());
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
  },
  
  /**
   * Trigger the load method of the resourcesManager.
   * @param resourcesManager ResourcesManager
   */
  loadEditorResources : function(resourcesManager){
    var registry = this._resourcesRegistry;
    resourcesManager.load(registry);
  }
});
