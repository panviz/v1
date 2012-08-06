/**
 * Abstract container for data
 */
Class.create("Item", ReactiveRecord, {
  /**
   * @param path String
   * @param isLeaf Boolean
   * @param label String
   * @param icon String
   */
  initialize : function(path, params){//isLeaf, label, icon){
    this._path = path;
    var p = params || {};
    if(this._path && this._path.length && this._path.length > 1){
      if(this._path[this._path.length-1] == "/"){
        this._path = this._path.substring(0, this._path.length-1);
      }
    }
    this._metadata = $H(p.metadata);
    this._isLeaf = p.isLeaf || false;
    this._label = p.label || '';
    this._icon = p.icon || '';
    this.fake = p.fake || false;
    this._isLoaded = p.isLoaded || false;
    this._children = $A([]);
    this._isRoot = false;
  },

  /**
   * Unload child and notify "force_clear"
   */
  clear : function(){
    this._children.each(function(child){
      this.removeChild(child);
    }.bind(this));
    this._isLoaded = false;   
    this.notify("force_clear");
  },
  /**
   * Sets this Item as being the root parent
   */
  setRoot : function(){
    this._isRoot = true;
  },

  /**
   * Set the item children as a bunch
   * @param Items Items[]
   */
  setChildren : function(Items){
    this._children = $A(Items);
    this._children.invoke('setParent', this);
  },

  /**
   * Get all children as a bunch
   * @returns Item[]
   */
  getChildren : function(){
    return this._children;
  },

  /**
   * Adds a child to children
   * @param Item Item The child
   */
  addChild : function(Item){
    Item.setParent(this);
    if(this._iItemProvider) Item._iItemProvider = this._iItemProvider;
    if(existingItem = this.findChildByPath(Item.getPath())){
      existingItem.replaceBy(Item);
    }else{      
      this._children.push(Item);
      this.notify("child_added", Item.getPath());
    }
  },
  /**
   * Removes the child from the children
   * @param Item Item
   */
  removeChild : function(Item){
    var removePath = Item.getPath();
    Item.notify("item_removed");
    this._children = this._children.without(Item);
    this.notify("child_removed", removePath);
  },
  /**
   * Replaces the current item by a new one. Copy all properties deeply
   * @param Item Item
   */
  replaceBy : function(Item){
    this._isLeaf = Item._isLeaf;
    if(Item._label){
      this._label = Item._label;
    }
    if(Item._icon){
      this._icon = Item._icon;
    }
    if(Item._iItemProvider){
      this._iItemProvider = Item._iItemProvider;
    }
    this._isRoot = Item._isRoot;
    this._isLoaded = Item._isLoaded;
    this.fake = Item.fake;
    Item.getChildren().each(function(child){
      this.addChild(child);
    }.bind(this) );   
    var meta = Item.getMetadata();    
    meta.each(function(pair){
      if(this._metadata.get(pair.key) && pair.value === ""){
        return;
      }
      this._metadata.set(pair.key, pair.value);
    }.bind(this) );
    this.notify("item_replaced", this);   
  },

  /**
   * Is this item a leaf
   * @returns Boolean
   */
  isLeaf : function(){
    return this._isLeaf;
  },
  /**
   * if name starts with dot
   * @returns Boolean
   */
  isHidden : function(){
  },

  /**
   * @returns String
   */
  getPath : function(){
    return this._path;
  },

  /**
   * @returns String
   */
  getLabel : function(){
    return this._label;
  },

  /**
   * @returns String
   */
  getIcon : function(){
    return this._icon;
  },

  /**
   * Sets a reference to the parent item
   * @param parentItem Item
   */
  setParent : function(parentItem){
    this._parentItem = parentItem;
  },

  /**
   * Gets the parent Item
   * @returns Item
   */
  getParent : function(){
    return this._parentItem;
  },

  /**
   * @returns Boolean
   */
  isRoot : function(){
    return this._isRoot;
  },

  /**
   * Check if it's the parent of the given item
   * @param item Item
   * @returns Boolean
   */
  isParentOf : function(item){
    var childPath = item.getPath();
    var parentPath = this.getPath();
    return (childPath.substring(0,parentPath.length) == parentPath);
  },

  /**
   * Check if it's a child of the given item
   * @param item Item
   * @returns Boolean
   */
  isChildOf : function(item){
    var childPath = this.getPath();
    var parentPath = item.getPath();
    return (childPath.substring(0,parentPath.length) == parentPath);
  }
});
