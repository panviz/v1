/**
 * Abstract container for data
 */
Class.create("Item", ReactiveRecord, {

  /**
   * @param name String
   * @param p JSON optional params
   */
  initialize : function($super, name){
    this.__defineGetter__("size", function(){
      return this.children ? this.children.length : 0;
    })

    $super(name);
    this.type = this.__className.toLowerCase();
  },
  //TODO override Reactive get/put to use this.type for $proxy.send and 'item' for this.store

  _update : function($super, p){
    $super();
    var p = p || {};
    this.id = p.id;
    this.createdAt = p.createdAt;
    this.label = p.label || name;
    this.icon = p.icon;
    this.children = p.children;
    //TODO what format of links?
    this._links = p.links;
  },

  /**
   * if this Item is linked with given item
   * @param item Item
   * @returns Boolean
   */
  hasLink : function(item){
    //TODO
  },

  /**
   * @param type String limit links to certain type if specified
   * @returns Array all directly linked items
   */
  links : function(type){
  },

  /**
   * @returns Array all "parent" items
   */
  incoming : function(type){
  },

  /**
   * @returns Array all "child" items
   */
  outgoing : function(type){
  }

});
