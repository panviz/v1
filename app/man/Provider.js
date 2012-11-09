/** 
 * Items provider of any type
 */
Class.create("Provider", ReactiveProvider, {
  // Default type is 'item'
  man: '',
  public: 'all',

  initialize : function($super, store){
    $super(store);
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
