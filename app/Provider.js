/** 
 * Reactive manager of Items
 * loading, accessType, owner, label, icon
 */
Class.create("Provider", Reactive, {

  // @var String
  _id: undefined,

  // @var String
  _label: 'Public Repository',

  // @var String
  _icon: '',

  // @var String
  _accessType: '',

  // @var Boolean
  userEditable: false,

  // @var String
  _name: '',

  /**
   * User which created or been assinged to this repo
   * @var String
   */
  _owner: '',

  /**
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

    //Load repository params for current user and item if available
    load('/', {}, p.callback);
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
  },

  /**
   * TODO Rename
   * Finds this item by path if it already exists in arborescence
   * @param rootItem Item
   * @param fakeItems Item[]
   */
  findInArbo : function(rootItem, fakeItems){
    if(!this.getPath()) return;
    var pathParts = this.getPath().split("/");
    var parentItems = $A();
    var currentPath = "";
    var crtItem, crtParentItem = rootItem;
    for(var i=0;i<pathParts.length;i++){
      if(pathParts[i] == "") continue;
      currentPath = currentPath + "/" + pathParts[i];
      if(item = crtParentItem.findChildByPath(currentPath)){
        crtItem = item;
      }else{
        crtItem = new Item(currentPath, {"isLeaf" : false, 'label' : getBaseName(currentPath), "fake" : true});
        fakeItems.push(crtItem);
        crtParentItem.addChild(crtItem);
      }
      crtParentItem = crtItem;
    }
    return crtItem;
  },
  /**
   * Finds a child item by its path
   * @param path String
   * @returns Item
   */
  findChildByPath : function(path){
    return $A(this._children).find(function(child){
      return (child.getPath() == path);
    });
  }
});
