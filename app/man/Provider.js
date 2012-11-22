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

  get : function(got, value, options){
    options = options || {};
    var onFind = function(data, err){
      var result = {}
      // format array of item ids as relations
      if (Object.isArray(data)){
        result.relations = data.map(function(id){
          var link = {}
          //link.id = $util.generateId()
          link.target = id
          link.direction = 'out'
          return link
        })
      } else {result = data}
      got(result, err)
    }
    var key = options.key || options.name ? 'name' : 'id'
    if (value == 'ItemSearch') return this.store.findLinked(onFind, key, options.search)
    this.store.find(onFind, null, key, value)
  },
  /**
   * @param JSON p response
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
   * @param Item rootItem
   * @param Item[] fakeItems
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
   * @param String path
   * @returns Item
   */
  findChildByPath : function(path){
    return $A(this._children).find(function(child){
      return (child.getPath() == path);
    });
  }
});
