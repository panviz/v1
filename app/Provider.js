/** 
 * Provider of Collection and Items of certain Graph type (Tree for now)
 * TODO Update to server Graph, not only Tree
 * loading, accessType, owner, label, icon
 */
Class.create("Provider", Module, {

  /**
   * @var String
   */
  _id: undefined,
  /**
   * @var String
   */
  _label: 'Public Repository',
  /**
   * @var String
   */
  _icon: '',
  /**
   * @var String
   */
  _accessType: '',
  /**
   * @var ResourcesManager
   */
  resourcesManager: undefined,
  /**
   * TODO where used?
   * @var Boolean
   */
  userEditable: false,
  /**
   * @var String
   */
  _name: '',
  /**
   * User which created or been assinged to this repo
   * @var String
   */
  _owner: '',

  /**
   * Constructor
   * @param id String
   * @param p params JSON
   */
  initialize : function(id, p){
    debugger
    this.p = p;
    if($i18n){
      this._label = $i18n[391];
    }
    this._id = id;
    this._icon = THEME.path +'/image/action/16/network-wired.png';

    //TODO create specific ResourcesManager
    this.resourcesManager = new ResourcesManager();
    this.resourcesManager.load();

    //Load repository params for current user and item if available
    load('/', {}, p.callback);
  },

  /**
   * Load an item
   * @param path
   * @p params Range, limit, tree depth, etc
   * @param itemCallback Function On item loaded
   */
  load : function(path, p, itemCallback){
    if(this.isLoading) return;    
    if(this._isLoaded){
      //TODO where should loaded data be saved
      callback();
      return
    }
    var connection = new Connection('/data/' + this._id + path);
    //add Provider params to request
    if(this.p || p){
      var params = $H(Object.extend(p, this.p));
      params.each(function(pair){
        connection.addParameter(pair.key, pair.value);
      });
    }
    connection.onComplete = this._onLoad.bind(this, itemCallback);
    connection.sendAsync();
  },
  /**
   * @param transport Ajax.Response
   * @param itemCallback Function
   * @param childCallback Function
   */
  _onLoad : function(transport){
    this._isLoaded = true;
    this.isLoading = false;
    var response = transport.responseJSON;
    
    //TODO check bind parameters
    debugger
    if(!response || !response.item){;
      if(app) app.displayMessage('ERROR', 'Loading error:'+e.message);
      else alert('Loading error:'+ e.message);
    }
    //update this repository on first load
    if(response.repository){
      parseParams(response.repository);
    }
    document.fire("app:context_changed", response.item);
  },

  /**
   * @param p JSON response
   */
  parseParams : function(p){
    this._name = p._name;
    this.p = p;
    this._accessType = p.accessType;
    this._owner = p.owner;
    this._label = p.label;
    if(p.resources){
      //TODO update resourcesManager
      this.resourcesManager.parse(p.resources);
    }
  },
  
  /**
   * @returns String
   */
  getId : function(){
    return this._id;
  },
  
  /**
   * @returns String
   */
  getName : function(){
    return this._name;
  },

  /**
   * @return String
   */
  getOwner : function(){
      return this._owner;
  },
  
  /**
   * @returns String
   */
  getLabel : function(){
    return this._label;
  },
  /**
   * @param label String
   */
  setLabel : function(label){
    this._label = _label;
  },
  
  /**
   * @returns String
   */
  getIcon : function(){
    return this._icon;
  },
  /**
   * @param icon String
   */
  setIcon : function(icon){
    this._icon = icon;
  },

  /**
   * @returns String
   */
  getAccessType : function(){
    return this._accessType;
  },

  /**
   * @param access String
   */
  setAccessType : function(access){
    this._accessType = access;
  },

  /**
   * Check whether a path exists
   * @param path String
   * @returns Boolean
   */
  pathExists : function(path){
    //var connection = new Connection();
    //connection.addParameter("get_action", "stat");
    //connection.addParameter("file", dirName);
    //this.tmpResTest = false;
    //connection.onComplete = function(transport){
      //if(transport.responseJSON && transport.responseJSON.mode) this.tmpResTest = true;
    //}.bind(this);
    //connection.sendSync();    
    //return this.tmpResTest;
  },
});
